import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sslOptions = {};
if (process.env.DB_SSL === 'true') {
  const caPath = path.join(__dirname, '..', 'ca.pem');
  
  // Check if CA file exists
  if (fs.existsSync(caPath)) {
    sslOptions = {
      rejectUnauthorized: true,
      ca: fs.readFileSync(caPath).toString()
    };
    console.log('✅ SSL enabled with CA certificate');
  } else {
    console.log('⚠️  CA certificate not found, using SSL without certificate verification');
    sslOptions = {
      rejectUnauthorized: false
    };
  }
} else {
  console.log('🔓 SSL disabled');
}

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: Object.keys(sslOptions).length > 0 ? sslOptions : false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default db;
