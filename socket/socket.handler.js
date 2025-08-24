import db from '../config/database.js';

export const handleSocketConnection = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle new order event
    socket.on('newOrder', (data) => {
      console.log('New order received:', data);
      io.emit('orderCreated', data);
    });

    // Handle order status update
    socket.on('updateOrderStatus', (data) => {
      console.log('Order status update:', data);
      io.emit('orderStatusUpdated', data);
    });

    // Handle PIN created
    socket.on('pinCreated', (data) => {
      console.log('PIN created:', data);
      io.emit('pinUpdated', data);
    });

    // Handle table toggle
    socket.on('toggleTable', (data) => {
      console.log('Table toggle:', data);
      io.emit('tableStatusChanged', data);
    });

    // Handle payment status update
    socket.on('paymentUpdate', (data) => {
      console.log('Payment update:', data);
      io.emit('paymentStatusUpdated', data);
    });

    // Handle message
    socket.on('message', async (data) => {
      try {
        // Example: Store message in database
        await db.query('INSERT INTO messages (content) VALUES (?)', [data.message]);
        io.emit('message', data);
      } catch (error) {
        console.error('Error storing message:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
