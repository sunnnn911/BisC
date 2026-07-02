const menu = document.getElementById("menu");
const how = document.getElementById("how");
const ending = document.getElementById("ending");
const loading = document.getElementById("loading");
const hud = document.getElementById("hud");
const mobileControls = document.getElementById("mobileControls");

const startBtn = document.getElementById("startBtn");
const howBtn = document.getElementById("howBtn");
const backBtn = document.getElementById("backBtn");
const restartBtn = document.getElementById("restartBtn");

const objectiveText = document.getElementById("objectiveText");
const fuseText = document.getElementById("fuseText");
const talismanText = document.getElementById("talismanText");
const staminaText = document.getElementById("staminaText");
const message = document.getElementById("message");
const interactHint = document.getElementById("interactHint");
const damageVignette = document.getElementById("damageVignette");

const joystick = document.getElementById("joystick");
const joystickKnob = document.getElementById("joystickKnob");
const actionBtn = document.getElementById("actionBtn");
const runBtn = document.getElementById("runBtn");
const lookPad = document.getElementById("lookPad");

let scene, camera, renderer;
let player, ghost;
let flashlight, flashlightGlow;
let clock = new THREE.Clock();

const keys = new Set();
const touchMove = { x: 0, y: 0 };
const look = { active: false, lastX: 0, lastY: 0 };
const state = {
  playing: false,
  objective: 0,
  fuses: 0,
  talismans: 0,
  stamina: 100,
  runTouch: false,
  powerOn: false,
  ghostActive: false,
  gameOver: false,
  yaw: 0,
  pitch: 0,
  nearTarget: null,
  time: 0
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

const colliders = [];
const items = [];
const interactables = [];

function showScreen(name) {
  [menu, how, ending].forEach(s => s.classList.remove("active"));
  if (name === "menu") menu.classList.add("active");
  if (name === "how") how.classList.add("active");
  if (name === "ending") ending.classList.add("active");

  const inGame = name === "game";
  hud.classList.toggle("hidden", !inGame);
  mobileControls.classList.toggle("hidden", !inGame);
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030305);
  scene.fog = new THREE.Fog(0x030305, 8, 34);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 80);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true;
  document.getElementById("game").prepend(renderer.domElement);

  const ambient = new THREE.AmbientLight(0x414151, 0.62);
  scene.add(ambient);

  const moon = new THREE.DirectionalLight(0x7580a0, 0.55);
  moon.position.set(-8, 12, 6);
  scene.add(moon);

  flashlight = new THREE.SpotLight(0xffffff, 4.4, 26, Math.PI / 5.2, 0.55, 1.1);
  flashlight.position.set(0, 0, 0);
  flashlight.target.position.set(0, 0, -1);
  camera.add(flashlight);
  camera.add(flashlight.target);
  scene.add(camera);

  flashlightGlow = new THREE.PointLight(0xffffff, 0.55, 4.5);
  camera.add(flashlightGlow);

  createSchool();
  createPlayer();
  createGhost();
  setupInput();

  window.addEventListener("resize", onResize);
  loading.classList.add("hidden");
  showScreen("menu");
  animate();
}

function createPlayer() {
  player = {
    pos: new THREE.Vector3(-9, 1.65, 13),
    radius: 0.35,
    walkSpeed: 4.1,
    runSpeed: 6.4
  };
  camera.position.copy(player.pos);
}

function createGhost() {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xdedeea,
    roughness: 0.7,
    transparent: true,
    opacity: 0.92
  });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 1 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 1.15, 8, 16), bodyMat);
  body.position.y = 1.05;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 18), bodyMat);
  head.position.y = 1.86;
  group.add(head);

  const hair = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.25, 8, 16), hairMat);
  hair.position.set(0, 1.55, -0.03);
  group.add(hair);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMat);
  eye1.position.set(-0.12, 1.9, -0.31);
  const eye2 = eye1.clone();
  eye2.position.x = 0.12;
  group.add(eye1, eye2);

  const light = new THREE.PointLight(0xe8e8ff, 1.2, 5);
  light.position.y = 1.4;
  group.add(light);

  group.position.set(9, 0, -9);
  group.visible = false;
  scene.add(group);
  ghost = { group, speed: 1.7 };
}

function createSchool() {
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x1b1b22, roughness: 0.96 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x353641, roughness: 0.9 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x2a1d15, roughness: 0.85 });
  const chalkMat = new THREE.MeshStandardMaterial({ color: 0x102315, roughness: 0.9 });
  const itemMat = new THREE.MeshStandardMaterial({ color: 0xe0c45c, emissive: 0x221700, roughness: 0.5 });

  addBox(0, -0.05, 0, 24, 0.1, 34, floorMat, false);
  addBox(0, 3.05, 0, 24, 0.1, 34, wallMat, false);

  addWall(0, 1.5, -17, 24, 3, 0.35);
  addWall(0, 1.5, 17, 24, 3, 0.35);
  addWall(-12, 1.5, 0, 0.35, 3, 34);
  addWall(12, 1.5, 0, 0.35, 3, 34);

  // central corridor side walls
  addWall(-5.2, 1.5, -8, 0.25, 3, 14);
  addWall(5.2, 1.5, -8, 0.25, 3, 14);
  addWall(-5.2, 1.5, 9.5, 0.25, 3, 9);
  addWall(5.2, 1.5, 9.5, 0.25, 3, 9);

  // classrooms / office blocks
  addWall(-8.8, 1.5, -3, 6, 3, 0.25);
  addWall(8.8, 1.5, -3, 6, 3, 0.25);
  addWall(-8.8, 1.5, 5, 6, 3, 0.25);
  addWall(8.8, 1.5, 5, 6, 3, 0.25);
  addWall(-8.8, 1.5, 11, 6, 3, 0.25);
  addWall(8.8, 1.5, 11, 6, 3, 0.25);

  // doors and classroom objects
  addDoor(-5.35, 1.1, -1.2, "1학년 3반");
  addDoor(5.35, 1.1, -1.2, "과학실");
  addDoor(-5.35, 1.1, 7.2, "전기실");
  addDoor(5.35, 1.1, 7.2, "교장실");

  addBoard(-9.6, 1.4, -5.8);
  addBoard(9.6, 1.4, -5.8);
  addBoard(-9.6, 1.4, 13.2);

  for (let i = 0; i < 9; i++) {
    addDesk(-9.2 + (i % 3) * 1.5, 0.45, -12 + Math.floor(i / 3) * 1.2);
    addDesk(7.0 + (i % 3) * 1.5, 0.45, -12 + Math.floor(i / 3) * 1.2);
  }

  // lights on ceiling
  for (const z of [-14, -9, -4, 1, 6, 11, 15]) {
    const lamp = new THREE.PointLight(0xc6d7ff, 0.17, 7);
    lamp.position.set(0, 2.7, z);
    scene.add(lamp);
    addBox(0, 2.88, z, 2.1, 0.05, 0.28, new THREE.MeshBasicMaterial({ color: 0x445066 }), false);
  }

  // entrance trigger
  interactables.push({
    id: "entrance",
    label: "폐교 안으로 들어가기",
    pos: new THREE.Vector3(-9, 0, 12.5),
    radius: 2.2
  });

  interactables.push({
    id: "wire",
    label: "전선 연결하기",
    pos: new THREE.Vector3(-8.2, 0, 8.2),
    radius: 1.5
  });
  interactables.push({
    id: "breaker",
    label: "차단기 올리기",
    pos: new THREE.Vector3(-9.6, 0, 9.4),
    radius: 1.5
  });
  interactables.push({
    id: "principal",
    label: "교장실 전원 켜기",
    pos: new THREE.Vector3(8.5, 0, 8.2),
    radius: 1.7
  });

  // items
  addItem("fuse", -8.7, 0.65, -12.7);
  addItem("fuse", 8.9, 0.65, -13.0);
  addItem("fuse", -8.7, 0.65, 1.1);
  addItem("fuse", 8.9, 0.65, 2.1);
  addItem("fuse", 0, 0.65, -15.4);

  addItem("talisman", -9.6, 0.75, -4.4, true);
  addItem("talisman", 9.5, 0.75, -4.1, true);
  addItem("talisman", -9.7, 0.75, 13.0, true);
  addItem("talisman", 9.5, 0.75, 12.6, true);
  addItem("talisman", 0.2, 0.75, 15.0, true);

  function addDoor(x, y, z, text) {
    addBox(x, y, z, 0.16, 2.1, 1.25, doorMat, false);
    makeTextSign(text, x + (x < 0 ? 0.12 : -0.12), 2.2, z);
  }

  function addBoard(x, y, z) {
    addBox(x, y, z, 0.08, 1.1, 2.3, chalkMat, false);
  }

  function addDesk(x, y, z) {
    addBox(x, y, z, 1.0, 0.15, 0.65, new THREE.MeshStandardMaterial({ color: 0x3a2c21, roughness: 0.8 }), true);
  }

  function addItem(type, x, y, z, hidden = false) {
    const mat = type === "fuse"
      ? new THREE.MeshStandardMaterial({ color: 0xe0c45c, emissive: 0x1c1300 })
      : new THREE.MeshStandardMaterial({ color: 0xf0dfae, emissive: 0x301000 });

    const mesh = new THREE.Mesh(
      type === "fuse" ? new THREE.CylinderGeometry(0.13, 0.13, 0.55, 14) : new THREE.BoxGeometry(0.4, 0.55, 0.04),
      mat
    );
    mesh.position.set(x, y, z);
    if (type === "fuse") mesh.rotation.z = Math.PI / 2;
    mesh.visible = !hidden;
    scene.add(mesh);
    items.push({ type, mesh, taken: false, hidden });
  }
}

function addWall(x, y, z, w, h, d) {
  addBox(x, y, z, w, h, d, new THREE.MeshStandardMaterial({ color: 0x343640, roughness: 0.92 }), true);
}

function addBox(x, y, z, w, h, d, mat, collide = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  if (collide) colliders.push(new THREE.Box3().setFromObject(mesh));
  return mesh;
}

function makeTextSign(text, x, y, z) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 80;
  const c = canvas.getContext("2d");
  c.fillStyle = "rgba(15,15,18,0.95)";
  c.fillRect(0, 0, 256, 80);
  c.fillStyle = "#ddd";
  c.font = "bold 32px sans-serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(text, 128, 40);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), mat);
  sign.position.set(x, y, z);
  sign.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
  scene.add(sign);
}

function updateHud() {
  objectiveText.textContent = objectives[state.objective] || "";
  fuseText.textContent = `퓨즈 ${state.fuses}/5`;
  talismanText.textContent = `부적 ${state.talismans}/5`;
  staminaText.textContent = `체력 ${Math.round(state.stamina)}%`;
}

function showMessage(text, ms = 1600) {
  message.textContent = text;
  message.classList.remove("hidden");
  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => message.classList.add("hidden"), ms);
}

function completeObjective(text) {
  objectiveText.textContent = objectives[state.objective].replace("□", "☑");
  showMessage(text || "목표 완료");
  setTimeout(() => {
    state.objective++;
    updateHud();
    if (state.objective === 5) revealTalismans();
  }, 800);
}

function revealTalismans() {
  for (const item of items) {
    if (item.type === "talisman" && !item.taken) item.mesh.visible = true;
  }
}

function startGame() {
  state.playing = true;
  state.objective = 0;
  state.fuses = 0;
  state.talismans = 0;
  state.stamina = 100;
  state.powerOn = false;
}

function resetWorld() {
  player.pos.set(-9, 1.65, 13);
  state.yaw = 0;
  state.pitch = 0;
  camera.rotation.set(0, 0, 0);

  ghost.group.position.set(9, 0, -9);
  ghost.group.visible = false;

  for (const item of items) {
    item.taken = false;
    item.mesh.visible = !item.hidden;
  }

  state.playing = true;
  state.objective = 0;
  state.fuses = 0;
  state.talismans = 0;
  state.stamina = 100;
  state.runTouch = false;
  state.powerOn = false;
  state.ghostActive = false;
  state.gameOver = false;
  damageVignette.style.opacity = "0";
  updateHud();
  showScreen("game");
  showMessage("폐교 안으로 들어왔다.", 1500);
}

function triggerBlackout() {
  showMessage("불이 꺼졌다.", 1700);
  scene.fog.near = 5;
  scene.fog.far = 24;

  setTimeout(() => {
    state.ghostActive = true;
    ghost.group.visible = true;
    state.objective = 5;
    updateHud();
    showMessage("복도 끝에서 무언가가 움직인다.", 2200);
  }, 1600);
}

function finishGame() {
  state.playing = false;
  document.getElementById("endingTitle").textContent = "Season 1 Demo Clear";
  document.getElementById("endingText").textContent = "부적이 빛나자 처녀귀신의 움직임이 멈췄다. 하지만 체육관 쪽에서 오래된 문이 열리는 소리가 들린다.";
  showScreen("ending");
}

function failGame() {
  if (state.gameOver) return;
  state.gameOver = true;
  state.playing = false;
  document.getElementById("endingTitle").textContent = "GAME OVER";
  document.getElementById("endingText").textContent = "그녀에게 붙잡혔다. 폐교 안의 불빛은 다시 조용히 꺼졌다.";
  showScreen("ending");
}

function interact() {
  if (!state.playing) return;

  if (state.objective === 6 && state.ghostActive) {
    const dist = player.pos.distanceTo(ghost.group.position);
    if (dist < 2.2) {
      finishGame();
      return;
    }
  }

  const target = findNearInteractable();
  if (!target) return;

  if (target.id === "entrance" && state.objective === 0) completeObjective("학교 안쪽을 조사하자.");
  if (target.id === "wire" && state.objective === 2) completeObjective("전선이 연결되었다.");
  if (target.id === "breaker" && state.objective === 3) {
    state.powerOn = true;
    completeObjective("차단기가 올라갔다.");
    showMessage("복도 조명이 켜졌다.", 1200);
  }
  if (target.id === "principal" && state.objective === 4) {
    completeObjective("학교 전체 전원이 켜졌다.");
    setTimeout(triggerBlackout, 1300);
  }
}

function findNearInteractable() {
  let found = null;
  for (const obj of interactables) {
    const dist = player.pos.distanceTo(obj.pos);
    const active =
      (obj.id === "entrance" && state.objective === 0) ||
      (obj.id === "wire" && state.objective === 2) ||
      (obj.id === "breaker" && state.objective === 3) ||
      (obj.id === "principal" && state.objective === 4);
    if (active && dist < obj.radius) found = obj;
  }
  return found;
}

function collectItems() {
  for (const item of items) {
    if (item.taken || !item.mesh.visible) continue;
    const dist = player.pos.distanceTo(item.mesh.position);

    if (dist < 1.25 && item.type === "fuse" && state.objective === 1) {
      item.taken = true;
      item.mesh.visible = false;
      state.fuses++;
      showMessage(`퓨즈를 찾았다. ${state.fuses}/5`, 900);
      if (state.fuses >= 5) completeObjective("퓨즈를 모두 찾았다.");
    }

    if (dist < 1.25 && item.type === "talisman" && state.objective === 5) {
      item.taken = true;
      item.mesh.visible = false;
      state.talismans++;
      showMessage(`부적을 찾았다. ${state.talismans}/5`, 900);
      if (state.talismans >= 5) completeObjective("처녀귀신에게 부적을 붙이자.");
    }
  }
}

function updatePlayer(dt) {
  let x = 0;
  let z = 0;
  if (keys.has("w") || keys.has("arrowup")) z -= 1;
  if (keys.has("s") || keys.has("arrowdown")) z += 1;
  if (keys.has("a") || keys.has("arrowleft")) x -= 1;
  if (keys.has("d") || keys.has("arrowright")) x += 1;

  x += touchMove.x;
  z += touchMove.y;

  const moving = Math.abs(x) + Math.abs(z) > 0.05;
  const wantsRun = keys.has("shift") || state.runTouch;
  const canRun = wantsRun && state.stamina > 3 && moving;
  const speed = canRun ? player.runSpeed : player.walkSpeed;

  if (moving) {
    const len = Math.hypot(x, z);
    x /= len;
    z /= len;

    const forward = new THREE.Vector3(Math.sin(state.yaw), 0, Math.cos(state.yaw) * -1);
    const right = new THREE.Vector3(Math.cos(state.yaw), 0, Math.sin(state.yaw));
    const move = new THREE.Vector3()
      .addScaledVector(right, x)
      .addScaledVector(forward, -z)
      .normalize()
      .multiplyScalar(speed * dt);

    tryMove(move);

    if (canRun) state.stamina = Math.max(0, state.stamina - 24 * dt);
    else state.stamina = Math.min(100, state.stamina + 8 * dt);
  } else {
    state.stamina = Math.min(100, state.stamina + 18 * dt);
  }

  camera.position.copy(player.pos);
  camera.rotation.order = "YXZ";
  camera.rotation.y = state.yaw;
  camera.rotation.x = state.pitch;

  updateHud();
  collectItems();
}

function tryMove(move) {
  const next = player.pos.clone().add(move);
  const feet = new THREE.Vector3(next.x, 1, next.z);
  const sphere = new THREE.Sphere(feet, player.radius);

  for (const box of colliders) {
    if (box.intersectsSphere(sphere)) return;
  }

  player.pos.copy(next);
}

function updateGhost(dt) {
  if (!state.ghostActive || state.gameOver) return;

  const g = ghost.group.position;
  const target = new THREE.Vector3(player.pos.x, 0, player.pos.z);
  const dir = target.clone().sub(g);
  const dist = dir.length();

  if (dist > 0.01) {
    dir.normalize();
    const next = g.clone().addScaledVector(dir, ghost.speed * dt);
    const sphere = new THREE.Sphere(new THREE.Vector3(next.x, 1, next.z), 0.35);
    let blocked = false;
    for (const box of colliders) {
      if (box.intersectsSphere(sphere)) {
        blocked = true;
        break;
      }
    }
    if (!blocked) g.copy(next);
    else {
      // simple recovery movement when stuck
      g.x += Math.sin(state.time * 2) * dt * 0.8;
      g.z += Math.cos(state.time * 2) * dt * 0.8;
    }
  }

  ghost.group.lookAt(player.pos.x, 1.2, player.pos.z);
  ghost.group.position.y = Math.sin(state.time * 4) * 0.08;

  const danger = Math.max(0, 1 - dist / 8);
  damageVignette.style.opacity = String(danger * 0.8);

  if (dist < 0.9) failGame();
}

function updateItems(dt) {
  for (const item of items) {
    if (item.taken) continue;
    item.mesh.rotation.y += dt * 1.3;
    item.mesh.position.y += Math.sin(state.time * 3 + item.mesh.position.x) * 0.0008;
  }
}

function updateInteractHint() {
  state.nearTarget = findNearInteractable();
  const canSeal = state.objective === 6 && state.ghostActive && player.pos.distanceTo(ghost.group.position) < 2.2;
  interactHint.classList.toggle("show", Boolean(state.nearTarget) || canSeal);
}

function setupInput() {
  window.addEventListener("keydown", e => {
    keys.add(e.key.toLowerCase());
    if (e.key.toLowerCase() === "e") interact();
  });
  window.addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));

  renderer.domElement.addEventListener("click", () => {
    if (state.playing && document.pointerLockElement !== renderer.domElement) {
      renderer.domElement.requestPointerLock?.();
    }
  });

  window.addEventListener("mousemove", e => {
    if (document.pointerLockElement === renderer.domElement && state.playing) {
      rotateView(e.movementX, e.movementY);
    }
  });

  setupJoystick();
  setupLookPad();

  actionBtn.addEventListener("pointerdown", e => {
    e.preventDefault();
    interact();
  });

  runBtn.addEventListener("pointerdown", e => {
    e.preventDefault();
    state.runTouch = true;
  });
  runBtn.addEventListener("pointerup", () => state.runTouch = false);
  runBtn.addEventListener("pointercancel", () => state.runTouch = false);
  runBtn.addEventListener("pointerleave", () => state.runTouch = false);
}

function rotateView(dx, dy) {
  state.yaw -= dx * 0.0032;
  state.pitch -= dy * 0.0028;
  state.pitch = Math.max(-1.15, Math.min(1.15, state.pitch));
}

function setupJoystick() {
  function setStick(clientX, clientY) {
    const rect = joystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const max = rect.width * 0.34;
    const len = Math.hypot(dx, dy);
    if (len > max) {
      dx = dx / len * max;
      dy = dy / len * max;
    }
    touchMove.x = dx / max;
    touchMove.y = dy / max;
    joystickKnob.style.left = `${41 + dx}px`;
    joystickKnob.style.top = `${41 + dy}px`;
  }

  function resetStick() {
    touchMove.x = 0;
    touchMove.y = 0;
    joystickKnob.style.left = "41px";
    joystickKnob.style.top = "41px";
  }

  joystick.addEventListener("pointerdown", e => {
    joystick.setPointerCapture(e.pointerId);
    setStick(e.clientX, e.clientY);
  });
  joystick.addEventListener("pointermove", e => setStick(e.clientX, e.clientY));
  joystick.addEventListener("pointerup", resetStick);
  joystick.addEventListener("pointercancel", resetStick);
}

function setupLookPad() {
  lookPad.addEventListener("pointerdown", e => {
    look.active = true;
    look.lastX = e.clientX;
    look.lastY = e.clientY;
    lookPad.setPointerCapture(e.pointerId);
  });

  lookPad.addEventListener("pointermove", e => {
    if (!look.active) return;
    const dx = e.clientX - look.lastX;
    const dy = e.clientY - look.lastY;
    look.lastX = e.clientX;
    look.lastY = e.clientY;
    rotateView(dx, dy);
  });

  lookPad.addEventListener("pointerup", () => look.active = false);
  lookPad.addEventListener("pointercancel", () => look.active = false);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.035);
  state.time += dt;

  if (state.playing) {
    updatePlayer(dt);
    updateGhost(dt);
    updateItems(dt);
    updateInteractHint();
  }

  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

startBtn.addEventListener("click", resetWorld);
howBtn.addEventListener("click", () => showScreen("how"));
backBtn.addEventListener("click", () => showScreen("menu"));
restartBtn.addEventListener("click", resetWorld);

if (window.THREE) init();
else loading.textContent = "Three.js를 불러오지 못했습니다. 인터넷 연결을 확인하세요.";
