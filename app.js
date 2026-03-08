const baseCostEl = document.getElementById("baseCost");
const leadSourceEl = document.getElementById("leadSource");
const companyTruckEl = document.getElementById("companyTruck");
const acceleratorEl = document.getElementById("accelerator");
const marginSliderEl = document.getElementById("marginSlider");

const marginLabel = document.getElementById("marginLabel");
const warningBox = document.getElementById("warningBox");

const adjustedCostEl = document.getElementById("adjustedCost");
const salePriceEl = document.getElementById("salePrice");
const commissionPercentEl = document.getElementById("commissionPercent");
const commissionDollarsEl = document.getElementById("commissionDollars");
const nextTierBox = document.getElementById("nextTierBox");

// Restore settings
companyTruckEl.value = localStorage.getItem("truck") || "no";
acceleratorEl.value = localStorage.getItem("accel") || "0";

companyTruckEl.addEventListener("change", () =>
  localStorage.setItem("truck", companyTruckEl.value)
);
acceleratorEl.addEventListener("change", () =>
  localStorage.setItem("accel", acceleratorEl.value)
);

function animateNumber(element, target) {
  const start = parseFloat(element.innerText.replace(/[^0-9.-]+/g,"")) || 0;
  const duration = 500;
  const startTime = performance.now();

  function frame(time) {
    const progress = Math.min((time - startTime) / duration, 1);
    const value = start + (target - start) * progress;
    element.innerText = "$" + value.toFixed(2);
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function flashCard(el) {
  el.classList.add("result-pop");
  setTimeout(() => el.classList.remove("result-pop"), 250);
}

function glowTierBox() {
  nextTierBox.classList.add("next-tier-glow");
  setTimeout(() => nextTierBox.classList.remove("next-tier-glow"), 600);
}

function formatCurrency(n) {
  return "$" + n.toFixed(2);
}

function determineCommissionBand(m) {
  if (m >= 0.60) return "60";
  if (m >= 0.43) return "43";
  if (m >= 0.33) return "33";
  return "22";
}

function commissionLookup(band, lead, truck) {
  const m = {
    "22": { company: 0.035, self: 0.055, truckCompany: 0.02, truckSelf: 0.04 },
    "33": { company: 0.08, self: 0.10, truckCompany: 0.065, truckSelf: 0.085 },
    "43": { company: 0.10, self: 0.12, truckCompany: 0.085, truckSelf: 0.105 },
    "60": { company: 0.15, self: 0.17, truckCompany: 0.135, truckSelf: 0.155 }
  };

  if (lead === "company")
    return truck === "yes" ? m[band].truckCompany : m[band].company;

  return truck === "yes" ? m[band].truckSelf : m[band].self;
}

function nextTier(m) {
  if (m < 0.33) return 0.33;
  if (m < 0.43) return 0.43;
  if (m < 0.60) return 0.60;
  return null;
}

let lastMarginBand = null;

function calculate() {
  const base = parseFloat(baseCostEl.value) || 0;
  const lead = leadSourceEl.value;
  const truck = companyTruckEl.value;
  const accel = parseFloat(acceleratorEl.value);
  const margin = parseFloat(marginSliderEl.value) / 100;

  marginLabel.textContent = Math.round(margin * 100) + "%";

  if (!lead || !base) return;

  const marketing = lead === "company" ? 250 : 0;
  const adjusted = base + marketing;
  const sale = adjusted / (1 - margin);

  const profit = sale - adjusted;
  const profitMargin = profit / sale;

  const band = determineCommissionBand(profitMargin);
  const basePct = commissionLookup(band, lead, truck);
  const finalPct = basePct + accel;
  const comm = sale * finalPct;

  animateNumber(adjustedCostEl, adjusted);
  animateNumber(salePriceEl, sale);
  commissionPercentEl.textContent = (finalPct * 100).toFixed(2) + "%";
  animateNumber(commissionDollarsEl, comm);

  flashCard(adjustedCostEl.parentElement);
  flashCard(salePriceEl.parentElement);
  flashCard(commissionDollarsEl.parentElement);

  if (margin * 100 < 40) warningBox.classList.remove("hidden");
  else warningBox.classList.add("hidden");

  const tier = nextTier(margin);

  if (!tier) {
    nextTierBox.innerHTML = `
      <div style="font-size:1.4rem; font-weight:bold; animation: shake 0.4s;">
        🏆 Top Commission Tier Achieved! 🏆
      </div>
    `;

    if (lastMarginBand !== "60") {
      confetti();
      nextTierBox.classList.add("next-tier-glow");
    }

    lastMarginBand = "60";
    return;
  }

  const reqSale = adjusted / (1 - tier);
  const diff = reqSale - sale;

  nextTierBox.innerHTML = `
    Next Commission Tier: ${(tier * 100).toFixed(0)}%<br>
    Increase price by ${formatCurrency(diff)} to reach this tier.
  `;

  glowTierBox();
  lastMarginBand = band;
}

document.querySelectorAll("input, select").forEach(el =>
  el.addEventListener("input", calculate)
);

marginSliderEl.addEventListener("input", calculate);
