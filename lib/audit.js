import db from '@/lib/db';

/**
 * Log an administrative action to the audit_logs table
 * @param {Object} params
 * @param {number} [params.adminId]
 * @param {string} [params.adminName]
 * @param {string} params.action - e.g. 'UPDATE_SERVICE_PRICING', 'UPDATE_WEBSITE_MODE', 'VERIFY_PAYMENT'
 * @param {string} [params.entity] - e.g. 'service_pricing', 'website_settings', 'applications'
 * @param {string|number} [params.entityId]
 * @param {string|Object} [params.details]
 * @param {string} [params.ipAddress]
 */
export async function logAudit({ adminId = null, adminName = '', action, entity = '', entityId = '', details = '', ipAddress = '' }) {
  try {
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : String(details || '');
    await db.run(
      'INSERT INTO audit_logs (admin_id, admin_name, action, entity, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [adminId, adminName, action, entity, String(entityId || ''), detailsStr, ipAddress]
    );
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR]', error);
  }
}
