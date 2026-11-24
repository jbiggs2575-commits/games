"use strict";

const gameTabs = document.querySelectorAll(".game-tab");
const pongPanel = document.querySelector("#pong-panel");
const tttPanel = document.querySelector("#tictactoe-panel");
const brickPanel = document.querySelector("#brickbreaker-panel");
let pongActive = true;
let brickActive = false;

for (const tab of gameTabs) {
  tab.addEventListener("click", () => {
    const activeGame = tab.dataset.game;
    pongPanel.hidden = activeGame !== "pong";
    tttPanel.hidden = activeGame !== "tictactoe";
    brickPanel.hidden = activeGame !== "brickbreaker";
    const showPong = activeGame === "pong";
    pongActive = showPong;
    brickActive = activeGame === "brickbreaker";

    for (const otherTab of gameTabs) {
      const active = otherTab === tab;
      otherTab.classList.toggle("is-active", active);
      otherTab.setAttribute("aria-pressed", String(active));
    }
  });
}

const canvas = document.querySelector("#pong-canvas");
const ctx = canvas.getContext("2d");
const playerScoreLabel = document.querySelector("#player-score");
const cpuScoreLabel = document.querySelector("#cpu-score");
const pongMessage = document.querySelector("#pong-message");
const pong = {
  width: canvas.width,
  height: canvas.height,
  paddleWidth: 11,
  paddleHeight: 86,
  ballRadius: 8,
  playerY: canvas.height / 2 - 43,
  cpuY: canvas.height / 2 - 43,
  ballX: canvas.width / 2,
  ballY: canvas.height / 2,
  ballVX: 0,
  ballVY: 0,
  playerScore: 0,
  cpuScore: 0,
  running: false,
  finished: false,
  keys: new Set(),
  lastFrame: 0
};

function drawPong() {
  ctx.fillStyle = "#0e141a";
  ctx.fillRect(0, 0, pong.width, pong.height);

  ctx.setLineDash([6, 10]);
  ctx.strokeStyle = "#2b343e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pong.width / 2, 0);
  ctx.lineTo(pong.width / 2, pong.height);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#c8f169";
  ctx.fillRect(26, pong.playerY, pong.paddleWidth, pong.paddleHeight);
  ctx.fillStyle = "#ff875c";
  ctx.fillRect(pong.width - 26 - pong.paddleWidth, pong.cpuY, pong.paddleWidth, pong.paddleHeight);

  ctx.beginPath();
  ctx.arc(pong.ballX, pong.ballY, pong.ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#eef0e9";
  ctx.fill();
}

function setPongMessage(message) {
  pongMessage.textContent = message;
  pongMessage.classList.toggle("is-hidden", !message);
}

function resetBall(direction = Math.random() < 0.5 ? -1 : 1) {
  pong.ballX = pong.width / 2;
  pong.ballY = pong.height / 2;
  pong.ballVX = direction * 360;
  pong.ballVY = (Math.random() * 260) - 130;
}

function resetPong() {
  pong.playerY = pong.height / 2 - pong.paddleHeight / 2;
  pong.cpuY = pong.playerY;
  pong.playerScore = 0;
  pong.cpuScore = 0;
  pong.running = false;
  pong.finished = false;
  pong.keys.clear();
  playerScoreLabel.textContent = "0";
  cpuScoreLabel.textContent = "0";
  pong.ballVX = 0;
  pong.ballVY = 0;
  pong.ballX = pong.width / 2;
  pong.ballY = pong.height / 2;
  setPongMessage("Press any paddle key to serve");
  drawPong();
}

function scorePoint(playerScored) {
  if (playerScored) {
    pong.playerScore += 1;
    playerScoreLabel.textContent = String(pong.playerScore);
  } else {
    pong.cpuScore += 1;
    cpuScoreLabel.textContent = String(pong.cpuScore);
  }

  if (pong.playerScore === 5 || pong.cpuScore === 5) {
    pong.running = false;
    pong.finished = true;
    setPongMessage(pong.playerScore === 5 ? "You win! Start a new game to play again." : "CPU wins! Start a new game to play again.");
    return;
  }

  pong.running = false;
  pong.ballVX = 0;
  pong.ballVY = 0;
  pong.ballX = pong.width / 2;
  pong.ballY = pong.height / 2;
  setPongMessage("Point! Press a paddle key to serve");
}

function updatePong(delta) {
  const playerSpeed = 420;
  const cpuSpeed = 310;
  const maxY = pong.height - pong.paddleHeight;

  if (pong.keys.has("ArrowUp") || pong.keys.has("w") || pong.keys.has("W")) {
    pong.playerY -= playerSpeed * delta;
  }
  if (pong.keys.has("ArrowDown") || pong.keys.has("s") || pong.keys.has("S")) {
    pong.playerY += playerSpeed * delta;
  }
  pong.playerY = Math.max(0, Math.min(maxY, pong.playerY));

  const cpuCenter = pong.cpuY + pong.paddleHeight / 2;
  const cpuTarget = pong.ballY - pong.paddleHeight / 2;
  if (cpuCenter < pong.ballY - 10) {
    pong.cpuY += cpuSpeed * delta;
  } else if (cpuCenter > pong.ballY + 10) {
    pong.cpuY -= cpuSpeed * delta;
  }
  pong.cpuY = Math.max(0, Math.min(maxY, pong.cpuY));
  if (Math.abs(cpuTarget - pong.cpuY) < 1) {
    pong.cpuY = cpuTarget;
  }

  if (!pong.running) {
    return;
  }

  pong.ballX += pong.ballVX * delta;
  pong.ballY += pong.ballVY * delta;

  if (pong.ballY - pong.ballRadius <= 0 || pong.ballY + pong.ballRadius >= pong.height) {
    pong.ballVY *= -1;
    pong.ballY = Math.max(pong.ballRadius, Math.min(pong.height - pong.ballRadius, pong.ballY));
  }

  const playerFace = 26 + pong.paddleWidth;
  if (pong.ballVX < 0 && pong.ballX - pong.ballRadius <= playerFace &&
      pong.ballY >= pong.playerY && pong.ballY <= pong.playerY + pong.paddleHeight) {
    pong.ballVX = Math.abs(pong.ballVX) * 1.04;
    pong.ballVY += ((pong.ballY - (pong.playerY + pong.paddleHeight / 2)) / (pong.paddleHeight / 2)) * 150;
    pong.ballX = playerFace + pong.ballRadius;
  }

  const cpuFace = pong.width - 26 - pong.paddleWidth;
  if (pong.ballVX > 0 && pong.ballX + pong.ballRadius >= cpuFace &&
      pong.ballY >= pong.cpuY && pong.ballY <= pong.cpuY + pong.paddleHeight) {
    pong.ballVX = -Math.abs(pong.ballVX) * 1.04;
    pong.ballVY += ((pong.ballY - (pong.cpuY + pong.paddleHeight / 2)) / (pong.paddleHeight / 2)) * 130;
    pong.ballX = cpuFace - pong.ballRadius;
  }

  if (pong.ballX < 0) {
    scorePoint(false);
  } else if (pong.ballX > pong.width) {
    scorePoint(true);
  }
}

function pongFrame(timestamp) {
  const delta = pong.lastFrame ? Math.min((timestamp - pong.lastFrame) / 1000, 0.04) : 0;
  pong.lastFrame = timestamp;

  if (pongActive) {
    updatePong(delta);
    drawPong();
  }

  requestAnimationFrame(pongFrame);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "w", "W", "s", "S"].includes(event.key) &&
      pongActive && !pongPanel.hidden) {
    event.preventDefault();
    pong.keys.add(event.key);
    if (!pong.running && !pong.finished) {
      pong.running = true;
      setPongMessage("");
      if (pong.ballVX === 0) {
        resetBall();
      }
    }
  }
});

window.addEventListener("keyup", (event) => {
  pong.keys.delete(event.key);
});

window.addEventListener("blur", () => pong.keys.clear());
document.querySelector("#pong-reset").addEventListener("click", resetPong);
drawPong();
requestAnimationFrame(pongFrame);

const brickCanvas = document.querySelector("#brick-canvas");
const brickCtx = brickCanvas.getContext("2d");
const brickScoreLabel = document.querySelector("#brick-score");
const brickLivesLabel = document.querySelector("#brick-lives");
const brickMessage = document.querySelector("#brick-message");
const brickGame = {
  width: brickCanvas.width,
  height: brickCanvas.height,
  paddleWidth: 112,
  paddleHeight: 14,
  paddleY: brickCanvas.height - 38,
  paddleX: (brickCanvas.width - 112) / 2,
  ballRadius: 8,
  ballX: brickCanvas.width / 2,
  ballY: brickCanvas.height - 54,
  ballVX: 0,
  ballVY: 0,
  score: 0,
  lives: 3,
  launched: false,
  finished: false,
  keys: new Set(),
  lastFrame: 0,
  bricks: []
};
const brickColors = ["#ff875c", "#ffae58", "#f2d45c", "#9bd66b", "#65c7bd"];
const brickLayout = { rows: 5, columns: 10, width: 64, height: 20, gap: 10, top: 62 };
const brickSideMargin = (brickGame.width -
  (brickLayout.columns * brickLayout.width + (brickLayout.columns - 1) * brickLayout.gap)) / 2;

function setBrickMessage(message) {
  brickMessage.textContent = message;
  brickMessage.classList.toggle("is-hidden", !message);
}

function resetBrickBall() {
  brickGame.launched = false;
  brickGame.ballVX = 0;
  brickGame.ballVY = 0;
  brickGame.paddleX = (brickGame.width - brickGame.paddleWidth) / 2;
  brickGame.ballX = brickGame.paddleX + brickGame.paddleWidth / 2;
  brickGame.ballY = brickGame.paddleY - brickGame.ballRadius;
}

function resetBrickBreaker() {
  brickGame.score = 0;
  brickGame.lives = 3;
  brickGame.finished = false;
  brickGame.lastFrame = 0;
  brickGame.keys.clear();
  brickGame.bricks = [];
  for (let row = 0; row < brickLayout.rows; row += 1) {
    for (let column = 0; column < brickLayout.columns; column += 1) {
      brickGame.bricks.push({
        x: brickSideMargin + column * (brickLayout.width + brickLayout.gap),
        y: brickLayout.top + row * (brickLayout.height + brickLayout.gap),
        width: brickLayout.width,
        height: brickLayout.height,
        color: brickColors[row],
        alive: true
      });
    }
  }
  brickScoreLabel.textContent = "0";
  brickLivesLabel.textContent = "3";
  resetBrickBall();
  setBrickMessage("Move your paddle, then press Space or click to launch");
  drawBrickBreaker();
}

function drawBrickBreaker() {
  brickCtx.fillStyle = "#0e141a";
  brickCtx.fillRect(0, 0, brickGame.width, brickGame.height);

  for (const brick of brickGame.bricks) {
    if (!brick.alive) {
      continue;
    }
    brickCtx.fillStyle = brick.color;
    brickCtx.fillRect(brick.x, brick.y, brick.width, brick.height);
    brickCtx.fillStyle = "rgb(255 255 255 / 18%)";
    brickCtx.fillRect(brick.x, brick.y, brick.width, 3);
  }

  brickCtx.fillStyle = "#c8f169";
  brickCtx.fillRect(brickGame.paddleX, brickGame.paddleY, brickGame.paddleWidth, brickGame.paddleHeight);
  brickCtx.beginPath();
  brickCtx.arc(brickGame.ballX, brickGame.ballY, brickGame.ballRadius, 0, Math.PI * 2);
  brickCtx.fillStyle = "#eef0e9";
  brickCtx.fill();
}

function moveBrickPaddle(x) {
  brickGame.paddleX = Math.max(0, Math.min(brickGame.width - brickGame.paddleWidth, x - brickGame.paddleWidth / 2));
  if (!brickGame.launched) {
    brickGame.ballX = brickGame.paddleX + brickGame.paddleWidth / 2;
  }
}

function launchBrickBall() {
  if (brickGame.finished) {
    return;
  }
  if (!brickGame.launched) {
    brickGame.launched = true;
    brickGame.ballVX = 155;
    brickGame.ballVY = -330;
    setBrickMessage("");
  }
}

function updateBrickBreaker(delta) {
  const paddleSpeed = 480;
  if (brickGame.keys.has("ArrowLeft") || brickGame.keys.has("a") || brickGame.keys.has("A")) {
    moveBrickPaddle(brickGame.paddleX + brickGame.paddleWidth / 2 - paddleSpeed * delta);
  }
  if (brickGame.keys.has("ArrowRight") || brickGame.keys.has("d") || brickGame.keys.has("D")) {
    moveBrickPaddle(brickGame.paddleX + brickGame.paddleWidth / 2 + paddleSpeed * delta);
  }

  if (!brickGame.launched || brickGame.finished) {
    return;
  }

  const previousX = brickGame.ballX;
  const previousY = brickGame.ballY;
  brickGame.ballX += brickGame.ballVX * delta;
  brickGame.ballY += brickGame.ballVY * delta;

  if (brickGame.ballX - brickGame.ballRadius <= 0) {
    brickGame.ballX = brickGame.ballRadius;
    brickGame.ballVX = Math.abs(brickGame.ballVX);
  } else if (brickGame.ballX + brickGame.ballRadius >= brickGame.width) {
    brickGame.ballX = brickGame.width - brickGame.ballRadius;
    brickGame.ballVX = -Math.abs(brickGame.ballVX);
  }
  if (brickGame.ballY - brickGame.ballRadius <= 0) {
    brickGame.ballY = brickGame.ballRadius;
    brickGame.ballVY = Math.abs(brickGame.ballVY);
  }

  if (brickGame.ballVY > 0 &&
      brickGame.ballX + brickGame.ballRadius >= brickGame.paddleX &&
      brickGame.ballX - brickGame.ballRadius <= brickGame.paddleX + brickGame.paddleWidth &&
      brickGame.ballY + brickGame.ballRadius >= brickGame.paddleY &&
      previousY + brickGame.ballRadius <= brickGame.paddleY + brickGame.paddleHeight) {
    const hitPosition = (brickGame.ballX - (brickGame.paddleX + brickGame.paddleWidth / 2)) /
      (brickGame.paddleWidth / 2);
    const angle = hitPosition * (Math.PI / 3);
    const speed = Math.hypot(brickGame.ballVX, brickGame.ballVY);
    brickGame.ballVX = speed * Math.sin(angle);
    brickGame.ballVY = -Math.abs(speed * Math.cos(angle));
    brickGame.ballY = brickGame.paddleY - brickGame.ballRadius;
  }

  if (brickGame.ballY - brickGame.ballRadius > brickGame.height) {
    brickGame.lives -= 1;
    brickLivesLabel.textContent = String(brickGame.lives);
    if (brickGame.lives === 0) {
      brickGame.finished = true;
      setBrickMessage("Game over! Start a new game to try again");
    } else {
      resetBrickBall();
      setBrickMessage(`Ball lost — ${brickGame.lives} ${brickGame.lives === 1 ? "life" : "lives"} left. Press Space or click to relaunch`);
    }
    return;
  }

  for (const brick of brickGame.bricks) {
    if (!brick.alive) {
      continue;
    }

    const closestX = Math.max(brick.x, Math.min(brickGame.ballX, brick.x + brick.width));
    const closestY = Math.max(brick.y, Math.min(brickGame.ballY, brick.y + brick.height));
    const dx = brickGame.ballX - closestX;
    const dy = brickGame.ballY - closestY;
    if (dx * dx + dy * dy > brickGame.ballRadius * brickGame.ballRadius) {
      continue;
    }

    brick.alive = false;
    brickGame.score += 10;
    brickScoreLabel.textContent = String(brickGame.score);

    if (previousY + brickGame.ballRadius <= brick.y ||
        previousY - brickGame.ballRadius >= brick.y + brick.height) {
      brickGame.ballVY *= -1;
    } else if (previousX + brickGame.ballRadius <= brick.x ||
        previousX - brickGame.ballRadius >= brick.x + brick.width) {
      brickGame.ballVX *= -1;
    } else {
      brickGame.ballVY *= -1;
    }
    break;
  }

  if (brickGame.bricks.every((brick) => !brick.alive)) {
    brickGame.finished = true;
    setBrickMessage("You cleared the wall! Start a new game to play again");
  }
}

function brickBreakerFrame(timestamp) {
  const delta = brickGame.lastFrame
    ? Math.max(0, Math.min((timestamp - brickGame.lastFrame) / 1000, 0.04))
    : 0;
  brickGame.lastFrame = timestamp;

  if (brickActive) {
    updateBrickBreaker(delta);
    drawBrickBreaker();
  }

  requestAnimationFrame(brickBreakerFrame);
}

window.addEventListener("keydown", (event) => {
  if (!brickActive || brickPanel.hidden) {
    return;
  }
  if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(event.key)) {
    event.preventDefault();
    brickGame.keys.add(event.key);
  } else if (event.code === "Space") {
    event.preventDefault();
    launchBrickBall();
  }
});

window.addEventListener("keyup", (event) => {
  brickGame.keys.delete(event.key);
});

window.addEventListener("blur", () => brickGame.keys.clear());
brickCanvas.addEventListener("pointermove", (event) => {
  const bounds = brickCanvas.getBoundingClientRect();
  moveBrickPaddle((event.clientX - bounds.left) * brickGame.width / bounds.width);
});
brickCanvas.addEventListener("pointerdown", (event) => {
  const bounds = brickCanvas.getBoundingClientRect();
  moveBrickPaddle((event.clientX - bounds.left) * brickGame.width / bounds.width);
  launchBrickBall();
});
document.querySelector("#brick-reset").addEventListener("click", resetBrickBreaker);
resetBrickBreaker();
requestAnimationFrame(brickBreakerFrame);

const cells = [...document.querySelectorAll(".ttt-cell")];
const tttStatus = document.querySelector("#ttt-status");
const tttHelp = document.querySelector("#ttt-help");
const tttModeButtons = [...document.querySelectorAll(".ttt-mode")];
const winningLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];
let board = Array(9).fill("");
let currentPlayer = "X";
let tttFinished = false;
let computerMode = true;
let aiTimer = null;
const preferredTttMoves = [4, 0, 2, 6, 8, 1, 3, 5, 7];

function updateTttStatus(message, winner = false, mark = currentPlayer) {
  tttStatus.replaceChildren();
  if (winner) {
    tttStatus.textContent = message;
    return;
  }

  const markElement = document.createElement("span");
  markElement.className = `turn-mark${mark === "O" ? " mark-o" : ""}`;
  markElement.textContent = mark;
  tttStatus.append(markElement, document.createTextNode(` ${message}`));
}

function resetTtt() {
  window.clearTimeout(aiTimer);
  aiTimer = null;
  board = Array(9).fill("");
  currentPlayer = "X";
  tttFinished = false;
  cells.forEach((cell, index) => {
    cell.textContent = "";
    cell.disabled = false;
    cell.classList.remove("mark-o", "is-winner");
    cell.setAttribute("aria-label", `Row ${Math.floor(index / 3) + 1}, column ${(index % 3) + 1}, empty`);
  });
  updateTttStatus(computerMode ? "Your turn" : "Player X's turn", false, "X");
}

function findWinningLine(cellsToCheck, mark) {
  return winningLines.find((line) => line.every((position) => cellsToCheck[position] === mark));
}

function finishTtt(message) {
  tttFinished = true;
  cells.forEach((button) => { button.disabled = true; });
  updateTttStatus(message, true);
}

function makeTttMove(index, mark) {
  board[index] = mark;
  const cell = cells[index];
  cell.textContent = mark;
  cell.disabled = true;
  cell.classList.toggle("mark-o", mark === "O");
  cell.setAttribute("aria-label", `Row ${Math.floor(index / 3) + 1}, column ${(index % 3) + 1}, ${mark}`);

  const winningLine = findWinningLine(board, mark);
  if (winningLine) {
    winningLine.forEach((position) => cells[position].classList.add("is-winner"));
    finishTtt(computerMode
      ? mark === "X" ? "You win!" : "Computer wins!"
      : `Player ${mark} wins!`);
    return true;
  }

  if (board.every(Boolean)) {
    finishTtt("It's a draw!");
    return true;
  }

  return false;
}

function minimax(cellsToCheck, mark, alpha = -Infinity, beta = Infinity) {
  if (findWinningLine(cellsToCheck, "X")) {
    return 10;
  }
  if (findWinningLine(cellsToCheck, "O")) {
    return -10;
  }

  let bestScore = mark === "X" ? -Infinity : Infinity;
  let hasOpenCell = false;
  for (const index of preferredTttMoves) {
    if (cellsToCheck[index]) {
      continue;
    }

    hasOpenCell = true;
    cellsToCheck[index] = mark;
    const score = minimax(cellsToCheck, mark === "X" ? "O" : "X", alpha, beta);
    cellsToCheck[index] = "";

    if (mark === "X") {
      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, bestScore);
    } else {
      bestScore = Math.min(bestScore, score);
      beta = Math.min(beta, bestScore);
    }
    if (beta <= alpha) {
      break;
    }
  }

  return hasOpenCell ? bestScore : 0;
}

function findComputerMove() {
  let bestMove = -1;
  let bestScore = Infinity;

  for (const index of preferredTttMoves) {
    if (board[index]) {
      continue;
    }

    board[index] = "O";
    const score = minimax(board, "X", -Infinity, bestScore);
    board[index] = "";
    if (score < bestScore) {
      bestScore = score;
      bestMove = index;
    }
  }

  return bestMove;
}

function takeComputerTurn() {
  aiTimer = null;
  if (!computerMode || tttFinished || currentPlayer !== "O") {
    return;
  }

  const move = findComputerMove();
  if (move < 0 || makeTttMove(move, "O")) {
    return;
  }

  currentPlayer = "X";
  cells.forEach((cell, index) => { cell.disabled = Boolean(board[index]); });
  updateTttStatus("Your turn", false, "X");
}

function playCell(index) {
  if (board[index] || tttFinished) {
    return;
  }
  if (computerMode && currentPlayer !== "X") {
    return;
  }

  if (makeTttMove(index, currentPlayer)) {
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  if (computerMode) {
    cells.forEach((cell) => { cell.disabled = true; });
    updateTttStatus("Computer is thinking...", false, "O");
    aiTimer = window.setTimeout(takeComputerTurn, 300);
  } else {
    updateTttStatus(`Player ${currentPlayer}'s turn`, false, currentPlayer);
  }
}

cells.forEach((cell, index) => cell.addEventListener("click", () => playCell(index)));
document.querySelector("#ttt-reset").addEventListener("click", resetTtt);
tttModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    computerMode = button.dataset.mode === "computer";
    tttModeButtons.forEach((modeButton) => {
      const active = modeButton === button;
      modeButton.classList.toggle("is-active", active);
      modeButton.setAttribute("aria-pressed", String(active));
    });
    tttHelp.textContent = computerMode
      ? "You are X. The computer is O."
      : "X goes first. Take turns on the same board.";
    resetTtt();
  });
});
