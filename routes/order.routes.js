import express from 'express';
import { 
  createOrder, 
  getGroupedOrders, 
  updateOrderStatus, 
  getCompletedTotals, 
  updatePaymentStatus, 
  getOrderHistory, 
  getPaymentHistory, 
  getReceipt 
} from '../controllers/order.controller.js';

const router = express.Router();

router.post('/', createOrder);
router.get('/grouped', getGroupedOrders);
router.put('/:id/status', updateOrderStatus);
router.get('/completed-totals', getCompletedTotals);
router.put('/total-orders/:pinId/payment', updatePaymentStatus);
router.get('/history/:pin', getOrderHistory);
router.get('/payment-history', getPaymentHistory);
router.get('/receipts/:pin', getReceipt);

export default router;
