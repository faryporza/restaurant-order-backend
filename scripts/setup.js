import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setup = async () => {
  try {
    console.log('🚀 Setting up Restaurant Order Backend...\n');
    
    // Create uploads directory
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    try {
      await fs.access(uploadsDir);
      console.log('✅ Uploads directory already exists');
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory');
    }
    
    // Check .env file
    const envPath = path.join(__dirname, '..', '.env');
    try {
      await fs.access(envPath);
      console.log('✅ .env file exists');
    } catch {
      console.log('⚠️  .env file not found. Please copy .env.example to .env and configure your settings');
    }
    
    // Create logs directory (optional)
    const logsDir = path.join(__dirname, '..', 'logs');
    try {
      await fs.access(logsDir);
      console.log('✅ Logs directory already exists');
    } catch {
      await fs.mkdir(logsDir, { recursive: true });
      console.log('✅ Created logs directory');
    }
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Configure your .env file with database credentials');
    console.log('2. Run the database schema: npm run db:migrate');
    console.log('3. Create an admin user: npm run create-admin');
    console.log('4. Start the development server: npm run dev');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
};

setup();
