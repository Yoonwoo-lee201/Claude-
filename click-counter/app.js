// ── 클릭 카운터 메인 로직 ─────────────────────────────────

const totalCountEl = document.getElementById("totalCount");
const goalTextEl = document.getElementById("goalText");
const progressFillEl = document.getElementById("progressFill");
const clickStageEl = document.getElementById("clickStage");
const bigButtonEl = document.getElementById("bigButton");
const statusNoteEl = document.getElementById("statusNote");

const PARTICLE_COLORS = ["#ff8ad1", "#7f5af0", "#5ad1ff", "#ffd93d", "#6bcb77"];

let currentTotal = 0;
let audioCtx = null;

function formatNumber(n) {
  return n.toLocaleString("ko-KR");
}

function renderTotal(total) {
  currentTotal = total;
  totalCountEl.textContent = formatNumber(total);
  totalCountEl.classList.remove("bump");
  void totalCountEl.offsetWidth;
  totalCountEl.classList.add("bump");

  const percent = Math.min(100, (total / DAILY_GOAL) * 100);
  progressFillEl.style.width = `${percent.toFixed(6)}%`;
  goalTextEl.textContent = `목표 ${formatNumber(DAILY_GOAL)} 클릭까지 ${percent.toFixed(2)}% 달성`;
}

async function loadInitialCount() {
  const { data, error } = await supabaseClient
    .from("click_counter")
    .select("total_clicks")
    .eq("id", 1)
    .single();

  if (error) {
    statusNoteEl.textContent = "카운터를 불러오지 못했어요. Supabase 설정을 확인해주세요.";
    console.error("[Supabase] 초기 카운트 조회 실패:", error.message);
    renderTotal(0);
    return;
  }

  renderTotal(data.total_clicks);
}

function playPopSound() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.16);
}

function triggerShake() {
  clickStageEl.classList.remove("stage-shake");
  void clickStageEl.offsetWidth;
  clickStageEl.classList.add("stage-shake");
}

function spawnParticles(originX, originY) {
  const count = 14;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";

    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const distance = 60 + Math.random() * 60;
    const endX = Math.cos(angle) * distance;
    const endY = Math.sin(angle) * distance;

    particle.style.background = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
    particle.style.setProperty("--start-x", `${originX}px`);
    particle.style.setProperty("--start-y", `${originY}px`);
    particle.style.setProperty("--end-x", `${originX + endX}px`);
    particle.style.setProperty("--end-y", `${originY + endY}px`);

    document.body.appendChild(particle);
    particle.addEventListener("animationend", () => particle.remove());
  }
}

async function handleClick(event) {
  const rect = bigButtonEl.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  playPopSound();
  triggerShake();
  spawnParticles(originX, originY);
  renderTotal(currentTotal + 1);

  trackEvent("button_click");

  const { data, error } = await supabaseClient.rpc("increment_click_counter");

  if (error) {
    console.error("[Supabase] 클릭 반영 실패:", error.message);
    statusNoteEl.textContent = "서버 반영에 실패했어요 (연결을 확인해주세요).";
    return;
  }

  statusNoteEl.textContent = "";
  renderTotal(data);
}

bigButtonEl.addEventListener("click", handleClick);

loadInitialCount();
