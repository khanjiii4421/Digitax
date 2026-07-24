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
      await db.run(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, ?, ?, 'info', ?)
      `, [
        decoded.id,
        'Family Tax Filing Application Submitted',
        `Your application #${orderNumber} has been submitted. Please complete payment to begin processing.`,
        `/portal/family-tax/${applicationId}`
      ]);

      // Send Emails
      const adminEmail = process.env.ADMIN_EMAIL || "info@digitax.pk";
      const clientEmail = applicant.email || decoded.email;

      // Email to Client
      await sendEmail({
        to: clientEmail,
        subject: `Family Tax Filing - Application Received (#${orderNumber})`,
        text: `Dear ${applicant.fullName || 'Client'},\n\nYour Family Tax Filing application (#${orderNumber}) has been submitted successfully.\n\nPlease proceed to complete your payment to begin processing. You can view your application status in your portal.\n\nThank you,\nLaw Website Team`
      });

      // Email to Admin
      await sendEmail({
        to: adminEmail,
        subject: `New Family Tax Application (#${orderNumber})`,
        text: `A new Family Tax Filing application (#${orderNumber}) has been submitted by ${applicant.fullName || 'a client'}.\n\nCNIC: ${applicant.cnic}\nEmail: ${clientEmail}\n\nPlease review it in the admin dashboard.`
      });
    }

    return NextResponse.json({
      success: true,
      message: isDraft ? 'Draft saved successfully' : 'Application submitted successfully',
      applicationId,
      orderNumber
    });

  } catch (error) {
    console.error('Error saving family application:', error);
    return NextResponse.json({ success: false, error: 'Failed to save application' }, { status: 500 });
  }
}
