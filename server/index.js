require('dotenv').config();
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// Environment variables with defaults
const PREFERRED_PORT = process.env.PORT || 8080;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ["GET", "POST"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
});
const userSocketMap = {};
const roomCodeMap = {};  // Track code state for each room
const roomInputMap = {}; // Track input state for each room
const roomLanguageMap = {}; // Track language state for each room
const roomOutputMap = {}; // Track output state for each room

const getAllConnectedClients = (roomId) => {
  try {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
      (socketId) => {
        return {
          socketId,
          username: userSocketMap[socketId],
        };
      }
    );
  } catch (error) {
    console.error('Error getting connected clients:', error);
    return [];
  }
};

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join", ({ roomId, username }) => {
    try {
      if (!username || !roomId) {
        socket.emit('error', { message: 'Username and roomId are required' });
        return;
      }

      userSocketMap[socket.id] = username;
      socket.join(roomId);
      const clients = getAllConnectedClients(roomId);
      
      console.log(`${username} joined room ${roomId}`);

      // Send current room state to the new user
      if (roomCodeMap[roomId]) {
        socket.emit('code-change', { code: roomCodeMap[roomId] });
      }
      if (roomInputMap[roomId]) {
        socket.emit('input-change', { input: roomInputMap[roomId] });
      }
      if (roomLanguageMap[roomId]) {
        socket.emit('language-change', { language: roomLanguageMap[roomId] });
      }
      if (roomOutputMap[roomId]) {
        socket.emit('code-execution', roomOutputMap[roomId]);
      }

      // notify all clients in the room
      clients.forEach(({ socketId }) => {
        io.to(socketId).emit("joined", {
          clients,
          username,
          socketId: socket.id,
        });
      });
    } catch (error) {
      console.error('Error in join event:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on("get-code", ({ roomId }) => {
    try {
      if (roomCodeMap[roomId]) {
        socket.emit('code-change', { code: roomCodeMap[roomId] });
      }
    } catch (error) {
      console.error('Error in get-code event:', error);
    }
  });

  socket.on("code-change", ({ roomId, code }) => {
    try {
      if (!roomId) {
        return;
      }
      roomCodeMap[roomId] = code;
      const username = userSocketMap[socket.id];
      socket.in(roomId).emit("code-change", { code, username });
    } catch (error) {
      console.error('Error in code-change event:', error);
    }
  });

  socket.on("input-change", ({ roomId, input }) => {
    try {
      if (!roomId) {
        return;
      }
      roomInputMap[roomId] = input;
      const username = userSocketMap[socket.id];
      socket.in(roomId).emit("input-change", { input, username });
    } catch (error) {
      console.error('Error in input-change event:', error);
    }
  });

  socket.on("language-change", ({ roomId, language }) => {
    try {
      if (!roomId) {
        return;
      }
      roomLanguageMap[roomId] = language;
      const username = userSocketMap[socket.id];
      socket.in(roomId).emit("language-change", { language, username });
    } catch (error) {
      console.error('Error in language-change event:', error);
    }
  });

  socket.on("cursor-update", ({ roomId, position }) => {
    try {
      if (!roomId) {
        return;
      }
      socket.in(roomId).emit("cursor-update", {
        socketId: socket.id,
        username: userSocketMap[socket.id],
        position,
      });
    } catch (error) {
      console.error('Error in cursor-update event:', error);
    }
  });

  socket.on("sync-code", ({ socketId, code }) => {
    try {
      if (!socketId) {
        return;
      }
      io.to(socketId).emit("code-change", { code });
    } catch (error) {
      console.error('Error in sync-code event:', error);
    }
  });

  socket.on("code-execution", ({ roomId, output, error }) => {
    try {
      if (!roomId) {
        return;
      }
      roomOutputMap[roomId] = { output, error };
      const username = userSocketMap[socket.id];
      // Emit to all clients in the room except the sender
      socket.in(roomId).emit("code-execution", { output, error, username });
    } catch (error) {
      console.error('Error in code-execution event:', error);
    }
  });

  socket.on("code-running", ({ roomId }) => {
    try {
      if (!roomId) {
        return;
      }
      const username = userSocketMap[socket.id];
      // Emit to all clients in the room except the sender
      socket.in(roomId).emit("code-running", { username });
    } catch (error) {
      console.error('Error in code-running event:', error);
    }
  });

  socket.on("disconnecting", () => {
    try {
      const rooms = [...socket.rooms];
      rooms.forEach((roomId) => {
        const username = userSocketMap[socket.id];
        socket.in(roomId).emit("disconnected", {
          socketId: socket.id,
          username: username,
        });
        console.log(`${username} left room ${roomId}`);
      });
      delete userSocketMap[socket.id];
      socket.leave();
    } catch (error) {
      console.error('Error in disconnecting event:', error);
    }
  });

  socket.on("error", (error) => {
    console.error('Socket error:', error);
  });
});

// Function to find an available port
const findAvailablePort = (startPort) => {
  return new Promise((resolve, reject) => {
    const tryPort = (port) => {
      const testServer = http.createServer();
      
      testServer.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          tryPort(port + 1);
        } else {
          reject(err);
        }
      });

      testServer.once('listening', () => {
        testServer.close(() => resolve(port));
      });

      testServer.listen(port);
    };

    tryPort(startPort);
  });
};

// Start server with automatic port selection
findAvailablePort(PREFERRED_PORT)
  .then(port => {
    server.listen(port, () => {
      console.log(`✅ Server is running on port ${port}`);
      console.log(`👉 CORS enabled for origin: ${CORS_ORIGIN}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });
