import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';
import { connectMongo, connectPostgres } from './src/config/database.js';

const PORT = process.env.PORT || 5000;

// Initialize Databases (Optional for development)
try {
  await connectPostgres();
  await connectMongo();
} catch (err) {
  console.warn('⚠️ Warning: Could not connect to databases. Some features will be disabled. Check your .env file or local database instances.');
}

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

// Socket room management and events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_trip', (tripId) => {
    socket.join(`trip_${tripId}`);
    console.log(`User ${socket.id} joined trip_${tripId}`);
  });

  socket.on('itinerary_update', (data) => {
    // Broadcast update to everyone in the trip room except sender
    socket.to(`trip_${data.tripId}`).emit('itinerary_updated', data);
  });

  socket.on('budget_update', (data) => {
    socket.to(`trip_${data.tripId}`).emit('budget_updated', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
