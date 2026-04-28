'use strict';

// ── Constants ──────────────────────────────────────────────────────────────
const GRID = 20;          // cells per row/col
const CELL = 24;          // px per cell
const CANVAS_SIZE = GRID * CELL;  // 480px

const DIRS = {
  UP:    { x: 0, y: -1 },
  DOWN:  { x: 0, y:  1 },
  LEFT:  { x: -1, y: 0 },
  RIGHT: { x: 1,  y: 0 },
};

const OPPOSITE = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };

// Speed in ms per tick; decreases as level increases
const BASE_SPEED = 150;
const SPEED_STEP = 10;

// Points per food eaten
const POINTS_PER_FOOD = 10;
// Foods needed to level up
const FOODS_PER_LEVEL = 5;

// ── Colors ─────────────────────────────────────────────────────────────────
const C = {
  bg:          '#0a0a1a',
  grid:        '#11112a',
  snakeHead:   '#00ff88',
  snakeBody:   '#00cc6a',
  snakeTail:   '#008844',
  food:        '#ff6b35',
  foodGlow:    'rgba(255, 107, 53, 0.4)',
  particle:    '#ff6b35',
};

// ── State ──────────────────────────────────────────────────────────────────
let snake, dir, nextDir, food, score, highScore, level, foodCount;
let particles = [];
let gameRunning = false;
let paused = false;
let tickTimer = null;
let animFrame = null;
let lastTick = 0;

// ── DOM ────────────────────────────────────────────────────────────────────
const startScreen    = document.getElementById('start-screen');
const gameScreen     = document.getElementById('game-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const canvas         = document.getElementById('game-canvas');
const ctx            = canvas.getContext('2d');
const pauseOverlay   = document.getElementById('pause-overlay');
const scoreEl        = document.getElementById('score');
const highScoreEl    = document.getElementById('high-score');
const levelBadge     = document.getElementById('level-badge');
const finalScore     = document.getElementById('final-score');
const finalHighScore = document.getElementById('final-high-score');
const finalLength    = document.getElementById('final-length');
const finalLevel     = document.getElementById('final-level');
const newRecord      = document.getElementById('new-record');

// ── Canvas setup ───────────────────────────────────────────────────────────
canvas.width  = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

// ── Particle ───────────────────────────────────────────────────────────────
function createParticles(x, y) {
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 / 12) * i + (Math.random() - 0.5) * 0.5;
    const speed = 1.5 + Math.random() * 2.5;
    particles.push({
      x: x * CELL + CELL / 2,
      y: y * CELL + CELL / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.04 + Math.random() * 0.04,
      size: 2 + Math.random() * 3,
    });
  }
}

function updateParticles() {
  particles = particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08;  // gravity
    p.life -= p.decay;
    return p.life > 0;
  });
}

function drawParticles() {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = C.particle;
    ctx.shadowColor = C.particle;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── Drawing ────────────────────────────────────────────────────────────────
function drawGrid() {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL, 0);
    ctx.lineTo(i * CELL, CANVAS_SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * CELL);
    ctx.lineTo(CANVAS_SIZE, i * CELL);
    ctx.stroke();
  }
}

function drawCell(x, y, color, radius = 3, glow = null) {
  const px = x * CELL + 1;
  const py = y * CELL + 1;
  const size = CELL - 2;
  if (glow) {
    ctx.save();
    ctx.shadowColor = glow;
    ctx.shadowBlur = 12;
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(px, py, size, size, radius);
  ctx.fill();
  if (glow) ctx.restore();
}

let foodPulse = 0;

function drawFood() {
  foodPulse = (foodPulse + 0.08) % (Math.PI * 2);
  const scale = 1 + 0.12 * Math.sin(foodPulse);

  const cx = food.x * CELL + CELL / 2;
  const cy = food.y * CELL + CELL / 2;
  const r = (CELL / 2 - 2) * scale;

  ctx.save();
  ctx.shadowColor = C.food;
  ctx.shadowBlur = 18;

  // outer glow ring
  ctx.beginPath();
  ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
  ctx.fillStyle = C.foodGlow;
  ctx.fill();

  // main food circle
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = C.food;
  ctx.fill();

  // shine
  ctx.beginPath();
  ctx.arc(cx - r * 0.28, cy - r * 0.28, r * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fill();

  ctx.restore();
}

function drawSnake() {
  for (let i = snake.length - 1; i >= 0; i--) {
    const seg = snake[i];
    if (i === 0) {
      // head – brighter with glow
      drawCell(seg.x, seg.y, C.snakeHead, 6, C.snakeHead);

      // eyes
      const eyeColor = '#000';
      const d = dir;
      const ex1 = seg.x * CELL + CELL / 2;
      const ey1 = seg.y * CELL + CELL / 2;
      const eyeOff = 4;
      const eyeDist = 4;

      let e1x, e1y, e2x, e2y;
      if (d.x === 1)       { e1x = ex1+eyeDist; e1y = ey1-eyeOff; e2x = ex1+eyeDist; e2y = ey1+eyeOff; }
      else if (d.x === -1) { e1x = ex1-eyeDist; e1y = ey1-eyeOff; e2x = ex1-eyeDist; e2y = ey1+eyeOff; }
      else if (d.y === -1) { e1x = ex1-eyeOff;  e1y = ey1-eyeDist; e2x = ex1+eyeOff;  e2y = ey1-eyeDist; }
      else                  { e1x = ex1-eyeOff;  e1y = ey1+eyeDist; e2x = ex1+eyeOff;  e2y = ey1+eyeDist; }

      ctx.fillStyle = eyeColor;
      ctx.beginPath(); ctx.arc(e1x, e1y, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(e2x, e2y, 2, 0, Math.PI * 2); ctx.fill();
    } else {
      // body gradient from bright to dark as we approach the tail
      const t = i / (snake.length - 1);
      const color = i < snake.length * 0.4 ? C.snakeBody : C.snakeTail;
      const alpha = Math.max(0.4, 1 - t * 0.5);
      ctx.globalAlpha = alpha;
      drawCell(seg.x, seg.y, color, 4);
      ctx.globalAlpha = 1;
    }
  }
}

function render() {
  drawGrid();
  updateParticles();
  drawParticles();
  drawFood();
  drawSnake();
}

// ── Game logic ─────────────────────────────────────────────────────────────
function randomFood() {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

function initGame() {
  const mid = Math.floor(GRID / 2);
  snake    = [
    { x: mid,     y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
  dir      = DIRS.RIGHT;
  nextDir  = DIRS.RIGHT;
  food     = randomFood();
  score    = 0;
  level    = 1;
  foodCount = 0;
  particles = [];
  paused   = false;
  updateHUD();
}

function tick() {
  if (!gameRunning || paused) return;

  dir = nextDir;
  const head = snake[0];
  const newHead = { x: head.x + dir.x, y: head.y + dir.y };

  // Wall collision
  if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
    endGame(); return;
  }
  // Self collision
  if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
    endGame(); return;
  }

  snake.unshift(newHead);

  if (newHead.x === food.x && newHead.y === food.y) {
    // Eat food
    score += POINTS_PER_FOOD * level;
    foodCount++;
    createParticles(food.x, food.y);
    food = randomFood();

    if (foodCount % FOODS_PER_LEVEL === 0) {
      level++;
    }

    if (score > highScore) highScore = score;
    updateHUD();
  } else {
    snake.pop();
  }
}

function updateHUD() {
  scoreEl.textContent    = score;
  highScoreEl.textContent = highScore;
  levelBadge.textContent = `Lv.${level}`;
}

function getSpeed() {
  return Math.max(60, BASE_SPEED - (level - 1) * SPEED_STEP);
}

function startTickLoop() {
  function loop(ts) {
    if (!gameRunning) return;
    animFrame = requestAnimationFrame(loop);

    const speed = getSpeed();
    if (ts - lastTick >= speed) {
      tick();
      lastTick = ts;
    }
    render();
  }
  lastTick = performance.now();
  animFrame = requestAnimationFrame(loop);
}

function stopLoop() {
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
}

// ── Screens ────────────────────────────────────────────────────────────────
function showScreen(name) {
  startScreen.classList.add('hidden');
  gameScreen.classList.add('hidden');
  gameoverScreen.classList.add('hidden');
  document.getElementById(name + '-screen').classList.remove('hidden');
}

function startGame() {
  highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
  highScoreEl.textContent = highScore;
  initGame();
  showScreen('game');
  gameRunning = true;
  startTickLoop();
}

function endGame() {
  gameRunning = false;
  stopLoop();

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('snakeHighScore', String(highScore));
  }

  // Final render so player sees crash state
  render();

  // Populate game over screen
  finalScore.textContent     = score;
  finalHighScore.textContent = highScore;
  finalLength.textContent    = snake.length;
  finalLevel.textContent     = level;

  const isNewRecord = score > 0 && score >= highScore && score === highScore;
  // show new record banner if we beat or set a high score this game
  newRecord.classList.toggle('hidden', !(score > 0 && score === highScore && foodCount > 0));

  setTimeout(() => showScreen('gameover'), 300);
}

function togglePause() {
  if (!gameRunning) return;
  paused = !paused;
  pauseOverlay.classList.toggle('hidden', !paused);
}

// ── Input ──────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  const keyMap = {
    ArrowUp:    'UP',    w: 'UP',    W: 'UP',
    ArrowDown:  'DOWN',  s: 'DOWN',  S: 'DOWN',
    ArrowLeft:  'LEFT',  a: 'LEFT',  A: 'LEFT',
    ArrowRight: 'RIGHT', d: 'RIGHT', D: 'RIGHT',
  };
  const newDirName = keyMap[e.key];
  if (newDirName) {
    e.preventDefault();
    if (OPPOSITE[newDirName] !== getDirName(dir)) {
      nextDir = DIRS[newDirName];
    }
  }
  if (e.key === ' ') {
    e.preventDefault();
    togglePause();
  }
});

function getDirName(d) {
  return Object.keys(DIRS).find(k => DIRS[k].x === d.x && DIRS[k].y === d.y);
}

// Touch / swipe support
let touchStart = null;
canvas.addEventListener('touchstart', e => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });

canvas.addEventListener('touchend', e => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    const nd = dx > 0 ? 'RIGHT' : 'LEFT';
    if (OPPOSITE[nd] !== getDirName(dir)) nextDir = DIRS[nd];
  } else {
    const nd = dy > 0 ? 'DOWN' : 'UP';
    if (OPPOSITE[nd] !== getDirName(dir)) nextDir = DIRS[nd];
  }
}, { passive: true });

// Add touch control buttons to game screen
const touchControls = document.createElement('div');
touchControls.id = 'touch-controls';
touchControls.innerHTML = `
  <button class="touch-btn center-top"  data-dir="UP">▲</button>
  <button class="touch-btn center-left" data-dir="LEFT">◀</button>
  <button class="touch-btn center-mid"  data-dir="DOWN">▼</button>
  <button class="touch-btn center-right"data-dir="RIGHT">▶</button>
`;
gameScreen.appendChild(touchControls);

touchControls.addEventListener('click', e => {
  const btn = e.target.closest('[data-dir]');
  if (!btn) return;
  const nd = btn.dataset.dir;
  if (OPPOSITE[nd] !== getDirName(dir)) nextDir = DIRS[nd];
});

// ── Button listeners ───────────────────────────────────────────────────────
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('retry-btn').addEventListener('click', startGame);
document.getElementById('menu-btn').addEventListener('click', () => {
  showScreen('start');
  stopLoop();
  gameRunning = false;
});

// ── Init ───────────────────────────────────────────────────────────────────
highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
highScoreEl.textContent = highScore;
showScreen('start');
