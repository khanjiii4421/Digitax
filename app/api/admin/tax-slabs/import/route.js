import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value;
    const admin = verifyToken(token);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { slabs, replaceYear } = await req.json();

    if (!Array.isArray(slabs) || slabs.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid tax slab rows found in file.' }, { status: 400 });
    }

    // If replaceYear is specified, clean existing slabs for that year
    if (replaceYear) {
      await db.run('DELETE FROM tax_slabs WHERE tax_year = ?', [replaceYear]);
    }

    let insertedCount = 0;
    for (const item of slabs) {
      const taxYear = String(item.tax_year || item.year || replaceYear || '2025').trim();
      const salaryFrom = parseFloat(item.salary_from ?? item.from ?? 0);
      const salaryTo = parseFloat(item.salary_to ?? item.to ?? 0);
      const taxAmount = parseFloat(item.tax_amount ?? item.rate ?? item.tax_rate ?? 0);

      if (taxYear && !isNaN(salaryFrom) && !isNaN(salaryTo) && !isNaN(taxAmount)) {
        await db.run(
          'INSERT INTO tax_slabs (tax_year, salary_from, salary_to, tax_amount) VALUES (?, ?, ?, ?)',
          [taxYear, salaryFrom, salaryTo, taxAmount]
        );
        insertedCount++;
      }
    }

    await logAudit({
      adminId: admin.id,
      adminName: admin.name || 'Admin',
      action: 'IMPORT_TAX_SLABS',
      entity: 'tax_slabs',
      details: `Imported ${insertedCount} tax slabs for year ${replaceYear || 'multi-year'} via Excel/CSV`
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedCount} tax slabs!`,
      count: insertedCount
    });
  } catch (error) {
    console.error('Tax slabs import error:', error);
    return NextResponse.json({ success: false, error: 'Failed to import tax slabs.' }, { status: 500 });
  }
}
