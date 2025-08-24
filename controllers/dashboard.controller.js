import db from '../config/database.js';

// Get daily sales stats
export const getDailySales = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        SUM(total_sales) as totalSales,
        SUM(order_count) as totalOrders,
        AVG(average_order) as averageOrder,
        (
          SELECT COUNT(*) 
          FROM pin 
          WHERE DATE(created_at) = CURDATE()
        ) as pinCount
      FROM daily_sales
      WHERE date = CURDATE()
    `);

    res.json({
      totalSales: rows[0].totalSales || 0,
      totalOrders: rows[0].totalOrders || 0,
      averageOrder: rows[0].averageOrder || 0,
      pinCount: rows[0].pinCount || 0
    });
  } catch (error) {
    console.error('Error fetching daily sales:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get monthly sales
export const getMonthlySales = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        CONCAT(year, '-', LPAD(month, 2, '0')) as month,
        total_sales as total
      FROM monthly_sales
      ORDER BY year DESC, month DESC
      LIMIT 6
    `);
    res.json(rows.reverse());
  } catch (error) {
    console.error('Error fetching monthly sales:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get daily orders
export const getDailyOrders = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        DATE_FORMAT(date, '%a') as day,
        order_count as count
      FROM daily_sales
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      ORDER BY date ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching daily orders:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get category stats
export const getCategoryStats = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.name,
        cs.total_sales as total
      FROM category_stats cs
      JOIN category c ON cs.category_id = c.id
      WHERE c.status = 'active'
      ORDER BY total_sales DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get top menu items
export const getTopMenuItems = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        m.name,
        ms.total_quantity as quantity,
        ms.total_sales as amount,
        c.name as category,
        (ms.total_sales / ms.total_quantity) as average_price
      FROM menu_stats ms
      JOIN menu_items m ON ms.menu_item_id = m.id
      JOIN category c ON m.category_id = c.id
      WHERE ms.total_quantity > 0
        AND m.status = 'active'
        AND c.status = 'active'
      ORDER BY ms.total_quantity DESC, ms.total_sales DESC
      LIMIT 5
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching top menu items:', error);
    res.status(500).json({ message: error.message });
  }
};
