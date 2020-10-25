const inputName = document.getElementById("input-name");
const playBtn = document.getElementById("play-btn");

const containerStart = document.querySelector(".container--start");
const containerQuestion = document.querySelector(".container--question");
const questionNavbar = document.querySelector(".question__nav");
const opponentSearch = document.querySelector(".opponent-search");
const progressBar = document.getElementById("progress-bar");
const quesBoxes = document.querySelectorAll(".box");
const ansBoxes = document.querySelectorAll(".box-small");

const pointsEl = document.querySelector(".points");
const usernameEl = document.querySelector(".username");

let opponent = {};
let player = {};
let playerID;
let activeUsers = [];

let points = 0;
let correctAns;

//socket.io
//io function is available because of this script "http://localhost:3000/socket.io/socket.io.js"
const socket = io("http://localhost:3000");

socket.on("connect", () => {
  playerID = socket.id;
});

playBtn.addEventListener("click", () => {
  opponentSearch.classList.remove("d-none");

  // Setting Own Data
  player["id"] = playerID;
  player["name"] = inputName.value.toUpperCase();

  if (activeUsers.length == 1) {
    // Already one user is waiting, its time to play

    // Setting Opponent
    opponent = Object.assign({}, activeUsers[0]);

    // Send the opponent message to play, along with your info,
    // so that the opponent can also set its opponent
    socket.emit("lets-play", opponent, player);

    // Empty activeUsers array and start the game
    activeUsers = [];
    startGame();
  } else {
    // No user in queue, push our data into the activeUsers array and let everyone else know
    activeUsers.push(Object.assign({}, player));
  }
  socket.emit("new-user", activeUsers);
});

socket.on("userlist-updated", (updatedList) => {
  if (activeUsers.length === 1 && updatedList.length === 1) {
    // This situation happens when a player pressed the button but noone else received the message

    // Setting Opponent
    opponent = Object.assign({}, updatedList[0]);

    // Send the opponent message to play, along with your info,
    // so that the opponent can also set its opponent
    socket.emit("lets-play", opponent, player);

    // Empty activeUsers array and start the game
    activeUsers = [];
    startGame();
  } else {
    activeUsers = [...updatedList];
  }
});

socket.on("time-to-play", (opponentData) => {
  // Setting opponent data
  opponent = Object.assign({}, opponentData);

  startGame();
});

function startGame() {
  opponentSearch.classList.add("d-none");
  containerQuestion.classList.remove("d-none"); // Show container question
  containerStart.classList.add("d-none"); // Hide container start
  usernameEl.innerText = player.name;

  console.log(`${player.name} VS ${opponent.name}`);

  createQues();
  startTimer();
}

function createQues() {
  const operators = ["+", "-", "×"];
  const firstOp = Math.floor(Math.random() * 10);
  const operator = operators[Math.floor(Math.random() * operators.length)];
  const secondOp = Math.floor(Math.random() * 10);
  const result = calcResult(firstOp, operator, secondOp);

  const question = [firstOp, operator, secondOp, result];
  const blankIndex = Math.floor(Math.random() * question.length);
  correctAns = question[blankIndex];

  quesBoxes[blankIndex].classList.add("box--blank");

  for (let i = 0; i < quesBoxes.length; i++) {
    if (i !== blankIndex) {
      quesBoxes[i].innerText = question[i];
    }
  }

  const options = createOptions();
  checkUniqueAns(question, blankIndex, options);
}

function createOptions() {
  if (typeof correctAns === "string") {
    var options = ["+", "-", "×", "÷"];
  } else {
    var options = [
      correctAns,
      Math.floor(Math.random() * 39) - 19,
      Math.floor(Math.random() * 39) - 19,
      Math.floor(Math.random() * 39) - 19,
    ];
  }
  options = shuffle(options);

  for (let i = 0; i < ansBoxes.length; i++) {
    ansBoxes[i].innerText = options[i];
  }

  return options;
}

function checkUniqueAns(question, blankIndex, options) {
  // This eliminates situations like 4 + 0 = 4, 4 - 0 = 4 OR 2 * 2= 4, 2 + 2 = 4
  // This also eliminates duplicates in options

  noOfCorrect = 0;
  for (let i = 0; i < options.length; i++) {
    let expression = [...question];
    expression[blankIndex] = options[i];

    let correctRes = expression[expression.length - 1];
    let res = calcResult(...expression.slice(0, expression.length - 1));

    if (res === correctRes) {
      noOfCorrect += 1;
    }
  }

  // If noOfCorrect is greater than 1 it means multiple options are correct
  if (noOfCorrect > 1) {
    clearBoard();
    createQues();
  }
}

// Click listener on the option buttons
for (let i = 0; i < ansBoxes.length; i++) {
  ansBoxes[i].addEventListener("click", (e) => {
    if (e.target.innerText == correctAns) {
      points += 1;
      pointsEl.innerText = `Points: ${points}`;
      questionNavbar.classList.add("green-border");
    } else {
      questionNavbar.classList.add("red-border");
    }

    setTimeout(() => {
      questionNavbar.classList.remove("green-border");
      questionNavbar.classList.remove("red-border");
    }, 300);

    clearBoard();
    createQues();
  });
}

function clearBoard() {
  quesBoxes.forEach((el) => {
    //el.innerText = "";
    el.classList.remove("box--blank");
  });

  // ansBoxes.forEach((el) => {
  //   el.innerText = "";
  // });
}

function calcResult(first, op, second) {
  if (op === "+") return first + second;
  else if (op === "-") return first - second;
  else return first * second;
}

function shuffle(arr) {
  var ctr = arr.length;
  var temp, index;

  // While there are elements in the array
  while (ctr > 0) {
    // Pick a random index
    index = Math.floor(Math.random() * ctr);
    // Decrease ctr by 1 to make it point to the last element
    ctr--;
    // And swap it with the ctr(the last element)
    temp = arr[ctr];
    arr[ctr] = arr[index];
    arr[index] = temp;
  }
  return arr;
}

socket.on("opponent-score", (opponentScore) => {
  //console.log(`Your opponent scored ${opponentScore}`);
  endGame(opponentScore);
});

function endGame(opScore) {
  progressBar.classList.remove("timer");
  clearBoard();

  let message;
  if (points > opScore) {
    message = "Hurrah! You Won 😄";
  } else if (points === opScore) {
    message = "It's a Tie 😵";
  } else {
    message = "Oops! You lost 😔";
  }
  const gameoverScore = document.querySelector(".gameover-score");
  gameoverScore.innerText = `${message}
  ${player.name} VS ${opponent.name}
  You Scored: ${points}
  Opponent Scored: ${opScore}`;

  $("#gameover-modal").modal("show");
  //console.log(`${yourName.name} Points Updated!`);
}

function startTimer() {
  points = 0;
  progressBar.classList.add("timer");
  setTimeout(() => {
    socket.emit("user-gameover", opponent, points);
  }, 30000);
}

// This is triggered when the modal is closed
$("#gameover-modal").on("hidden.bs.modal", (e) => {
  gameRestart();
});

function gameRestart() {
  containerQuestion.classList.add("d-none"); // Hide container question
  containerStart.classList.remove("d-none"); // Show container start
}

// const playagainBtn = document.getElementById("playagain-btn");
// playagainBtn.addEventListener("click", () => {
//   //console.log("Play Again?");
//   $("#gameover-modal").modal("hide");
//   containerQuestion.classList.remove("d-none");
//   containerStart.classList.add("d-none");
//   clearBoard();
//   createQues();
//   startTimer();
// });
