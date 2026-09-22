import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import { sendEmail } from '@/lib/email';

function validateCnic(cnic) {
  if (!cnic) return false;
  const clean = cnic.replace(/[-]/g, '');
  return /^\d{13}$/.test(clean);
}

function validateMobile(mobile) {
  if (!mobile) return false;
  const clean = mobile.replace(/[-+\s]/g, '');
  return /^03\d{9}$/.test(clean) || /^923\d{9}$/.test(clean);
}

function validateEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const draftOnly = searchParams.get('draftOnly') === 'true';

    if (draftOnly) {
      const draft = await db.get(
        "SELECT * FROM family_applications WHERE user_id = ? AND is_draft = 1 ORDER BY id DESC LIMIT 1",
        [decoded.id]
      );
      if (!draft) {
        return NextResponse.json({ success: true, hasDraft: false, data: null });
      }

      // Fetch related records for draft
      const members = await db.all("SELECT * FROM family_members WHERE application_id = ?", [draft.id]);
      const incomeSources = await db.all("SELECT * FROM family_income_sources WHERE application_id = ?", [draft.id]);
      const assets = await db.all("SELECT * FROM family_assets WHERE application_id = ?", [draft.id]);
      const liabilities = await db.all("SELECT * FROM family_liabilities WHERE application_id = ?", [draft.id]);
      const bankAccounts = await db.all("SELECT * FROM family_bank_accounts WHERE application_id = ?", [draft.id]);
      const documents = await db.all("SELECT * FROM family_documents WHERE application_id = ?", [draft.id]);

      return NextResponse.json({
        success: true,
        hasDraft: true,
        data: {
          ...draft,
          members,
          incomeSources,
          assets,
          liabilities,
          bankAccounts,
          documents
        }
      });
    }

    // List all user applications
    const applications = await db.all(
      "SELECT * FROM family_applications WHERE user_id = ? ORDER BY id DESC",
      [decoded.id]
    );

    return NextResponse.json({ success: true, data: applications });

  } catch (error) {
    console.error('Error fetching family applications:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      isDraft = false,
      currentStep = 1,
      applicant = {},
      spouse = null,
      children = [],
      familyMembers = [],
      incomeSources = [],
      assets = [],
      liabilities = [],
      bankAccounts = [],
      documents = [],
      digitalSignature = '',
      declaredCorrect = false,
      couponCode = '',
      discountAmount = 0,
      amount = null
    } = body;

    // Strict Validations for submission (non-draft)
    if (!isDraft) {
      if (!applicant.fullName || !applicant.cnic || !applicant.mobile || !applicant.email) {
        return NextResponse.json({ success: false, error: 'Missing required applicant fields' }, { status: 400 });
      }
      if (!validateCnic(applicant.cnic)) {
        return NextResponse.json({ success: false, error: 'Invalid CNIC format. Standard 13-digit CNIC required.' }, { status: 400 });
      }
      if (!validateMobile(applicant.mobile)) {
        return NextResponse.json({ success: false, error: 'Invalid Mobile Number format.' }, { status: 400 });
      }
      if (!validateEmail(applicant.email)) {
        return NextResponse.json({ success: false, error: 'Invalid Email address.' }, { status: 400 });
      }
      if (!declaredCorrect || !digitalSignature) {
        return NextResponse.json({ success: false, error: 'Please accept declaration and provide digital signature.' }, { status: 400 });
      }

      // Check duplicate CNIC application
      const duplicate = await db.get(
        "SELECT id FROM family_applications WHERE cnic = ? AND status NOT IN ('Rejected', 'Draft') AND id != ?",
        [applicant.cnic, id || 0]
      );
      if (duplicate) {
        return NextResponse.json({
          success: false,
          error: 'An active Family Tax Filing application already exists for this CNIC.'
        }, { status: 400 });
      }
    }

    const monthlyInc = parseFloat(applicant.monthlyIncome || 0);
    const annualInc = monthlyInc * 12;

    let applicationId = id;
    let orderNumber;

    if (applicationId) {
      // Update existing application
      const existing = await db.get("SELECT order_number FROM family_applications WHERE id = ? AND user_id = ?", [applicationId, decoded.id]);
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
      }
      orderNumber = existing.order_number;

      const newStatus = isDraft ? 'Draft' : 'Payment Pending';
      const newPaymentStatus = isDraft ? 'Pending Payment' : 'Pending Payment';

      await db.run(`
        UPDATE family_applications SET
          full_name = ?, father_name = ?, cnic = ?, dob = ?, gender = ?, marital_status = ?,
          mobile = ?, whatsapp = ?, email = ?, occupation = ?, employer_name = ?,
          monthly_income = ?, annual_income = ?, ntn = ?, address = ?, province = ?, city = ?, postal_code = ?,
          current_step = ?, is_draft = ?, status = IF(status = 'Draft', ?, status),
          payment_status = IF(status = 'Draft', ?, payment_status),
          digital_signature = ?, declared_correct = ?,
          coupon_code = ?, discount_amount = ?, amount = ?
        WHERE id = ? AND user_id = ?
      `, [
        applicant.fullName || '', applicant.fatherName || '', applicant.cnic || '', applicant.dob || '', applicant.gender || '', applicant.maritalStatus || 'Single',
        applicant.mobile || '', applicant.whatsapp || '', applicant.email || '', applicant.occupation || '', applicant.employerName || '',
        monthlyInc, annualInc, applicant.ntn || '', applicant.address || '', applicant.province || '', applicant.city || '', applicant.postalCode || '',
        currentStep, isDraft ? 1 : 0, newStatus, newPaymentStatus,
        digitalSignature || '', declaredCorrect ? 1 : 0, couponCode || '', parseFloat(discountAmount || 0), parseFloat(amount || 5000),
        applicationId, decoded.id
      ]);

    } else {
      // Create new application
      orderNumber = `FTX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const initialStatus = isDraft ? 'Draft' : 'Payment Pending';

      const res = await db.run(`
        INSERT INTO family_applications (
          order_number, user_id, full_name, father_name, cnic, dob, gender, marital_status,
          mobile, whatsapp, email, occupation, employer_name, monthly_income, annual_income,
          ntn, address, province, city, postal_code, current_step, is_draft, status, payment_status, amount,
          coupon_code, discount_amount, digital_signature, declared_correct
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderNumber, decoded.id, applicant.fullName || '', applicant.fatherName || '', applicant.cnic || '', applicant.dob || '', applicant.gender || '', applicant.maritalStatus || 'Single',
        applicant.mobile || '', applicant.whatsapp || '', applicant.email || '', applicant.occupation || '', applicant.employerName || '', monthlyInc, annualInc,
        applicant.ntn || '', applicant.address || '', applicant.province || '', applicant.city || '', applicant.postalCode || '', currentStep, isDraft ? 1 : 0,
        initialStatus, 'Pending Payment', parseFloat(amount || 5000), couponCode || '', parseFloat(discountAmount || 0), digitalSignature || '', declaredCorrect ? 1 : 0
      ]);

      applicationId = res.insertId;

      // Status history & Activity log
      await db.run("INSERT INTO family_status_history (application_id, status, notes, changed_by) VALUES (?, ?, ?, ?)", [
        applicationId, initialStatus, isDraft ? 'Application saved as draft' : 'Application submitted', decoded.id
      ]);

      await db.run("INSERT INTO family_activity_logs (application_id, user_id, action, description) VALUES (?, ?, ?, ?)", [
        applicationId, decoded.id, isDraft ? 'CREATE_DRAFT' : 'SUBMIT_APPLICATION', `Order #${orderNumber} created`
      ]);
    }

    // Clear & re-insert related sub-entities for consistent updates
    await db.run("DELETE FROM family_members WHERE application_id = ?", [applicationId]);
    await db.run("DELETE FROM family_income_sources WHERE application_id = ?", [applicationId]);
    await db.run("DELETE FROM family_assets WHERE application_id = ?", [applicationId]);
    await db.run("DELETE FROM family_liabilities WHERE application_id = ?", [applicationId]);
    await db.run("DELETE FROM family_bank_accounts WHERE application_id = ?", [applicationId]);
    await db.run("DELETE FROM family_documents WHERE application_id = ?", [applicationId]);

    // Insert Spouse
    if (applicant.maritalStatus === 'Married' && spouse && spouse.name) {
      const spMonthly = parseFloat(spouse.monthlyIncome || 0);
      await db.run(`
        INSERT INTO family_members (
          application_id, member_type, relationship, name, cnic, dob, bform_cnic,
          is_student, institution, occupation, monthly_income, annual_income, ntn, is_taxpayer
        ) VALUES (?, 'spouse', 'Spouse', ?, ?, ?, ?, 0, '', ?, ?, ?, ?, ?)
      `, [
        applicationId, spouse.name || '', spouse.cnic || '', spouse.dob || '', spouse.cnic || '',
        spouse.occupation || '', spMonthly, spMonthly * 12, spouse.ntn || '', spouse.isTaxFiler ? 1 : 0
      ]);
    }

    // Insert Children
    if (Array.isArray(children)) {
      for (const child of children) {
        if (!child.name) continue;
        const chMonthly = parseFloat(child.monthlyIncome || 0);
        await db.run(`
          INSERT INTO family_members (
            application_id, member_type, relationship, name, cnic, dob, bform_cnic,
            is_student, institution, occupation, monthly_income, annual_income, ntn, is_taxpayer
          ) VALUES (?, 'child', 'Child', ?, ?, ?, ?, ?, ?, 'Student/Other', ?, ?, '', ?)
        `, [
          applicationId, child.name || '', child.bformCnic || '', child.dob || '', child.bformCnic || '',
          child.isStudent ? 1 : 0, child.institution || '', chMonthly, chMonthly * 12, child.isTaxpayer ? 1 : 0
        ]);
      }
    }

    // Insert Other Family Members
    if (Array.isArray(familyMembers)) {
      for (const member of familyMembers) {
        if (!member.name) continue;
        const memMonthly = parseFloat(member.monthlyIncome || 0);
        await db.run(`
          INSERT INTO family_members (
            application_id, member_type, relationship, name, cnic, dob, bform_cnic,
            is_student, institution, occupation, monthly_income, annual_income, ntn, is_taxpayer
          ) VALUES (?, 'other', ?, ?, ?, ?, ?, 0, '', ?, ?, ?, ?, 0)
        `, [
          applicationId, member.relationship || 'Dependent', member.name || '', member.cnic || '', member.dob || '', member.cnic || '',
          member.occupation || '', memMonthly, memMonthly * 12, member.ntn || ''
        ]);
      }
    }

    // Insert Income Sources
    if (Array.isArray(incomeSources)) {
      for (const inc of incomeSources) {
        if (!inc.incomeType) continue;
        await db.run(`
          INSERT INTO family_income_sources (application_id, income_type, monthly_amount, annual_amount, details_json)
          VALUES (?, ?, ?, ?, ?)
        `, [
          applicationId, inc.incomeType, parseFloat(inc.monthlyAmount || 0), parseFloat(inc.annualAmount || 0), JSON.stringify(inc.details || {})
        ]);
      }
    }

    // Insert Assets
    if (Array.isArray(assets)) {
      for (const ast of assets) {
        if (!ast.assetType) continue;
        await db.run(`
          INSERT INTO family_assets (
            application_id, asset_type, title, purchase_date, purchase_value, current_value, ownership_percentage, details_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          applicationId, ast.assetType, ast.title || '', ast.purchaseDate || '', parseFloat(ast.purchaseValue || 0),
          parseFloat(ast.currentValue || 0), parseFloat(ast.ownershipPercentage || 100), JSON.stringify(ast.details || {})
        ]);
      }
    }

    // Insert Liabilities
    if (Array.isArray(liabilities)) {
      for (const lia of liabilities) {
        if (!lia.liabilityType) continue;
        await db.run(`
          INSERT INTO family_liabilities (
            application_id, liability_type, title, lender_name, total_amount, remaining_amount, details_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          applicationId, lia.liabilityType, lia.title || '', lia.lenderName || '', parseFloat(lia.totalAmount || 0),
          parseFloat(lia.remainingAmount || 0), JSON.stringify(lia.details || {})
        ]);
      }
    }

    // Insert Bank Accounts
    if (Array.isArray(bankAccounts)) {
      for (const acc of bankAccounts) {
        if (!acc.bankName || !acc.accountNumber) continue;
        await db.run(`
          INSERT INTO family_bank_accounts (
            application_id, bank_name, account_title, account_number, iban, annual_transactions
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          applicationId, acc.bankName || '', acc.accountTitle || '', acc.accountNumber || '', acc.iban || '', parseFloat(acc.annualTransactions || 0)
        ]);
      }
    }

    // Insert Documents
    if (Array.isArray(documents)) {
      for (const doc of documents) {
        if (!doc.fileUrl) continue;
        await db.run(`
          INSERT INTO family_documents (
            application_id, category, doc_type, file_name, file_url, file_size, file_type
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          applicationId, doc.category || 'general', doc.docType || 'document', doc.fileName || 'file',
          doc.fileUrl, doc.fileSize || 0, doc.fileType || ''
        ]);
      }
    }

    // Send Notification if submitted
    if (!isDraft) {
      const displayId = Number(applicationId) < 2192 ? (2191 + Number(applicationId || 1)) : applicationId;

      await db.run(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, ?, ?, 'info', ?)
      `, [
        decoded.id,
        'Family Tax Filing Application Submitted',
        `Your application #${displayId} (${orderNumber}) has been submitted. Our team is reviewing your documents.`,
        `/portal/family-tax/${applicationId}`
      ]);

      // Fetch Admin Email & Logo
      const adminEmailRow = await db.get("SELECT value FROM settings WHERE `key` = 'admin_email'");
      const adminEmail = adminEmailRow?.value || process.env.ADMIN_EMAIL || "info@digitax.com";
      const clientEmail = applicant.email || decoded.email;

      // 1. Email to Client
      await sendEmail({
        to: clientEmail,
        subject: `Family Tax Filing Application Submitted - #${displayId}`,
        html: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f7fb;padding:24px;">
            <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 20px rgba(0,0,0,0.05);">
              <div style="background:linear-gradient(135deg,#0056A8,#0077cc);padding:30px;text-align:center;">
                <div style="display:inline-block;background:#ffffff;padding:8px 16px;border-radius:10px;margin-bottom:12px;">
                  <span style="font-size:20px;font-weight:900;color:#0056A8;letter-spacing:1px;">DIGITAX</span>
                </div>
                <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:800;">Application Received</h1>
                <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;font-size:13px;">Family Income Tax & Wealth Filing</p>
              </div>
              <div style="padding:30px;">
                <h2 style="color:#111827;font-size:18px;margin:0 0 6px;">Application Submitted Successfully!</h2>
                <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">Dear ${applicant.fullName || 'Valued Client'}, thank you for choosing DIGITAX for your family tax return preparation.</p>
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;width:40%;">Application ID</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#0056A8;font-weight:bold;">#${displayId}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Order Reference</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;">${orderNumber}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Primary Applicant</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;">${applicant.fullName}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">CNIC</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;font-family:monospace;">${applicant.cnic}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Total Fee</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;font-weight:bold;">Rs ${(parseFloat(amount) || 5000).toLocaleString()}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Status</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#d97706;font-weight:bold;">Pending Review</td></tr>
                </table>
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin-bottom:24px;">
                  <p style="color:#1e40af;font-size:13px;margin:0;line-height:1.5;">Our specialized tax consultant will review your wealth statements, deductions, and family assets before final submission to FBR.</p>
                </div>
                <div style="text-align:center;margin:24px 0;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://digitax.pk'}/portal/family-tax/${applicationId}" style="display:inline-block;background:#0056A8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 32px;border-radius:10px;box-shadow:0 4px 12px rgba(0,86,168,0.25);">View Application Status</a>
                </div>
                <p style="color:#94a3b8;font-size:12px;text-align:center;margin:20px 0 0;border-top:1px solid #f1f5f9;padding-top:16px;">This is an automated notification from DIGITAX (Pvt) Limited.</p>
              </div>
            </div>
          </div>
        `,
        text: `Dear ${applicant.fullName || 'Client'},\n\nYour Family Tax Filing application (#${displayId} - ${orderNumber}) has been submitted successfully.\n\nThank you,\nDIGITAX Team`
      });

      // 2. Email to Admin (info@digitax.com)
      await sendEmail({
        to: adminEmail,
        subject: `🚨 New Family Tax Application Received - #${displayId}`,
        html: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f7fb;padding:24px;">
            <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
              <div style="background:#111827;padding:24px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:800;">DIGITAX Admin Alert</h1>
                <p style="color:#9ca3af;margin:4px 0 0;font-size:13px;">New Family Tax Filing Submission</p>
              </div>
              <div style="padding:28px;">
                <p style="color:#111827;font-size:15px;margin:0 0 16px;">A new Family Tax Filing application has been submitted by ${applicant.fullName || 'a client'}.</p>
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;width:40%;">Application ID</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#0056A8;font-weight:bold;">#${displayId}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Order Number</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;">${orderNumber}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Applicant Name</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;font-weight:bold;">${applicant.fullName}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">CNIC</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;">${applicant.cnic}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Mobile / WhatsApp</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;">${applicant.mobile || applicant.whatsapp}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Email</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;">${clientEmail}</td></tr>
                  <tr><td style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;">Amount</td><td style="padding:10px;background:#fff;border:1px solid #e2e8f0;font-size:13px;color:#111827;font-weight:bold;">Rs ${(parseFloat(amount) || 5000).toLocaleString()}</td></tr>
                </table>
                <div style="text-align:center;margin:24px 0;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://digitax.pk'}/admin/family-tax" style="display:inline-block;background:#0056A8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 32px;border-radius:10px;">Review in Admin Panel</a>
                </div>
              </div>
            </div>
          </div>
        `,
        text: `New Family Tax Application #${displayId} (${orderNumber}) from ${applicant.fullName} (${clientEmail}). CNIC: ${applicant.cnic}. View in Admin Panel: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://digitax.pk'}/admin/family-tax`
      });
    }

    const rawAppId = applicationId;
    const finalDisplayId = Number(rawAppId) < 2192 ? (2191 + Number(rawAppId || 1)) : rawAppId;

    return NextResponse.json({
      success: true,
      message: isDraft ? 'Draft saved successfully' : 'Application submitted successfully',
      applicationId: finalDisplayId,
      rawId: rawAppId,
      orderNumber
    });

  } catch (error) {
    console.error('Error saving family application:', error);
    return NextResponse.json({ success: false, error: 'Failed to save application' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Application ID is required.' }, { status: 400 });
    }

    // Verify ownership
    const app = await db.get(
      "SELECT id, status FROM family_applications WHERE id = ? AND user_id = ? AND (deleted_at IS NULL OR deleted_at = '')",
      [id, decoded.id]
    );

    if (!app) {
      return NextResponse.json({ success: false, error: 'Application not found or unauthorized.' }, { status: 404 });
    }

    // Lifecycle check: block deletion for applications under review or beyond
    const blockedStatuses = ['Under Review', 'Processing', 'FBR Submitted', 'Completed'];
    if (blockedStatuses.includes(app.status)) {
      return NextResponse.json({
        success: false,
        error: 'This application is currently under review or completed and cannot be deleted. Please contact support for assistance.'
      }, { status: 400 });
    }

    // Soft delete
    await db.run(
      "UPDATE family_applications SET deleted_at = NOW(), deleted_by = ? WHERE id = ? AND user_id = ?",
      [decoded.id, id, decoded.id]
    );

    return NextResponse.json({ success: true, message: 'Application cancelled successfully.' });
  } catch (error) {
    console.error('Error deleting family application:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
