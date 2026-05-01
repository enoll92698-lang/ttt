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
const OPPOSITE = { UP:'DOWN', DOWN:'UP', LEFT:'RIGHT', RIGHT:'LEFT' };

const FOODS_PER_LVL    = 5;
const COMBO_WINDOW     = 5000;
const SLOW_DURATION    = 5000;
const GOLD_TTL         = 8000;
const SHRINK_AMT       = 3;
const TIME_ATTACK_SECS = 60;

// ── Difficulty configs ─────────────────────────────────────────────────────
const DIFFS = {
  easy:   { label:'かんたん',   speed:210, step:6,  obsAt:5, obsMax:1 },
  normal: { label:'ふつう',     speed:150, step:10, obsAt:3, obsMax:4 },
  hard:   { label:'むずかしい', speed:100, step:14, obsAt:2, obsMax:6 },
};

// ── Food types ─────────────────────────────────────────────────────────────
const FOOD_TYPES = {
  normal: { color:'#ff6b35', glow:'rgba(255,107,53,0.4)',  pts:10, label:''   },
  gold:   { color:'#ffd700', glow:'rgba(255,215,0,0.5)',   pts:30, label:'×3' },
  slow:   { color:'#00bfff', glow:'rgba(0,191,255,0.4)',   pts:15, label:'❄'  },
  shrink: { color:'#c084fc', glow:'rgba(192,132,252,0.4)', pts:20, label:'−3' },
  shield: { color:'#00ffcc', glow:'rgba(0,255,204,0.4)',   pts:5,  label:'🛡' },
};

// ── Mode descriptions ──────────────────────────────────────────────────────
const MODE_DESC = {
  classic:    '壁に当たるとゲームオーバー',
  nowalls:    '壁をすり抜けてループ移動',
  timeattack: '60秒で最高スコアを目指せ！',
};

// ── Colors ─────────────────────────────────────────────────────────────────
const C = {
  bg:'#0a0a1a', grid:'#11112a',
  head:'#00ff88', body:'#00cc6a', tail:'#008844',
  obstacle:'#3a3a6a', obstacleB:'#5a5aaa',
};

// ── Audio ──────────────────────────────────────────────────────────────────
let audioCtx = null;
let muted    = false;

function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq, type, dur, vol = 0.15, delay = 0) {
  if (muted) return;
  try {
    const ac = getAudio();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
    gain.gain.setValueAtTime(vol, ac.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + delay + dur);
    osc.start(ac.currentTime + delay);
    osc.stop(ac.currentTime + delay + dur);
  } catch (_) {}
}

function sfxEat()         { playTone(440 + level * 20, 'sine', 0.08); }
function sfxGold()        { [523,659,784].forEach((f,i) => playTone(f,'sine',0.12,0.18,i*0.05)); }
function sfxSlow()        { playTone(220,'sawtooth',0.3,0.10); }
function sfxShrink()      { playTone(330,'triangle',0.2,0.12); }
function sfxShield()      { [784,880,1047].forEach((f,i) => playTone(f,'sine',0.10,0.18,i*0.04)); }
function sfxShieldBreak() { [880,660,440,220].forEach((f,i) => playTone(f,'triangle',0.12,0.14,i*0.05)); }
function sfxLevelUp()     { [523,659,784,1047].forEach((f,i) => playTone(f,'sine',0.15,0.20,i*0.07)); }
function sfxGameOver()    { [400,320,240,180].forEach((f,i) => playTone(f,'sawtooth',0.25,0.10,i*0.10)); }
function sfxTimeUp()      { [523,392,330,262].forEach((f,i) => playTone(f,'square',0.20,0.12,i*0.12)); }
function sfxCountdown()   { playTone(660,'sine',0.12,0.20); }
function sfxGo()          { [523,659,784].forEach((f,i) => playTone(f,'sine',0.18,0.25,i*0.04)); }

// ── BGM ────────────────────────────────────────────────────────────────────
const BGM = [
  [523,120],[0,40],[659,120],[0,40],[784,120],[659,80],[523,120],[0,80],
  [440,120],[0,40],[523,120],[0,40],[392,200],[0,80],
  [523,120],[0,40],[784,120],[0,40],[1047,120],[784,80],[659,120],[0,80],
  [523,120],[0,40],[659,120],[0,40],[523,260],[0,140],
];
let bgmIdx = 0, bgmTimer = null, bgmRunning = false;

function bgmStep() {
  if (!bgmRunning || muted) return;
  const [freq, dur] = BGM[bgmIdx++ % BGM.length];
  if (freq > 0) {
    try {
      const ac = getAudio();
      const osc = ac.createOscillator();
      const g   = ac.createGain();
      osc.connect(g); g.connect(ac.destination);
      osc.type = 'square';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.024, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur / 1000 * 0.8);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + dur / 1000);
    } catch (_) {}
  }
  bgmTimer = setTimeout(bgmStep, dur);
}

function startBGM() {
  if (bgmRunning || muted) return;
  bgmRunning = true; bgmIdx = 0; bgmStep();
}
function stopBGM() { bgmRunning = false; clearTimeout(bgmTimer); }

// ── State ──────────────────────────────────────────────────────────────────
let gameMode   = 'classic';
let difficulty = 'normal';
let snake, dir, nextDir, food, score, highScore, level, foodCount;
let obstacles  = [];
let particles  = [];
let floats     = [];
let slowUntil  = 0;
let shielded   = false;
let combo      = 1;
let comboTimer = null;
let timeLeft   = TIME_ATTACK_SECS;
let timerId    = null;
let gameRunning = false;
let paused      = false;
let animFrame   = null;
let lastTick    = 0;
let foodPulse   = 0;
let cdVal       = -1;   // countdown: 3,2,1,0='GO!', -1=none
let cdPulse     = 0;

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
const timerBadge     = document.getElementById('timer-badge');
const finalScore     = document.getElementById('final-score');
const finalHighScore = document.getElementById('final-high-score');
const finalLength    = document.getElementById('final-length');
const finalLevel     = document.getElementById('final-level');
const newRecord      = document.getElementById('new-record');
const effectSlow     = document.getElementById('effect-slow');
const effectShield   = document.getElementById('effect-shield');
const effectCombo    = document.getElementById('effect-combo');
const comboCount     = document.getElementById('combo-count');
const canvasWrapper  = document.getElementById('canvas-wrapper');
const muteBtnEl      = document.getElementById('mute-btn');
const gameoverTitle  = document.getElementById('gameover-title');
const currentBestEl  = document.getElementById('current-best');

canvas.width  = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

// ── Utility ────────────────────────────────────────────────────────────────
function turnLeft(d)   { return { x:  d.y, y: -d.x }; }
function turnRight(d)  { return { x: -d.y, y:  d.x }; }
function getDirName(d) { return Object.keys(DIRS).find(k => DIRS[k].x===d.x && DIRS[k].y===d.y); }
function shuffle(arr)  {
  for (let i = arr.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}

// ── Particles / floats ─────────────────────────────────────────────────────
function spawnParticles(gx, gy, color) {
  for (let i = 0; i < 14; i++) {
    const angle = (Math.PI*2/14)*i + (Math.random()-0.5)*0.4;
    const spd   = 1.5 + Math.random()*2.5;
    particles.push({
      x: gx*CELL+CELL/2, y: gy*CELL+CELL/2,
      vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd,
      life:1, decay:0.035+Math.random()*0.04,
      size:2+Math.random()*3, color,
    });
  }
}
function spawnFloat(gx, gy, text, color) {
  floats.push({ x:gx*CELL+CELL/2, y:gy*CELL, text, color, life:1, vy:-1.2 });
}

// ── Screen shake ───────────────────────────────────────────────────────────
function triggerShake() {
  let count = 0;
  const id = setInterval(() => {
    const mag = Math.max(0, 9-count*1.4);
    canvasWrapper.style.transform = mag > 0.5
      ? `translate(${(Math.random()-0.5)*mag*2}px,${(Math.random()-0.5)*mag*2}px)` : '';
    if (++count > 7) { clearInterval(id); canvasWrapper.style.transform=''; }
  }, 40);
  canvasWrapper.classList.add('death');
  setTimeout(() => canvasWrapper.classList.remove('death'), 600);
}

// ── Drawing ────────────────────────────────────────────────────────────────
function drawGrid() {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0,0,CANVAS_SIZE,CANVAS_SIZE);
  ctx.strokeStyle = C.grid; ctx.lineWidth = 0.5;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath(); ctx.moveTo(i*CELL,0); ctx.lineTo(i*CELL,CANVAS_SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,i*CELL); ctx.lineTo(CANVAS_SIZE,i*CELL); ctx.stroke();
  }
}

function drawCell(x, y, color, radius=3, glowColor=null) {
  ctx.save();
  if (glowColor) { ctx.shadowColor=glowColor; ctx.shadowBlur=14; }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x*CELL+1, y*CELL+1, CELL-2, CELL-2, radius);
  ctx.fill();
  ctx.restore();
}

function drawPortalEdges() {
  if (gameMode !== 'nowalls') return;
  ctx.save();
  ctx.strokeStyle='rgba(0,255,136,0.18)'; ctx.lineWidth=4;
  ctx.setLineDash([8,6]);
  ctx.strokeRect(2,2,CANVAS_SIZE-4,CANVAS_SIZE-4);
  ctx.restore();
}

function drawObstacles() {
  for (const ob of obstacles) {
    ctx.save();
    ctx.shadowColor=C.obstacleB; ctx.shadowBlur=8;
    ctx.fillStyle=C.obstacle; ctx.strokeStyle=C.obstacleB; ctx.lineWidth=1;
    ctx.beginPath();
    ctx.roundRect(ob.x*CELL+2,ob.y*CELL+2,CELL-4,CELL-4,3);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

function drawFood() {
  foodPulse = (foodPulse+0.08)%(Math.PI*2);
  const isGold    = food.type==='gold';
  const elapsed   = isGold ? performance.now()-food.spawnedAt : 0;
  const remaining = isGold ? Math.max(0,GOLD_TTL-elapsed) : Infinity;
  if (isGold && remaining<2000 && Math.floor(performance.now()/200)%2===0) return;

  const ft    = FOOD_TYPES[food.type];
  const scale = 1+0.12*Math.sin(foodPulse);
  const cx    = food.x*CELL+CELL/2;
  const cy    = food.y*CELL+CELL/2;
  const r     = (CELL/2-2)*scale;

  ctx.save();
  ctx.shadowColor=ft.color; ctx.shadowBlur=20;
  ctx.beginPath(); ctx.arc(cx,cy,r+4,0,Math.PI*2); ctx.fillStyle=ft.glow; ctx.fill();
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);   ctx.fillStyle=ft.color; ctx.fill();
  ctx.beginPath(); ctx.arc(cx-r*0.28,cy-r*0.28,r*0.3,0,Math.PI*2);
  ctx.fillStyle='rgba(255,255,255,0.45)'; ctx.fill();

  if (ft.label) {
    ctx.font=`bold ${CELL*0.44}px sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='#fff'; ctx.shadowBlur=0;
    ctx.fillText(ft.label, cx, cy+r+9);
  }
  if (isGold) {
    ctx.shadowBlur=0;
    ctx.fillStyle='#333'; ctx.fillRect(food.x*CELL+2,food.y*CELL-6,CELL-4,3);
    ctx.fillStyle='#ffd700'; ctx.fillRect(food.x*CELL+2,food.y*CELL-6,(CELL-4)*(remaining/GOLD_TTL),3);
  }
  ctx.restore();
}

function rainbowColor(i, alpha=1) {
  const hue = (i*22 + performance.now()/12) % 360;
  return `hsla(${hue},100%,58%,${alpha})`;
}

function drawSnake() {
  const isSlow    = performance.now() < slowUntil;
  const isRainbow = combo >= 5;
  const headColor = isRainbow ? rainbowColor(0) : isSlow ? '#00e5ff' : C.head;

  for (let i = snake.length-1; i >= 0; i--) {
    const seg = snake[i];
    if (i === 0) {
      // Shield aura
      if (shielded) {
        ctx.save();
        ctx.strokeStyle='#00ffcc'; ctx.shadowColor='#00ffcc'; ctx.shadowBlur=18;
        ctx.lineWidth=2;
        ctx.globalAlpha = 0.7+0.3*Math.sin(performance.now()/150);
        ctx.beginPath();
        ctx.arc(seg.x*CELL+CELL/2, seg.y*CELL+CELL/2, CELL/2+5, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
      }
      drawCell(seg.x, seg.y, headColor, 6, headColor);
      // Eyes
      const d=dir, cx=seg.x*CELL+CELL/2, cy=seg.y*CELL+CELL/2;
      let e1x,e1y,e2x,e2y;
      if      (d.x===1)  {e1x=cx+4;e1y=cy-4;e2x=cx+4;e2y=cy+4;}
      else if (d.x===-1) {e1x=cx-4;e1y=cy-4;e2x=cx-4;e2y=cy+4;}
      else if (d.y===-1) {e1x=cx-4;e1y=cy-4;e2x=cx+4;e2y=cy-4;}
      else               {e1x=cx-4;e1y=cy+4;e2x=cx+4;e2y=cy+4;}
      ctx.fillStyle='#000';
      ctx.beginPath(); ctx.arc(e1x,e1y,2,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(e2x,e2y,2,0,Math.PI*2); ctx.fill();
    } else {
      const t = i/(snake.length-1);
      let color;
      if (isRainbow) {
        color = rainbowColor(i);
      } else if (isSlow) {
        color = i < snake.length*0.4 ? '#0099cc' : '#006699';
      } else {
        color = i < snake.length*0.4 ? C.body : C.tail;
      }
      ctx.globalAlpha = Math.max(0.35, 1-t*0.55);
      drawCell(seg.x, seg.y, color, 4, isRainbow ? color : null);
      ctx.globalAlpha = 1;
    }
  }
}

function drawParticles() {
  particles = particles.filter(p => {
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.life-=p.decay;
    if (p.life<=0) return false;
    ctx.save();
    ctx.globalAlpha=p.life; ctx.fillStyle=p.color; ctx.shadowColor=p.color; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); ctx.fill();
    ctx.restore();
    return true;
  });
}

function drawFloats() {
  floats = floats.filter(f => {
    f.y+=f.vy; f.vy*=0.96; f.life-=0.022;
    if (f.life<=0) return false;
    ctx.save();
    ctx.globalAlpha=f.life; ctx.fillStyle=f.color; ctx.shadowColor=f.color; ctx.shadowBlur=8;
    ctx.font='bold 14px sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
    return true;
  });
}

function drawCountdown() {
  if (cdVal < 0) return;
  cdPulse += 0.18;
  const text  = cdVal===0 ? 'GO!' : String(cdVal);
  const color = cdVal===0 ? '#00ff88' : '#ffffff';
  const sz    = 1 + 0.07*Math.sin(cdPulse);
  ctx.save();
  ctx.translate(CANVAS_SIZE/2, CANVAS_SIZE/2);
  ctx.scale(sz, sz);
  ctx.shadowColor=color; ctx.shadowBlur=50;
  ctx.fillStyle=color;
  ctx.font="bold 96px 'Segoe UI',sans-serif";
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.globalAlpha=0.92;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function render() {
  drawGrid();
  drawPortalEdges();
  drawObstacles();
  drawParticles();
  drawFloats();
  drawFood();
  drawSnake();
  drawCountdown();
}

// ── Game logic ─────────────────────────────────────────────────────────────
function isCellFree(x, y) {
  if (snake && snake.some(s=>s.x===x&&s.y===y)) return false;
  if (obstacles.some(o=>o.x===x&&o.y===y)) return false;
  if (food && food.x===x&&food.y===y) return false;
  return true;
}

function randomEmpty() {
  let pos, tries=0;
  do { pos={x:Math.floor(Math.random()*GRID),y:Math.floor(Math.random()*GRID)}; }
  while (!isCellFree(pos.x,pos.y) && ++tries<400);
  return pos;
}

function pickFoodType() {
  const weights = [
    ['normal', 50],
    ['gold',   25],
    ['slow',   level>=3 ? 13 : 0],
    ['shrink', level>=5 ? 9  : 0],
    ['shield', 5],
  ];
  const total = weights.reduce((s,[,w])=>s+w, 0);
  let r = Math.random()*total;
  for (const [type, w] of weights) { r-=w; if (r<=0) return type; }
  return 'normal';
}

function spawnFood() {
  food = { ...randomEmpty(), type:pickFoodType(), spawnedAt:performance.now() };
}

function addObstacles(n) {
  for (let i=0; i<n; i++) obstacles.push(randomEmpty());
}

// ── Leaderboard ────────────────────────────────────────────────────────────
function getHSKey()     { return `snakeHS_${gameMode}_${difficulty}`; }
function getScoresKey() { return `snakeScores_${gameMode}_${difficulty}`; }
function loadHS()       { return parseInt(localStorage.getItem(getHSKey())||'0',10); }
function saveHS()       { localStorage.setItem(getHSKey(), String(highScore)); }

function getTopScores() {
  try { return JSON.parse(localStorage.getItem(getScoresKey())||'[]'); }
  catch(_) { return []; }
}

function addToLeaderboard(s) {
  if (s<=0) return;
  const scores = getTopScores();
  scores.push(s);
  scores.sort((a,b)=>b-a);
  localStorage.setItem(getScoresKey(), JSON.stringify(scores.slice(0,3)));
}

function getModeLabel() {
  const mn={classic:'クラシック',nowalls:'ノーウォール',timeattack:'タイムアタック'};
  return `${mn[gameMode]} · ${DIFFS[difficulty].label}`;
}

function renderLeaderboard(newScore) {
  const scores  = getTopScores();
  const medals  = ['🥇','🥈','🥉'];
  const listEl  = document.getElementById('lb-list');
  document.getElementById('lb-mode-label').textContent = getModeLabel();
  if (scores.length===0) {
    listEl.innerHTML = '<div class="lb-empty">まだ記録なし</div>';
    return;
  }
  listEl.innerHTML = scores.map((s,i) => {
    const isNew = s===newScore && i===0 ? 'lb-new' : '';
    return `<div class="lb-item ${isNew}">
      <span class="lb-rank">${medals[i]||''}</span>
      <span class="lb-pts">${s.toLocaleString()}</span>
    </div>`;
  }).join('');
}

function updateCurrentBest() {
  const best = loadHS();
  currentBestEl.textContent = best > 0 ? `ベスト: ${best.toLocaleString()}` : 'ベスト: ---';
}

// ── Init ───────────────────────────────────────────────────────────────────
function initGame() {
  const mid = Math.floor(GRID/2);
  snake     = [{x:mid,y:mid},{x:mid-1,y:mid},{x:mid-2,y:mid}];
  dir       = DIRS.RIGHT;
  nextDir   = DIRS.RIGHT;
  obstacles = [];
  particles = [];
  floats    = [];
  slowUntil = 0;
  shielded  = false;
  combo     = 1;
  score     = 0;
  level     = 1;
  foodCount = 0;
  paused    = false;
  clearTimeout(comboTimer); comboTimer=null;
  spawnFood();

  if (gameMode==='timeattack') {
    timeLeft = TIME_ATTACK_SECS;
    levelBadge.classList.add('hidden');
    timerBadge.classList.remove('hidden');
    updateTimerDisplay();
  } else {
    levelBadge.classList.remove('hidden');
    timerBadge.classList.add('hidden');
  }
  updateHUD();
  updateEffectBar();
}

// ── Tick ───────────────────────────────────────────────────────────────────
function tick() {
  if (!gameRunning || paused) return;

  if (food.type==='gold' && performance.now()-food.spawnedAt>GOLD_TTL) spawnFood();

  dir = nextDir;
  const head = snake[0];
  let nx = head.x+dir.x;
  let ny = head.y+dir.y;

  // Wall handling
  const hitWall = nx<0||nx>=GRID||ny<0||ny>=GRID;
  if (hitWall) {
    if (gameMode==='nowalls') {
      nx=(nx+GRID)%GRID; ny=(ny+GRID)%GRID;
    } else if (shielded) {
      shielded=false; sfxShieldBreak();
      spawnParticles(head.x,head.y,'#00ffcc');
      spawnFloat(head.x,head.y,'🛡 SAVED!','#00ffcc');
      nx=(nx+GRID)%GRID; ny=(ny+GRID)%GRID;
      updateEffectBar();
    } else {
      endGame('collision'); return;
    }
  }

  // Self / obstacle collision
  const hitSelf     = snake.some(s=>s.x===nx&&s.y===ny);
  const hitObstacle = obstacles.some(o=>o.x===nx&&o.y===ny);
  if (hitSelf||hitObstacle) {
    if (shielded) {
      shielded=false; sfxShieldBreak();
      spawnParticles(nx,ny,'#00ffcc');
      spawnFloat(nx,ny,'🛡 SAVED!','#00ffcc');
      updateEffectBar();
      // Allow passing through this tick
    } else {
      endGame('collision'); return;
    }
  }

  snake.unshift({x:nx,y:ny});

  if (nx===food.x && ny===food.y) {
    const ft  = FOOD_TYPES[food.type];
    const pts = ft.pts*level*combo;
    score    += pts;
    foodCount++;
    spawnParticles(food.x,food.y,ft.color);
    spawnFloat(food.x,food.y,`+${pts}${combo>1?' ×'+combo:''}`,ft.color);

    switch(food.type) {
      case 'gold':   sfxGold();   break;
      case 'slow':   slowUntil=performance.now()+SLOW_DURATION; sfxSlow(); break;
      case 'shrink': for (let i=0;i<SHRINK_AMT&&snake.length>3;i++) snake.pop(); sfxShrink(); break;
      case 'shield': shielded=true; sfxShield(); break;
      default:       sfxEat();
    }

    clearTimeout(comboTimer);
    combo++;
    comboTimer = setTimeout(()=>{combo=1;updateEffectBar();}, COMBO_WINDOW);

    if (gameMode!=='timeattack' && foodCount%FOODS_PER_LVL===0) {
      const prev=level; level++;
      const d=DIFFS[difficulty];
      if (level>=d.obsAt) addObstacles(Math.min(level-d.obsAt+1,d.obsMax));
      if (level>prev) {
        sfxLevelUp();
        spawnFloat(Math.floor(GRID/2),Math.floor(GRID/2),`LEVEL ${level}!`,'#a855f7');
      }
    }

    if (score>highScore) highScore=score;
    spawnFood();
    updateHUD();
    updateEffectBar();
  } else {
    snake.pop();
  }
}

function getSpeed() {
  const d = DIFFS[difficulty];
  const base = Math.max(50, d.speed-(level-1)*d.step);
  return performance.now()<slowUntil ? base*2 : base;
}

function updateHUD() {
  scoreEl.textContent     = score;
  highScoreEl.textContent = highScore;
  levelBadge.textContent  = `Lv.${level}`;
}

function updateTimerDisplay() {
  timerBadge.textContent = `⏱ ${timeLeft}`;
  timerBadge.classList.toggle('urgent', timeLeft<=10);
}

function updateEffectBar() {
  effectSlow.classList.toggle  ('hidden', !(performance.now()<slowUntil));
  effectShield.classList.toggle('hidden', !shielded);
  effectCombo.classList.toggle ('hidden', combo<2);
  if (combo>=2) comboCount.textContent=combo;
}

function startTimerCountdown() {
  clearInterval(timerId);
  timerId = setInterval(()=>{
    if (!gameRunning||paused) return;
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft<=0) { clearInterval(timerId); endGame('timeout'); }
  },1000);
}

// ── Game loop ──────────────────────────────────────────────────────────────
function startTickLoop() {
  function loop(ts) {
    animFrame = requestAnimationFrame(loop);
    if (gameRunning && ts-lastTick>=getSpeed()) { tick(); lastTick=ts; }
    updateEffectBar();
    render();
  }
  animFrame = requestAnimationFrame(loop);
}

function stopLoop() {
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame=null; }
}

// ── Countdown before game start ────────────────────────────────────────────
function startCountdown() {
  cdVal=3; cdPulse=0;
  sfxCountdown();
  const steps=[2,1,0];
  let si=0;
  const id = setInterval(()=>{
    cdVal=steps[si++];
    if (cdVal>0) sfxCountdown();
    if (si>=steps.length) {
      clearInterval(id);
      sfxGo();
      setTimeout(()=>{
        cdVal=-1;
        gameRunning=true;
        startBGM();
        if (gameMode==='timeattack') startTimerCountdown();
        lastTick=performance.now();
      },600);
    }
  },700);
}

// ── Screens ────────────────────────────────────────────────────────────────
function showScreen(name) {
  [startScreen,gameScreen,gameoverScreen].forEach(s=>s.classList.add('hidden'));
  document.getElementById(name+'-screen').classList.remove('hidden');
}

function startGame() {
  stopPreview();
  highScore=loadHS();
  highScoreEl.textContent=highScore;
  initGame();
  gameRunning=false;
  showScreen('game');
  lastTick=performance.now();
  startTickLoop();
  startCountdown();
}

function endGame(reason='collision') {
  gameRunning=false;
  stopLoop();
  clearInterval(timerId);
  stopBGM();

  if (reason!=='timeout') triggerShake();
  reason==='timeout' ? sfxTimeUp() : sfxGameOver();

  if (score>highScore) { highScore=score; saveHS(); }
  addToLeaderboard(score);

  render();

  finalScore.textContent     = score;
  finalHighScore.textContent = highScore;
  finalLength.textContent    = snake.length;
  finalLevel.textContent     = level;
  gameoverTitle.textContent  = reason==='timeout' ? 'TIME UP!' : 'GAME OVER';
  newRecord.classList.toggle('hidden', !(score>0&&score===highScore&&foodCount>0));
  renderLeaderboard(score);

  setTimeout(()=>showScreen('gameover'), 450);
}

function togglePause() {
  if (!gameRunning) return;
  paused=!paused;
  pauseOverlay.classList.toggle('hidden', !paused);
  if (paused) stopBGM(); else startBGM();
}

// ── Input ──────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e=>{
  const map={
    ArrowUp:'UP',w:'UP',W:'UP',
    ArrowDown:'DOWN',s:'DOWN',S:'DOWN',
    ArrowLeft:'LEFT',a:'LEFT',A:'LEFT',
    ArrowRight:'RIGHT',d:'RIGHT',D:'RIGHT',
  };
  const nd=map[e.key];
  if (nd) { e.preventDefault(); if (OPPOSITE[nd]!==getDirName(dir)) nextDir=DIRS[nd]; }
  if (e.key===' ') { e.preventDefault(); togglePause(); }
});

let touchStart=null;
canvas.addEventListener('touchstart', e=>{
  touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};
},{passive:true});
canvas.addEventListener('touchend', e=>{
  if (!touchStart) return;
  const dx=e.changedTouches[0].clientX-touchStart.x;
  const dy=e.changedTouches[0].clientY-touchStart.y;
  touchStart=null;
  if (Math.abs(dx)<10&&Math.abs(dy)<10) return;
  if (Math.abs(dx)>Math.abs(dy)) {
    const nd=dx>0?'RIGHT':'LEFT';
    if (OPPOSITE[nd]!==getDirName(dir)) nextDir=DIRS[nd];
  } else {
    const nd=dy>0?'DOWN':'UP';
    if (OPPOSITE[nd]!==getDirName(dir)) nextDir=DIRS[nd];
  }
},{passive:true});

const touchControls=document.createElement('div');
touchControls.id='touch-controls';
touchControls.innerHTML=`
  <button class="touch-btn center-top"   data-dir="UP">▲</button>
  <button class="touch-btn center-left"  data-dir="LEFT">◀</button>
  <button class="touch-btn center-mid"   data-dir="DOWN">▼</button>
  <button class="touch-btn center-right" data-dir="RIGHT">▶</button>
`;
gameScreen.appendChild(touchControls);
touchControls.addEventListener('click', e=>{
  const btn=e.target.closest('[data-dir]');
  if (!btn) return;
  const nd=btn.dataset.dir;
  if (OPPOSITE[nd]!==getDirName(dir)) nextDir=DIRS[nd];
});

// ── Mode / difficulty buttons ──────────────────────────────────────────────
document.querySelectorAll('.mode-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    gameMode=btn.dataset.mode;
    document.getElementById('mode-desc').textContent=MODE_DESC[gameMode];
    updateCurrentBest();
  });
});

document.querySelectorAll('.diff-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.diff-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    difficulty=btn.dataset.diff;
    updateCurrentBest();
  });
});

// ── Mute ──────────────────────────────────────────────────────────────────
muteBtnEl.addEventListener('click',()=>{
  muted=!muted;
  muteBtnEl.textContent=muted?'🔇':'🔊';
  if (muted) stopBGM();
  else if (gameRunning&&!paused) startBGM();
});

// ── Screen buttons ─────────────────────────────────────────────────────────
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('retry-btn').addEventListener('click', startGame);
document.getElementById('menu-btn').addEventListener('click',()=>{
  showScreen('start');
  stopLoop(); stopBGM();
  gameRunning=false;
  updateCurrentBest();
  initPreview();
});

// ── Start-screen preview animation ────────────────────────────────────────
const PV_GRID=10, PV_CELL=13;
let pvSnake, pvDir, pvFood, pvAnim=null, pvLastT=0;

function pvReset() {
  pvSnake=[{x:5,y:5},{x:4,y:5},{x:3,y:5}];
  pvDir={x:1,y:0};
  pvFood={x:Math.floor(Math.random()*PV_GRID),y:Math.floor(Math.random()*PV_GRID)};
}

function pvStep() {
  const head=pvSnake[0];
  const opts=shuffle([pvDir,turnLeft(pvDir),turnRight(pvDir)]);
  for (const d of opts) {
    const nx=(head.x+d.x+PV_GRID)%PV_GRID;
    const ny=(head.y+d.y+PV_GRID)%PV_GRID;
    if (!pvSnake.some(s=>s.x===nx&&s.y===ny)) { pvDir=d; break; }
  }
  const nx=(head.x+pvDir.x+PV_GRID)%PV_GRID;
  const ny=(head.y+pvDir.y+PV_GRID)%PV_GRID;
  if (pvSnake.some(s=>s.x===nx&&s.y===ny)) { pvReset(); return; }
  pvSnake.unshift({x:nx,y:ny});
  if (nx===pvFood.x&&ny===pvFood.y) {
    pvFood={x:Math.floor(Math.random()*PV_GRID),y:Math.floor(Math.random()*PV_GRID)};
    if (pvSnake.length>18) pvSnake.pop();
  } else { pvSnake.pop(); }
}

function pvDraw(pc) {
  pc.fillStyle=C.bg; pc.fillRect(0,0,PV_GRID*PV_CELL,PV_GRID*PV_CELL);
  pc.strokeStyle=C.grid; pc.lineWidth=0.5;
  for (let i=0;i<=PV_GRID;i++) {
    pc.beginPath(); pc.moveTo(i*PV_CELL,0); pc.lineTo(i*PV_CELL,PV_GRID*PV_CELL); pc.stroke();
    pc.beginPath(); pc.moveTo(0,i*PV_CELL); pc.lineTo(PV_GRID*PV_CELL,i*PV_CELL); pc.stroke();
  }
  pc.save(); pc.shadowColor='#ff6b35'; pc.shadowBlur=10; pc.fillStyle='#ff6b35';
  pc.beginPath();
  pc.arc(pvFood.x*PV_CELL+PV_CELL/2,pvFood.y*PV_CELL+PV_CELL/2,PV_CELL/2-1,0,Math.PI*2);
  pc.fill(); pc.restore();
  for (let i=pvSnake.length-1;i>=0;i--) {
    const s=pvSnake[i];
    const color=i===0?'#00ff88':(i<pvSnake.length*0.4?'#00cc6a':'#008844');
    pc.save();
    if (i===0){pc.shadowColor='#00ff88';pc.shadowBlur=12;}
    pc.fillStyle=color;
    pc.globalAlpha=Math.max(0.4,1-(i/pvSnake.length)*0.5);
    pc.beginPath();
    pc.roundRect(s.x*PV_CELL+1,s.y*PV_CELL+1,PV_CELL-2,PV_CELL-2,2);
    pc.fill(); pc.restore();
  }
}

function initPreview() {
  const pvc=document.getElementById('preview-canvas');
  pvc.width=PV_GRID*PV_CELL; pvc.height=PV_GRID*PV_CELL;
  const pc=pvc.getContext('2d');
  pvReset();
  if (pvAnim) cancelAnimationFrame(pvAnim);
  function loop(ts) {
    pvAnim=requestAnimationFrame(loop);
    if (ts-pvLastT>180){pvStep();pvLastT=ts;}
    pvDraw(pc);
  }
  pvAnim=requestAnimationFrame(loop);
}

function stopPreview() {
  if (pvAnim){cancelAnimationFrame(pvAnim);pvAnim=null;}
}

// ── Boot ───────────────────────────────────────────────────────────────────
updateCurrentBest();
showScreen('start');
initPreview();
