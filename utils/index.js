import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate random PIN
export const generatePin = (length = 6) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Delete image file utility
export const deleteImageFile = async (imagePath) => {
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

// Response helpers
export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return res.status(statusCode).json(response);
};

export const sendError = (res, message = 'Internal server error', statusCode = 500, error = null) => {
  const response = {
    success: false,
    message
  };
  
  if (error && process.env.NODE_ENV !== 'production') {
    response.error = error.toString();
  }
  
  return res.status(statusCode).json(response);
};

// Validation helpers
export const validateRequired = (fields, data) => {
  const missing = [];
  
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missing.push(field);
    }
  }
  
  return missing;
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Database helpers
export const executeQuery = async (db, query, params = []) => {
  try {
    const [result] = await db.query(query, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const beginTransaction = async (db) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();
  return connection;
};

export const commitTransaction = async (connection) => {
  await connection.commit();
  connection.release();
};

export const rollbackTransaction = async (connection) => {
  await connection.rollback();
  connection.release();
};

// Date helpers
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    default:
      return `${year}-${month}-${day}`;
  }
};

// Array helpers
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

export const unique = (array, key) => {
  const seen = new Set();
  return array.filter(item => {
    const value = key ? item[key] : item;
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};
