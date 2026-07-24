import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Allow user to view their own application, or admin to view any application
    const application = await db.get(
      "SELECT * FROM family_applications WHERE id = ? AND (user_id = ? OR ? = 'admin')",
      [id, decoded.id, decoded.role]
    );

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const members = await db.all("SELECT * FROM family_members WHERE application_id = ?", [id]);
    const incomeSources = await db.all("SELECT * FROM family_income_sources WHERE application_id = ?", [id]);
    const assets = await db.all("SELECT * FROM family_assets WHERE application_id = ?", [id]);
    const liabilities = await db.all("SELECT * FROM family_liabilities WHERE application_id = ?", [id]);
    const bankAccounts = await db.all("SELECT * FROM family_bank_accounts WHERE application_id = ?", [id]);
    const documents = await db.all("SELECT * FROM family_documents WHERE application_id = ?", [id]);
    const payment = await db.get("SELECT * FROM family_payments WHERE application_id = ? ORDER BY id DESC LIMIT 1", [id]);
    const statusHistory = await db.all("SELECT * FROM family_status_history WHERE application_id = ? ORDER BY id ASC", [id]);
    const activityLogs = await db.all("SELECT * FROM family_activity_logs WHERE application_id = ? ORDER BY id DESC", [id]);

    return NextResponse.json({
      success: true,
      data: {
        ...application,
        members,
        incomeSources,
        assets,
        liabilities,
        bankAccounts,
        documents,
        payment,
        statusHistory,
        activityLogs
      }
    });

  } catch (error) {
    console.error('Error fetching application details:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow deleting draft applications
    const draft = await db.get("SELECT id FROM family_applications WHERE id = ? AND user_id = ? AND is_draft = 1", [id, decoded.id]);
    if (!draft) {
      return NextResponse.json({ success: false, error: 'Cannot delete submitted application' }, { status: 400 });
    }

    await db.run("DELETE FROM family_applications WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: 'Draft deleted successfully' });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete draft' }, { status: 500 });
  }
}
