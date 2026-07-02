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
const electricEffect = document.getElementById("electricEffect");
const finishBox = document.getElementById("finishBox");

const canvas = document.getElementById("voltageCanvas");
const ctx = canvas.getContext("2d");

let data = [];
let running = false;

function drawChart() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 5; i++) {
    const y = 220 - i * 38;
    ctx.beginPath();
    ctx.moveTo(50, y);
    ctx.lineTo(850, y);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "13px Arial";
    ctx.fillText(`${i}V`, 16, y + 4);
  }

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText("전압(V)", 55, 28);

  if (data.length < 2) return;

  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 4;
  ctx.shadowColor = "#ffd166";
  ctx.shadowBlur = 16;

  ctx.beginPath();

  data.forEach((point, index) => {
    const x = 50 + (index / 100) * 800;
    const y = 220 - (point / 5) * 190;

    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
  ctx.shadowBlur = 0;
}

function updateDisplay(voltage) {
  const current = voltage * 42;
  const power = voltage * current;
  const percent = Math.min((voltage / 5) * 100, 100);

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

  electricEffect.classList.add("hidden");
  finishBox.classList.add("hidden");
  arduinoStage.classList.remove("shake");

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

  mainMessage.textContent = "발전이 시작됩니다.";
  countStatus.textContent = "카운트다운 중";


  mainMessage.textContent = "발전 중... 전기가 모이고 있습니다!";
  countStatus.textContent = "발전 진행 중";
  electricEffect.classList.remove("hidden");
  arduinoStage.classList.add("shake");

  const duration = 7000;
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const realisticProgress =
      progress < 0.7
        ? progress * progress * 1.25
        : 1 - Math.pow(1 - progress, 3);

    let voltage = Math.min(realisticProgress * 5, 5);

    const noise = progress < 1 ? Math.sin(now / 90) * 0.04 : 0;
    voltage = Math.max(0, Math.min(5, voltage + noise));

    updateDisplay(voltage);

    if (data.length <= 100) {
      data.push(voltage);
    } else {
      data.shift();
      data.push(voltage);
    }

    drawChart();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      updateDisplay(5);
      data.push(5);
      drawChart();

      electricEffect.classList.add("hidden");
      arduinoStage.classList.remove("shake");
      finishBox.classList.remove("hidden");

      mainMessage.textContent = "5.00V 충전 완료!";
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
