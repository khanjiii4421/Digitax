import mysql from 'mysql2/promise';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// MySQL connection pool
let pool = null;
let initialized = false;
let initPromise = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
      database: process.env.MYSQL_DATABASE || 'digitax',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
      charset: 'utf8mb4',
    });
  }
  return pool;
}

// Ensure DB is initialized before any query
async function ensureInit() {
  if (initialized) return;
  if (!initPromise) {
    initPromise = initDb().then(() => { initialized = true; });
  }
  await initPromise;
}

// Helper object that mimics the old SQLite API
const db = {
  // Returns all rows
  async all(sql, params = []) {
    await ensureInit();
    const p = getPool();
    const [rows] = await p.execute(sql, params);
    return rows;
  },
  // Returns single row or null
  async get(sql, params = []) {
    await ensureInit();
    const p = getPool();
    const [rows] = await p.execute(sql, params);
    return rows[0] || null;
  },
  // Returns { insertId, affectedRows }
  async run(sql, params = []) {
    await ensureInit();
    const p = getPool();
    const [result] = await p.execute(sql, params);
    return { insertId: result.insertId, affectedRows: result.affectedRows };
  },
  // Execute raw SQL (for setup/migrations)
  async exec(sql) {
    await ensureInit();
    const p = getPool();
    await p.query(sql);
  },
};

export function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password, hash) {
  if (hash && hash.length === 64 && /^[a-f0-9]+$/.test(hash)) {
    return crypto.createHash('sha256').update(password).digest('hex') === hash;
  }
  try {
    return bcrypt.compareSync(password, hash);
  } catch(e) {
    return false;
  }
}

export async function initDb() {
  const p = getPool();

  // Users table
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255),
      number VARCHAR(50),
      email VARCHAR(255) UNIQUE,
      cnic VARCHAR(50),
      password_hash VARCHAR(255),
      role VARCHAR(20) DEFAULT 'user',
      oauth_provider VARCHAR(50),
      oauth_id VARCHAR(255),
      otp_code VARCHAR(20),
      otp_expires DATETIME,
      failed_attempts INT DEFAULT 0,
      locked_until DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Tax Slabs table
  await p.query(`
    CREATE TABLE IF NOT EXISTS tax_slabs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      tax_year VARCHAR(10),
      salary_from BIGINT,
      salary_to BIGINT,
      tax_amount DECIMAL(10,2)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Site Settings table
  await p.query(`
    CREATE TABLE IF NOT EXISTS settings (
      \`key\` VARCHAR(255) PRIMARY KEY,
      value TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Partners table
  await p.query(`
    CREATE TABLE IF NOT EXISTS partners (
      id INT PRIMARY KEY AUTO_INCREMENT,
      image_url TEXT,
      name VARCHAR(255),
      display_order INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Products table
  await p.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT PRIMARY KEY AUTO_INCREMENT,
      image_url TEXT,
      title VARCHAR(255),
      description TEXT,
      price VARCHAR(100),
      button_text VARCHAR(100) DEFAULT 'Start Now',
      button_link VARCHAR(500) DEFAULT '/login',
      display_order INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Testimonials table
  await p.query(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INT PRIMARY KEY AUTO_INCREMENT,
      photo_url TEXT,
      name VARCHAR(255),
      role VARCHAR(255),
      review TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Team table
  await p.query(`
    CREATE TABLE IF NOT EXISTS team (
      id INT PRIMARY KEY AUTO_INCREMENT,
      photo_url TEXT,
      name VARCHAR(255),
      role VARCHAR(255),
      display_order INT DEFAULT 0,
      enabled TINYINT DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Videos table
  await p.query(`
    CREATE TABLE IF NOT EXISTS videos (
      id INT PRIMARY KEY AUTO_INCREMENT,
      youtube_id VARCHAR(100),
      title VARCHAR(255),
      display_order INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Service Categories table
  await p.query(`
    CREATE TABLE IF NOT EXISTS service_categories (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Services table
  await p.query(`
    CREATE TABLE IF NOT EXISTS services (
      id INT PRIMARY KEY AUTO_INCREMENT,
      category_id INT,
      title VARCHAR(255),
      price VARCHAR(100),
      working_days VARCHAR(100),
      description TEXT,
      requirements TEXT,
      icon_url TEXT,
      status VARCHAR(20) DEFAULT 'active'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Queries table
  await p.query(`
    CREATE TABLE IF NOT EXISTS queries (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      subject VARCHAR(500),
      message TEXT,
      status VARCHAR(20) DEFAULT 'unread',
      user_id INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Query Replies table
  await p.query(`
    CREATE TABLE IF NOT EXISTS query_replies (
      id INT PRIMARY KEY AUTO_INCREMENT,
      query_id INT,
      sender_type VARCHAR(20) DEFAULT 'admin',
      sender_id INT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Notifications table
  await p.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT,
      title VARCHAR(255),
      message TEXT,
      type VARCHAR(50) DEFAULT 'info',
      is_read TINYINT DEFAULT 0,
      link VARCHAR(500),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Email Templates table
  await p.query(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id INT PRIMARY KEY AUTO_INCREMENT,
      \`key\` VARCHAR(100) UNIQUE,
      name VARCHAR(255),
      subject VARCHAR(500),
      body_html LONGTEXT,
      body_text TEXT,
      enabled TINYINT DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Blogs table
  await p.query(`
    CREATE TABLE IF NOT EXISTS blogs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(500),
      description TEXT,
      image_url TEXT,
      link VARCHAR(500),
      display_order INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // NTN Applications table
  await p.query(`
    CREATE TABLE IF NOT EXISTS ntn_applications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT,
      service_type VARCHAR(100) DEFAULT 'ntn-registration',
      category VARCHAR(100),
      cnic_front_url TEXT,
      cnic_back_url TEXT,
      selfie_url TEXT,
      payment_method VARCHAR(100),
      payment_status VARCHAR(20) DEFAULT 'pending',
      amount DECIMAL(10,2) DEFAULT 1500,
      status VARCHAR(20) DEFAULT 'pending',
      admin_notes TEXT,
      admin_file_url TEXT,
      payment_proof_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Payment Methods table
  await p.query(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255),
      account_number VARCHAR(100),
      account_title VARCHAR(255),
      logo_url TEXT,
      is_active TINYINT DEFAULT 1,
      display_order INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Seed Blogs if empty
  const [blogCount] = await p.query('SELECT COUNT(*) as count FROM blogs');
  if (blogCount[0].count === 0) {
    await p.query('INSERT INTO blogs (title, description, image_url, link, display_order) VALUES (?, ?, ?, ?, ?)',
      ['How to File Your Taxes in 6 Minutes', 'Learn the quickest way to file your income tax return in Pakistan using our streamlined process and expert consultants.', '', '/services', 1]);
    await p.query('INSERT INTO blogs (title, description, image_url, link, display_order) VALUES (?, ?, ?, ?, ?)',
      ['Company Registration in Pakistan: Complete Guide', 'Everything you need to know about registering a Private Limited Company in Pakistan — documents, timeline, and costs.', '', '/services', 2]);
    await p.query('INSERT INTO blogs (title, description, image_url, link, display_order) VALUES (?, ?, ?, ?, ?)',
      ['Understanding Sales Tax for E-Commerce', 'A comprehensive guide to sales tax registration and monthly filing requirements for online businesses in Pakistan.', '', '/sales-tax', 3]);
    await p.query('INSERT INTO blogs (title, description, image_url, link, display_order) VALUES (?, ?, ?, ?, ?)',
      ['USA LLC Formation for Pakistani Entrepreneurs', 'How Pakistani freelancers and business owners can set up an LLC in the USA for international payments and credibility.', '', '/services', 4]);
  }

  // Seed Payment Methods if empty
  const [pmCount] = await p.query('SELECT COUNT(*) as count FROM payment_methods');
  if (pmCount[0].count === 0) {
    await p.query('INSERT INTO payment_methods (name, account_number, account_title, logo_url, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?)',
      ['Easypaisa', '03XX-XXXXXXX', 'DIGITAX', '/uploads/payment-logos/easypaisa.svg', 1, 1]);
    await p.query('INSERT INTO payment_methods (name, account_number, account_title, logo_url, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?)',
      ['JazzCash', '03XX-XXXXXXX', 'DIGITAX', '/uploads/payment-logos/jazzcash.svg', 1, 2]);
    await p.query('INSERT INTO payment_methods (name, account_number, account_title, logo_url, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?)',
      ['Bank Transfer', 'XXXX-XXXXXXXX', 'DIGITAX Pvt Ltd', '/uploads/payment-logos/bank-transfer.svg', 1, 3]);
  }

  // Seed Admin (with bcrypt)
  const adminEmail = 'admin123@gmail.com';
  const [adminRows] = await p.query('SELECT id, password_hash FROM users WHERE email = ?', [adminEmail]);
  if (adminRows.length === 0) {
    await p.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Admin', adminEmail, hashPassword('12345'), 'admin']);
  } else if (adminRows[0].password_hash && adminRows[0].password_hash.length === 64 && /^[a-f0-9]+$/.test(adminRows[0].password_hash)) {
    await p.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword('12345'), adminRows[0].id]);
  }

  // Seed Tax Slabs with real Pakistan income tax data
  const [slabYears] = await p.query("SELECT DISTINCT tax_year FROM tax_slabs");
  const existingYears = slabYears.map(r => r.tax_year);
  const needsReseed = existingYears.length < 2 || !existingYears.includes('2025');

  if (needsReseed) {
    await p.query('DELETE FROM tax_slabs');

    const slabs = [
      // 2025-2026
      ['2025', 0, 600000, 0], ['2025', 600000, 1200000, 5], ['2025', 1200000, 2200000, 15],
      ['2025', 2200000, 3200000, 25], ['2025', 3200000, 4100000, 30], ['2025', 4100000, 99999999, 35],
      // 2024-2025
      ['2024', 0, 600000, 0], ['2024', 600000, 1200000, 5], ['2024', 1200000, 2200000, 15],
      ['2024', 2200000, 3200000, 25], ['2024', 3200000, 4100000, 30], ['2024', 4100000, 99999999, 35],
      // 2023-2024
      ['2023', 0, 400000, 0], ['2023', 400000, 800000, 2.5], ['2023', 800000, 1200000, 7.5],
      ['2023', 1200000, 2400000, 15], ['2023', 2400000, 3200000, 25], ['2023', 3200000, 4800000, 30], ['2023', 4800000, 99999999, 35],
      // 2022-2023
      ['2022', 0, 400000, 0], ['2022', 400000, 800000, 2.5], ['2022', 800000, 1200000, 7.5],
      ['2022', 1200000, 2400000, 15], ['2022', 2400000, 3200000, 25], ['2022', 3200000, 4800000, 30], ['2022', 4800000, 99999999, 35],
      // 2021-2022
      ['2021', 0, 400000, 0], ['2021', 400000, 800000, 2.5], ['2021', 800000, 1200000, 7.5],
      ['2021', 1200000, 2400000, 15], ['2021', 2400000, 4800000, 25], ['2021', 4800000, 99999999, 30],
      // 2020-2021
      ['2020', 0, 400000, 0], ['2020', 400000, 800000, 2.5], ['2020', 800000, 1200000, 7.5],
      ['2020', 1200000, 2400000, 15], ['2020', 2400000, 4800000, 25], ['2020', 4800000, 99999999, 30],
      // 2019-2020
      ['2019', 0, 400000, 0], ['2019', 400000, 800000, 2.5], ['2019', 800000, 1200000, 7.5],
      ['2019', 1200000, 2400000, 15], ['2019', 2400000, 3200000, 20], ['2019', 3200000, 4800000, 25], ['2019', 4800000, 99999999, 30],
      // 2018-2019
      ['2018', 0, 400000, 0], ['2018', 400000, 800000, 2.5], ['2018', 800000, 1200000, 7.5],
      ['2018', 1200000, 2400000, 15], ['2018', 2400000, 3200000, 20], ['2018', 3200000, 4800000, 25], ['2018', 4800000, 99999999, 30],
    ];

    for (const s of slabs) {
      await p.query('INSERT INTO tax_slabs (tax_year, salary_from, salary_to, tax_amount) VALUES (?, ?, ?, ?)', s);
    }
  }

  // Seed Default Settings
  const settings = [
    ['site_title', 'DIGITAX'],
    ['site_slogan', 'File Your Taxes In Just 6 Minutes With Our Qualified Consultants!'],
    ['footer_copyright', '© 2018–2026 Befiler (Pvt) Limited'],
    ['footer_powered_by', 'Powered by Arittek'],
    ['contact_phone', '+92 349 1887803'],
    ['contact_email', 'info@digitax.pk'],
    ['office_address', 'Office 12, 3rd Floor, Executive Plaza, Islamabad, Pakistan'],
    ['google_maps_link', ''],
    ['about_title', 'About DIGITAX'],
    ['about_description', 'DIGITAX is Pakistan\'s premier digital tax preparation and filing portal designed to simplify FBR compliance. Our team of certified tax professionals, corporate lawyers, and IT specialist consultants ensures your filings are precise, compliant, and completed within minutes.'],
    ['about_image', ''],
    ['about_enabled', '1'],
    ['team_title', 'Meet Our Dream Team'],
    ['team_section_image', ''],
    ['seo_title', 'DIGITAX — Pakistan\'s Premier Tax & Business Consultants'],
    ['seo_description', 'Expert tax filing, NTN & company registration, FBR compliance, and corporate advisory services across Pakistan.'],
    ['seo_keywords', 'tax filing, NTN registration, company registration, FBR, befiler, pakistan'],
    ['coming_soon_calculator', 'active'],
    ['coming_soon_sales_tax', 'active'],
    ['coming_soon_services', 'active'],
    ['coming_soon_about', 'active'],
    ['coming_soon_testimonials', 'active'],
    ['coming_soon_videos', 'active'],
    ['dynamic_section_order', 'hero,calculator,partners,about,services,testimonials,team,videos,blogs,queries'],
    ['announcement_text', ''],
    ['announcement_link', ''],
    ['announcement_enabled', '0'],
  ];

  for (const [key, value] of settings) {
    await p.query('INSERT IGNORE INTO settings (`key`, value) VALUES (?, ?)', [key, value]);
  }

  // Seed Email Templates
  const templates = [
    ['welcome_email', 'Welcome Email',
      'Welcome to DIGITAX - Your Account is Ready!',
      '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f0f4f8;font-family:Segoe UI,Arial,sans-serif;-webkit-font-smoothing:antialiased"><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f0f4f8;padding:40px 16px"><tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.06)"><tr><td style="background:linear-gradient(135deg,#0056A8,#0077cc);padding:40px 32px;text-align:center"><h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 8px 0;letter-spacing:-0.5px">Welcome to DIGITAX!</h1><p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0">Your premium tax and business services portal</p></td></tr><tr><td style="padding:40px 32px"><p style="font-size:22px;font-weight:700;color:#111827;margin:0 0 16px 0">Hi {{name}}</p><p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 24px 0">Congratulations! Your DIGITAX account has been created successfully. You now have access to Pakistan\'s most comprehensive tax filing and business registration platform.</p><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px 0"><tr><td style="background:#f0f7ff;border-radius:12px;padding:20px;border-left:4px solid #0056A8"><p style="font-size:14px;color:#0056A8;font-weight:600;margin:0 0 8px 0">What you can do now:</p><ul style="font-size:14px;color:#4b5563;line-height:1.8;margin:4px 0 0 0;padding-left:20px"><li>File your income tax returns online</li><li>Register your business / NTN</li><li>Track your filing status in real-time</li><li>Access documents and certificates</li></ul></td></tr></table><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px 0"><tr><td align="center"><a href="https://digitax.pk/portal" style="display:inline-block;background:#0056A8;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:12px;box-shadow:0 4px 12px rgba(0,86,168,0.3)">Go to My Portal</a></td></tr></table><p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;border-top:1px solid #f3f4f6;padding-top:20px">If you have any questions, reply to this email or contact us at <a href="mailto:info@digitax.pk" style="color:#0056A8;text-decoration:none">info@digitax.pk</a></p></td></tr><tr><td style="background:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #f3f4f6"><p style="font-size:18px;font-weight:800;color:#0056A8;margin:0 0 4px 0">DIGITAX</p><p style="font-size:12px;color:#9ca3af;margin:0">Pakistan\'s Trusted Tax and Business Services Platform</p></td></tr></table></td></tr></table></body></html>',
      'Welcome to DIGITAX!\n\nHi {{name}},\n\nCongratulations! Your DIGITAX account has been created successfully.', 1],
    ['login_alert', 'Login Alert',
      'DIGITAX - New Login Detected',
      '<h3>Hi {{name}},</h3><p>We detected a new login to your DIGITAX client portal account.</p><p>If this was not you, please change your password immediately.</p><p>Best regards,<br/>DIGITAX Team</p>',
      'Hi {{name}},\n\nWe detected a new login to your DIGITAX client portal account.\n\nIf this was not you, please change your password immediately.', 1],
    ['forgot_password_otp', 'Forgot Password OTP',
      'DIGITAX - Password Reset OTP',
      '<h3>Hi {{name}},</h3><p>Your OTP for password reset is:</p><h2 style="color:#e53e3e;letter-spacing:8px;">{{otp}}</h2><p>This code expires in 10 minutes. Do not share this code with anyone.</p><p>Best regards,<br/>DIGITAX Team</p>',
      'Hi {{name}},\n\nYour OTP for password reset is: {{otp}}', 1],
    ['new_query_notification', 'New Query Notification',
      'DIGITAX - Query Received: {{subject}}',
      '<h3>Hi {{name}},</h3><p>We have received your query regarding <strong>{{subject}}</strong>.</p><p>Our team will review and get back to you shortly.</p><p><strong>Your Message:</strong><br/>{{message}}</p><p>Best regards,<br/>DIGITAX Team</p>',
      'Hi {{name}},\n\nWe have received your query regarding: {{subject}}', 1],
    ['query_reply', 'Query Reply',
      'DIGITAX - Reply to your query: {{subject}}',
      '<h3>Hi {{name}},</h3><p>Our team has replied to your query: <strong>{{subject}}</strong></p><p><strong>Reply:</strong><br/>{{reply}}</p><p>You can view the full conversation in your portal.</p><p>Best regards,<br/>DIGITAX Team</p>',
      'Hi {{name}},\n\nOur team has replied to your query: {{subject}}', 1],
    ['password_reset_success', 'Password Reset Success',
      'DIGITAX - Password Changed Successfully',
      '<h3>Hi {{name}},</h3><p>Your password has been changed successfully.</p><p>If you did not make this change, please contact us immediately.</p><p>Best regards,<br/>DIGITAX Team</p>',
      'Hi {{name}},\n\nYour password has been changed successfully.', 1],
  ];

  for (const [key, name, subject, html, text, enabled] of templates) {
    await p.query('INSERT IGNORE INTO email_templates (`key`, name, subject, body_html, body_text, enabled) VALUES (?, ?, ?, ?, ?, ?)',
      [key, name, subject, html, text, enabled]);
  }

  // Update existing welcome email template
  const [welcomeRows] = await p.query("SELECT id FROM email_templates WHERE `key` = 'welcome_email'");
  if (welcomeRows.length > 0) {
    await p.query("UPDATE email_templates SET subject = ?, body_html = ?, body_text = ? WHERE `key` = 'welcome_email'",
      ['Welcome to DIGITAX - Your Account is Ready!',
      '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f0f4f8;font-family:Segoe UI,Arial,sans-serif;-webkit-font-smoothing:antialiased"><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f0f4f8;padding:40px 16px"><tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.06)"><tr><td style="background:linear-gradient(135deg,#0056A8,#0077cc);padding:40px 32px;text-align:center"><h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 8px 0;letter-spacing:-0.5px">Welcome to DIGITAX!</h1><p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0">Your premium tax and business services portal</p></td></tr><tr><td style="padding:40px 32px"><p style="font-size:22px;font-weight:700;color:#111827;margin:0 0 16px 0">Hi {{name}}</p><p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 24px 0">Congratulations! Your DIGITAX account has been created successfully. You now have access to Pakistan\'s most comprehensive tax filing and business registration platform.</p><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px 0"><tr><td style="background:#f0f7ff;border-radius:12px;padding:20px;border-left:4px solid #0056A8"><p style="font-size:14px;color:#0056A8;font-weight:600;margin:0 0 8px 0">What you can do now:</p><ul style="font-size:14px;color:#4b5563;line-height:1.8;margin:4px 0 0 0;padding-left:20px"><li>File your income tax returns online</li><li>Register your business / NTN</li><li>Track your filing status in real-time</li><li>Access documents and certificates</li></ul></td></tr></table><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px 0"><tr><td align="center"><a href="https://digitax.pk/portal" style="display:inline-block;background:#0056A8;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:12px;box-shadow:0 4px 12px rgba(0,86,168,0.3)">Go to My Portal</a></td></tr></table><p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;border-top:1px solid #f3f4f6;padding-top:20px">If you have any questions, reply to this email or contact us at <a href="mailto:info@digitax.pk" style="color:#0056A8;text-decoration:none">info@digitax.pk</a></p></td></tr><tr><td style="background:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #f3f4f6"><p style="font-size:18px;font-weight:800;color:#0056A8;margin:0 0 4px 0">DIGITAX</p><p style="font-size:12px;color:#9ca3af;margin:0">Pakistan\'s Trusted Tax and Business Services Platform</p></td></tr></table></td></tr></table></body></html>',
      'Welcome to DIGITAX!\n\nHi {{name}},\n\nCongratulations! Your DIGITAX account has been created successfully.\n\nYou now have access to:\n- Online income tax filing\n- Business and NTN registration\n- Real-time filing status tracking\n- Document and certificate access\n\nGo to your portal: https://digitax.pk/portal']);
  }
}

// Auto-initialize on first query (lazy, not at import time)
// This avoids connection errors during Next.js build

export default db;
