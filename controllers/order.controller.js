import db from '../config/database.js';
import { getSocket } from '../socket/socket.instance.js';

// Create new order
export const createOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id_pin, id_table, items } = req.body;

    console.log('Received order request:', {
      id_pin,
      id_table,
      items
    });

    // Validate input
    if (!id_pin || !id_table || !items || !items.length) {
      throw new Error('Missing required fields');
    }

    // First verify that the PIN is valid and active
    const [pinCheck] = await connection.query(
      'SELECT id FROM pin WHERE pin = ? AND id_table = ? AND status_pin = ?',
      [id_pin.toString(), id_table, 'active']
    );

    if (!pinCheck.length) {
      throw new Error('Invalid or inactive PIN');
    }

    const pin_id = pinCheck[0].id;

    // Create orders for each item
    const orderPromises = items.map(async (item) => {
      // Validate item data
      if (!item.id || !item.quantity || !item.price) {
        throw new Error(`Invalid item data: ${JSON.stringify(item)}`);
      }

      const [result] = await connection.query(
        'INSERT INTO orders (id_pin, id_table, menu_item_id, note, amount, total_price) VALUES (?, ?, ?, ?, ?, ?)',
        [
          pin_id,
          id_table,
          parseInt(item.id),
          item.note || null,
          parseFloat(item.quantity),
          parseFloat(item.price) * parseFloat(item.quantity)
        ]
      );
      return result.insertId;
    });

    const orderIds = await Promise.all(orderPromises);
    await connection.commit();

    // Emit order created event
    try {
      const io = getSocket();
      io.emit('newOrder', {
        tableId: id_table,
        orderIds: orderIds,
        status: 'pending'
      });
    } catch (socketError) {
      console.error('Socket emission error:', socketError);
    }

    res.status(201).json({
      success: true,
      orderIds: orderIds,
      message: 'Orders created successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error creating order',
      details: error.toString()
    });
  } finally {
    connection.release();
  }
};

// Get grouped orders
export const getGroupedOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT 
        o.id,
        o.status,
        p.pin,
        t.name as table_name,
        m.name as menu_name,
        o.note,
        o.amount,
        o.total_price,
        o.created_at
      FROM orders o
      JOIN pin p ON o.id_pin = p.id
      JOIN dining_tables t ON o.id_table = t.id
      JOIN menu_items m ON o.menu_item_id = m.id
      WHERE o.status IN ('pending', 'cooking', 'served')
      ORDER BY p.created_at DESC, o.created_at ASC
    `);

    // Group orders by PIN
    const grouped = orders.reduce((acc, order) => {
      const key = order.pin;
      if (!acc[key]) {
        acc[key] = {
          pin: order.pin,
          tableName: order.table_name,
          orders: []
        };
      }
      acc[key].orders.push({
        id: order.id,
        menu_name: order.menu_name,
        note: order.note,
        amount: order.amount,
        total_price: order.total_price,
        status: order.status,
        created_at: order.created_at
      });
      return acc;
    }, {});

    res.json(Object.values(grouped));
  } catch (error) {
    console.error('Error fetching grouped orders:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'completed', 'cancel', 'cooking', 'served'].includes(status)) {
      throw new Error('Invalid status');
    }

    const [result] = await db.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      throw new Error('Order not found');
    }

    // Emit status update event
    try {
      const io = getSocket();
      io.emit('orderStatusUpdated', {
        orderId: parseInt(id),
        status: status
      });
    } catch (socketError) {
      console.error('Socket emission error:', socketError);
    }

    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get completed totals
export const getCompletedTotals = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT DISTINCT
        p.pin,
        t.name as table_name,
        to2.total_amount as total,
        to2.payment_status,
        o.id,
        o.amount,
        o.total_price,
        o.created_at,
        m.name as menu_name,
        o.status
      FROM orders o
      JOIN pin p ON o.id_pin = p.id
      JOIN dining_tables t ON p.id_table = t.id
      JOIN menu_items m ON o.menu_item_id = m.id
      LEFT JOIN total_orders to2 ON o.id_pin = to2.id_pin
      WHERE o.status = 'completed'
        AND p.status_pin = 'active'
      ORDER BY o.created_at DESC
    `);

    // Group orders by PIN
    const grouped = orders.reduce((acc, order) => {
      if (!order.pin) return acc;
      
      const key = order.pin;
      if (!acc[key]) {
        acc[key] = {
          pin: order.pin,
          tableName: order.table_name,
          total: order.total || order.total_price, // Fallback to order price if no total
          payment_status: order.payment_status || 'unpaid',
          orders: []
        };
      }

      // Add order to group
      acc[key].orders.push({
        id: order.id,
        menu_name: order.menu_name,
        amount: order.amount,
        total_price: order.total_price,
        status: order.status,
        created_at: order.created_at
      });

      // Update total if not set
      if (!acc[key].total) {
        acc[key].total = acc[key].orders.reduce((sum, o) => sum + o.total_price, 0);
      }

      return acc;
    }, {});

    res.json(Object.values(grouped));
  } catch (error) {
    console.error('Error fetching completed totals:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { pinId } = req.params;
    const { payment_status } = req.body;

    // First get pin id from pin code
    const [pinResult] = await connection.query(
      'SELECT id FROM pin WHERE pin = ?',
      [pinId]
    );

    if (!pinResult.length) {
      throw new Error('Invalid PIN');
    }

    const pinId_db = pinResult[0].id;

    // Update total_orders payment status
    const [updateResult] = await connection.query(
      'UPDATE total_orders SET payment_status = ? WHERE id_pin = ?',
      [payment_status, pinId_db]
    );

    if (updateResult.affectedRows === 0) {
      throw new Error('No total orders found for this PIN');
    }

    await connection.commit();

    // Emit socket event
    try {
      const io = getSocket();
      io.emit('paymentStatusUpdated', {
        pinId: pinId,
        status: payment_status
      });
    } catch (socketError) {
      console.error('Socket emission error:', socketError);
    }

    res.json({ success: true, message: 'Payment status updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating payment status:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// Get order history by PIN
export const getOrderHistory = async (req, res) => {
  try {
    const { pin } = req.params;
    console.log('Fetching order history for PIN:', pin);
    
    // ตรวจสอบว่า PIN มีอยู่จริงหรือไม่
    const [pinResult] = await db.query(
      `SELECT p.id, p.id_table FROM pin p WHERE p.pin = ? AND p.status_pin = 'active'`,
      [pin]
    );
    
    console.log('PIN query result:', pinResult);
    
    if (pinResult.length === 0) {
      console.log('PIN not found or not active');
      return res.status(404).json({ message: 'PIN ไม่ถูกต้องหรือไม่ได้ใช้งาน' });
    }
    
    const pinId = pinResult[0].id;
    const tableId = pinResult[0].id_table;
    
    console.log('Fetching orders for PIN ID:', pinId);
    
    // ดึงประวัติการสั่งซื้อตาม PIN
    const [orders] = await db.query(
      `SELECT o.id, m.name as menu_name, m.price, o.amount, o.note, o.status, o.created_at, o.total_price
       FROM orders o
       JOIN menu_items m ON o.menu_item_id = m.id
       WHERE o.id_pin = ?
       ORDER BY o.created_at DESC`,
      [pinId]
    );
    
    console.log(`Found ${orders.length} orders for PIN:`, pin);
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลประวัติการสั่งซื้อได้' });
  }
};

// Get payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const { date } = req.query;
    let dateFilter = '';
    let params = [];

    if (date) {
      dateFilter = 'AND DATE(t.created_at) = ?';
      params.push(date);
    }

    // Simplified query without JSON functions
    const [orders] = await db.query(`
      SELECT 
        p.pin,
        dt.name as tableName,
        t.total_amount as total,
        t.created_at as payment_date,
        t.payment_status,
        m.name as menu_name,
        o.amount,
        o.total_price
      FROM total_orders t
      JOIN pin p ON t.id_pin = p.id
      JOIN dining_tables dt ON p.id_table = dt.id
      JOIN orders o ON o.id_pin = p.id
      JOIN menu_items m ON o.menu_item_id = m.id
      WHERE t.payment_status = 'paid'
      ${dateFilter}
      ORDER BY t.created_at DESC
    `, params);

    // Group the results manually
    const groupedOrders = orders.reduce((acc, order) => {
      const key = order.pin;
      if (!acc[key]) {
        acc[key] = {
          pin: order.pin,
          tableName: order.tableName,
          total: order.total,
          payment_date: order.payment_date,
          orders: []
        };
      }

      acc[key].orders.push({
        menu_name: order.menu_name,
        amount: order.amount,
        total_price: order.total_price
      });

      return acc;
    }, {});

    const formattedHistory = Object.values(groupedOrders);
    res.json(formattedHistory);

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ 
      message: 'Failed to fetch payment history',
      error: error.message 
    });
  }
};

// Get receipt by PIN
export const getReceipt = async (req, res) => {
  try {
    const { pin } = req.params;
    console.log('Fetching receipt for PIN:', pin);
    
    // ค้นหา PIN ที่หมดอายุ (status_pin = 'inactive')
    const [pinResult] = await db.query(
      `SELECT p.id, p.id_table, t.name as table_name, p.status_pay, p.status_pin
       FROM pin p
       JOIN dining_tables t ON p.id_table = t.id
       WHERE p.pin = ?`,
      [pin]
    );
    
    console.log('PIN result:', pinResult);
    
    if (pinResult.length === 0) {
      console.log(`No PIN found for ${pin}`);
      return res.status(404).json({ message: 'ไม่พบ PIN นี้' });
    }
    
    // ตรวจสอบว่าเป็น inactive PIN หรือไม่
    if (pinResult[0].status_pin !== 'inactive') {
      console.log(`PIN ${pin} is still active:`, pinResult[0].status_pin);
      return res.status(400).json({ message: 'PIN ยังไม่หมดอายุ' });
    }
    
    const pinId = pinResult[0].id;
    const tableName = pinResult[0].table_name;
    
    // ดึงข้อมูลการชำระเงิน
    const [paymentResult] = await db.query(
      `SELECT total_amount, created_at as payment_date
       FROM total_orders
       WHERE id_pin = ? AND payment_status = 'paid'`,
      [pinId]
    );
    
    if (paymentResult.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลการชำระเงิน' });
    }
    
    // ดึงรายการสั่งซื้อทั้งหมด
    const [orderItems] = await db.query(
      `SELECT o.amount, m.name as menu_name, o.total_price as price, o.created_at
       FROM orders o
       JOIN menu_items m ON o.menu_item_id = m.id
       WHERE o.id_pin = ?
       ORDER BY o.created_at ASC`,
      [pinId]
    );
    
    // สร้างข้อมูลใบเสร็จ
    const receipt = {
      pin: pin,
      table_name: tableName,
      payment_date: paymentResult[0].payment_date,
      total: paymentResult[0].total_amount,
      items: orderItems
    };
    
    // Log response for debugging
    console.log('Returning receipt data for PIN:', pin);
    
    res.json(receipt);
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลใบเสร็จได้', error: error.message });
  }
};
