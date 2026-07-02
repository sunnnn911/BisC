const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const screens = {
  menu: document.getElementById("menu"),
  intro: document.getElementById("intro"),
  how: document.getElementById("how"),
  ending: document.getElementById("ending")
};

const hud = document.getElementById("hud");
const objectiveText = document.getElementById("objectiveText");
const fuseCounter = document.getElementById("fuseCounter");
const talismanCounter = document.getElementById("talismanCounter");
const staminaCounter = document.getElementById("staminaCounter");
const hintBox = document.getElementById("hintBox");
const messageBox = document.getElementById("message");
const redFlash = document.getElementById("redFlash");
const introText = document.getElementById("introText");
const endingTitle = document.getElementById("endingTitle");
const endingText = document.getElementById("endingText");

const startBtn = document.getElementById("startBtn");
const howBtn = document.getElementById("howBtn");
const backBtn = document.getElementById("backBtn");
const skipIntroBtn = document.getElementById("skipIntroBtn");
const restartBtn = document.getElementById("restartBtn");

const keys = new Set();

const mobileControls = document.getElementById("mobileControls");
const joystick = document.getElementById("joystick");
const joystickKnob = document.getElementById("joystickKnob");
const mobileActionBtn = document.getElementById("mobileActionBtn");
const mobileRunBtn = document.getElementById("mobileRunBtn");

const touchMove = { x: 0, y: 0, active: false };


const TILE = 64;
const mapRows = [
  "####################",
  "#S.....#......F....#",
  "#.###..#.####.###..#",
  "#...#..#....#...#..#",
  "###.#..####.#.#.#.##",
  "#...#.....#.#.#....#",
  "#.#####.#.#.#.####.#",
  "#.....#.#...#....#.#",
  "#.###.#.########.#.#",
  "#.#...#......F...#.#",
  "#.#.###########.##.#",
  "#.#......E....#....#",
  "#.######.###..####.#",
  "#....F...#B#.......#",
  "####.#####.#.#######",
  "#....#.....#.......#",
  "#.##.#.##########..#",
  "#F...#.....T....F..#",
  "####################"
];

const world = {
  width: mapRows[0].length * TILE,
  height: mapRows.length * TILE
};

const state = {
  mode: "menu",
  objectiveIndex: 0,
  fuses: 0,
  talismans: 0,
  powerOn: false,
  blackout: false,
  ghostActive: false,
  gameOver: false,
  clear: false,
  shake: 0,
  flicker: 0,
  time: 0,
  typedDone: false
};

const objectives = [
  "□ 폐교 안으로 들어가기",
  "□ 퓨즈 5개 찾기",
  "□ 전기실에서 전선 연결하기",
  "□ 차단기 올리기",
  "□ 교장실에서 전원 켜기",
  "□ 부적 5장 찾기",
  "□ 처녀귀신에게 부적 붙이기"
];

const player = {
  x: 96,
  y: 96,
  r: 16,
  speed: 3.2,
  runSpeed: 5.2,
  stamina: 100,
  runningByTouch: false
};

const ghost = {
  x: 1120,
  y: 1040,
  r: 20,
  speed: 1.42
};

let items = [];
let interactables = [];
let particles = [];

function resetGame() {
  state.mode = "playing";
  state.objectiveIndex = 0;
  state.fuses = 0;
  state.talismans = 0;
  state.powerOn = false;
  state.blackout = false;
  state.ghostActive = false;
  state.gameOver = false;
  state.clear = false;
  state.shake = 0;
  state.flicker = 0;
  state.time = 0;

  player.x = 96;
  player.y = 96;
  player.stamina = 100;
  player.runningByTouch = false;
  ghost.x = 1120;
  ghost.y = 1040;

  items = [
    { type: "fuse", x: 1110, y: 100, taken: false },
    { type: "fuse", x: 890, y: 620, taken: false },
    { type: "fuse", x: 260, y: 880, taken: false },
    { type: "fuse", x: 110, y: 1130, taken: false },
    { type: "fuse", x: 1110, y: 1130, taken: false },

    { type: "talisman", x: 1030, y: 280, taken: false },
    { type: "talisman", x: 180, y: 360, taken: false },
    { type: "talisman", x: 520, y: 520, taken: false },
    { type: "talisman", x: 260, y: 1040, taken: false },
    { type: "talisman", x: 820, y: 1120, taken: false }
  ];

  interactables = [
    { id: "entrance", label: "폐교 입구", x: 96, y: 96, r: 48 },
    { id: "wire", label: "전기실 전선", x: 835, y: 740, r: 46 },
    { id: "breaker", label: "차단기", x: 742, y: 865, r: 42 },
    { id: "principal", label: "교장실 전원", x: 640, y: 1130, r: 44 }
  ];

  particles = Array.from({ length: 140 }, () => ({
    x: Math.random() * world.width,
    y: Math.random() * world.height,
    a: Math.random() * Math.PI * 2,
    s: 0.15 + Math.random() * 0.35
  }));

  updateHud();
  showMessage("폐교 안으로 들어왔다.", 1400);
}

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove("active"));
  if (screens[name]) screens[name].classList.add("active");
  hud.classList.toggle("hidden", name !== "playing");
  if (mobileControls) mobileControls.classList.toggle("hidden", name !== "playing");
}

function typeIntro() {
  const text = `며칠 전부터 버려진 폐교에 불이 켜진다는 소문이 돌기 시작했다.\n\n사람이 있을 리 없는 학교.\n\n하지만 매일 밤, 3층 교실의 불빛은 꺼지지 않았다.\n\n당신은 그 원인을 조사하기 위해 폐교 안으로 들어간다.`;
  introText.textContent = "";
  let i = 0;
  const timer = setInterval(() => {
    if (!screens.intro.classList.contains("active")) {
      clearInterval(timer);
      return;
    }
    introText.textContent = text.slice(0, i);
    i++;
    if (i > text.length) {
      clearInterval(timer);
      state.typedDone = true;
      setTimeout(() => {
        showScreen("playing");
        resetGame();
      }, 900);
    }
  }, 35);
}

function startIntro() {
  state.mode = "intro";
  state.typedDone = false;
  showScreen("intro");
  typeIntro();
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isWallAt(x, y) {
  if (x < 0 || y < 0 || x >= world.width || y >= world.height) return true;
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  return mapRows[row]?.[col] === "#";
}

function canMoveTo(x, y, r) {
  return !(
    isWallAt(x - r, y - r) ||
    isWallAt(x + r, y - r) ||
    isWallAt(x - r, y + r) ||
    isWallAt(x + r, y + r)
  );
}

function moveEntity(entity, dx, dy) {
  const nx = entity.x + dx;
  const ny = entity.y + dy;

  if (canMoveTo(nx, entity.y, entity.r)) entity.x = nx;
  if (canMoveTo(entity.x, ny, entity.r)) entity.y = ny;
}

function currentObjective() {
  return objectives[state.objectiveIndex] || "";
}

function completeObjective(nextMessage) {
  const old = currentObjective().replace("□", "☑");
  objectiveText.textContent = old;
  showMessage(nextMessage || "목표 완료", 1200);
  setTimeout(() => {
    state.objectiveIndex++;
    updateHud();
  }, 800);
}

function updateHud() {
  objectiveText.textContent = currentObjective();
  fuseCounter.textContent = `퓨즈 ${state.fuses}/5`;
  talismanCounter.textContent = `부적 ${state.talismans}/5`;
  if (staminaCounter) staminaCounter.textContent = `체력 ${Math.round(player.stamina)}%`;
}

function showMessage(text, duration = 1700) {
  messageBox.textContent = text;
  messageBox.classList.remove("hidden");
  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => {
    messageBox.classList.add("hidden");
  }, duration);
}

function nearestInteractable() {
  return interactables.find(obj => distance(player, obj) < obj.r);
}

function collectItems() {
  for (const item of items) {
    if (item.taken) continue;
    if (distance(player, item) < 34) {
      if (item.type === "fuse" && state.objectiveIndex === 1) {
        item.taken = true;
        state.fuses++;
        updateHud();
        showMessage(`퓨즈를 찾았다. ${state.fuses}/5`, 900);
        if (state.fuses >= 5) completeObjective("퓨즈를 모두 찾았다.");
      }
      if (item.type === "talisman" && state.objectiveIndex === 5) {
        item.taken = true;
        state.talismans++;
        updateHud();
        showMessage(`부적을 찾았다. ${state.talismans}/5`, 900);
        if (state.talismans >= 5) completeObjective("부적이 모두 모였다.");
      }
    }
  }
}

function interact() {
  const near = nearestInteractable();
  if (!near) {
    if (state.objectiveIndex === 6 && state.ghostActive && distance(player, ghost) < 76) {
      sealGhost();
    }
    return;
  }

  if (near.id === "entrance" && state.objectiveIndex === 0) {
    completeObjective("학교 안쪽으로 들어가자.");
  }

  if (near.id === "wire" && state.objectiveIndex === 2) {
    completeObjective("전선이 연결되었다.");
  }

  if (near.id === "breaker" && state.objectiveIndex === 3) {
    state.powerOn = true;
    state.flicker = 24;
    completeObjective("차단기가 올라갔다.");
  }

  if (near.id === "principal" && state.objectiveIndex === 4) {
    completeObjective("학교 전체 전등이 켜졌다.");
    setTimeout(triggerBlackout, 1300);
  }
}

function triggerBlackout() {
  state.powerOn = false;
  state.blackout = true;
  state.flicker = 80;
  state.shake = 18;
  showMessage("불이 꺼졌다.", 1700);

  setTimeout(() => {
    state.ghostActive = true;
    state.objectiveIndex = 5;
    updateHud();
    showMessage("복도 끝에서 무언가가 움직인다.", 2200);
  }, 1500);
}

function sealGhost() {
  state.ghostActive = false;
  state.clear = true;
  showMessage("부적이 빛나기 시작했다.", 1800);
  setTimeout(() => {
    endingTitle.textContent = "Season 1 Demo Clear";
    endingText.textContent = "귀신의 움직임이 멈추고, 폐교 안을 가득 채우던 한기가 서서히 사라졌다. 그 순간, 체육관 쪽에서 오래된 문이 열리는 소리가 들렸다. 아직 끝난 것이 아니다.";
    showScreen("ending");
    state.mode = "ending";
  }, 1900);
}

function gameOver() {
  if (state.gameOver) return;
  state.gameOver = true;
  state.mode = "ending";
  endingTitle.textContent = "GAME OVER";
  endingText.textContent = "그녀에게 붙잡혔다. 폐교 안의 불빛은 다시 조용히 꺼졌다.";
  showScreen("ending");
}

function updateGhost() {
  if (!state.ghostActive || state.gameOver) return;

  const dx = player.x - ghost.x;
  const dy = player.y - ghost.y;
  const len = Math.hypot(dx, dy) || 1;
  const speedBoost = Math.min(0.85, Math.max(0, 260 - len) / 260);
  const spd = ghost.speed + speedBoost;

  moveEntity(ghost, (dx / len) * spd, (dy / len) * spd);

  if (distance(player, ghost) < player.r + ghost.r + 3) {
    state.shake = 30;
    gameOver();
  }

  const danger = Math.max(0, 1 - len / 330);
  redFlash.style.opacity = String(danger * 0.75);
}

function updatePlayer() {
  let dx = 0;
  let dy = 0;
  if (keys.has("w") || keys.has("arrowup")) dy -= 1;
  if (keys.has("s") || keys.has("arrowdown")) dy += 1;
  if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
  if (keys.has("d") || keys.has("arrowright")) dx += 1;

  dx += touchMove.x;
  dy += touchMove.y;

  const wantsRun = keys.has("shift") || player.runningByTouch;
  const isMoving = Boolean(dx || dy);
  const canRun = wantsRun && player.stamina > 4 && isMoving;
  const currentSpeed = canRun ? player.runSpeed : player.speed;

  if (isMoving) {
    const len = Math.hypot(dx, dy);
    dx = (dx / len) * currentSpeed;
    dy = (dy / len) * currentSpeed;
    moveEntity(player, dx, dy);

    if (canRun) {
      player.stamina = Math.max(0, player.stamina - 0.38);
    } else {
      player.stamina = Math.min(100, player.stamina + 0.12);
    }
  } else {
    player.stamina = Math.min(100, player.stamina + 0.32);
  }

  if (state.time % 6 === 0) updateHud();

  collectItems();

  const near = nearestInteractable();
  const canSeal = state.objectiveIndex === 6 && state.ghostActive && distance(player, ghost) < 76;
  hintBox.classList.toggle("show", Boolean(near) || canSeal);
}

function updateParticles() {
  for (const p of particles) {
    p.x += Math.cos(p.a) * p.s;
    p.y += Math.sin(p.a) * p.s;
    if (p.x < 0) p.x = world.width;
    if (p.x > world.width) p.x = 0;
    if (p.y < 0) p.y = world.height;
    if (p.y > world.height) p.y = 0;
  }
}

function camera() {
  const scaleX = canvas.width / window.innerWidth;
  const scaleY = canvas.height / window.innerHeight;
  const visibleW = canvas.width;
  const visibleH = canvas.height;
  let x = player.x - visibleW / 2;
  let y = player.y - visibleH / 2;
  x = Math.max(0, Math.min(world.width - visibleW, x));
  y = Math.max(0, Math.min(world.height - visibleH, y));

  if (state.shake > 0) {
    x += (Math.random() - 0.5) * state.shake;
    y += (Math.random() - 0.5) * state.shake;
    state.shake *= 0.9;
    if (state.shake < 0.4) state.shake = 0;
  }

  return { x, y, scaleX, scaleY };
}

function drawMap(cam) {
  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  ctx.fillStyle = "#111217";
  ctx.fillRect(0, 0, world.width, world.height);

  for (let r = 0; r < mapRows.length; r++) {
    for (let c = 0; c < mapRows[r].length; c++) {
      const x = c * TILE;
      const y = r * TILE;
      const tile = mapRows[r][c];

      if (tile === "#") {
        ctx.fillStyle = "#252833";
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = "rgba(255,255,255,0.035)";
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
      } else {
        ctx.fillStyle = ((r + c) % 2 === 0) ? "#14161d" : "#101219";
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = "rgba(255,255,255,0.025)";
        ctx.strokeRect(x, y, TILE, TILE);
      }
    }
  }

  drawRoomLabel("입구", 72, 70);
  drawRoomLabel("전기실", 770, 720);
  drawRoomLabel("차단기", 694, 860);
  drawRoomLabel("교장실", 575, 1110);

  ctx.restore();
}

function drawRoomLabel(text, x, y) {
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.font = "700 18px system-ui";
  ctx.fillText(text, x, y);
}

function drawItems(cam) {
  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  for (const item of items) {
    if (item.taken) continue;

    if (item.type === "talisman" && state.objectiveIndex < 5) continue;

    const pulse = 1 + Math.sin(state.time * 0.08) * 0.12;
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.scale(pulse, pulse);

    if (item.type === "fuse") {
      ctx.fillStyle = "#f5d76e";
      ctx.fillRect(-10, -18, 20, 36);
      ctx.fillStyle = "#5b4b19";
      ctx.fillRect(-6, -12, 12, 24);
    } else {
      ctx.fillStyle = "#efe0a5";
      ctx.fillRect(-12, -18, 24, 36);
      ctx.fillStyle = "#8f1b1b";
      ctx.fillRect(-8, -3, 16, 6);
      ctx.fillRect(-3, -12, 6, 24);
    }

    ctx.restore();
  }

  ctx.restore();
}

function drawInteractables(cam) {
  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  for (const obj of interactables) {
    const active =
      (obj.id === "entrance" && state.objectiveIndex === 0) ||
      (obj.id === "wire" && state.objectiveIndex === 2) ||
      (obj.id === "breaker" && state.objectiveIndex === 3) ||
      (obj.id === "principal" && state.objectiveIndex === 4);

    if (!active) continue;

    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.34)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "700 15px system-ui";
    ctx.fillText("E", obj.x - 6, obj.y + 6);
  }

  ctx.restore();
}

function drawPlayer(cam) {
  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fillStyle = "#d6dde8";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(player.x + 5, player.y - 4, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.restore();
}

function drawGhost(cam) {
  if (!state.ghostActive) return;
  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  const float = Math.sin(state.time * 0.07) * 5;
  const x = ghost.x;
  const y = ghost.y + float;

  ctx.globalAlpha = 0.88 + Math.sin(state.time * 0.2) * 0.08;
  ctx.fillStyle = "rgba(240,240,255,0.9)";
  ctx.beginPath();
  ctx.arc(x, y - 12, 18, Math.PI, 0);
  ctx.lineTo(x + 18, y + 22);
  ctx.quadraticCurveTo(x + 6, y + 10, x, y + 24);
  ctx.quadraticCurveTo(x - 6, y + 10, x - 18, y + 22);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(20,20,20,0.8)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 11);
  ctx.lineTo(x - 3, y - 9);
  ctx.moveTo(x + 8, y - 11);
  ctx.lineTo(x + 3, y - 9);
  ctx.stroke();

  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, 52, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawParticles(cam) {
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  for (const p of particles) {
    ctx.fillRect(p.x, p.y, 2, 2);
  }
  ctx.restore();
}

function drawLighting(cam) {
  const nearGhost = state.ghostActive ? Math.max(0, 1 - distance(player, ghost) / 420) : 0;
  const radius = state.powerOn ? 520 : 390;
  const flicker = state.flicker > 0 ? Math.random() * 0.75 : 0;
  if (state.flicker > 0) state.flicker--;

  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${state.powerOn ? 0.12 + flicker * 0.12 : 0.48 + flicker * 0.10})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalCompositeOperation = "destination-out";
  const px = player.x - cam.x;
  const py = player.y - cam.y;
  const gradient = ctx.createRadialGradient(px, py, 20, px, py, radius);
  gradient.addColorStop(0, "rgba(0,0,0,0.98)");
  gradient.addColorStop(0.55, "rgba(0,0,0,0.78)");
  gradient.addColorStop(1, "rgba(0,0,0,0.05)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(px, py, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = `rgba(60,0,0,${nearGhost * 0.18})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.restore();
}

function drawVignette() {
  const gradient = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    120,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width * 0.65
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function draw() {
  const cam = camera();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawMap(cam);
  drawParticles(cam);
  drawItems(cam);
  drawInteractables(cam);
  drawGhost(cam);
  drawPlayer(cam);
  drawLighting(cam);
  drawVignette();
}

function loop() {
  state.time++;
  if (state.mode === "playing") {
    updatePlayer();
    updateGhost();
    updateParticles();
    draw();
  }
  requestAnimationFrame(loop);
}

function resizeCanvas() {
  canvas.width = 1280;
  canvas.height = 720;
}

window.addEventListener("keydown", event => {
  keys.add(event.key.toLowerCase());
  if (event.key.toLowerCase() === "e" && state.mode === "playing") {
    interact();
  }
});

window.addEventListener("keyup", event => {
  keys.delete(event.key.toLowerCase());
});

startBtn.addEventListener("click", startIntro);
howBtn.addEventListener("click", () => showScreen("how"));
backBtn.addEventListener("click", () => showScreen("menu"));
skipIntroBtn.addEventListener("click", () => {
  showScreen("playing");
  resetGame();
});
restartBtn.addEventListener("click", () => {
  showScreen("menu");
  redFlash.style.opacity = "0";
});


function setupMobileControls() {
  if (!joystick || !joystickKnob || !mobileActionBtn) return;

  function setKnob(clientX, clientY) {
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const max = rect.width * 0.34;
    const len = Math.hypot(dx, dy);

    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }

    touchMove.x = dx / max;
    touchMove.y = dy / max;
    touchMove.active = true;

    joystickKnob.style.left = `${39 + dx}px`;
    joystickKnob.style.top = `${39 + dy}px`;
  }

  function resetKnob() {
    touchMove.x = 0;
    touchMove.y = 0;
    touchMove.active = false;
    joystickKnob.style.left = "39px";
    joystickKnob.style.top = "39px";
  }

  joystick.addEventListener("pointerdown", event => {
    joystick.setPointerCapture(event.pointerId);
    setKnob(event.clientX, event.clientY);
  });

  joystick.addEventListener("pointermove", event => {
    if (touchMove.active) setKnob(event.clientX, event.clientY);
  });

  joystick.addEventListener("pointerup", resetKnob);
  joystick.addEventListener("pointercancel", resetKnob);

  mobileActionBtn.addEventListener("pointerdown", event => {
    event.preventDefault();
    if (state.mode === "playing") interact();
  });

  if (mobileRunBtn) {
    mobileRunBtn.addEventListener("pointerdown", event => {
      event.preventDefault();
      player.runningByTouch = true;
    });
    mobileRunBtn.addEventListener("pointerup", () => {
      player.runningByTouch = false;
    });
    mobileRunBtn.addEventListener("pointercancel", () => {
      player.runningByTouch = false;
    });
    mobileRunBtn.addEventListener("pointerleave", () => {
      player.runningByTouch = false;
    });
  }
}

resizeCanvas();
setupMobileControls();
showScreen("menu");
loop();
