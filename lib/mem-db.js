const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Use CWD (project root) so path is stable regardless of how Turbopack bundles __dirname
const DB_DIR = path.join(process.cwd(), '.next');
const DB_PATH = path.join(DB_DIR, 'dev.db');

let db;

function getDb() {
  if (!db) {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const Database = require('better-sqlite3');
      db = new Database(DB_PATH);
    } catch (e) {
      console.error('[MEMDB] Failed to load better-sqlite3:', e.message);
      throw e;
    }
    db.exec('PRAGMA journal_mode=WAL');
    db.exec('PRAGMA foreign_keys=ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      number TEXT,
      email TEXT UNIQUE,
      cnic TEXT,
      password_hash TEXT,
      role TEXT DEFAULT 'user',
      oauth_provider TEXT,
      oauth_id TEXT,
      refresh_token_hash TEXT,
      otp_code TEXT,
      otp_code_hash TEXT,
      otp_expires TEXT,
      failed_attempts INTEGER DEFAULT 0,
      locked_until TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tax_slabs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tax_year TEXT,
      salary_from INTEGER,
      salary_to INTEGER,
      tax_amount REAL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT,
      name TEXT,
      display_order INTEGER DEFAULT 0
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT,
      title TEXT,
      description TEXT,
      price TEXT,
      button_text TEXT DEFAULT 'Start Now',
      button_link TEXT DEFAULT '/login',
      display_order INTEGER DEFAULT 0
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photo_url TEXT,
      name TEXT,
      role TEXT,
      review TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS team (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photo_url TEXT,
      name TEXT,
      role TEXT,
      display_order INTEGER DEFAULT 0,
      enabled INTEGER DEFAULT 1
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      youtube_id TEXT,
      title TEXT,
      display_order INTEGER DEFAULT 0
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS service_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      title TEXT,
      price TEXT,
      working_days TEXT,
      description TEXT,
      requirements TEXT,
      icon_url TEXT,
      status TEXT DEFAULT 'active'
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      phone TEXT,
      subject TEXT,
      message TEXT,
      status TEXT DEFAULT 'unread',
      user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS query_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query_id INTEGER,
      sender_type TEXT DEFAULT 'admin',
      sender_id INTEGER,
      message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      message TEXT,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE,
      name TEXT,
      subject TEXT,
      body_html TEXT,
      body_text TEXT,
      enabled INTEGER DEFAULT 1
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS blogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      image_url TEXT,
      link TEXT,
      display_order INTEGER DEFAULT 0
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ntn_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      service_type TEXT DEFAULT 'ntn-registration',
      category TEXT,
      cnic_front_url TEXT,
      cnic_back_url TEXT,
      selfie_url TEXT,
      payment_method TEXT,
      payment_status TEXT DEFAULT 'pending',
      amount REAL DEFAULT 1500,
      status TEXT DEFAULT 'pending',
      admin_notes TEXT,
      admin_file_url TEXT,
      payment_proof_url TEXT,
      is_resumable INTEGER DEFAULT 1,
      form_data TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      account_number TEXT,
      account_title TEXT,
      logo_url TEXT,
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS family_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE,
      user_id INTEGER,
      full_name TEXT,
      father_name TEXT,
      cnic TEXT,
      dob TEXT,
      gender TEXT,
      marital_status TEXT,
      mobile TEXT,
      whatsapp TEXT,
      email TEXT,
      occupation TEXT,
      employer_name TEXT,
      monthly_income REAL DEFAULT 0,
      annual_income REAL DEFAULT 0,
      ntn TEXT,
      address TEXT,
      province TEXT,
      city TEXT,
      postal_code TEXT,
      current_step INTEGER DEFAULT 1,
      is_draft INTEGER DEFAULT 1,
      status TEXT DEFAULT 'Draft',
      payment_status TEXT DEFAULT 'Pending Payment',
      amount REAL DEFAULT 5000,
      payment_method TEXT,
      payment_proof_url TEXT,
      digital_signature TEXT,
      declared_correct INTEGER DEFAULT 0,
      assigned_consultant_id INTEGER,
      filed_return_url TEXT,
      wealth_statement_url TEXT,
      admin_notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS family_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER,
      member_type TEXT,
      relationship TEXT,
      name TEXT,
      cnic TEXT,
      dob TEXT,
      bform_cnic TEXT,
      is_student INTEGER DEFAULT 0,
      institution TEXT,
      occupation TEXT,
      monthly_income REAL DEFAULT 0,
      annual_income REAL DEFAULT 0,
      ntn TEXT,
      is_taxpayer INTEGER DEFAULT 0,
      FOREIGN KEY (application_id) REFERENCES family_applications(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS family_income_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER,
      income_type TEXT,
      monthly_amount REAL DEFAULT 0,
      annual_amount REAL DEFAULT 0,
      details_json TEXT,
      FOREIGN KEY (application_id) REFERENCES family_applications(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS family_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER,
      asset_type TEXT,
      title TEXT,
      purchase_date TEXT,
      purchase_value REAL DEFAULT 0,
      current_value REAL DEFAULT 0,
      ownership_percentage REAL DEFAULT 100,
      details_json TEXT,
      FOREIGN KEY (application_id) REFERENCES family_applications(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS family_liabilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER,
      liability_type TEXT,
      title TEXT,
      lender_name TEXT,
      total_amount REAL DEFAULT 0,
      remaining_amount REAL DEFAULT 0,
      details_json TEXT,
      FOREIGN KEY (application_id) REFERENCES family_applications(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS family_bank_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER,
      bank_name TEXT,
      account_title TEXT,
      account_number TEXT,
      iban TEXT,
      annual_transactions REAL DEFAULT 0,
      FOREIGN KEY (application_id) REFERENCES family_applications(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS family_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER,
      category TEXT,
      doc_type TEXT,
      file_name TEXT,
      file_url TEXT,
      file_size INTEGER,
      file_type TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES family_applications(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS family_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER,
      order_number TEXT,
      payment_method TEXT,
      amount REAL,
      status TEXT DEFAULT 'Pending Payment',
      payment_proof_url TEXT,
      transaction_ref TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      verified_at TEXT,
      FOREIGN KEY (application_id) REFERENCES family_applications(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS family_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER,
      status TEXT,
      notes TEXT,
      changed_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES family_applications(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS family_activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER,
      user_id INTEGER,
      action TEXT,
      description TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES family_applications(id) ON DELETE CASCADE
    )
  `);

  // Seed admin if not exists
  const admin = db.prepare("SELECT id, password_hash FROM users WHERE email = ?").get('admin123@gmail.com');
  if (!admin) {
    const hash = bcrypt.hashSync('12345', 12);
    db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)").run('Admin', 'admin123@gmail.com', hash, 'admin');
  } else if (admin.password_hash && admin.password_hash.length === 64 && /^[a-f0-9]+$/.test(admin.password_hash)) {
    const hash = bcrypt.hashSync('12345', 12);
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, admin.id);
  }

  // Seed blogs if empty
  const blogCount = db.prepare("SELECT COUNT(*) as count FROM blogs").get();
  if (blogCount.count === 0) {
    const insertBlog = db.prepare("INSERT INTO blogs (title, description, image_url, link, display_order) VALUES (?, ?, ?, ?, ?)");
    insertBlog.run('How to File Your Taxes in 6 Minutes', 'Learn the quickest way to file your income tax return in Pakistan using our streamlined process and expert consultants.', '', '/services', 1);
    insertBlog.run('Company Registration in Pakistan: Complete Guide', 'Everything you need to know about registering a Private Limited Company in Pakistan — documents, timeline, and costs.', '', '/services', 2);
    insertBlog.run('Understanding Sales Tax for E-Commerce', 'A comprehensive guide to sales tax registration and monthly filing requirements for online businesses in Pakistan.', '', '/sales-tax', 3);
    insertBlog.run('USA LLC Formation for Pakistani Entrepreneurs', 'How Pakistani freelancers and business owners can set up an LLC in the USA for international payments and credibility.', '', '/services', 4);
  }

  // Seed payment methods if empty
  const pmCount = db.prepare("SELECT COUNT(*) as count FROM payment_methods").get();
  if (pmCount.count === 0) {
    const insertPm = db.prepare("INSERT INTO payment_methods (name, account_number, account_title, logo_url, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?)");
    insertPm.run('Easypaisa', '03XX-XXXXXXX', 'DIGITAX', '/uploads/payment-logos/easypaisa.svg', 1, 1);
    insertPm.run('JazzCash', '03XX-XXXXXXX', 'DIGITAX', '/uploads/payment-logos/jazzcash.svg', 1, 2);
    insertPm.run('Bank Transfer', 'XXXX-XXXXXXXX', 'DIGITAX Pvt Ltd', '/uploads/payment-logos/bank-transfer.svg', 1, 3);
  }

  // Seed settings if empty
  const settingsCount = db.prepare("SELECT COUNT(*) as count FROM settings").get();
  if (settingsCount.count === 0) {
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
      ['about_description', "DIGITAX is Pakistan's premier digital tax preparation and filing portal designed to simplify FBR compliance. Our team of certified tax professionals, corporate lawyers, and IT specialist consultants ensures your filings are precise, compliant, and completed within minutes."],
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
    const insertSetting = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
    for (const [key, value] of settings) {
      insertSetting.run(key, value);
    }
  }

  // Seed tax slabs if empty
  const slabCount = db.prepare("SELECT COUNT(*) as count FROM tax_slabs").get();
  if (slabCount.count === 0) {
    const insertSlab = db.prepare("INSERT INTO tax_slabs (tax_year, salary_from, salary_to, tax_amount) VALUES (?, ?, ?, ?)");
    const slabs = [
      ['2025', 0, 600000, 0], ['2025', 600000, 1200000, 5], ['2025', 1200000, 2200000, 15],
      ['2025', 2200000, 3200000, 25], ['2025', 3200000, 4100000, 30], ['2025', 4100000, 99999999, 35],
      ['2024', 0, 600000, 0], ['2024', 600000, 1200000, 5], ['2024', 1200000, 2200000, 15],
      ['2024', 2200000, 3200000, 25], ['2024', 3200000, 4100000, 30], ['2024', 4100000, 99999999, 35],
      ['2023', 0, 400000, 0], ['2023', 400000, 800000, 2.5], ['2023', 800000, 1200000, 7.5],
      ['2023', 1200000, 2400000, 15], ['2023', 2400000, 3200000, 25], ['2023', 3200000, 4800000, 30], ['2023', 4800000, 99999999, 35],
      ['2022', 0, 400000, 0], ['2022', 400000, 800000, 2.5], ['2022', 800000, 1200000, 7.5],
      ['2022', 1200000, 2400000, 15], ['2022', 2400000, 3200000, 25], ['2022', 3200000, 4800000, 30], ['2022', 4800000, 99999999, 35],
      ['2021', 0, 400000, 0], ['2021', 400000, 800000, 2.5], ['2021', 800000, 1200000, 7.5],
      ['2021', 1200000, 2400000, 15], ['2021', 2400000, 4800000, 25], ['2021', 4800000, 99999999, 30],
      ['2020', 0, 400000, 0], ['2020', 400000, 800000, 2.5], ['2020', 800000, 1200000, 7.5],
      ['2020', 1200000, 2400000, 15], ['2020', 2400000, 4800000, 25], ['2020', 4800000, 99999999, 30],
      ['2019', 0, 400000, 0], ['2019', 400000, 800000, 2.5], ['2019', 800000, 1200000, 7.5],
      ['2019', 1200000, 2400000, 15], ['2019', 2400000, 3200000, 20], ['2019', 3200000, 4800000, 25], ['2019', 4800000, 99999999, 30],
      ['2018', 0, 400000, 0], ['2018', 400000, 800000, 2.5], ['2018', 800000, 1200000, 7.5],
      ['2018', 1200000, 2400000, 15], ['2018', 2400000, 3200000, 20], ['2018', 3200000, 4800000, 25], ['2018', 4800000, 99999999, 30],
    ];
    for (const s of slabs) {
      insertSlab.run(s[0], s[1], s[2], s[3]);
    }
  }

  // Seed email templates if empty
  const tmplCount = db.prepare("SELECT COUNT(*) as count FROM email_templates").get();
  if (tmplCount.count === 0) {
    const insertTmpl = db.prepare("INSERT INTO email_templates (key, name, subject, body_html, body_text, enabled) VALUES (?, ?, ?, ?, ?, ?)");
    insertTmpl.run('welcome_email', 'Welcome Email', 'Welcome to DIGITAX - Your Account is Ready!',
      '<h1>Welcome to DIGITAX!</h1><p>Hi {{name}},</p><p>Congratulations! Your DIGITAX account has been created successfully.</p>',
      'Welcome to DIGITAX!\n\nHi {{name}},\n\nCongratulations! Your DIGITAX account has been created successfully.', 1);
    insertTmpl.run('login_alert', 'Login Alert', 'DIGITAX - New Login Detected',
      '<h3>Hi {{name}},</h3><p>We detected a new login to your DIGITAX portal.</p>',
      'Hi {{name}},\n\nWe detected a new login to your DIGITAX portal.', 1);
    insertTmpl.run('forgot_password_otp', 'Forgot Password OTP', 'DIGITAX - Password Reset OTP',
      '<h3>Hi {{name}},</h3><p>Your OTP is: <strong>{{otp}}</strong></p>',
      'Hi {{name}},\n\nYour OTP is: {{otp}}', 1);
    insertTmpl.run('new_query_notification', 'New Query Notification', 'DIGITAX - Query Received: {{subject}}',
      '<h3>Hi {{name}},</h3><p>We received your query: <strong>{{subject}}</strong></p>',
      'Hi {{name}},\n\nWe received your query: {{subject}}', 1);
    insertTmpl.run('query_reply', 'Query Reply', 'DIGITAX - Reply to your query: {{subject}}',
      '<h3>Hi {{name}},</h3><p>Our team replied to: <strong>{{subject}}</strong></p>',
      'Hi {{name}},\n\nOur team replied to: {{subject}}', 1);
    insertTmpl.run('password_reset_success', 'Password Reset Success', 'DIGITAX - Password Changed Successfully',
      '<h3>Hi {{name}},</h3><p>Your password has been changed successfully.</p>',
      'Hi {{name}},\n\nYour password has been changed successfully.', 1);
  }
}

const memDb = {
  all(sql, params = []) {
    const d = getDb();
    try {
      return d.prepare(sql).all(...params);
    } catch (e) {
      console.warn('[MEMDB] all() error:', e.message, e.stack?.split('\n')[1]);
      return [];
    }
  },
  get(sql, params = []) {
    const d = getDb();
    try {
      const result = d.prepare(sql).get(...params) || null;
      return result;
    } catch (e) {
      console.warn('[MEMDB] get() error:', e.message, e.stack?.split('\n')[1]);
      return null;
    }
  },
  run(sql, params = []) {
    const d = getDb();
    try {
      const result = d.prepare(sql).run(...params);
      return { insertId: result.lastInsertRowid, affectedRows: result.changes };
    } catch (e) {
      console.warn('SQLite error (run):', e.message);
      return { insertId: 0, affectedRows: 0 };
    }
  },
  exec(sql) {
    const d = getDb();
    // already initialized in getDb
  },
};

module.exports = memDb;
