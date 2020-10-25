const port = process.env.PORT;

const express = require("express");
const app = express();
app.use(express.static(__dirname));

const server = app.listen(port);
const io = require("socket.io").listen(server);

io.on("connection", (socket) => {
  socket.on("new-user", (activeUsers) => {
    socket.broadcast.emit("userlist-updated", activeUsers);
  });

  socket.on("lets-play", (opponentData, playerData) => {
    socket.to(opponentData.id).emit("time-to-play", playerData);
  });

  socket.on("user-gameover", (opponentData, points) => {
    //console.log(`${opponentData.name}: ${points}`);
    socket.to(opponentData.id).emit("opponent-score", points);
  });
});
