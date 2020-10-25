const port = process.env.PORT || 3000;
const io = require("socket.io")(port);
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
