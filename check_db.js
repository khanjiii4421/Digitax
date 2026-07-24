const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function check() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
    });
    
    const [dbs] = await conn.query('SHOW DATABASES');
    const names = dbs.map(r => Object.values(r)[0]);
    console.log('Databases:', names.join(', '));
    
    const dbName = process.env.DB_NAME || 'digitax';
    if (names.includes(dbName)) {
      await conn.query('USE ' + dbName);
      const [users] = await conn.query('SELECT id, email, role, is_active FROM users');
      console.log('All users:', JSON.stringify(users, null, 2));
      
      const [admins] = await conn.query('SELECT id, email, password_hash, role FROM users WHERE role = ?', ['admin']);
      console.log('Admin users:', JSON.stringify(admins, null, 2));
      
      if (admins.length > 0) {
        const bcrypt = require('bcryptjs');
        const match = bcrypt.compareSync('12345', admins[0].password_hash);
        console.log('Password 12345 matches:', match);
      } else {
        console.log('NO ADMIN USER FOUND - seeding needed');
        // Seed admin
        const bcrypt = require('bcryptjs');
        const hash = bcrypt.hashSync('12345', 12);
        await conn.query("INSERT INTO users (name, email, password_hash, role) VALUES ('Admin', 'admin123@gmail.com', ?, 'admin') ON DUPLICATE KEY UPDATE password_hash = ?", [hash, hash]);
        console.log('Admin user seeded with 12345');
        
        // Verify
        const [verify] = await conn.query("SELECT id, email, role FROM users WHERE email = 'admin123@gmail.com'");
        console.log('Verified:', JSON.stringify(verify));
      }
    } else {
      console.log('Database', dbName, 'does not exist');
      console.log('Creating database...');
      await conn.query('CREATE DATABASE IF NOT EXISTS `' + dbName + '`');
      console.log('Created. Now run the app to init tables.');
    }
    
    await conn.end();
  } catch(e) {
    console.error('Error:', e.message);
  }
}
check();
