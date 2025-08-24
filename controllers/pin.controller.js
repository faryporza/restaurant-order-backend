import db from '../config/database.js';
import { getSocket } from '../socket/socket.instance.js';

// Generate new PIN
const generateNewPin = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Create new PIN
export const createPin = async (req, res) => {
  try {
    const { pin, id_table } = req.body;
    
    // Check for existing active PIN
    const [activePins] = await db.query(
      'SELECT * FROM pin WHERE id_table = ? AND status_pin = ?', 
      [id_table, 'active']
    );
    
    if (activePins.length > 0) {
      // Emit socket event for existing PIN
      const io = getSocket();
      io.emit('pinUpdated', {
        tableId: parseInt(id_table),
        pin: activePins[0].pin,
        action: 'create'
      });
      return res.status(200).json(activePins[0]);
    }

    // Create new PIN
    const [result] = await db.query(
      'INSERT INTO pin (pin, id_table, status_pin) VALUES (?, ?, ?)', 
      [pin, id_table, 'active']
    );
    
    const [newPin] = await db.query(
      'SELECT * FROM pin WHERE id = ?',
      [result.insertId]
    );

    // Emit socket event with parsed id
    const io = getSocket();
    io.emit('pinUpdated', {
      tableId: parseInt(id_table),
      pin: pin,
      action: 'create'
    });

    res.status(201).json(newPin[0]);
  } catch (error) {
    console.error('Error creating pin:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get active PINs
export const getActivePins = async (req, res) => {
  try {
    const [pins] = await db.query(`
      SELECT DISTINCT p.id_table, p.pin 
      FROM pin p
      WHERE p.status_pin = 'active'
      AND p.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY p.created_at DESC
    `);
    res.json(pins);
  } catch (error) {
    console.error('Error fetching active pins:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get PIN by code
export const getPinByCode = async (req, res) => {
  try {
    const { pin } = req.params;
    
    console.log('Searching for PIN:', pin);
    const [pins] = await db.query(
      `SELECT p.*, t.name as table_name 
       FROM pin p 
       JOIN dining_tables t ON p.id_table = t.id 
       WHERE p.pin = ? AND p.status_pin = 'active'`,
      [pin]
    );
    
    console.log('Found pins:', pins);
    
    if (pins.length === 0) {
      console.log('No pin found');
      return res.status(404).json({ message: 'Pin not found' });
    }

    console.log('Returning pin info:', pins[0]);
    res.json(pins[0]);
  } catch (error) {
    console.error('Error finding pin:', error);
    res.status(500).json({ message: error.message });
  }
};
