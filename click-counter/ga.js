// ── Google Analytics 4 로드 + 이벤트 헬퍼 ───────────────────
// button_click 이벤트를 계속 쏘면 GA4 기본 리포트(탐색 분석 > 시간, 요일)에서
// 시간대별/요일별 클릭 몰림 패턴을 바로 확인할 수 있음 (별도 파라미터 불필요).

(function () {
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID.startsWith("G-XXXX")) {
    console.warn("[GA] config.js에 GA_MEASUREMENT_ID를 설정해야 실제 수집이 됩니다.");
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
})();

function trackEvent(name, params) {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params || {});
  }
}
