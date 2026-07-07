const connectBtn = document.getElementById("connectBtn");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");

const arduinoStage = document.getElementById("arduinoStage");
const connectionStatus = document.getElementById("connectionStatus");
const countStatus = document.getElementById("countStatus");
const mainMessage = document.getElementById("mainMessage");

const voltageValue = document.getElementById("voltageValue");
const currentValue = document.getElementById("currentValue");
const powerValue = document.getElementById("powerValue");
const percentValue = document.getElementById("percentValue");
const gaugeFill = document.getElementById("gaugeFill");
const finishBox = document.getElementById("finishBox");

const canvas = document.getElementById("voltageCanvas");
const ctx = canvas.getContext("2d");

const MAX_VOLTAGE = 2; // 목표 전압
const RISE_DURATION = 30000; // 0V -> 2V까지 걸리는 시간 (천천히 상승)

let data = [];
let running = false;

function drawChart() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 5; i++) {
    const y = 220 - i * 38;
    const label = (i / 5) * MAX_VOLTAGE;

    ctx.beginPath();
    ctx.moveTo(50, y);
    ctx.lineTo(850, y);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "13px Arial";
    ctx.fillText(`${label.toFixed(1)}V`, 16, y + 4);
  }

  if (data.length < 2) return;

  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 4;

  ctx.beginPath();

  data.forEach((point, index) => {
    const x = 50 + (index / 160) * 800;
    const y = 220 - (point / MAX_VOLTAGE) * 190;

    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}

function updateDisplay(voltage) {
  const current = voltage * 42;
  const power = voltage * current;
  const percent = Math.min((voltage / MAX_VOLTAGE) * 100, 100);

  voltageValue.textContent = voltage.toFixed(2);
  currentValue.textContent = `${current.toFixed(1)} mA`;
  powerValue.textContent = `${power.toFixed(1)} mW`;
  percentValue.textContent = `${percent.toFixed(0)}%`;
  gaugeFill.style.width = `${percent}%`;
}

function resetSimulation() {
  running = false;
  data = [];

  voltageValue.textContent = "0.00";
  currentValue.textContent = "0.0 mA";
  powerValue.textContent = "0.0 mW";
  percentValue.textContent = "0%";
  gaugeFill.style.width = "0%";

  countStatus.textContent = "시작 대기";
  mainMessage.textContent = "아두이노가 준비되었습니다.";
  finishBox.classList.add("hidden");

  drawChart();
}

connectBtn.addEventListener("click", () => {
  arduinoStage.classList.remove("hidden");
  startBtn.classList.remove("hidden");
  resetBtn.classList.remove("hidden");

  connectionStatus.textContent = "● Arduino Uno 연결 완료";
  connectionStatus.style.color = "#63e6be";
  countStatus.textContent = "시작 가능";
  mainMessage.textContent = "Arduino Uno가 연결되었습니다.";
});

startBtn.addEventListener("click", async () => {
  if (running) return;
  running = true;

  finishBox.classList.add("hidden");
  startBtn.disabled = true;
  connectBtn.disabled = true;

  mainMessage.textContent = "발전 준비 중";
  countStatus.textContent = "준비 중";

  await wait(5000);

  mainMessage.textContent = "발전 중";
  countStatus.textContent = "발전 진행 중";

  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / RISE_DURATION, 1);

    const smoothProgress = progress * progress * (3 - 2 * progress);
    let voltage = smoothProgress * MAX_VOLTAGE;

    const noise = progress < 1 ? Math.sin(now / 220) * 0.004 : 0;
    voltage = Math.max(0, Math.min(MAX_VOLTAGE, voltage + noise));

    updateDisplay(voltage);

    if (data.length <= 160) {
      data.push(voltage);
    } else {
      data.shift();
      data.push(voltage);
    }

    drawChart();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      updateDisplay(MAX_VOLTAGE);
      data.push(MAX_VOLTAGE);
      drawChart();

      finishBox.classList.remove("hidden");
      mainMessage.textContent = `${MAX_VOLTAGE.toFixed(2)}V 충전 완료!`;
      countStatus.textContent = "완료";

      running = false;
      startBtn.disabled = false;
      connectBtn.disabled = false;
    }
  }

  requestAnimationFrame(animate);
});

resetBtn.addEventListener("click", resetSimulation);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

drawChart();
