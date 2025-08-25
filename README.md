# Restaurant Order Backendd

Restaurant Order Management System Backend
ระบบจัดการร้านอาหาร รองรับการสั่งอาหาร การจัดการโต๊ะ เมนู หมวดหมู่ PIN และออเดอร์ พร้อม Authentication, Real-time Updates และ Dashboard Analytics

---

## ฟีเจอร์หลัก

* Authentication & Users

  * สมัครสมาชิก / เข้าสู่ระบบ
  * JWT Authentication
  * Role-based Access (admin/employee)

* การจัดการโต๊ะ (Tables)

  * CRUD
  * สถานะเปิด/ปิดโต๊ะ
  * ผูกกับ PIN system

* การจัดการหมวดหมู่ (Categories)

  * CRUD
  * Soft Delete
  * ตรวจสอบการใช้งานก่อนลบ

* การจัดการเมนู (Menu Items)

  * CRUD
  * อัพโหลดรูปภาพ
  * เปิด/ปิด availability

* PIN System

  * สร้าง PIN สำหรับโต๊ะ
  * ติดตามสถานะ active/inactive

* Orders

  * สร้างออเดอร์
  * ติดตามสถานะ (pending → cooking → served → completed)
  * ประวัติการสั่งซื้อ
  * ใบเสร็จ

* Payments

  * ติดตามการชำระเงิน
  * ยอดรวม / ประวัติการชำระเงิน

* Dashboard

  * Daily / Monthly Sales
  * Category Stats
  * Top Menu Items

* Real-time Updates

  * Socket.IO integration
  * แจ้งเตือนออเดอร์ใหม่ & อัพเดตสถานะ

---

## โครงสร้างโปรเจค

```
restaurant-order-backend/
├── config/              # การเชื่อมต่อ DB
│   └── database.js
├── controllers/         # Business Logic
│   ├── auth.controller.js
│   ├── table.controller.js
│   ├── category.controller.js
│   ├── menu.controller.js
│   ├── pin.controller.js
│   ├── order.controller.js
│   └── dashboard.controller.js
├── routes/              # API endpoints
│   ├── auth.routes.js
│   ├── table.routes.js
│   ├── category.routes.js
│   ├── menu.routes.js
│   ├── pin.routes.js
│   ├── order.routes.js
│   └── dashboard.routes.js
├── middleware/          # Authentication & Authorization
│   └── auth.middleware.js
├── socket/              # Socket.IO
│   ├── socket.handler.js
│   └── socket.instance.js
├── constants/           # ค่าคงที่
│   └── index.js
├── utils/               # ฟังก์ชันช่วยเหลือ
│   └── index.js
├── database/            # Schema และ Migration
│   └── schema.sql
├── scripts/             # Scripts setup
│   ├── setup.js
│   ├── migrate.js
│   └── create-admin.js
├── uploads/             # อัพโหลดรูปภาพ
├── dist/                # Static frontend (ถ้ามี)
└── server.js            # Main server
```

---

## การติดตั้ง

### 1. Clone โปรเจค

```bash
git clone https://github.com/yourname/restaurant-order-backend.git
cd restaurant-order-backend
```

### 2. ติดตั้ง dependencies

```bash
npm install
```

### 3. ตั้งค่าไฟล์ `.env`

สร้างไฟล์ `.env` ที่ root:

```env
# Server
PORT=3000
JWT_SECRET=supersecretjwtkey

# Database (Aiven MySQL)
DB_HOST=your-db-host
DB_PORT=11912
DB_USER=avnadmin
DB_PASSWORD=your-password
DB_NAME=restaurant_db
DB_SSL=true
```

หากใช้ Aiven ให้ดาวน์โหลด `ca.pem` แล้ววางไว้ใน `config/` หรือ root

### 4. รันเซิร์ฟเวอร์

```bash
# Development mode (auto restart)
npm run dev

# Production
npm start
```

---

## API Endpoints

### Authentication

* POST /api/auth/register
* POST /api/auth/login
* GET  /api/auth/profile

### Tables

* GET    /api/tables
* POST   /api/tables
* PUT    /api/tables/\:id
* DELETE /api/tables/\:id

### Categories

* GET    /api/categories
* POST   /api/categories
* PUT    /api/categories/\:id
* DELETE /api/categories/\:id

### Menu

* GET    /api/menu/items
* POST   /api/menu
* PUT    /api/menu/\:id
* PATCH  /api/menu/\:id/availability

### PIN

* POST   /api/pins
* GET    /api/pins/active
* GET    /api/pins/\:pin

### Orders

* POST   /api/orders
* GET    /api/orders/grouped
* PUT    /api/orders/\:id/status
* GET    /api/orders/history/\:pin

### Dashboard

* GET /api/dashboard/daily-sales/current
* GET /api/dashboard/monthly-sales
* GET /api/dashboard/category-stats
* GET /api/dashboard/menu-stats/top

---

## ความปลอดภัย

* JWT Authentication
* Password Hashing (bcrypt)
* Parameterized Queries (ป้องกัน SQL Injection)
* File Upload Validation
* CORS Configuration
* Input Validation

---

## Database

ตารางหลัก:

* users
* dining\_tables
* category
* menu\_items
* pin
* orders
* total\_orders
* daily\_sales
* monthly\_sales

---

## Development

* Backend: Node.js + Express.js
* Database: MySQL (Aiven Cloud, SSL enabled)
* Real-time: Socket.IO
* Auth: JWT + bcrypt

---

