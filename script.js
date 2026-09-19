const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const startButton = document.getElementById('startButton');

const keys = {};
const bullets = [];
const enemies = [];
const pickups = [];
const stars = [];

const state = {
  running: false,
  gameOver: false,
  score: 0,
  lives: 3,
  lastTime: 0,
  spawnTimer: 0,
  pickupTimer: 0,
};

const player = {
  x: canvas.width / 2,
  y: canvas.height - 60,
  radius: 18,
  speed: 320,
  cooldown: 0,
};

function resetGame() {
  state.running = true;
  state.gameOver = false;
  state.score = 0;
  state.lives = 3;
  state.spawnTimer = 0;
  state.pickupTimer = 0;
  player.x = canvas.width / 2;
  player.y = canvas.height - 60;
  bullets.length = 0;
  enemies.length = 0;
  pickups.length = 0;
  scoreEl.textContent = '0';
  livesEl.textContent = '3';
  overlay.classList.remove('visible');
}

function createStars() {
  stars.length = 0;
  for (let i = 0; i < 90; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      speed: Math.random() * 40 + 20,
    });
  }
}

function spawnEnemy() {
  const size = 18 + Math.random() * 16;
  enemies.push({
    x: 30 + Math.random() * (canvas.width - 60),
    y: -30,
    radius: size,
    speed: 120 + Math.random() * 90,
    drift: (Math.random() - 0.5) * 90,
  });
}

function spawnPickup() {
  pickups.push({
    x: 30 + Math.random() * (canvas.width - 60),
    y: -20,
    radius: 10,
    speed: 110,
    type: Math.random() > 0.7 ? 'shield' : 'score',
  });
}

function shoot() {
  if (!state.running || player.cooldown > 0) return;

  bullets.push({
    x: player.x,
    y: player.y - 18,
    radius: 5,
    speed: 520,
  });
  player.cooldown = 0.18;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updatePlayer(dt) {
  const left = keys['ArrowLeft'] || keys['a'];
  const right = keys['ArrowRight'] || keys['d'];
  const up = keys['ArrowUp'] || keys['w'];
  const down = keys['ArrowDown'] || keys['s'];

  if (left) player.x -= player.speed * dt;
  if (right) player.x += player.speed * dt;
  if (up) player.y -= player.speed * dt;
  if (down) player.y += player.speed * dt;

  player.x = clamp(player.x, 26, canvas.width - 26);
  player.y = clamp(player.y, 40, canvas.height - 38);

  if (player.cooldown > 0) player.cooldown -= dt;

  if (keys[' '] || keys['Space']) shoot();
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y -= bullets[i].speed * dt;
    if (bullets[i].y < -20) bullets.splice(i, 1);
  }
}

function updateEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.y += e.speed * dt;
    e.x += e.drift * dt;

    if (e.x < 20 || e.x > canvas.width - 20) {
      e.drift *= -1;
    }

    if (e.y > canvas.height + 40) {
      enemies.splice(i, 1);
      state.lives -= 1;
      livesEl.textContent = String(state.lives);
      if (state.lives <= 0) {
        endGame();
      }
      continue;
    }

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    if (dist < player.radius + e.radius) {
      enemies.splice(i, 1);
      state.lives -= 1;
      livesEl.textContent = String(state.lives);
      if (state.lives <= 0) {
        endGame();
      }
    }
  }
}

function updatePickups(dt) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    p.y += p.speed * dt;

    if (p.y > canvas.height + 20) {
      pickups.splice(i, 1);
      continue;
    }

    const dx = player.x - p.x;
    const dy = player.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < player.radius + p.radius + 8) {
      pickups.splice(i, 1);
      if (p.type === 'shield') {
        state.lives += 1;
        livesEl.textContent = String(state.lives);
      } else {
        state.score += 50;
        scoreEl.textContent = String(state.score);
      }
    }
  }
}

function handleCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      const dx = bullet.x - enemy.x;
      const dy = bullet.y - enemy.y;
      const dist = Math.hypot(dx, dy);

      if (dist < bullet.radius + enemy.radius) {
        bullets.splice(i, 1);
        enemies.splice(j, 1);
        state.score += 10;
        scoreEl.textContent = String(state.score);
        break;
      }
    }
  }
}

function updateStars(dt) {
  for (const star of stars) {
    star.y += star.speed * dt;
    if (star.y > canvas.height) {
      star.y = -5;
      star.x = Math.random() * canvas.width;
    }
  }
}

function updateGame(dt) {
  if (!state.running) return;

  updateStars(dt);
  updatePlayer(dt);
  updateBullets(dt);

  state.spawnTimer -= dt;
  state.pickupTimer -= dt;

  if (state.spawnTimer <= 0) {
    spawnEnemy();
    state.spawnTimer = 0.75 + Math.random() * 0.7;
  }

  if (state.pickupTimer <= 0) {
    spawnPickup();
    state.pickupTimer = 7 + Math.random() * 5;
  }

  updateEnemies(dt);
  updatePickups(dt);
  handleCollisions();
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#040b17';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const star of stars) {
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer() {
  ctx.beginPath();
  ctx.fillStyle = '#7cf7c6';
  ctx.moveTo(player.x, player.y - 22);
  ctx.lineTo(player.x - 14, player.y + 18);
  ctx.lineTo(player.x + 14, player.y + 18);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = '#63d8ff';
  ctx.arc(player.x, player.y - 6, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawBullets() {
  for (const bullet of bullets) {
    ctx.beginPath();
    ctx.fillStyle = '#63d8ff';
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    ctx.beginPath();
    ctx.fillStyle = '#ff647c';
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = '#ffd1d8';
    ctx.arc(enemy.x - 5, enemy.y - 5, 3, 0, Math.PI * 2);
    ctx.arc(enemy.x + 5, enemy.y - 5, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPickups() {
  for (const pickup of pickups) {
    ctx.beginPath();
    ctx.fillStyle = pickup.type === 'shield' ? '#7cf7c6' : '#f6d365';
    ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function endGame() {
  state.running = false;
  overlay.classList.add('visible');
  overlay.innerHTML = `
    <h1>Game Over</h1>
    <p>Final score: ${state.score}</p>
    <p>Press restart to play again</p>
    <button id="startButton">Restart Game</button>
  `;
  document.getElementById('startButton').addEventListener('click', resetGame);
}

function render() {
  drawBackground();
  drawPickups();
  drawBullets();
  drawEnemies();
  drawPlayer();
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - state.lastTime) / 1000 || 0.016, 0.033);
  state.lastTime = timestamp;
  updateGame(dt);
  render();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
  }
  keys[event.key] = true;
  keys[event.code] = true;
});

window.addEventListener('keyup', (event) => {
  keys[event.key] = false;
  keys[event.code] = false;
});

startButton.addEventListener('click', resetGame);
createStars();
requestAnimationFrame(gameLoop);
