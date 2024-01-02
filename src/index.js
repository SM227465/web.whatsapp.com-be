import mongoose from 'mongoose';
import { Server } from 'socket.io';
import app from './app.js';
import logger from './configs/logger.config.js';
import SocketServer from './SocketServer.js';
import { connectWithDB } from './db/db.js';

// Handling uncaught exception
process.on('uncaughtException', (error) => {
  logger.info('UNCAUGHT EXCEPTION!');
  logger.error(error.name, error.message);
  process.exit(1);
});

// Environment Logging
if (process.env.NODE_ENV === 'production') {
  logger.info('You are working on Production environment');
} else {
  logger.info('You are working on Development environment');
}

// getting port number from environment
const port = process.env.PORT || 8000;

// connecting to DB
connectWithDB();

const server = app.listen(port, () => {
  logger.info(`App is running at http://localhost:${port}`);
});

//socket io
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.CLIENT_ENDPOINT,
  },
});

io.on('connection', (socket) => {
  logger.info('socket io connected successfully.');
  SocketServer(socket, io);
});

// Handling unhandle promise rejection
process.on('unhandledRejection', (err) => {
  console.warn('UNHANDLED REJECTION!');
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED, Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated.');
  });
});
