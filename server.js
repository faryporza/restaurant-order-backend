import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.routes.js';
import tableRoutes from './routes/table.routes.js';
import categoryRoutes from './routes/category.routes.js';
import menuRoutes from './routes/menu.routes.js';
import pinRoutes from './routes/pin.routes.js';
import orderRoutes from './routes/order.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

// Import socket handlers
import { handleSocketConnection } from './socket/socket.handler.js';
import { initSocket } from './socket/socket.instance.js';

// Import database for connection test
import db from './config/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { 
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"] 
  }
});

// Initialize socket instance
initSocket(io);

// Middleware
app.use(cors({ 
  origin: '*', 
  credentials: true 
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/pins', pinRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 as test');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Socket.IO handler
handleSocketConnection(io);

// Test database connection
db.query('SELECT 1')
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
  });

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Static files served from: ${path.join(__dirname, 'dist')}`);
  console.log(`📂 Uploads served from: ${path.join(__dirname, 'uploads')}`);
});
