import mysql from 'mysql2/promise';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import memDb from './mem-db.js';

// MySQL connection pool
let pool = null;
let initialized = false;
let initPromise = null;

let connectionFailed = false;
let useMemDb = false;

function getMemDb() {
  return memDb;
}

const isProduction = process.env.NODE_ENV === 'production';

function getPool() {
  if (!pool) {
    const host = process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT || '3306', 10);
    const database = process.env.DB_NAME || 'digitax';
    const user = process.env.DB_USER || process.env.DB_USERNAME || 'root';
    const password = process.env.DB_PASS ?? process.env.DB_PASSWORD ?? '';

    pool = mysql.createPool({
      host,
      port,
      database,
      user,
      password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: false,
      charset: 'utf8mb4',
    });
  }
  return pool;
}

// Ensure DB is initialized before any query
async function ensureInit() {
  if (initialized) return;
  if (connectionFailed) {
    if (isProduction) {
      throw new Error('FATAL: Database connection failed in production. Production must use MySQL.');
    }
    return;
  }
  if (!initPromise) {
    initPromise = initDb()
      .then(() => {
        initialized = true;
      })
      .catch((err) => {
        connectionFailed = true;
        console.error('\n❌ [MySQL Database Connection Failed] ❌');
        console.error('Error code:', err.code || 'UNKNOWN');
        console.error('Error message:', err.message);

        if (isProduction) {
          useMemDb = false;
          console.error('CRITICAL: In-memory fallback is strictly disabled in production. Verify DB credentials in .env!\n');
          throw new Error(`Production Database Error: Unable to connect to MySQL database (${err.message})`);
        } else {
          useMemDb = true;
          console.warn('⚠️ [Development Only] Using in-memory fallback database (seeded with admin user admin123@gmail.com / 12345)\n');
        }
      });
  }
  await ensureInitFallback();
}

async function ensureInitFallback() {
  try {
    await initPromise;
  } catch (err) {
    if (isProduction) {
      throw err;
    }
  }
}

// Helper object that mimics the old SQLite API
const db = {
  // Returns all rows
  async all(sql, params = []) {
    await ensureInit();
    if (!isProduction && useMemDb) return getMemDb().all(sql, params);
    try {
      const p = getPool();
      const [rows] = await p.execute(sql, params);
      return rows;
    } catch (err) {
      console.error('❌ Database execute error (db.all):', err.message);
      return [];
    }
  },
  // Returns single row or null
  async get(sql, params = []) {
    await ensureInit();
    if (!isProduction && useMemDb) return getMemDb().get(sql, params);
    try {
      const p = getPool();
      const [rows] = await p.execute(sql, params);
      return rows[0] || null;
    } catch (err) {
      console.error('❌ Database execute error (db.get):', err.message);
      return null;
    }
  },
  // Returns { insertId, affectedRows }
  async run(sql, params = []) {
    await ensureInit();
    if (!isProduction && useMemDb) return getMemDb().run(sql, params);
    try {
      const p = getPool();
      const [result] = await p.execute(sql, params);
      return { insertId: result.insertId, affectedRows: result.affectedRows };
    } catch (err) {
      console.error('❌ Database execute error (db.run):', err.message);
      return { insertId: 0, affectedRows: 0 };
    }
  },
  // Execute raw SQL (for setup/migrations)
  async exec(sql) {
    await ensureInit();
    if (!isProduction && useMemDb) return getMemDb().exec(sql);
    try {
      const p = getPool();
      await p.query(sql);
    } catch (err) {
      console.error('❌ Database query error (db.exec):', err.message);
    }
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

  // Add columns that might not exist on older schema versions
  try { await p.query("ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT NULL AFTER role"); } catch (e) {}
  try { await p.query("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER locked_until"); } catch (e) {}
  try { await p.query("ALTER TABLE users ADD COLUMN refresh_token_hash VARCHAR(255) AFTER oauth_id"); } catch (e) {}
  try { await p.query("ALTER TABLE users ADD COLUMN otp_code_hash VARCHAR(255) AFTER otp_code"); } catch (e) {}
  try { await p.query("ALTER TABLE ntn_applications ADD COLUMN is_resumable BOOLEAN DEFAULT TRUE AFTER status"); } catch (e) {}
  try { await p.query("ALTER TABLE ntn_applications ADD COLUMN form_data JSON AFTER category"); } catch (e) {}
  try { await p.query("ALTER TABLE family_applications ADD COLUMN coupon_code VARCHAR(50) AFTER amount"); } catch (e) {}
  try { await p.query("ALTER TABLE family_applications ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 AFTER coupon_code"); } catch (e) {}

  // Application drafts table for tracking abandoned / incomplete applications
  await p.query(`
    CREATE TABLE IF NOT EXISTS application_drafts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT,
      user_name VARCHAR(255),
      user_email VARCHAR(255),
      user_phone VARCHAR(50),
      service_type VARCHAR(100),
      current_step INT DEFAULT 1,
      step_name VARCHAR(100),
      draft_data JSON,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user (user_id),
      INDEX idx_service (service_type)
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

  // Coupons table
  await p.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INT PRIMARY KEY AUTO_INCREMENT,
      code VARCHAR(50) UNIQUE NOT NULL,
      discount_type VARCHAR(20) DEFAULT 'fixed',
      discount_value DECIMAL(10,2) DEFAULT 0,
      min_amount DECIMAL(10,2) DEFAULT 0,
      max_uses INT DEFAULT 100,
      used_count INT DEFAULT 0,
      is_active TINYINT DEFAULT 1,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

  // Family Tax Applications table
  await p.query(`
    CREATE TABLE IF NOT EXISTS family_applications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      order_number VARCHAR(100) UNIQUE,
      user_id INT,
      full_name VARCHAR(255),
      father_name VARCHAR(255),
      cnic VARCHAR(50),
      dob VARCHAR(50),
      gender VARCHAR(20),
      marital_status VARCHAR(20),
      mobile VARCHAR(50),
      whatsapp VARCHAR(50),
      email VARCHAR(255),
      occupation VARCHAR(255),
      employer_name VARCHAR(255),
      monthly_income DECIMAL(12,2) DEFAULT 0,
      annual_income DECIMAL(12,2) DEFAULT 0,
      ntn VARCHAR(100),
      address TEXT,
      province VARCHAR(100),
      city VARCHAR(100),
      postal_code VARCHAR(20),
      current_step INT DEFAULT 1,
      is_draft TINYINT DEFAULT 1,
      status VARCHAR(50) DEFAULT 'Draft',
      payment_status VARCHAR(50) DEFAULT 'Pending Payment',
      amount DECIMAL(10,2) DEFAULT 5000,
      payment_method VARCHAR(100),
      payment_proof_url TEXT,
      digital_signature VARCHAR(255),
      declared_correct TINYINT DEFAULT 0,
      assigned_consultant_id INT,
      filed_return_url TEXT,
      wealth_statement_url TEXT,
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Family Members table
  await p.query(`
    CREATE TABLE IF NOT EXISTS family_members (
      id INT PRIMARY KEY AUTO_INCREMENT,
      application_id INT,
      member_type VARCHAR(20),
      relationship VARCHAR(50),
      name VARCHAR(255),
      cnic VARCHAR(50),
      dob VARCHAR(50),
      bform_cnic VARCHAR(50),
      is_student TINYINT DEFAULT 0,
      institution VARCHAR(255),
      occupation VARCHAR(255),
      monthly_income DECIMAL(12,2) DEFAULT 0,
      annual_income DECIMAL(12,2) DEFAULT 0,
      ntn VARCHAR(100),
      is_taxpayer TINYINT DEFAULT 0,
      FOREIGN KEY (application_id) REFERENCES family_applications(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Family Income Sources table
  await p.query(`
    CREATE TABLE IF NOT EXISTS family_income_sources (
      id INT PRIMARY KEY AUTO_INCREMENT,
      application_id INT,
      income_type VARCHAR(50),
      monthly_amount DECIMAL(12,2) DEFAULT 0,
      annual_amount DECIMAL(12,2) DEFAULT 0,
      details_json TEXT,
      FOREIGN KEY (application_id) REFERENCES family_applications(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Family Assets table
  await p.query(`
    CREATE TABLE IF NOT EXISTS family_assets (
      id INT PRIMARY KEY AUTO_INCREMENT,
      application_id INT,
      asset_type VARCHAR(50),
      title VARCHAR(255),
      purchase_date VARCHAR(50),
      purchase_value DECIMAL(12,2) DEFAULT 0,
      current_value DECIMAL(12,2) DEFAULT 0,
      ownership_percentage DECIMAL(5,2) DEFAULT 100,
      details_json TEXT,
      FOREIGN KEY (application_id) REFERENCES family_applications(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Family Liabilities table
  await p.query(`
    CREATE TABLE IF NOT EXISTS family_liabilities (
      id INT PRIMARY KEY AUTO_INCREMENT,
      application_id INT,
      liability_type VARCHAR(50),
      title VARCHAR(255),
      lender_name VARCHAR(255),
      total_amount DECIMAL(12,2) DEFAULT 0,
      remaining_amount DECIMAL(12,2) DEFAULT 0,
      details_json TEXT,
      FOREIGN KEY (application_id) REFERENCES family_applications(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Family Bank Accounts table
  await p.query(`
    CREATE TABLE IF NOT EXISTS family_bank_accounts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      application_id INT,
      bank_name VARCHAR(255),
      account_title VARCHAR(255),
      account_number VARCHAR(100),
      iban VARCHAR(100),
      annual_transactions DECIMAL(14,2) DEFAULT 0,
      FOREIGN KEY (application_id) REFERENCES family_applications(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Family Documents table
  await p.query(`
    CREATE TABLE IF NOT EXISTS family_documents (
      id INT PRIMARY KEY AUTO_INCREMENT,
      application_id INT,
      category VARCHAR(50),
      doc_type VARCHAR(50),
      file_name VARCHAR(255),
      file_url TEXT,
      file_size INT,
      file_type VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES family_applications(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Family Payments table
  await p.query(`
    CREATE TABLE IF NOT EXISTS family_payments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      application_id INT,
      order_number VARCHAR(100),
      payment_method VARCHAR(100),
      amount DECIMAL(10,2),
      status VARCHAR(50) DEFAULT 'Pending Payment',
      payment_proof_url TEXT,
      transaction_ref VARCHAR(100),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      verified_at DATETIME,
      FOREIGN KEY (application_id) REFERENCES family_applications(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Family Status History table
  await p.query(`
    CREATE TABLE IF NOT EXISTS family_status_history (
      id INT PRIMARY KEY AUTO_INCREMENT,
      application_id INT,
      status VARCHAR(50),
      notes TEXT,
      changed_by INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES family_applications(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Family Activity Logs table
  await p.query(`
    CREATE TABLE IF NOT EXISTS family_activity_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      application_id INT,
      user_id INT,
      action VARCHAR(100),
      description TEXT,
      ip_address VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES family_applications(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Service Pricing table
  await p.query(`
    CREATE TABLE IF NOT EXISTS service_pricing (
      id INT PRIMARY KEY AUTO_INCREMENT,
      service_key VARCHAR(100) UNIQUE NOT NULL,
      service_name VARCHAR(255) NOT NULL,
      government_fee DECIMAL(10,2) DEFAULT 0,
      digitax_fee DECIMAL(10,2) DEFAULT 0,
      total_fee DECIMAL(10,2) DEFAULT 0,
      currency VARCHAR(10) DEFAULT 'PKR',
      description TEXT,
      is_active TINYINT DEFAULT 1,
      updated_by INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // FAQs table
  await p.query(`
    CREATE TABLE IF NOT EXISTS faqs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      question TEXT NOT NULL,
      answer LONGTEXT NOT NULL,
      category VARCHAR(100) DEFAULT 'general',
      service_key VARCHAR(100),
      display_order INT DEFAULT 0,
      is_active TINYINT DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Audit Logs table
  await p.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      admin_id INT,
      admin_name VARCHAR(255),
      action VARCHAR(100) NOT NULL,
      entity VARCHAR(100),
      entity_id VARCHAR(100),
      details TEXT,
      ip_address VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Payment Transactions table
  await p.query(`
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      application_id INT,
      application_type VARCHAR(50) DEFAULT 'ntn',
      user_id INT,
      provider VARCHAR(50) DEFAULT 'manual',
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'PKR',
      status VARCHAR(50) DEFAULT 'pending',
      transaction_ref VARCHAR(255),
      proof_url TEXT,
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Safe additive migrations
  try { await p.query("ALTER TABLE blogs ADD COLUMN slug VARCHAR(300)"); } catch(e) {}
  try { await p.query("ALTER TABLE blogs ADD COLUMN status VARCHAR(20) DEFAULT 'published'"); } catch(e) {}
  try { await p.query("ALTER TABLE blogs ADD COLUMN content LONGTEXT"); } catch(e) {}
  try { await p.query("ALTER TABLE blogs ADD COLUMN category VARCHAR(100) DEFAULT 'Tax Filing'"); } catch(e) {}
  try { await p.query("ALTER TABLE blogs ADD COLUMN tags TEXT"); } catch(e) {}
  try { await p.query("ALTER TABLE blogs ADD COLUMN publish_date DATETIME DEFAULT CURRENT_TIMESTAMP"); } catch(e) {}
  try { await p.query("ALTER TABLE blogs ADD COLUMN featured TINYINT DEFAULT 0"); } catch(e) {}

  try { await p.query("ALTER TABLE videos ADD COLUMN description TEXT"); } catch(e) {}
  try { await p.query("ALTER TABLE videos ADD COLUMN thumbnail_url TEXT"); } catch(e) {}
  try { await p.query("ALTER TABLE videos ADD COLUMN category VARCHAR(100) DEFAULT 'Tax Tutorials'"); } catch(e) {}
  try { await p.query("ALTER TABLE videos ADD COLUMN is_active TINYINT DEFAULT 1"); } catch(e) {}

  try { await p.query("ALTER TABLE services ADD COLUMN service_key VARCHAR(100)"); } catch(e) {}
  try { await p.query("ALTER TABLE services ADD COLUMN government_fee DECIMAL(10,2) DEFAULT 0"); } catch(e) {}
  try { await p.query("ALTER TABLE services ADD COLUMN digitax_fee DECIMAL(10,2) DEFAULT 0"); } catch(e) {}
  try { await p.query("ALTER TABLE services ADD COLUMN total_fee DECIMAL(10,2) DEFAULT 0"); } catch(e) {}
  try { await p.query("ALTER TABLE services ADD COLUMN slug VARCHAR(255)"); } catch(e) {}
  try { await p.query("ALTER TABLE services ADD COLUMN display_order INT DEFAULT 0"); } catch(e) {}
  try { await p.query("ALTER TABLE services ADD COLUMN cta_text VARCHAR(100) DEFAULT 'Apply Now'"); } catch(e) {}
  try { await p.query("ALTER TABLE services ADD COLUMN portal_url VARCHAR(255)"); } catch(e) {}

  try { await p.query("ALTER TABLE ntn_applications ADD COLUMN deleted_at DATETIME NULL"); } catch(e) {}
  try { await p.query("ALTER TABLE ntn_applications ADD COLUMN deleted_by INT NULL"); } catch(e) {}
  try { await p.query("ALTER TABLE family_applications ADD COLUMN deleted_at DATETIME NULL"); } catch(e) {}
  try { await p.query("ALTER TABLE family_applications ADD COLUMN deleted_by INT NULL"); } catch(e) {}

  // Page contact settings table
  await p.query(`
    CREATE TABLE IF NOT EXISTS page_contact_settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      page_slug VARCHAR(100) UNIQUE NOT NULL,
      page_title VARCHAR(255),
      use_custom_contact TINYINT DEFAULT 0,
      office_address TEXT,
      contact_phone VARCHAR(50),
      support_phone VARCHAR(50),
      ntn_phone VARCHAR(50),
      usa_phone VARCHAR(50),
      contact_email VARCHAR(255),
      whatsapp_number VARCHAR(50),
      google_maps_link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Seed default service pricing if table is empty
  const [pricingCount] = await p.query('SELECT COUNT(*) as count FROM service_pricing');
  if (pricingCount[0].count === 0) {
    const defaultPricing = [
      ['personal-tax', 'Personal Tax Filing', 0, 2500, 2500, 'PKR', 'Individual income tax return preparation and submission to FBR.', 1],
      ['family-tax', 'Family Tax Filing', 0, 5000, 5000, 'PKR', 'Complete family income tax filing with asset and wealth statement.', 1],
      ['ntn-registration', 'NTN Registration', 0, 1500, 1500, 'PKR', 'National Tax Number registration with FBR for individuals and businesses.', 1],
      ['iris-profile', 'IRIS Profile Update', 0, 2000, 2000, 'PKR', 'FBR IRIS 181 form modification for mobile, address, bank, and business details.', 1],
      ['business-registration', 'Business Registration', 2000, 8000, 10000, 'PKR', 'Sole Proprietorship, Partnership, and SECP Private Limited company formation.', 1],
      ['gst-registration', 'GST Registration', 0, 7500, 7500, 'PKR', 'Sales tax registration with FBR for businesses and retailers.', 1],
    ];
    for (const pr of defaultPricing) {
      await p.query(
        'INSERT IGNORE INTO service_pricing (service_key, service_name, government_fee, digitax_fee, total_fee, currency, description, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        pr
      );
    }
  }

  // Seed default FAQs if empty
  const [faqCount] = await p.query('SELECT COUNT(*) as count FROM faqs');
  if (faqCount[0].count === 0) {
    const defaultFaqs = [
      ['What documents are required for NTN registration?', 'For individual NTN: CNIC copy, active mobile number registered on own CNIC, and personal email. For business: Rent deed/utility bill of business premises.', 'ntn', 'ntn-registration', 1],
      ['How long does personal tax filing take?', 'With DigiTax, your return is prepared and submitted within 24 to 48 hours after all required financial documents are verified.', 'tax', 'personal-tax', 2],
      ['What is the difference between Filer and Non-Filer in Pakistan?', 'Filers pay significantly reduced withholding taxes on banking transactions, property purchase/sale, vehicle registration, and cash withdrawals compared to non-filers.', 'tax', 'personal-tax', 3],
      ['Can I update my registered mobile number in FBR IRIS?', 'Yes, you can submit an IRIS Profile Update application through DigiTax. Our team will file form 181 for profile modification.', 'iris', 'iris-profile', 4],
      ['What is required for GST/Sales Tax Registration?', 'Active NTN, business bank account maintenance certificate, business premises electricity bill, and biometric verification at FBR e-Sahulat.', 'gst', 'gst-registration', 5],
    ];
    for (const fq of defaultFaqs) {
      await p.query('INSERT INTO faqs (question, answer, category, service_key, display_order) VALUES (?, ?, ?, ?, ?)', fq);
    }
  }

  // Seed Default Settings (including website_mode)
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
    ['office_address', 'Office 12, 3rd Floor, Executive Plaza, Islamabad, Pakistan'],
    ['google_maps_link', 'https://maps.google.com/?q=Islamabad'],
    ['locate_us_url', 'https://maps.google.com/?q=Islamabad'],
    ['about_title', 'About DIGITAX'],
    ['about_description', 'DIGITAX is Pakistan\'s premier digital tax preparation and filing portal designed to simplify FBR compliance. Our team of certified tax professionals, corporate lawyers, and IT specialist consultants ensures your filings are precise, compliant, and completed within minutes.'],
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
    ['family_tax_base_fee', '5000'],
    ['website_mode', 'ONLINE'],
    ['maintenance_message', 'We are currently performing scheduled system upgrades to improve our tax filing services. We will be back shortly.'],
    ['maintenance_title', 'System Maintenance in Progress'],
    ['maintenance_contact', 'For urgent inquiries, email info@digitax.pk or call +92 349 1887803'],
    ['closed_message', 'The DIGITAX portal is currently closed for new submissions.'],
    ['promo_popup_enabled', '1'],
    ['promo_popup_badge', 'Limited Time Special Offer'],
    ['promo_popup_title', 'Get 30% OFF On Tax Filing Services!'],
    ['promo_popup_description', 'Claim your 30% promotional discount on tax filing or NTN registration today. Automatic coupon will be applied at checkout!'],
    ['promo_popup_discount', '30% OFF'],
    ['promo_popup_coupon_code', 'SAVE30'],
    ['promo_popup_service_url', '/portal/personal-tax'],
    ['admin_email', 'info@digitax.com'],
    ['google_client_id', ''],
    ['promo_popup_button_text', 'Claim 30% Discount Now'],
  ];

  for (const [key, value] of settings) {
    await p.query('INSERT IGNORE INTO settings (`key`, value) VALUES (?, ?)', [key, value]);
  }

  // Ensure application auto_increment starts at 2192
  try {
    await p.query('ALTER TABLE ntn_applications AUTO_INCREMENT = 2192');
  } catch (e) {}
  try {
    await p.query('ALTER TABLE family_applications AUTO_INCREMENT = 2192');
  } catch (e) {}

  // Ensure any existing Befiler branding strings in settings are updated to Digitax
  try {
    await p.query("UPDATE settings SET value = '© 2018–2026 Digitax (Pvt) Limited' WHERE `key` = 'footer_copyright' AND value LIKE '%Befiler%'");
    await p.query("UPDATE settings SET value = 'tax filing, NTN registration, company registration, FBR, digitax, pakistan' WHERE `key` = 'seo_keywords' AND value LIKE '%befiler%'");
  } catch (e) {}

  // Seed Default SAVE30 Coupon
  try {
    await p.query(`
      INSERT IGNORE INTO coupons (code, discount_type, discount_value, min_amount, max_uses, used_count, is_active)
      VALUES ('SAVE30', 'percentage', 30, 0, 1000, 0, 1),
             ('WELCOME10', 'percentage', 10, 1000, 100, 0, 1),
             ('DIGITAX500', 'fixed', 500, 1500, 200, 0, 1)
    `);
  } catch(e) {}

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

  // Update existing welcome email template to premium version
  const [welcomeRows] = await p.query("SELECT id FROM email_templates WHERE `key` = 'welcome_email'");
  const premiumWelcomeHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Welcome to DIGITAX</title></head><body style="margin:0;padding:0;background:#eef2f7;font-family:'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#eef2f7;padding:32px 16px"><tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.09)"><tr><td style="background:linear-gradient(135deg,#003f7d 0%,#0056A8 50%,#0077cc 100%);padding:48px 40px 40px;text-align:center;position:relative"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding-bottom:20px"><div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:16px;padding:10px 22px"><span style="color:#ffffff;font-size:22px;font-weight:900;letter-spacing:1px;text-transform:uppercase">DIGITAX</span></div></td></tr><tr><td align="center"><div style="width:72px;height:72px;background:rgba(255,255,255,0.15);border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;border:3px solid rgba(255,255,255,0.3)"><span style="font-size:36px">&#127881;</span></div><h1 style="color:#ffffff;font-size:30px;font-weight:800;margin:0 0 10px;letter-spacing:-0.5px;line-height:1.2">Welcome to DIGITAX!</h1><p style="color:rgba(255,255,255,0.88);font-size:16px;margin:0;line-height:1.5">Pakistan's Premier Tax &amp; Business Services Platform</p></td></tr></table></td></tr><tr><td style="padding:40px 40px 0"><p style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px">Hello {{name}},</p><p style="font-size:15px;color:#4b5563;line-height:1.8;margin:0 0 28px">Congratulations on creating your DIGITAX account! You've taken the smart first step toward stress-free tax compliance. Our expert team of certified consultants is ready to help you every step of the way.</p><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,#f0f7ff,#e8f4fd);border-radius:16px;border:1px solid #cce0f5;margin:0 0 28px"><tr><td style="padding:24px 28px"><p style="font-size:14px;font-weight:700;color:#0056A8;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.5px">&#10003; &nbsp;What You Can Do Right Now</p><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td width="50%" style="vertical-align:top;padding-right:12px"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:6px 0"><span style="color:#0056A8;font-weight:700;margin-right:8px">&#9679;</span><span style="font-size:14px;color:#374151">File income tax returns online</span></td></tr><tr><td style="padding:6px 0"><span style="color:#0056A8;font-weight:700;margin-right:8px">&#9679;</span><span style="font-size:14px;color:#374151">Register your NTN number</span></td></tr><tr><td style="padding:6px 0"><span style="color:#0056A8;font-weight:700;margin-right:8px">&#9679;</span><span style="font-size:14px;color:#374151">Apply for company registration</span></td></tr></table></td><td width="50%" style="vertical-align:top;padding-left:12px"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:6px 0"><span style="color:#0056A8;font-weight:700;margin-right:8px">&#9679;</span><span style="font-size:14px;color:#374151">Track your filing status</span></td></tr><tr><td style="padding:6px 0"><span style="color:#0056A8;font-weight:700;margin-right:8px">&#9679;</span><span style="font-size:14px;color:#374151">Download certificates &amp; docs</span></td></tr><tr><td style="padding:6px 0"><span style="color:#0056A8;font-weight:700;margin-right:8px">&#9679;</span><span style="font-size:14px;color:#374151">USA LLC &amp; ITIN registration</span></td></tr></table></td></tr></table></td></tr></table><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f9fafb;border-radius:16px;border:1px solid #e5e7eb;margin:0 0 28px"><tr><td style="padding:22px 28px"><p style="font-size:13px;font-weight:700;color:#6b7280;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.5px">Why Clients Trust DIGITAX</p><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td width="33%" align="center" style="padding:8px 4px"><div style="width:40px;height:40px;background:#e8f1fb;border-radius:50%;margin:0 auto 8px;text-align:center;line-height:40px;font-size:18px">&#128274;</div><p style="font-size:12px;font-weight:600;color:#374151;margin:0;line-height:1.4">Bank-Level<br>Security</p></td><td width="33%" align="center" style="padding:8px 4px"><div style="width:40px;height:40px;background:#e8f1fb;border-radius:50%;margin:0 auto 8px;text-align:center;line-height:40px;font-size:18px">&#127775;</div><p style="font-size:12px;font-weight:600;color:#374151;margin:0;line-height:1.4">FBR Approved<br>&amp; Compliant</p></td><td width="33%" align="center" style="padding:8px 4px"><div style="width:40px;height:40px;background:#e8f1fb;border-radius:50%;margin:0 auto 8px;text-align:center;line-height:40px;font-size:18px">&#128202;</div><p style="font-size:12px;font-weight:600;color:#374151;margin:0;line-height:1.4">Fast<br>Turnaround</p></td></tr></table></td></tr></table></td></tr><tr><td style="padding:0 40px 40px"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px"><tr><td align="center"><a href="https://digitax.pk/portal" style="display:inline-block;background:linear-gradient(135deg,#0056A8,#0077cc);color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;padding:16px 48px;border-radius:14px;box-shadow:0 6px 20px rgba(0,86,168,0.35);letter-spacing:0.3px">&#128196; &nbsp;Go to My Portal</a></td></tr></table><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #f3f4f6;padding-top:20px"><tr><td><p style="font-size:13px;color:#9ca3af;line-height:1.7;margin:0">Questions? Our team is here for you:<br><a href="mailto:info@digitax.pk" style="color:#0056A8;text-decoration:none;font-weight:600">info@digitax.pk</a> &nbsp;|&nbsp; <a href="tel:+923491887803" style="color:#0056A8;text-decoration:none;font-weight:600">+92 349 1887803</a></p></td></tr></table></td></tr><tr><td style="background:#003f7d;padding:24px 40px"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td><p style="font-size:16px;font-weight:900;color:#ffffff;margin:0 0 4px;letter-spacing:1px">DIGITAX</p><p style="font-size:12px;color:rgba(255,255,255,0.65);margin:0">Pakistan's Trusted Tax &amp; Business Consultants</p></td><td align="right"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding:0 4px"><a href="https://digitax.pk" style="font-size:11px;color:rgba(255,255,255,0.6);text-decoration:none">Website</a></td><td style="padding:0 4px;color:rgba(255,255,255,0.3)">|</td><td style="padding:0 4px"><a href="https://digitax.pk/portal" style="font-size:11px;color:rgba(255,255,255,0.6);text-decoration:none">Portal</a></td><td style="padding:0 4px;color:rgba(255,255,255,0.3)">|</td><td style="padding:0 4px"><a href="mailto:info@digitax.pk" style="font-size:11px;color:rgba(255,255,255,0.6);text-decoration:none">Contact</a></td></tr></table></td></tr><tr><td colspan="2" style="padding-top:14px;border-top:1px solid rgba(255,255,255,0.1)"><p style="font-size:11px;color:rgba(255,255,255,0.4);margin:0">&#169; 2018–2026 Digitax (Pvt) Limited. All rights reserved.</p></td></tr></table></td></tr></table></td></tr></table></body></html>`;
  const premiumWelcomeText = `Welcome to DIGITAX!\n\nHi {{name}},\n\nCongratulations on creating your DIGITAX account! You've taken the smart first step toward stress-free tax compliance.\n\nWHAT YOU CAN DO NOW:\n  ✓ File income tax returns online\n  ✓ Register your NTN number\n  ✓ Apply for company registration\n  ✓ Track your filing status\n  ✓ Download certificates & documents\n  ✓ USA LLC & ITIN registration\n\nWHY CLIENTS TRUST DIGITAX:\n  🔒 Bank-Level Security\n  ⭐ FBR Approved & Compliant\n  📊 Fast Turnaround\n\nACCESS YOUR PORTAL:\nhttps://digitax.pk/portal\n\nNeed help? Contact us:\nEmail: info@digitax.pk\nPhone: +92 349 1887803\n\n---\nDIGITAX — Pakistan's Trusted Tax & Business Consultants\n© 2018–2026 Digitax (Pvt) Limited`;

  if (welcomeRows.length > 0) {
    await p.query("UPDATE email_templates SET subject = ?, body_html = ?, body_text = ? WHERE `key` = 'welcome_email'",
      ['Welcome to DIGITAX — Your Account is Ready! 🎉', premiumWelcomeHtml, premiumWelcomeText]);
  }
}

// Auto-initialize on first query (lazy, not at import time)
// This avoids connection errors during Next.js build

export default db;
