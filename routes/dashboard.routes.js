import express from 'express';
import { 
  getDailySales, 
  getMonthlySales, 
  getDailyOrders, 
  getCategoryStats, 
  getTopMenuItems 
} from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/daily-sales/current', getDailySales);
router.get('/monthly-sales', getMonthlySales);
router.get('/daily-orders', getDailyOrders);
router.get('/category-stats', getCategoryStats);
router.get('/menu-stats/top', getTopMenuItems);

export default router;
