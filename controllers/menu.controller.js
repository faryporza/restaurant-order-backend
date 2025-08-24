import db from '../config/database.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility function to delete image files
const deleteImageFile = async (imagePath) => {
  if (!imagePath) return;
  
  try {
    // Remove the leading slash if it exists
    const pathToCheck = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    // Try with and without the leading /uploads prefix
    const uploadPrefix = pathToCheck.startsWith('uploads/') ? '' : 'uploads/';
    const relativePath = uploadPrefix + pathToCheck.replace(/^uploads\//, '');
    
    const fullPath = path.join(__dirname, '..', relativePath);
    console.log('Attempting to delete image at:', fullPath);
    
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      console.log('Image file deleted:', fullPath);
    } else {
      console.log('Image file not found at:', fullPath);
    }
  } catch (error) {
    console.error('Error deleting image file:', error);
    // Don't throw, just log the error
  }
};

// Get all active menu items
export const getMenuItems = async (req, res) => {
  try {
    console.log('Fetching menu items...');
    const [rows] = await db.query(`
      SELECT m.*, c.name as category_name 
      FROM menu_items m 
      LEFT JOIN category c ON m.category_id = c.id 
      WHERE m.status = 'active'
      ORDER BY m.created_at DESC
    `);
    console.log('Menu items fetched:', rows);
    res.json(Array.isArray(rows) ? rows : []); // Ensure we always send an array
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create new menu item
export const createMenuItem = async (req, res) => {
  try {
    const { name, price, category_id } = req.body;
    if (!name || !price || !category_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const img = req.file ? `/uploads/${req.file.filename}` : null;
    console.log('Creating menu item:', { name, price, category_id, img });
    
    const [result] = await db.query(
      'INSERT INTO menu_items (name, price, category_id, img) VALUES (?, ?, ?, ?)',
      [name, parseFloat(price), parseInt(category_id), img]
    );
    
    const [newItem] = await db.query(
      'SELECT m.*, c.name as category_name FROM menu_items m LEFT JOIN category c ON m.category_id = c.id WHERE m.id = ?',
      [result.insertId]
    );

    res.status(201).json(newItem[0]);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update menu item
export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category_id } = req.body;
    
    // Get the old image path before updating
    const [oldMenuItem] = await db.query('SELECT img FROM menu_items WHERE id = ?', [id]);
    
    let updateQuery = 'UPDATE menu_items SET name = ?, price = ?, category_id = ?';
    let queryParams = [name, price, category_id];

    if (req.file) {
      // Delete old image if exists
      if (oldMenuItem && oldMenuItem[0] && oldMenuItem[0].img) {
        await deleteImageFile(oldMenuItem[0].img);
      }
      
      updateQuery += ', img = ?';
      queryParams.push(`/uploads/${req.file.filename}`);
    }

    updateQuery += ' WHERE id = ?';
    queryParams.push(id);

    await db.query(updateQuery, queryParams);
    
    res.json({ 
      id, 
      name, 
      price, 
      category_id, 
      img: req.file ? `/uploads/${req.file.filename}` : undefined 
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update menu item availability
export const updateMenuItemAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;
    
    if (typeof is_available !== 'boolean') {
      return res.status(400).json({ message: 'is_available must be a boolean' });
    }
    
    console.log(`Updating availability for menu item ${id} to ${is_available}`);
    
    // Check if menu item exists
    const [menuItemCheck] = await db.query('SELECT id FROM menu_items WHERE id = ?', [id]);
    
    if (!menuItemCheck || menuItemCheck.length === 0) {
      return res.status(404).json({ message: 'รายการเมนูไม่พบ' });
    }
    
    // Update the availability status
    await db.query(
      'UPDATE menu_items SET is_available = ? WHERE id = ?',
      [is_available, id]
    );
    
    res.json({ 
      id: parseInt(id), 
      is_available, 
      message: `Menu item availability updated to ${is_available}`
    });
  } catch (error) {
    console.error('Error updating menu item availability:', error);
    res.status(500).json({ 
      message: 'ไม่สามารถอัปเดตสถานะเมนูได้',
      error: error.message
    });
  }
};

// Soft delete menu item
export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Soft deleting menu item:', id);

    // Check if menu item exists and is active
    const [menuItemCheck] = await db.query('SELECT id, img, status FROM menu_items WHERE id = ? AND status = ?', [id, 'active']);
    
    if (!menuItemCheck || menuItemCheck.length === 0) {
      return res.status(404).json({ message: 'รายการเมนูไม่พบหรือถูกลบไปแล้ว' });
    }
    
    // Always allow soft delete by setting status to 'deleted'
    await db.query('UPDATE menu_items SET status = ? WHERE id = ?', ['deleted', id]);
    res.json({ message: 'รายการเมนูถูกลบเรียบร้อยแล้ว (ย้ายไปรายการที่ถูกลบ)' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ 
      message: 'ไม่สามารถลบรายการเมนูได้',
      error: error.message
    });
  }
};

// Check if menu item can be deleted
export const checkDeleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if menu item exists and is active
    const [menuItemCheck] = await db.query('SELECT id, name FROM menu_items WHERE id = ? AND status = ?', [id, 'active']);
    
    if (!menuItemCheck || menuItemCheck.length === 0) {
      return res.status(404).json({ 
        canDelete: false, 
        message: 'รายการเมนูไม่พบหรือถูกลบไปแล้ว' 
      });
    }
    
    // Check if this menu is referenced in orders for informational purposes
    const [orderCheck] = await db.query('SELECT COUNT(*) as count FROM orders WHERE menu_item_id = ?', [id]);
    
    // Always allow soft delete, but provide info about order usage
    if (orderCheck[0].count > 0) {
      res.json({ 
        canDelete: true, 
        message: `เมนูนี้ใช้งานในออเดอร์ ${orderCheck[0].count} ครั้ง แต่สามารถลบได้ (จะย้ายไปรายการที่ถูกลบ)`,
        usageCount: orderCheck[0].count,
        hasOrders: true
      });
    } else {
      res.json({ 
        canDelete: true, 
        message: 'สามารถลบเมนูนี้ได้',
        hasOrders: false
      });
    }
  } catch (error) {
    console.error('Error checking if menu item can be deleted:', error);
    res.status(500).json({ 
      canDelete: false, 
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะเมนู',
      error: error.message
    });
  }
};
