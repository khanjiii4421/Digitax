import { query, getOne } from '@/src/lib/db/pool';

export const UserRepository = {
  async findById(id) {
    return getOne(
      `SELECT id, name, email, number, cnic, role, oauth_provider, oauth_id,
              is_active, last_login_at, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );
  },

  async findByEmail(email) {
    return getOne('SELECT * FROM users WHERE email = ?', [email]);
  },

  async findByCnic(cnic) {
    return getOne('SELECT id, email FROM users WHERE cnic = ?', [cnic]);
  },

  async findByOAuth(provider, oauthId) {
    return getOne('SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?', [
      provider,
      oauthId,
    ]);
  },

  async create({ name, email, number, cnic, password_hash, role = 'user' }) {
    const result = await query(
      `INSERT INTO users (name, email, number, cnic, password_hash, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, number || null, cnic || null, password_hash || null, role]
    );
    return result.insertId;
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return;
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const values = keys.map((k) => fields[k]);
    await query(`UPDATE users SET ${setClause} WHERE id = ?`, [...values, id]);
  },

  async linkGoogleAccount(id, oauthId) {
    await query('UPDATE users SET oauth_provider = ?, oauth_id = ? WHERE id = ?', [
      'google',
      oauthId,
      id,
    ]);
  },

  async updateRefreshToken(id, tokenHash) {
    await query('UPDATE users SET refresh_token_hash = ? WHERE id = ?', [tokenHash, id]);
  },

  async recordLogin(id) {
    await query('UPDATE users SET last_login_at = NOW(), failed_attempts = 0 WHERE id = ?', [id]);
  },

  async incrementFailedAttempts(id) {
    await query(
      `UPDATE users SET
        failed_attempts = failed_attempts + 1,
        locked_until = IF(failed_attempts + 1 >= 5, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NULL)
       WHERE id = ?`,
      [id]
    );
    return getOne('SELECT failed_attempts, locked_until FROM users WHERE id = ?', [id]);
  },

  async unlock(id) {
    await query('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?', [id]);
  },

  async list({ page = 1, limit = 20, search, sort = 'created_at', order = 'desc' } = {}) {
    let sql = 'SELECT id, name, email, number, cnic, role, is_active, last_login_at, created_at FROM users WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR cnic LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countSql = sql.replace(
      'SELECT id, name, email, number, cnic, role, is_active, last_login_at, created_at',
      'SELECT COUNT(*) as total'
    );
    const [{ total }] = await query(countSql, params);

    const allowedSort = ['created_at', 'name', 'email', 'last_login_at', 'role'];
    const sortCol = allowedSort.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    sql += ` ORDER BY ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const rows = await query(sql, params);
    return { rows, total };
  },

  async delete(id) {
    await query('DELETE FROM users WHERE id = ?', [id]);
  },
};
