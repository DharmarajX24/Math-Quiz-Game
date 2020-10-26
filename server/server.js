const port = process.env.PORT;

const express = require("express");
const app = express();
const path = require("path");

app.use(express.static(path.join(__dirname, "../quiz")));
const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.get("/", function (req, res) {
  return res.status(200).sendFile(path.join(__dirname+"../quiz/index.html"))
})

app.get("*", function (req, res) {
  return res.status(404).end()
})

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

server.listen(port, function () {
  console.log("Server running on port " + port);
});
