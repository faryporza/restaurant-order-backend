import db from '../config/database.js';

// Get all active tables with PIN status
export const getTables = async (req, res) => {
  try {
    console.log('Fetching tables...');
    const [tables] = await db.query(`
      SELECT t.*, 
             p.pin,
             CASE WHEN p.id IS NOT NULL AND p.status_pin = 'active' THEN true ELSE false END as has_pin
      FROM dining_tables t
      LEFT JOIN pin p ON t.id = p.id_table AND p.status_pin = 'active'
      WHERE t.status_table = 'active'
      ORDER BY t.created_at DESC
    `);
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create new table
export const createTable = async (req, res) => {
  try {
    const { name } = req.body;
    console.log('Creating table:', name);
    const [result] = await db.query('INSERT INTO dining_tables (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update table
export const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    console.log('Updating table:', id, name);
    await db.query('UPDATE dining_tables SET name = ? WHERE id = ?', [name, id]);
    res.json({ id, name });
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ message: error.message });
  }
};

// Soft delete table
export const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Soft deleting table:', id);

    // Check if table exists and is active
    const [tableCheck] = await db.query('SELECT id, name FROM dining_tables WHERE id = ? AND status_table = ?', [id, 'active']);
    
    if (!tableCheck || tableCheck.length === 0) {
      return res.status(404).json({ message: 'โต๊ะไม่พบหรือถูกลบไปแล้ว' });
    }

    // Check if table has active PINs
    const [pinCheck] = await db.query('SELECT COUNT(*) as count FROM pin WHERE id_table = ? AND status_pin = ?', [id, 'active']);
    
    if (pinCheck[0].count > 0) {
      return res.status(400).json({ 
        message: `ไม่สามารถลบโต๊ะนี้ได้เนื่องจากมี PIN ที่ใช้งานอยู่ ${pinCheck[0].count} รายการ`,
        usageCount: pinCheck[0].count
      });
    }

    // Check if table has pending orders
    const [orderCheck] = await db.query('SELECT COUNT(*) as count FROM orders WHERE id_table = ? AND status IN (?, ?, ?)', [id, 'pending', 'cooking', 'served']);
    
    if (orderCheck[0].count > 0) {
      return res.status(400).json({ 
        message: `ไม่สามารถลบโต๊ะนี้ได้เนื่องจากมีออเดอร์ที่ยังไม่เสร็จสิ้น ${orderCheck[0].count} รายการ`,
        orderCount: orderCheck[0].count
      });
    }

    // Soft delete by updating status_table to 'deleted'
    await db.query('UPDATE dining_tables SET status_table = ? WHERE id = ?', ['deleted', id]);
    res.json({ message: 'โต๊ะถูกลบเรียบร้อยแล้ว (ย้ายไปรายการที่ถูกลบ)' });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ 
      message: 'ไม่สามารถลบโต๊ะได้',
      error: error.message
    });
  }
};

// Check if table can be deleted
export const checkDeleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if table exists and is active
    const [tableCheck] = await db.query('SELECT id, name FROM dining_tables WHERE id = ? AND status_table = ?', [id, 'active']);
    
    if (!tableCheck || tableCheck.length === 0) {
      return res.status(404).json({ 
        canDelete: false, 
        message: 'โต๊ะไม่พบหรือถูกลบไปแล้ว' 
      });
    }
    
    // Check if table has active PINs
    const [pinCheck] = await db.query('SELECT COUNT(*) as count FROM pin WHERE id_table = ? AND status_pin = ?', [id, 'active']);
    
    if (pinCheck[0].count > 0) {
      return res.status(400).json({ 
        canDelete: false, 
        message: `ไม่สามารถลบโต๊ะนี้ได้เนื่องจากมี PIN ที่ใช้งานอยู่ ${pinCheck[0].count} รายการ`,
        usageCount: pinCheck[0].count,
        hasPins: true
      });
    }

    // Check if table has pending orders
    const [orderCheck] = await db.query('SELECT COUNT(*) as count FROM orders WHERE id_table = ? AND status IN (?, ?, ?)', [id, 'pending', 'cooking', 'served']);
    
    if (orderCheck[0].count > 0) {
      return res.status(400).json({ 
        canDelete: false, 
        message: `ไม่สามารถลบโต๊ะนี้ได้เนื่องจากมีออเดอร์ที่ยังไม่เสร็จสิ้น ${orderCheck[0].count} รายการ`,
        orderCount: orderCheck[0].count,
        hasOrders: true
      });
    }
    
    // If we get here, the table can be deleted
    res.json({ 
      canDelete: true, 
      message: 'สามารถลบโต๊ะนี้ได้',
      hasPins: false,
      hasOrders: false
    });
  } catch (error) {
    console.error('Error checking if table can be deleted:', error);
    res.status(500).json({ 
      canDelete: false, 
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะโต๊ะ',
      error: error.message
    });
  }
};

// Toggle table status (close PIN)
export const toggleTable = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Toggling table status for table:', id);

    // Check if table exists and has active PIN
    const [tableCheck] = await db.query(`
      SELECT t.id, t.name, p.id as pin_id, p.pin, p.status_pin
      FROM dining_tables t
      LEFT JOIN pin p ON t.id = p.id_table AND p.status_pin = 'active'
      WHERE t.id = ? AND t.status_table = 'active'
    `, [id]);
    
    if (!tableCheck || tableCheck.length === 0) {
      return res.status(404).json({ message: 'โต๊ะไม่พบหรือไม่ได้ใช้งาน' });
    }

    const table = tableCheck[0];
    
    // If table has active PIN, deactivate it
    if (table.pin_id) {
      // Update pin status to inactive
      await db.query('UPDATE pin SET status_pin = ? WHERE id = ?', ['inactive', table.pin_id]);
      
      // Emit socket events
      try {
        const { getSocket } = await import('../socket/socket.instance.js');
        const io = getSocket();
        
        io.emit('pinUpdated', {
          tableId: parseInt(id),
          pin: null,
          action: 'deactivate'
        });

        io.emit('tableStatusChanged', {
          tableId: parseInt(id),
          status: false,
          pin: null
        });
      } catch (socketError) {
        console.error('Socket emission error:', socketError);
      }
      
      res.json({ 
        success: true, 
        message: 'โต๊ะถูกปิดเรียบร้อยแล้ว',
        tableId: parseInt(id),
        hasPin: false
      });
    } else {
      res.status(400).json({ message: 'โต๊ะนี้ไม่มี PIN ที่ใช้งานอยู่' });
    }
    
  } catch (error) {
    console.error('Error toggling table:', error);
    res.status(500).json({ 
      message: 'ไม่สามารถเปลี่ยนสถานะโต๊ะได้',
      error: error.message
    });
  }
};
