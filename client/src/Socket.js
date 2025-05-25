import { io } from "socket.io-client";

export const initSocket = async () => {
  const options = {
    "force new connection": true,
    reconnectionAttempt: "Infinity",
    timeout: 10000,
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    autoConnect: false
  };

  const URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";

  return new Promise((resolve, reject) => {
    try {
      const socket = io(URL, options);

      socket.connect();

      socket.on("connect", () => {
        console.log("Socket connected successfully!", socket.id);
        resolve(socket);
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        socket.disconnect();
        reject(error);
      });

      socket.on("error", (error) => {
        console.error("Socket error:", error);
        socket.disconnect();
        reject(error);
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        if (reason === "io server disconnect") {
          socket.connect();
        }
      });

      setTimeout(() => {
        if (!socket.connected) {
          socket.disconnect();
          reject(new Error("Connection timeout"));
        }
      }, options.timeout);

    } catch (error) {
      console.error("Socket initialization error:", error);
      reject(error);
    }
  });
};
