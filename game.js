'use strict';

// ── Constants ──────────────────────────────────────────────────────────────
const GRID = 20;
const CELL = 24;
const CANVAS_SIZE = GRID * CELL;

const DIRS = {
  UP:    { x:  0, y: -1 },
  DOWN:  { x:  0, y:  1 },
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x:  1, y:  0 },
};
const OPPOSITE = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };

const BASE_SPEED    = 150;
const SPEED_STEP    = 10;
const FOODS_PER_LVL = 5;
const COMBO_WINDOW  = 5000;  // ms to maintain combo
const SLOW_DURATION = 5000;  // ms slow effect lasts
const GOLD_TTL      = 8000;  // ms gold food lives
const SHRINK_AMT    = 3;     // segments removed by shrink food

// Food type definitions
const FOOD_TYPES = {
  normal: { color: '#ff6b35', glow: 'rgba(255,107,53,0.4)',  pts: 10, label: '' },
  gold:   { color: '#ffd700', glow: 'rgba(255,215,0,0.5)',   pts: 30, label: '×3', ttl: GOLD_TTL },
  slow:   { color: '#00bfff', glow: 'rgba(0,191,255,0.4)',   pts: 15, label: '❄' },
  shrink: { color: '#c084fc', glow: 'rgba(192,132,252,0.4)', pts: 20, label: '−3' },
};

// ── Colors ─────────────────────────────────────────────────────────────────
const C = {
  bg:        '#0a0a1a',
  grid:      '#11112a',
  head:      '#00ff88',
  body:      '#00cc6a',
  tail:      '#008844',
  obstacle:  '#3a3a6a',
  obstacleB: '#5a5aaa',
};

// ── Audio ──────────────────────────────────────────────────────────────────
let audioCtx = null;

function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, type, duration, gainVal = 0.15, delay = 0) {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch (_) {}
}

function sfxEat()     { playTone(440 + level * 20, 'sine', 0.08); }
function sfxGold()    { [523, 659, 784].forEach((f, i) => playTone(f, 'sine', 0.12, 0.18, i * 0.05)); }
function sfxSlow()    { playTone(220, 'sawtooth', 0.3, 0.1); }
function sfxShrink()  { playTone(330, 'triangle', 0.2, 0.12); }
function sfxLevelUp() { [523, 659, 784, 1047].forEach((f, i) => playTone(f, 'sine', 0.15, 0.2, i * 0.07)); }
function sfxGameOver() {
  [400, 320, 240, 180].forEach((f, i) => playTone(f, 'sawtooth', 0.25, 0.1, i * 0.1));
}

// ── State ──────────────────────────────────────────────────────────────────
let snake, dir, nextDir, food, score, highScore, level, foodCount;
let obstacles   = [];
let particles   = [];
let floats      = [];      // floating score/effect texts
let slowUntil   = 0;       // timestamp when slow ends
let combo       = 1;
let comboTimer  = null;
let gameRunning = false;
let paused      = false;
let animFrame   = null;
let lastTick    = 0;
let foodPulse   = 0;

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
const effectSlow     = document.getElementById('effect-slow');
const effectCombo    = document.getElementById('effect-combo');
const comboCount     = document.getElementById('combo-count');

canvas.width  = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

// ── Particle helpers ───────────────────────────────────────────────────────
function spawnParticles(x, y, color) {
  for (let i = 0; i < 14; i++) {
    const angle = (Math.PI * 2 / 14) * i + (Math.random() - 0.5) * 0.4;
    const spd   = 1.5 + Math.random() * 2.5;
    particles.push({
      x: x * CELL + CELL / 2, y: y * CELL + CELL / 2,
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
      life: 1, decay: 0.035 + Math.random() * 0.04,
      size: 2 + Math.random() * 3, color,
    });
  }
}

function spawnFloat(x, y, text, color) {
  floats.push({
    x: x * CELL + CELL / 2, y: y * CELL,
    text, color, life: 1, vy: -1.2,
  });
}

// ── Drawing ────────────────────────────────────────────────────────────────
function drawGrid() {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, CANVAS_SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(CANVAS_SIZE, i * CELL); ctx.stroke();
  }
}

function drawCell(x, y, color, radius = 3, glowColor = null) {
  const px = x * CELL + 1, py = y * CELL + 1, s = CELL - 2;
  ctx.save();
  if (glowColor) { ctx.shadowColor = glowColor; ctx.shadowBlur = 14; }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(px, py, s, s, radius);
  ctx.fill();
  ctx.restore();
}

function drawObstacles() {
  for (const ob of obstacles) {
    ctx.save();
    ctx.shadowColor = C.obstacleB;
    ctx.shadowBlur = 8;
    ctx.fillStyle = C.obstacle;
    ctx.strokeStyle = C.obstacleB;
    ctx.lineWidth = 1;
    const px = ob.x * CELL + 2, py = ob.y * CELL + 2, s = CELL - 4;
    ctx.beginPath();
    ctx.roundRect(px, py, s, s, 3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawFood() {
  foodPulse = (foodPulse + 0.08) % (Math.PI * 2);

  // Gold food: flicker when TTL is low
  const isGold = food.type === 'gold';
  const elapsed = isGold ? (performance.now() - food.spawnedAt) : 0;
  const remaining = isGold ? Math.max(0, GOLD_TTL - elapsed) : Infinity;
  if (isGold && remaining < 2000 && Math.floor(performance.now() / 200) % 2 === 0) return;

  const ft = FOOD_TYPES[food.type];
  const scale = 1 + 0.12 * Math.sin(foodPulse);
  const cx = food.x * CELL + CELL / 2;
  const cy = food.y * CELL + CELL / 2;
  const r  = (CELL / 2 - 2) * scale;

  ctx.save();
  ctx.shadowColor = ft.color;
  ctx.shadowBlur  = 20;

  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.fillStyle = ft.glow;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = ft.color;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx - r * 0.28, cy - r * 0.28, r * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();

  // Label badge for special foods
  if (ft.label) {
    ctx.font = `bold ${CELL * 0.45}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 0;
    ctx.fillText(ft.label, cx, cy + r + 9);
  }

  // TTL bar for gold food
  if (isGold) {
    const barW = CELL - 4;
    const barH = 3;
    const bx = food.x * CELL + 2;
    const by = food.y * CELL - 6;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(bx, by, barW * (remaining / GOLD_TTL), barH);
  }

  ctx.restore();
}

function drawSnake() {
  const isSlow = performance.now() < slowUntil;
  const headColor = isSlow ? '#00e5ff' : C.head;

  for (let i = snake.length - 1; i >= 0; i--) {
    const seg = snake[i];
    if (i === 0) {
      drawCell(seg.x, seg.y, headColor, 6, headColor);

      // Eyes
      const d = dir;
      const cx = seg.x * CELL + CELL / 2;
      const cy = seg.y * CELL + CELL / 2;
      const off = 4, dist = 4;
      let e1x, e1y, e2x, e2y;
      if      (d.x ===  1) { e1x = cx+dist; e1y = cy-off; e2x = cx+dist; e2y = cy+off; }
      else if (d.x === -1) { e1x = cx-dist; e1y = cy-off; e2x = cx-dist; e2y = cy+off; }
      else if (d.y === -1) { e1x = cx-off;  e1y = cy-dist; e2x = cx+off;  e2y = cy-dist; }
      else                  { e1x = cx-off;  e1y = cy+dist; e2x = cx+off;  e2y = cy+dist; }

      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(e1x, e1y, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(e2x, e2y, 2, 0, Math.PI * 2); ctx.fill();
    } else {
      const t = i / (snake.length - 1);
      const color = isSlow
        ? (i < snake.length * 0.4 ? '#0099cc' : '#006699')
        : (i < snake.length * 0.4 ? C.body : C.tail);
      ctx.globalAlpha = Math.max(0.35, 1 - t * 0.55);
      drawCell(seg.x, seg.y, color, 4);
      ctx.globalAlpha = 1;
    }
  }
}

function drawParticles() {
  particles = particles.filter(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= p.decay;
    if (p.life <= 0) return false;
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle   = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur  = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return true;
  });
}

function drawFloats() {
  floats = floats.filter(f => {
    f.y  += f.vy;
    f.vy *= 0.96;
    f.life -= 0.022;
    if (f.life <= 0) return false;
    ctx.save();
    ctx.globalAlpha = f.life;
    ctx.fillStyle   = f.color;
    ctx.shadowColor = f.color;
    ctx.shadowBlur  = 8;
    ctx.font        = 'bold 14px sans-serif';
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
    return true;
  });
}

function render() {
  drawGrid();
  drawObstacles();
  drawParticles();
  drawFloats();
  drawFood();
  drawSnake();
}

// ── Game logic ─────────────────────────────────────────────────────────────
function isCellFree(x, y) {
  if (snake.some(s => s.x === x && s.y === y)) return false;
  if (obstacles.some(o => o.x === x && o.y === y)) return false;
  if (food && food.x === x && food.y === y) return false;
  return true;
}

function randomEmpty() {
  let pos;
  let tries = 0;
  do {
    pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    tries++;
  } while (!isCellFree(pos.x, pos.y) && tries < 400);
  return pos;
}

function pickFoodType() {
  const r = Math.random();
  if (level >= 5 && r < 0.12) return 'shrink';
  if (level >= 3 && r < 0.25) return 'slow';
  if (r < 0.38)               return 'gold';
  return 'normal';
}

function spawnFood() {
  const pos  = randomEmpty();
  const type = pickFoodType();
  food = { ...pos, type, spawnedAt: performance.now() };
}

function addObstacles(count) {
  for (let i = 0; i < count; i++) {
    const pos = randomEmpty();
    obstacles.push(pos);
  }
}

function initGame() {
  const mid = Math.floor(GRID / 2);
  snake     = [{ x: mid, y: mid }, { x: mid-1, y: mid }, { x: mid-2, y: mid }];
  dir       = DIRS.RIGHT;
  nextDir   = DIRS.RIGHT;
  obstacles = [];
  particles = [];
  floats    = [];
  slowUntil = 0;
  combo     = 1;
  score     = 0;
  level     = 1;
  foodCount = 0;
  paused    = false;
  clearTimeout(comboTimer);
  comboTimer = null;
  spawnFood();
  updateHUD();
  updateEffectBar();
}

function tick() {
  if (!gameRunning || paused) return;

  // Gold food expiry check
  if (food.type === 'gold' && performance.now() - food.spawnedAt > GOLD_TTL) {
    spawnFood();
  }

  dir = nextDir;
  const head    = snake[0];
  const newHead = { x: head.x + dir.x, y: head.y + dir.y };

  // Wall collision
  if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
    endGame(); return;
  }
  // Self collision
  if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
    endGame(); return;
  }
  // Obstacle collision
  if (obstacles.some(o => o.x === newHead.x && o.y === newHead.y)) {
    endGame(); return;
  }

  snake.unshift(newHead);

  if (newHead.x === food.x && newHead.y === food.y) {
    const ft   = FOOD_TYPES[food.type];
    const pts  = ft.pts * level * combo;

    score    += pts;
    foodCount++;

    spawnParticles(food.x, food.y, ft.color);
    spawnFloat(food.x, food.y, `+${pts}${combo > 1 ? ' ×' + combo : ''}`, ft.color);

    // Apply food effect
    switch (food.type) {
      case 'gold':
        sfxGold();
        break;
      case 'slow':
        slowUntil = performance.now() + SLOW_DURATION;
        sfxSlow();
        break;
      case 'shrink':
        for (let i = 0; i < SHRINK_AMT && snake.length > 3; i++) snake.pop();
        sfxShrink();
        break;
      default:
        sfxEat();
    }

    // Combo
    clearTimeout(comboTimer);
    combo++;
    comboTimer = setTimeout(() => { combo = 1; updateEffectBar(); }, COMBO_WINDOW);

    // Level up
    const prevLevel = level;
    if (foodCount % FOODS_PER_LVL === 0) {
      level++;
      if (level >= 3) addObstacles(level - 2);
      if (level > prevLevel) {
        sfxLevelUp();
        spawnFloat(Math.floor(GRID/2), Math.floor(GRID/2), `LEVEL ${level}!`, '#a855f7');
      }
    }

    if (score > highScore) highScore = score;
    spawnFood();
    updateHUD();
    updateEffectBar();
  } else {
    snake.pop();
  }
}

function getSpeed() {
  const base = Math.max(60, BASE_SPEED - (level - 1) * SPEED_STEP);
  return performance.now() < slowUntil ? base * 2 : base;
}

function updateHUD() {
  scoreEl.textContent     = score;
  highScoreEl.textContent = highScore;
  levelBadge.textContent  = `Lv.${level}`;
}

function updateEffectBar() {
  const slow = performance.now() < slowUntil;
  effectSlow.classList.toggle('hidden', !slow);
  effectCombo.classList.toggle('hidden', combo < 2);
  if (combo >= 2) comboCount.textContent = combo;
}

// ── Loop ───────────────────────────────────────────────────────────────────
function startTickLoop() {
  function loop(ts) {
    if (!gameRunning) return;
    animFrame = requestAnimationFrame(loop);
    if (ts - lastTick >= getSpeed()) {
      tick();
      lastTick = ts;
    }
    updateEffectBar();
    render();
  }
  lastTick  = performance.now();
  animFrame = requestAnimationFrame(loop);
}

function stopLoop() {
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
}

// ── Screens ────────────────────────────────────────────────────────────────
function showScreen(name) {
  [startScreen, gameScreen, gameoverScreen].forEach(s => s.classList.add('hidden'));
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
  sfxGameOver();

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('snakeHighScore', String(highScore));
  }

  render();

  finalScore.textContent     = score;
  finalHighScore.textContent = highScore;
  finalLength.textContent    = snake.length;
  finalLevel.textContent     = level;
  newRecord.classList.toggle('hidden', !(score > 0 && score === highScore && foodCount > 0));

  setTimeout(() => showScreen('gameover'), 400);
}

function togglePause() {
  if (!gameRunning) return;
  paused = !paused;
  pauseOverlay.classList.toggle('hidden', !paused);
}

// ── Input ──────────────────────────────────────────────────────────────────
function getDirName(d) {
  return Object.keys(DIRS).find(k => DIRS[k].x === d.x && DIRS[k].y === d.y);
}

document.addEventListener('keydown', e => {
  const map = {
    ArrowUp:'UP', w:'UP', W:'UP',
    ArrowDown:'DOWN', s:'DOWN', S:'DOWN',
    ArrowLeft:'LEFT', a:'LEFT', A:'LEFT',
    ArrowRight:'RIGHT', d:'RIGHT', D:'RIGHT',
  };
  const nd = map[e.key];
  if (nd) {
    e.preventDefault();
    if (OPPOSITE[nd] !== getDirName(dir)) nextDir = DIRS[nd];
  }
  if (e.key === ' ') { e.preventDefault(); togglePause(); }
});

// Swipe
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

// Touch buttons
const touchControls = document.createElement('div');
touchControls.id = 'touch-controls';
touchControls.innerHTML = `
  <button class="touch-btn center-top"   data-dir="UP">▲</button>
  <button class="touch-btn center-left"  data-dir="LEFT">◀</button>
  <button class="touch-btn center-mid"   data-dir="DOWN">▼</button>
  <button class="touch-btn center-right" data-dir="RIGHT">▶</button>
`;
gameScreen.appendChild(touchControls);
touchControls.addEventListener('click', e => {
  const btn = e.target.closest('[data-dir]');
  if (!btn) return;
  const nd = btn.dataset.dir;
  if (OPPOSITE[nd] !== getDirName(dir)) nextDir = DIRS[nd];
});

// ── Buttons ────────────────────────────────────────────────────────────────
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
