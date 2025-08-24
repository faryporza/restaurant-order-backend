import db from '../config/database.js';

// Get all active categories
export const getCategories = async (req, res) => {
  try {
    console.log('Fetching categories...');
    const [rows] = await db.query('SELECT * FROM category WHERE status = ? ORDER BY created_at DESC', ['active']);
    console.log('Categories fetched:', rows);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    console.log('Creating category:', name);
    const [result] = await db.query('INSERT INTO category (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    console.log('Updating category:', id, name);
    await db.query('UPDATE category SET name = ? WHERE id = ?', [name, id]);
    res.json({ id, name });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: error.message });
  }
};

// Soft delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Soft deleting category:', id);

    // Check if category exists and is active
    const [categoryCheck] = await db.query('SELECT id, name FROM category WHERE id = ? AND status = ?', [id, 'active']);
    
    if (!categoryCheck || categoryCheck.length === 0) {
      return res.status(404).json({ message: 'หมวดหมู่ไม่พบหรือถูกลบไปแล้ว' });
    }

    // Check if category is being used by menu items
    const [menuCheck] = await db.query('SELECT COUNT(*) as count FROM menu_items WHERE category_id = ? AND status = ?', [id, 'active']);
    
    if (menuCheck[0].count > 0) {
      return res.status(400).json({ 
        message: `ไม่สามารถลบหมวดหมู่นี้ได้เนื่องจากมีเมนู ${menuCheck[0].count} รายการที่ใช้หมวดหมู่นี้`,
        usageCount: menuCheck[0].count
      });
    }

    // Soft delete by updating status to 'deleted'
    await db.query('UPDATE category SET status = ? WHERE id = ?', ['deleted', id]);
    res.json({ message: 'หมวดหมู่ถูกลบเรียบร้อยแล้ว (ย้ายไปรายการที่ถูกลบ)' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ 
      message: 'ไม่สามารถลบหมวดหมู่ได้',
      error: error.message
    });
  }
};

// Check if category can be deleted
export const checkDeleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category exists and is active
    const [categoryCheck] = await db.query('SELECT id, name FROM category WHERE id = ? AND status = ?', [id, 'active']);
    
    if (!categoryCheck || categoryCheck.length === 0) {
      return res.status(404).json({ 
        canDelete: false, 
        message: 'หมวดหมู่ไม่พบหรือถูกลบไปแล้ว' 
      });
    }
    
    // Check if this category is used by menu items
    const [menuCheck] = await db.query('SELECT COUNT(*) as count FROM menu_items WHERE category_id = ? AND status = ?', [id, 'active']);
    
    if (menuCheck[0].count > 0) {
      return res.status(400).json({ 
        canDelete: false, 
        message: `ไม่สามารถลบหมวดหมู่นี้ได้เนื่องจากมีเมนู ${menuCheck[0].count} รายการที่ใช้หมวดหมู่นี้`,
        usageCount: menuCheck[0].count,
        hasMenuItems: true
      });
    }
    
    // If we get here, the category can be deleted
    res.json({ 
      canDelete: true, 
      message: 'สามารถลบหมวดหมู่นี้ได้',
      hasMenuItems: false
    });
  } catch (error) {
    console.error('Error checking if category can be deleted:', error);
    res.status(500).json({ 
      canDelete: false, 
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะหมวดหมู่',
      error: error.message
    });
  }
};
