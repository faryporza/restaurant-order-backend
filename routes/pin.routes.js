import express from 'express';
import { createPin, getActivePins, getPinByCode } from '../controllers/pin.controller.js';

const router = express.Router();

// Order matters: specific routes before parameterized routes
router.get('/active', getActivePins);
router.get('/:pin', getPinByCode);
router.post('/', createPin);

export default router;
