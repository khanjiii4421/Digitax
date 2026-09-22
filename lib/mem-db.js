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
      permissions TEXT DEFAULT '',
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

  try {
    db.exec("ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT ''");
  } catch (e) {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS application_drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      user_email TEXT,
      user_phone TEXT,
      service_type TEXT,
      current_step INTEGER DEFAULT 1,
      step_name TEXT,
      draft_data TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
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
      status TEXT DEFAULT 'active',
      slug TEXT,
      display_order INTEGER DEFAULT 0,
      cta_text TEXT DEFAULT 'Apply Now',
      portal_url TEXT
    )
  `);

  try { db.exec("ALTER TABLE services ADD COLUMN slug TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE services ADD COLUMN display_order INTEGER DEFAULT 0"); } catch (e) {}
  try { db.exec("ALTER TABLE services ADD COLUMN cta_text TEXT DEFAULT 'Apply Now'"); } catch (e) {}
  try { db.exec("ALTER TABLE services ADD COLUMN portal_url TEXT"); } catch (e) {}

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
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT DEFAULT 'fixed',
      discount_value REAL DEFAULT 0,
      min_amount REAL DEFAULT 0,
      max_uses INTEGER DEFAULT 100,
      used_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    const ntnSeq = db.prepare("SELECT seq FROM sqlite_sequence WHERE name = 'ntn_applications'").get();
    if (!ntnSeq || ntnSeq.seq < 2191) {
      db.prepare("INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES ('ntn_applications', 2191)").run();
    }
  } catch (e) {}

  try {
    const famSeq = db.prepare("SELECT seq FROM sqlite_sequence WHERE name = 'family_applications'").get();
    if (!famSeq || famSeq.seq < 2191) {
      db.prepare("INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES ('family_applications', 2191)").run();
    }
  } catch (e) {}

  try { db.exec("ALTER TABLE ntn_applications ADD COLUMN deleted_at TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE ntn_applications ADD COLUMN deleted_by INTEGER"); } catch (e) {}
  try { db.exec("ALTER TABLE ntn_applications ADD COLUMN coupon_code TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE ntn_applications ADD COLUMN discount_amount REAL DEFAULT 0"); } catch (e) {}
  try { db.exec("ALTER TABLE family_applications ADD COLUMN deleted_at TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE family_applications ADD COLUMN deleted_by INTEGER"); } catch (e) {}
  try { db.exec("ALTER TABLE family_applications ADD COLUMN coupon_code TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE family_applications ADD COLUMN discount_amount REAL DEFAULT 0"); } catch (e) {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS page_contact_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_slug TEXT UNIQUE NOT NULL,
      page_title TEXT,
      use_custom_contact INTEGER DEFAULT 0,
      office_address TEXT,
      contact_phone TEXT,
      support_phone TEXT,
      ntn_phone TEXT,
      usa_phone TEXT,
      contact_email TEXT,
      whatsapp_number TEXT,
      google_maps_link TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
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
      ['footer_copyright', '© 2018–2026 Digitax (Pvt) Limited'],
      ['footer_powered_by', 'Powered by Arittek'],
      ['contact_phone', '+92 349 1887803'],
      ['support_phone', '+92 349 1887803'],
      ['ntn_phone', '+92 349 1887803'],
      ['usa_phone', '+1 (302) 555-0199'],
      ['contact_email', 'info@digitax.pk'],
      ['admin_email', 'info@digitax.com'],
      ['google_client_id', ''],
      ['office_address', 'Office 12, 3rd Floor, Executive Plaza, Islamabad, Pakistan'],
      ['google_maps_link', 'https://maps.google.com/?q=Islamabad'],
      ['locate_us_url', 'https://maps.google.com/?q=Islamabad'],
      ['about_title', 'About DIGITAX'],
      ['about_description', "DIGITAX is Pakistan's premier digital tax preparation and filing portal designed to simplify FBR compliance. Our team of certified tax professionals, corporate lawyers, and IT specialist consultants ensures your filings are precise, compliant, and completed within minutes."],
      ['about_image', ''],
      ['about_enabled', '1'],
      ['team_title', 'Meet Our Dream Team'],
      ['team_section_image', ''],
      ['seo_title', 'DIGITAX — Pakistan\'s Premier Tax & Business Consultants'],
      ['seo_description', 'Expert tax filing, NTN & company registration, FBR compliance, and corporate advisory services across Pakistan.'],
      ['seo_keywords', 'tax filing, NTN registration, company registration, FBR, digitax, pakistan'],
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

  // Seed default coupons if empty
  try {
    const couponCount = db.prepare("SELECT COUNT(*) as count FROM coupons").get();
    if (couponCount.count === 0) {
      const insertCoupon = db.prepare("INSERT INTO coupons (code, discount_type, discount_value, min_amount, max_uses, used_count, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)");
      insertCoupon.run('WELCOME10', 'percent', 10, 1000, 100, 0, 1);
      insertCoupon.run('SAVE30', 'percent', 30, 1000, 500, 0, 1);
      insertCoupon.run('DIGITAX500', 'fixed', 500, 1500, 200, 0, 1);
    }
  } catch (e) {}

  // Ensure any existing Befiler branding strings in settings are updated to Digitax
  try {
    db.prepare("UPDATE settings SET value = '© 2018–2026 Digitax (Pvt) Limited' WHERE key = 'footer_copyright' AND value LIKE '%Befiler%'").run();
    db.prepare("UPDATE settings SET value = 'tax filing, NTN registration, company registration, FBR, digitax, pakistan' WHERE key = 'seo_keywords' AND value LIKE '%befiler%'").run();
  } catch (e) {}

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
    insertTmpl.run('welcome_email', 'Welcome Email', 'Welcome to DIGITAX — Your Account is Ready! 🎉',
      '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Welcome to DIGITAX</title></head><body style="margin:0;padding:0;background:#eef2f7;font-family:Segoe UI,Arial,sans-serif;-webkit-font-smoothing:antialiased"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#eef2f7;padding:32px 16px"><tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.09)"><tr><td style="background:linear-gradient(135deg,#003f7d 0%,#0056A8 50%,#0077cc 100%);padding:48px 40px 40px;text-align:center"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding-bottom:20px"><div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:16px;padding:10px 22px"><span style="color:#ffffff;font-size:22px;font-weight:900;letter-spacing:1px">DIGITAX</span></div></td></tr><tr><td align="center"><h1 style="color:#ffffff;font-size:30px;font-weight:800;margin:0 0 10px;letter-spacing:-0.5px;line-height:1.2">Welcome to DIGITAX!</h1><p style="color:rgba(255,255,255,0.88);font-size:16px;margin:0;line-height:1.5">Pakistan&#39;s Premier Tax &amp; Business Services Platform</p></td></tr></table></td></tr><tr><td style="padding:40px 40px 0"><p style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px">Hello {{name}},</p><p style="font-size:15px;color:#4b5563;line-height:1.8;margin:0 0 28px">Congratulations on creating your DIGITAX account! You&#39;ve taken the smart first step toward stress-free tax compliance. Our expert team of certified consultants is ready to help you every step of the way.</p><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,#f0f7ff,#e8f4fd);border-radius:16px;border:1px solid #cce0f5;margin:0 0 28px"><tr><td style="padding:24px 28px"><p style="font-size:14px;font-weight:700;color:#0056A8;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.5px">&#10003; &nbsp;What You Can Do Right Now</p><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td width="50%" style="vertical-align:top;padding-right:12px"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:6px 0"><span style="color:#0056A8;font-weight:700;margin-right:8px">&#9679;</span><span style="font-size:14px;color:#374151">File income tax returns online</span></td></tr><tr><td style="padding:6px 0"><span style="color:#0056A8;font-weight:700;margin-right:8px">&#9679;</span><span style="font-size:14px;color:#374151">Register your NTN number</span></td></tr><tr><td style="padding:6px 0"><span style="color:#0056A8;font-weight:700;margin-right:8px">&#9679;</span><span style="font-size:14px;color:#374151">Apply for company registration</span></td></tr></table></td><td width="50%" style="vertical-align:top;padding-left:12px"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:6px 0"><span style="color:#0056A8;font-weight:700;margin-right:8px">&#9679;</span><span style="font-size:14px;color:#374151">Track your filing status</span></td></tr><tr><td style="padding:6px 0"><span style="color:#0056A8;font-weight:700;margin-right:8px">&#9679;</span><span style="font-size:14px;color:#374151">Download certificates &amp; docs</span></td></tr><tr><td style="padding:6px 0"><span style="color:#0056A8;font-weight:700;margin-right:8px">&#9679;</span><span style="font-size:14px;color:#374151">USA LLC &amp; ITIN registration</span></td></tr></table></td></tr></table></td></tr></table><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f9fafb;border-radius:16px;border:1px solid #e5e7eb;margin:0 0 28px"><tr><td style="padding:22px 28px"><p style="font-size:13px;font-weight:700;color:#6b7280;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.5px">Why Clients Trust DIGITAX</p><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td width="33%" align="center" style="padding:8px 4px"><div style="width:40px;height:40px;background:#e8f1fb;border-radius:50%;margin:0 auto 8px;text-align:center;line-height:40px;font-size:18px">&#128274;</div><p style="font-size:12px;font-weight:600;color:#374151;margin:0;line-height:1.4">Bank-Level<br>Security</p></td><td width="33%" align="center" style="padding:8px 4px"><div style="width:40px;height:40px;background:#e8f1fb;border-radius:50%;margin:0 auto 8px;text-align:center;line-height:40px;font-size:18px">&#127775;</div><p style="font-size:12px;font-weight:600;color:#374151;margin:0;line-height:1.4">FBR Approved<br>&amp; Compliant</p></td><td width="33%" align="center" style="padding:8px 4px"><div style="width:40px;height:40px;background:#e8f1fb;border-radius:50%;margin:0 auto 8px;text-align:center;line-height:40px;font-size:18px">&#128202;</div><p style="font-size:12px;font-weight:600;color:#374151;margin:0;line-height:1.4">Fast<br>Turnaround</p></td></tr></table></td></tr></table></td></tr><tr><td style="padding:0 40px 40px"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px"><tr><td align="center"><a href="https://digitax.pk/portal" style="display:inline-block;background:linear-gradient(135deg,#0056A8,#0077cc);color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;padding:16px 48px;border-radius:14px;box-shadow:0 6px 20px rgba(0,86,168,0.35)">&#128196; &nbsp;Go to My Portal</a></td></tr></table><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #f3f4f6;padding-top:20px"><tr><td><p style="font-size:13px;color:#9ca3af;line-height:1.7;margin:0">Questions? Our team is here for you:<br><a href="mailto:info@digitax.pk" style="color:#0056A8;text-decoration:none;font-weight:600">info@digitax.pk</a> &nbsp;|&nbsp; <a href="tel:+923491887803" style="color:#0056A8;text-decoration:none;font-weight:600">+92 349 1887803</a></p></td></tr></table></td></tr><tr><td style="background:#003f7d;padding:24px 40px"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td><p style="font-size:16px;font-weight:900;color:#ffffff;margin:0 0 4px;letter-spacing:1px">DIGITAX</p><p style="font-size:12px;color:rgba(255,255,255,0.65);margin:0">Pakistan&#39;s Trusted Tax &amp; Business Consultants</p></td><td align="right"><a href="https://digitax.pk" style="font-size:11px;color:rgba(255,255,255,0.6);text-decoration:none">Website</a> <span style="color:rgba(255,255,255,0.3)">|</span> <a href="https://digitax.pk/portal" style="font-size:11px;color:rgba(255,255,255,0.6);text-decoration:none">Portal</a> <span style="color:rgba(255,255,255,0.3)">|</span> <a href="mailto:info@digitax.pk" style="font-size:11px;color:rgba(255,255,255,0.6);text-decoration:none">Contact</a></td></tr><tr><td colspan="2" style="padding-top:14px;border-top:1px solid rgba(255,255,255,0.1)"><p style="font-size:11px;color:rgba(255,255,255,0.4);margin:0">&#169; 2018-2026 Digitax (Pvt) Limited. All rights reserved.</p></td></tr></table></td></tr></table></td></tr></table></body></html>',
      'Welcome to DIGITAX!\n\nHi {{name}},\n\nCongratulations on creating your DIGITAX account! You have taken the smart first step toward stress-free tax compliance.\n\nWHAT YOU CAN DO NOW:\n  - File income tax returns online\n  - Register your NTN number\n  - Apply for company registration\n  - Track your filing status\n  - Download certificates & documents\n  - USA LLC & ITIN registration\n\nWHY CLIENTS TRUST DIGITAX:\n  - Bank-Level Security\n  - FBR Approved & Compliant\n  - Fast Turnaround\n\nACCESS YOUR PORTAL:\nhttps://digitax.pk/portal\n\nNeed help? Contact us:\nEmail: info@digitax.pk\nPhone: +92 349 1887803\n\n---\nDIGITAX - Pakistan\'s Trusted Tax & Business Consultants\n(c) 2018-2026 Digitax (Pvt) Limited', 1);
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
