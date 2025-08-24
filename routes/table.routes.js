import express from 'express';
import { 
  getTables, 
  createTable, 
  updateTable, 
  deleteTable, 
  checkDeleteTable, 
  toggleTable 
} from '../controllers/table.controller.js';

const router = express.Router();

router.get('/', getTables);
router.post('/', createTable);
router.put('/:id', updateTable);
router.delete('/:id', deleteTable);
router.get('/:id/check-delete', checkDeleteTable);
router.post('/:id/toggle', toggleTable);

export default router;
