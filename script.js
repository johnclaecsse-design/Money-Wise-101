// MoneyWise 101 — single-page site. Every block checks that its elements
// exist first, since not every section is guaranteed to be on the page.

document.addEventListener("DOMContentLoaded", () => {
  setupTermTooltips();
  setupChartMarkers();
  setupCompoundCalculator();
  setupPromoBar();
  setupSliders();
  setupPopup();
  setupScrollReveal();
});

// Hover-to-define terms: works with :hover on desktop for free (CSS),
// this adds tap-to-toggle for touch devices, and closes on outside tap.
function setupTermTooltips() {
  const terms = document.querySelectorAll(".term");
  if (!terms.length) return;

  terms.forEach((term) => {
    term.addEventListener("click", (e) => {
      const wasActive = term.classList.contains("active");
      terms.forEach((t) => t.classList.remove("active"));
      if (!wasActive) term.classList.add("active");
      e.stopPropagation();
    });
  });

  document.addEventListener("click", () => {
    terms.forEach((t) => t.classList.remove("active"));
  });
}

// "Why prices move" interactive chart: clicking a marker toggles its
// explanation panel. Only one panel open at a time per chart.
function setupChartMarkers() {
  const charts = document.querySelectorAll("[data-chart]");
  charts.forEach((chart) => {
    const markers = chart.querySelectorAll(".chart-marker");
    markers.forEach((marker) => {
      marker.addEventListener("click", () => {
        const panelId = marker.getAttribute("data-panel");
        const panel = document.getElementById(panelId);
        const isOpen = panel.classList.contains("visible");

        chart.querySelectorAll(".marker-panel").forEach((p) => p.classList.remove("visible"));
        chart.querySelectorAll(".chart-marker").forEach((m) => m.classList.remove("active"));

        if (!isOpen) {
          panel.classList.add("visible");
          marker.classList.add("active");
        }
      });
    });
  });
}

// Compound interest calculator: recalculates and redraws on every slider
// move, no reload. Principal fixed at 1,000, rate fixed at 5% annual.
function setupCompoundCalculator() {
  const slider = document.getElementById("calc-years");
  if (!slider) return;

  const yearsLabel = document.getElementById("calc-years-label");
  const resultGrown = document.getElementById("calc-result-grown");
  const svg = document.getElementById("calc-chart");
  const example = document.getElementById("calc-example");

  const PRINCIPAL = 1000;
  const RATE = 0.05;

  function valueAt(years) {
    return PRINCIPAL * Math.pow(1 + RATE, years);
  }

  function render() {
    const years = Number(slider.value);
    yearsLabel.textContent = years;
    const grown = Math.round(valueAt(years));
    resultGrown.textContent = grown.toLocaleString();
    if (example) {
      const yearWord = years === 1 ? "year" : "years";
      example.textContent =
        `Example: if you invest 1,000 today and it grows 5% a year, after ${years} ${yearWord} ` +
        `you would have about ${grown.toLocaleString()}, without adding any more money. ` +
        `That's ${(grown - PRINCIPAL).toLocaleString()} you never had to pay in.`;
    }
    drawChart(years);
  }

  function drawChart(years) {
    const width = 640;
    const height = 220;
    const padding = 28;

    const points = [];
    const steps = Math.max(years, 1);
    for (let y = 0; y <= steps; y++) {
      points.push([y, valueAt(y)]);
    }

    const maxVal = valueAt(steps);
    const minVal = PRINCIPAL;

    const xFor = (y) => padding + (y / steps) * (width - padding * 2);
    const yFor = (v) =>
      height - padding - ((v - minVal) / (maxVal - minVal || 1)) * (height - padding * 2);

    const path = points
      .map(([y, v], i) => `${i === 0 ? "M" : "L"} ${xFor(y).toFixed(1)} ${yFor(v).toFixed(1)}`)
      .join(" ");

    const lastX = xFor(steps);
    const lastY = yFor(maxVal);

    svg.innerHTML = `
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}"
            stroke="#e4ddcd" stroke-width="1" />
      <path d="${path}" fill="none" stroke="#f4a261" stroke-width="3" stroke-linecap="round" />
      <circle cx="${lastX}" cy="${lastY}" r="5" fill="#0f6e56" />
    `;
  }

  slider.addEventListener("input", render);
  render();
}

// Message bar at the top: shows one short message at a time and rotates
// every 4 seconds.
function setupPromoBar() {
  const msgs = document.querySelectorAll(".promo-msg");
  if (msgs.length < 2) return;
  let current = 0;
  setInterval(() => {
    msgs[current].classList.remove("is-active");
    current = (current + 1) % msgs.length;
    msgs[current].classList.add("is-active");
  }, 4000);
}

// Card sliders: the arrow buttons scroll the row by one card, and are
// disabled at the start/end. Swiping works on its own on phones.
function setupSliders() {
  document.querySelectorAll("[data-slider]").forEach((slider) => {
    const track = slider.querySelector(".slider-track");
    const arrows = slider.querySelectorAll(".slider-arrow");
    if (!track) return;

    function updateArrows() {
      const maxScroll = track.scrollWidth - track.clientWidth - 2;
      arrows.forEach((arrow) => {
        const dir = Number(arrow.dataset.dir);
        arrow.disabled = dir < 0 ? track.scrollLeft <= 2 : track.scrollLeft >= maxScroll;
      });
    }

    arrows.forEach((arrow) => {
      arrow.addEventListener("click", () => {
        const card = track.querySelector(".slide-card");
        const step = card ? card.offsetWidth + 16 : 250;
        track.scrollBy({ left: step * Number(arrow.dataset.dir), behavior: "smooth" });
      });
    });

    track.addEventListener("scroll", updateArrows);
    window.addEventListener("resize", updateArrows);
    updateArrows();
  });
}

// Pop-up: clicking a slider card opens a box with its full explanation.
// Closes with the x, a click outside the box, or the Escape key.
function setupPopup() {
  const popup = document.getElementById("popup");
  if (!popup) return;
  const title = document.getElementById("popup-title");
  const body = document.getElementById("popup-body");
  const link = document.getElementById("popup-link");
  const looks = document.getElementById("popup-looks");
  let lastCard = null;

  function label(text) {
    const strong = document.createElement("strong");
    strong.textContent = text;
    return strong;
  }

  function open(card) {
    lastCard = card;
    title.textContent = card.dataset.popupTitle;
    if (card.dataset.popupLooks) {
      looks.hidden = false;
      looks.replaceChildren(label("What it looks like: "), card.dataset.popupLooks);
      body.replaceChildren(label("Why it's dangerous: "), card.dataset.popupBody);
    } else {
      looks.hidden = true;
      body.textContent = card.dataset.popupBody;
    }
    if (card.dataset.popupLink) {
      link.href = card.dataset.popupLink;
      link.hidden = false;
    } else {
      link.hidden = true;
    }
    popup.hidden = false;
    popup.querySelector(".popup-close").focus({ preventScroll: true });
  }

  function close() {
    popup.hidden = true;
    if (lastCard) lastCard.focus({ preventScroll: true });
  }

  document.querySelectorAll(".slide-card").forEach((card) => {
    card.addEventListener("click", () => open(card));
  });
  popup.querySelectorAll("[data-popup-close]").forEach((el) => el.addEventListener("click", close));
  link.addEventListener("click", () => { popup.hidden = true; });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !popup.hidden) close();
  });
}

// Scroll-in: headings, paragraphs and cards slide up into view as you
// scroll down to them.
function setupScrollReveal() {
  if (!("IntersectionObserver" in window)) return;
  const items = document.querySelectorAll(
    ".scroll-page .eyebrow, .scroll-page .page-title, .scroll-page .page-lede, .scroll-page h3, .scroll-page .slider, .scroll-page .card, .scroll-page .callout, .scroll-page .glossary-list"
  );
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  items.forEach((item) => {
    item.classList.add("reveal");
    observer.observe(item);
  });
}
