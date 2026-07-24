# DIGITAX App Deployment Guide for cPanel

## Prerequisites
- cPanel login credentials (already provided)
- Deployment package: `digitax-deploy.zip` (already created)
- Database setup script: `database_setup.sql`

---

## Step 1: Set Up the Database in cPanel

### 1.1 Log in to cPanel
1. Open your browser and go to: https://digitax.pk:2083/evo/login
2. Log in with username: `tadbeer` and password: `Digitax@8554890`

### 1.2 Create Database and User
1. In cPanel, go to **"MySQL® Database Wizard"** under the **"Databases"** section
2. Step 1: Create a Database
   - Enter database name: `digitax_db` (cPanel will prefix it with your username, like `tadbeer_digitax_db`)
   - Click **"Next Step"**
3. Step 2: Create Database User
   - Username: `digitax_user` (cPanel will prefix it like `tadbeer_digitax_user`)
   - Password: Use a strong password (you can use the Password Generator)
   - Click **"Create User"**
4. Step 3: Add User to Database
   - Select the user and database you just created
   - Check **"ALL PRIVILEGES"**
   - Click **"Next Step"**

### 1.3 Import the Database
1. Go back to cPanel home, click **"phpMyAdmin"** under **"Databases"**
2. Select your new database from the left sidebar
3. Click the **"Import"** tab at the top
4. Click **"Choose File"** and select `database_setup.sql` from your project folder
5. Click **"Go"** to import the database

---

## Step 2: Set Up Node.js App in cPanel

### 2.1 Create Node.js Application
1. In cPanel, go to **"Setup Node.js App"** under the **"Software"** section
2. Click **"Create Application"**
3. Fill in the details:
   - **Node.js version**: Select the latest LTS version (e.g., 20.x or 18.x)
   - **Application mode**: Production
   - **Application root**: Enter a folder name (e.g., `digitax-app`)
   - **Application URL**: Select `digitax.pk` from the dropdown
   - **Application startup file**: `server.js`
4. Click **"Create"**

### 2.2 Upload and Extract Deployment Files
1. In cPanel, go to **"File Manager"** under **"Files"**
2. Navigate to the application root folder you just created (e.g., `digitax-app`)
3. Click **"Upload"** at the top
4. Upload `digitax-deploy.zip` from your project folder
5. Once uploaded, go back to the File Manager, right-click `digitax-deploy.zip` and select **"Extract"**
6. Click **"Extract File(s)"**

### 2.3 Configure Environment Variables
1. In the File Manager, go to your application root folder
2. Create a new file named `.env`
3. Edit the `.env` file and add the following (replace with your actual database details):
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=tadbeer_digitax_db
   DB_USER=tadbeer_digitax_user
   DB_PASS=your_database_password_here

   # JWT Secret (generate a secure random string)
   JWT_SECRET=change-this-to-a-secure-random-string

   # Email Configuration (optional, if you want to use email features)
   SMTP_HOST=
   SMTP_PORT=
   SMTP_USER=
   SMTP_PASS=
   ```
4. Save the file

### 2.4 Install Dependencies and Start the App
1. Go back to **"Setup Node.js App"** in cPanel
2. Click **"Edit"** next to your application
3. In the **"Detected configuration files"** section, click **"Run NPM Install"**
4. Wait for dependencies to install
5. Once installed, click **"Restart"** to start the application

---

## Step 3: Verify the Deployment
1. Open your browser and go to https://digitax.pk
2. The app should load successfully!
3. To access the admin panel, go to https://digitax.pk/admin
   - Default admin email: admin123@gmail.com
   - Default admin password: 12345 (**PLEASE CHANGE THIS AFTER FIRST LOGIN!**)

---

## Troubleshooting
- If the app doesn't load, check the Node.js error logs in cPanel's **"Setup Node.js App"** section
- Make sure all environment variables are correctly set
- Verify the database connection details in `.env`
- Ensure the database user has all privileges

---

## Important Notes
- Always back up your database before making changes
- Change the default admin password immediately after first login
- Keep your `.env` file secure and never commit it to version control
- For HTTPS, ensure your domain has an SSL certificate installed (cPanel usually provides free Let's Encrypt certificates)

---

## Contact Support
If you run into any issues, feel free to reach out!
