import { query, getOne } from '@/src/lib/db/pool';

export const ApplicationRepository = {
  async findById(id) {
    return getOne('SELECT * FROM applications WHERE id = ?', [id]);
  },

  async findByUserId(userId, { page = 1, limit = 20, status } = {}) {
    let sql = 'SELECT * FROM applications WHERE user_id = ?';
    const params = [userId];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [{ total }] = await query(countSql, params);

    sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const rows = await query(sql, params);
    return { rows, total };
  },

  async findResumable(userId) {
    return getOne(
      'SELECT * FROM applications WHERE user_id = ? AND is_resumable = TRUE AND status = ? ORDER BY updated_at DESC LIMIT 1',
      [userId, 'draft']
    );
  },

  async create({ user_id, form_data }) {
    const result = await query(
      `INSERT INTO applications (user_id, form_data, status, is_resumable)
       VALUES (?, ?, 'draft', TRUE)`,
      [user_id, JSON.stringify(form_data || {})]
    );
    return result.insertId;
  },

  async saveDraft(id, userId, formData) {
    await query(
      `UPDATE applications SET form_data = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ? AND status = 'draft'`,
      [JSON.stringify(formData), id, userId]
    );
  },

  async submit(id, userId, data) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return;

    fields.push("status = 'submitted'");
    fields.push('submitted_at = NOW()');
    fields.push('is_resumable = FALSE');

    await query(
      `UPDATE applications SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      [...values, id, userId]
    );
  },

  async update(id, data) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return;

    await query(`UPDATE applications SET ${fields.join(', ')} WHERE id = ?`, [
      ...values,
      id,
    ]);
  },

  async list({ page = 1, limit = 20, status, search, sort = 'created_at', order = 'desc' } = {}) {
    let sql =
      'SELECT a.*, u.name as user_name, u.email as user_email FROM applications a LEFT JOIN users u ON a.user_id = u.id WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const countSql = sql.replace(
      'SELECT a.*, u.name as user_name, u.email as user_email',
      'SELECT COUNT(*) as total'
    );
    const [{ total }] = await query(countSql, params);

    const allowedSort = ['created_at', 'updated_at', 'status', 'payment_status'];
    const sortCol = allowedSort.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    sql += ` ORDER BY a.${sortCol} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const rows = await query(sql, params);
    return { rows, total };
  },

  async delete(id) {
    await query('DELETE FROM applications WHERE id = ?', [id]);
  },
};
