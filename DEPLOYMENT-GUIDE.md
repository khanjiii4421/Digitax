# DIGITAX Production Deployment & Architecture Runbook
**Target Domain**: [https://digitax.pk](https://digitax.pk)  
**Hosting Environment**: DirectAdmin / cPanel (CloudLinux / Apache + Passenger)  
**Main Domain Isolation**: `sarkar.pk` is completely isolated and unaffected.

---

## Architecture Summary

```
User Request: https://digitax.pk
       │
       ▼
   HTTPS / SSL (Let's Encrypt / AutoSSL)
       │
       ▼
Apache Reverse Proxy (Port 80/443 with .htaccess hardening)
       │
       ▼
CloudLinux / Phusion Passenger
   (Unix Domain Socket / App Root: /domains/digitax.pk/public_html)
       │
       ▼
Next.js Production Standalone Runtime (Node.js 20 LTS)
       │
       ▼
MySQL / MariaDB Production Database (tadbeer_digitax_db)
       │
       ▼
Persistent Data (users, applications, drafts, settings)
```

---

## 1. Domain & Hosting Isolation

- **Main Domain**: `sarkar.pk` — Document Root: `/home/tadbeer/domains/sarkar.pk/public_html`
- **DIGITAX Domain**: `digitax.pk` — Document Root: `/home/tadbeer/domains/digitax.pk/public_html`
- **Isolation Guarantee**: All DIGITAX operations, uploads, environment configurations, and static files reside strictly inside the `domains/digitax.pk` directory tree. At no point should any files be written to `domains/sarkar.pk/` or the account root.

---

## 2. Database Setup & Migration

### 2.1 Database & User Creation
1. Log in to the hosting control panel (`https://digitax.pk:2083` or DirectAdmin).
2. Navigate to **MySQL Management** / **MySQL® Database Wizard**.
3. Create a dedicated database: `tadbeer_digitax_db`.
4. Create a dedicated user: `tadbeer_digitax_user` with a strong, unique password (e.g. 24+ characters alphanumeric with symbols).
5. Assign user `tadbeer_digitax_user` to `tadbeer_digitax_db` with `ALL PRIVILEGES`.

### 2.2 Schema Import
1. Open **phpMyAdmin**.
2. Select database `tadbeer_digitax_db`.
3. Go to the **Import** tab.
4. Upload [database_setup.sql](file:///c:/Users/Logo/Desktop/LAW-WEBSITE/database_setup.sql) from the repository.
5. Click **Import / Go**.
   - The script creates all 34 tables using `CREATE TABLE IF NOT EXISTS` with `ENGINE=InnoDB` and `utf8mb4`.
   - Populates initial defaults for settings, tax slabs, pricing, email templates, and admin account.

---

## 3. Node.js Application Configuration (Setup Node.js App)

In the hosting control panel under **Software** -> **Setup Node.js App**:

| Setting | Production Value |
| :--- | :--- |
| **Node.js version** | `20.x` (or latest LTS available) |
| **Application mode** | `Production` |
| **Application root** | `domains/digitax.pk/public_html` (or `digitax-app`) |
| **Application URL** | `digitax.pk` |
| **Application startup file** | `server.js` |

Click **Create / Save**.

---

## 4. Environment Configuration (`.env`)

Inside the application directory (`domains/digitax.pk/public_html/`), create a production `.env` file:

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://digitax.pk
NEXT_PUBLIC_BASE_URL=https://digitax.pk

# Database Configuration (MySQL / MariaDB)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=tadbeer_digitax_db
DB_USER=tadbeer_digitax_user
DB_PASS=YOUR_STRONG_DATABASE_PASSWORD_HERE

# JWT Secret (Min 64 random bytes)
JWT_SECRET=YOUR_64_CHAR_HEX_OR_RANDOM_SECRET_HERE

# SMTP Email Configuration
SMTP_HOST=mail.digitax.pk
SMTP_PORT=465
SMTP_USER=info@digitax.pk
SMTP_PASS=YOUR_SMTP_PASSWORD_HERE
SMTP_FROM=info@digitax.pk
ADMIN_EMAIL=admin@digitax.pk

# Google OAuth (Optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_ID=
```

> [!CAUTION]
> Never commit `.env`, `.env.local`, or any passwords to Git. The `.gitignore` and `.htaccess` files protect these files from both repository tracking and direct HTTP access.

---

## 5. Deployment Methods

### Method A: Automated Git Push Workflow (Recommended)
cPanel / DirectAdmin provides Git repository tracking configured at:
`https://tadbeer@server15.hndservers.net/domains/digitax.pk/law-website.git`

To deploy code updates:
```bash
# 1. Commit changes
git add -A
git commit -m "feat: production updates"

# 2. Push to server
git push cpanel main
```
The `.cpanel.yml` file in the root automatically:
1. Copies standalone files to `/home/tadbeer/domains/digitax.pk/public_html`.
2. Copies `.next/static` and `public/` assets.
3. Touches `tmp/restart.txt` to trigger a zero-downtime application restart.

---

### Method B: Zip Archive Deployment (Manual / Fallback)

1. Build and package the application locally:
   ```powershell
   # Run the deployment packaging script
   node prepare-deploy.js
   ```
   This generates `digitax-deploy.zip` containing:
   - Next.js Standalone server & chunks (`.next/standalone`)
   - Static client assets (`.next/static`)
   - Public assets and uploads (`public/`)
   - Hardened Apache rules (`.htaccess`)
   - Startup script (`server.js`)

2. In cPanel **File Manager**:
   - Navigate to `/home/tadbeer/domains/digitax.pk/public_html/`.
   - Upload `digitax-deploy.zip`.
   - Extract the archive in place.
   - Delete `digitax-deploy.zip`.

3. Restart the app:
   - In **Setup Node.js App**, click **Restart**.
   - Or create an empty file: `tmp/restart.txt`.

---

## 6. Zero-Downtime & Application Restart

Phusion Passenger automatically monitors `tmp/restart.txt`. Whenever this file is touched or modified, Passenger initiates a rolling restart without dropping in-flight HTTP requests:

```bash
touch /home/tadbeer/domains/digitax.pk/public_html/tmp/restart.txt
```

---

## 7. Database Backup & Restore

### Taking a Complete Backup
From cPanel / phpMyAdmin:
1. Go to **phpMyAdmin** -> `tadbeer_digitax_db`.
2. Click **Export** -> Format: **SQL** -> Click **Export**.

Or via SSH:
```bash
mysqldump -u tadbeer_digitax_user -p tadbeer_digitax_db > /home/tadbeer/backups/digitax_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restoring from Backup
```bash
mysql -u tadbeer_digitax_user -p tadbeer_digitax_db < /home/tadbeer/backups/digitax_backup_YYYYMMDD_HHMMSS.sql
```

---

## 8. Post-Deployment Verification Checklist

After deployment, verify each item at `https://digitax.pk`:

- [ ] **Public Access**: `https://digitax.pk` loads with CSS, images, and brand headers.
- [ ] **SSL / Redirect**: `http://digitax.pk` redirects to `https://digitax.pk` (301).
- [ ] **Canonical Apex**: `https://www.digitax.pk` redirects to `https://digitax.pk` (301).
- [ ] **Main Site Isolation**: `https://sarkar.pk` loads independently without interference.
- [ ] **Security Protection**:
  - `https://digitax.pk/.env` returns **403 Forbidden**.
  - `https://digitax.pk/package.json` returns **403 Forbidden**.
  - `https://digitax.pk/server.js` returns **403 Forbidden**.
- [ ] **Database Connection**: User signup, login, and application drafts save to MySQL.
- [ ] **Admin Security**: Accessing `/admin` requires admin credentials; unauthenticated API calls to `/api/admin/*` return **401 Unauthorized**.
- [ ] **Email System**: Transactional notifications dispatch through `mail.digitax.pk:465`.
