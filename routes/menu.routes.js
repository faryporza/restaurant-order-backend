import express from 'express';
import multer from 'multer';
import db from '../config/database.js';
import { 
  getMenuItems, 
  createMenuItem, 
  updateMenuItem, 
  updateMenuItemAvailability, 
  deleteMenuItem, 
  checkDeleteMenuItem 
} from '../controllers/menu.controller.js';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Available menu items endpoint for customers
const getAvailableMenuItems = async (req, res) => {
  try {
    const { category_id } = req.query;
    
    let query = `
      SELECT m.*, c.name as category_name 
      FROM menu_items m 
      LEFT JOIN category c ON m.category_id = c.id 
      WHERE m.status = 'active' AND m.is_available = true
    `;
    
    let params = [];
    
    if (category_id) {
      query += ' AND m.category_id = ?';
      params.push(category_id);
    }
    
    query += ' ORDER BY c.name, m.name';
    
    const [rows] = await db.query(query, params);
    res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    console.error('Error fetching available menu items:', error);
    res.status(500).json({ message: error.message });
  }
};

// Order routes: more specific routes first
router.get('/available', getAvailableMenuItems); // Customer route for available items only
router.get('/items', getMenuItems); // Admin route for all menu items
router.post('/', upload.single('image'), createMenuItem);
router.put('/:id', upload.single('image'), updateMenuItem);
router.patch('/:id/availability', updateMenuItemAvailability);
router.put('/:id/availability', updateMenuItemAvailability);
router.delete('/:id', deleteMenuItem);
router.get('/:id/check-delete', checkDeleteMenuItem);

export default router;
