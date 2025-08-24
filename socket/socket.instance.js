let io;

export const initSocket = (socketIo) => {
  io = socketIo;
};

export const getSocket = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  return io;
};
