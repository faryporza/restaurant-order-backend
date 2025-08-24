// Database status constants
export const TABLE_STATUS = {
  ACTIVE: 'active',
  DELETED: 'deleted'
};

export const CATEGORY_STATUS = {
  ACTIVE: 'active',
  DELETED: 'deleted'
};

export const MENU_STATUS = {
  ACTIVE: 'active',
  DELETED: 'deleted'
};

export const PIN_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

export const PAYMENT_STATUS = {
  PAID: 'paid',
  UNPAID: 'unpaid'
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  COOKING: 'cooking',
  SERVED: 'served',
  COMPLETED: 'completed',
  CANCEL: 'cancel'
};

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee'
};

// Socket events
export const SOCKET_EVENTS = {
  PIN_UPDATED: 'pinUpdated',
  TABLE_STATUS_CHANGED: 'tableStatusChanged',
  NEW_ORDER: 'newOrder',
  ORDER_STATUS_UPDATED: 'orderStatusUpdated',
  PAYMENT_STATUS_UPDATED: 'paymentStatusUpdated',
  ORDER_CREATED: 'orderCreated'
};

// API response messages
export const MESSAGES = {
  // Success messages
  TABLE_DELETED: 'โต๊ะถูกลบเรียบร้อยแล้ว (ย้ายไปรายการที่ถูกลบ)',
  TABLE_CLOSED: 'โต๊ะถูกปิดเรียบร้อยแล้ว',
  CATEGORY_DELETED: 'หมวดหมู่ถูกลบเรียบร้อยแล้ว (ย้ายไปรายการที่ถูกลบ)',
  MENU_DELETED: 'รายการเมนูถูกลบเรียบร้อยแล้ว (ย้ายไปรายการที่ถูกลบ)',
  ORDER_STATUS_UPDATED: 'Order status updated',
  PAYMENT_STATUS_UPDATED: 'Payment status updated successfully',
  ORDERS_CREATED: 'Orders created successfully',
  
  // Error messages
  TABLE_NOT_FOUND: 'โต๊ะไม่พบหรือถูกลบไปแล้ว',
  TABLE_HAS_PINS: 'ไม่สามารถลบโต๊ะนี้ได้เนื่องจากมี PIN ที่ใช้งานอยู่',
  TABLE_HAS_ORDERS: 'ไม่สามารถลบโต๊ะนี้ได้เนื่องจากมีออเดอร์ที่ยังไม่เสร็จสิ้น',
  TABLE_NO_PIN: 'โต๊ะนี้ไม่มี PIN ที่ใช้งานอยู่',
  
  CATEGORY_NOT_FOUND: 'หมวดหมู่ไม่พบหรือถูกลบไปแล้ว',
  CATEGORY_HAS_MENU: 'ไม่สามารถลบหมวดหมู่นี้ได้เนื่องจากมีเมนูที่ใช้หมวดหมู่นี้',
  
  MENU_NOT_FOUND: 'รายการเมนูไม่พบหรือถูกลบไปแล้ว',
  MENU_AVAILABILITY_ERROR: 'ไม่สามารถอัปเดตสถานะเมนูได้',
  
  PIN_NOT_FOUND: 'Pin not found',
  PIN_INVALID: 'PIN ไม่ถูกต้องหรือไม่ได้ใช้งาน',
  PIN_STILL_ACTIVE: 'PIN ยังไม่หมดอายุ',
  
  ORDER_NOT_FOUND: 'Order not found',
  ORDER_INVALID_STATUS: 'Invalid status',
  ORDER_HISTORY_ERROR: 'ไม่สามารถดึงข้อมูลประวัติการสั่งซื้อได้',
  
  RECEIPT_NOT_FOUND: 'ไม่พบ PIN นี้',
  RECEIPT_NO_PAYMENT: 'ไม่พบข้อมูลการชำระเงิน',
  RECEIPT_ERROR: 'ไม่สามารถดึงข้อมูลใบเสร็จได้',
  
  MISSING_FIELDS: 'Missing required fields',
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCESS_TOKEN_REQUIRED: 'Access token required',
  INVALID_TOKEN: 'Invalid or expired token',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  SOMETHING_WENT_WRONG: 'Something went wrong!'
};
