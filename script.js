const canvas = document.querySelector("#game-board");
const context = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const bestScoreElement = document.querySelector("#best-score");
const speedLabel = document.querySelector("#speed-label");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlay-title");
const overlayText = document.querySelector("#overlay-text");
const startButton = document.querySelector("#start-button");
const pauseButton = document.querySelector("#pause-button");
const resetButton = document.querySelector("#reset-button");
const difficultySelect = document.querySelector("#difficulty");

const gridSize = 20;
const tileCount = canvas.width / gridSize;
const difficultySettings = {
  easy: { label: "悠闲", interval: 150 },
  normal: { label: "普通", interval: 105 },
  hard: { label: "极速", interval: 72 },
};

let snake;
let food;
let direction;
let nextDirection;
let score;
let bestScore = Number(localStorage.getItem("snake-best-score")) || 0;
let gameTimer;
let gameState = "ready";

function resetGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  food = createFood();
  gameState = "ready";
  clearInterval(gameTimer);
  updateScore();
  drawGame();
  showOverlay("准备开始", "按空格键或点击“开始游戏”控制小蛇出发。");
  startButton.textContent = "开始游戏";
  pauseButton.textContent = "暂停";
}

function startGame() {
  if (gameState === "running") return;

  gameState = "running";
  overlay.classList.add("hidden");
  startButton.textContent = "继续游戏";
  pauseButton.textContent = "暂停";
  clearInterval(gameTimer);
  gameTimer = setInterval(moveSnake, difficultySettings[difficultySelect.value].interval);
}

function togglePause() {
  if (gameState === "ready" || gameState === "ended") return;

  if (gameState === "paused") {
    startGame();
    return;
  }

  gameState = "paused";
  clearInterval(gameTimer);
  pauseButton.textContent = "继续";
  showOverlay("已暂停", "按空格键、继续按钮或开始游戏恢复。");
}

function endGame() {
  gameState = "ended";
  clearInterval(gameTimer);
  bestScore = Math.max(bestScore, score);
  localStorage.setItem("snake-best-score", String(bestScore));
  updateScore();
  showOverlay("游戏结束", `最终得分：${score}。点击“重新开始”再挑战一次！`);
}

function moveSnake() {
  direction = nextDirection;
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  if (hasCollision(head)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    food = createFood();
    updateScore();
  } else {
    snake.pop();
  }

  drawGame();
}

function hasCollision(position) {
  const hitWall = position.x < 0 || position.x >= tileCount || position.y < 0 || position.y >= tileCount;
  const hitSelf = snake.some((segment) => segment.x === position.x && segment.y === position.y);
  return hitWall || hitSelf;
}

function createFood() {
  let position;

  do {
    position = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
  } while (snake?.some((segment) => segment.x === position.x && segment.y === position.y));

  return position;
}

function drawGame() {
  drawBoard();
  drawFood();
  drawSnake();
}

function drawBoard() {
  context.fillStyle = "#07111d";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(255, 255, 255, 0.035)";
  context.lineWidth = 1;

  for (let index = 0; index <= tileCount; index += 1) {
    const position = index * gridSize;
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, canvas.height);
    context.stroke();

    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(canvas.width, position);
    context.stroke();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const isHead = index === 0;
    context.fillStyle = isHead ? "#adffcf" : "#56f39a";
    context.shadowColor = "rgba(86, 243, 154, 0.5)";
    context.shadowBlur = isHead ? 16 : 8;
    drawRoundedTile(segment.x, segment.y, isHead ? 7 : 5);
  });
  context.shadowBlur = 0;
}

function drawFood() {
  const center = food.x * gridSize + gridSize / 2;
  const middle = food.y * gridSize + gridSize / 2;

  context.fillStyle = "#ff5b7f";
  context.shadowColor = "rgba(255, 91, 127, 0.7)";
  context.shadowBlur = 18;
  context.beginPath();
  context.arc(center, middle, gridSize * 0.38, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
}

function drawRoundedTile(x, y, radius) {
  const inset = 2;
  const left = x * gridSize + inset;
  const top = y * gridSize + inset;
  const size = gridSize - inset * 2;

  context.beginPath();
  context.roundRect(left, top, size, size, radius);
  context.fill();
}

function updateScore() {
  scoreElement.textContent = score;
  bestScoreElement.textContent = bestScore;
  speedLabel.textContent = difficultySettings[difficultySelect.value].label;
}

function showOverlay(title, text) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlay.classList.remove("hidden");
}

function changeDirection(newDirection) {
  const isReverse = newDirection.x + direction.x === 0 && newDirection.y + direction.y === 0;
  if (!isReverse) {
    nextDirection = newDirection;
  }
}

function handleKeydown(event) {
  const keyDirections = {
    ArrowUp: { x: 0, y: -1 },
    KeyW: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    KeyS: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    KeyA: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    KeyD: { x: 1, y: 0 },
  };

  if (event.code === "Space") {
    event.preventDefault();
    gameState === "running" ? togglePause() : startGame();
    return;
  }

  if (keyDirections[event.code]) {
    event.preventDefault();
    changeDirection(keyDirections[event.code]);
  }
}

function handleDifficultyChange() {
  updateScore();
  if (gameState === "running") {
    startGame();
  }
}

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);
resetButton.addEventListener("click", resetGame);
difficultySelect.addEventListener("change", handleDifficultyChange);
document.addEventListener("keydown", handleKeydown);

document.querySelectorAll("[data-direction]").forEach((button) => {
  button.addEventListener("click", () => {
    const directionName = button.dataset.direction;
    const directions = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };
    changeDirection(directions[directionName]);
    if (gameState === "ready") startGame();
  });
});

resetGame();
