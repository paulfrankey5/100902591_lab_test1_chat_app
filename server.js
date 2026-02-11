require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const authRoutes = require("./routes/auth");
const GroupMessage = require("./models/GroupMessage");
const PrivateMessage = require("./models/PrivateMessage");

app.use(cors());
app.use(express.json());
app.use(express.static("views"));
app.use("/api", authRoutes);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/signup.html");
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

let onlineUsers = {};

io.on("connection", (socket) => {

  console.log("User connected");

  socket.on("registerUser", (username) => {

    onlineUsers[username] = socket.id;

    io.emit("updateUserList", Object.keys(onlineUsers));
  });

  socket.on("joinRoom", async (room) => {

    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
    }

    socket.join(room);
    socket.currentRoom = room;

    const messages = await GroupMessage
      .find({ room: room })
      .sort({ date_sent: 1 });

    socket.emit("loadMessages", messages);
  });

  socket.on("leaveRoom", (room) => {
    socket.leave(room);
    socket.currentRoom = null;
  });

  socket.on("chatMessage", async (data) => {

    const newMessage = new GroupMessage({
      from_user: data.from_user,
      room: data.room,
      message: data.message
    });

    await newMessage.save();

    io.to(data.room).emit("message", newMessage);
  });

  socket.on("privateMessage", async (data) => {

    const newPrivate = new PrivateMessage({
      from_user: data.from_user,
      to_user: data.to_user,
      message: data.message
    });

    await newPrivate.save();

    const receiverSocket = onlineUsers[data.to_user];

    if (receiverSocket) {
      io.to(receiverSocket).emit("receivePrivate", newPrivate);
    }

    socket.emit("receivePrivate", newPrivate);
  });

  socket.on("typing", (data) => {
    socket.to(data.room).emit("typing", data.username);
  });

  socket.on("disconnect", () => {

    for (let user in onlineUsers) {
      if (onlineUsers[user] === socket.id) {
        delete onlineUsers[user];
      }
    }

    io.emit("updateUserList", Object.keys(onlineUsers));

    console.log("User disconnected");
  });

});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
