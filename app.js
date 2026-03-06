const baseCostEl = document.getElementById("baseCost");
const leadSourceEl = document.getElementById("leadSource");
const companyTruckEl = document.getElementById("companyTruck");
const acceleratorEl = document.getElementById("accelerator");
const marginSliderEl = document.getElementById("marginSlider");

const marginLabel = document.getElementById("marginLabel");
const warningBox = document.getElementById("warningBox");

const adjustedCostEl = document.getElementById("adjustedCost");
const salePriceEl = document.getElementById("salePrice");
const profitDollarsEl = document.getElementById("profitDollars");
const commissionPercentEl = document.getElementById("commissionPercent");
const commissionDollarsEl = document.getElementById("commissionDollars");
const nextTierBox = document.getElementById("nextTierBox");

// Restore saved settings
companyTruckEl.value = localStorage.getItem("truck") || "no";
acceleratorEl.value = localStorage.getItem("accel") || "0";

// Save on change
companyTruckEl.addEventListener("change", () =>
  localStorage.setItem("truck", companyTruckEl.value)
);

acceleratorEl.addEventListener("change", () =>
  localStorage.setItem("accel", acceleratorEl.value)
);

function formatCurrency(num) {
  return "$" + num.toFixed(2);
}

function determineCommissionBand(margin) {
  if (margin >= 0.60) return "60";
  if (margin >= 0.43) return "43";
  if (margin >= 0.33) return "33";
  return "22";
}

function commissionLookup(band, lead, truck) {
  const matrix = {
    "22": { company: 0.035, self: 0.055, truckCompany: 0.02, truckSelf: 0.04 },
    "33": { company: 0.08, self: 0.10, truckCompany: 0.065, truckSelf: 0.085 },
    "43": { company: 0.10, self: 0.12, truckCompany: 0.085, truckSelf: 0.105 },
    "60": { company: 0.15, self: 0.17, truckCompany: 0.135, truckSelf: 0.155 }
  };

  if (lead === "company") {
    return truck === "yes" ? matrix[band].truckCompany : matrix[band].company;
  }
  return truck === "yes" ? matrix[band].truckSelf : matrix[band].self;
}

function findNextTier(margin) {
  if (margin < 0.33) return 0.33;
  if (margin < 0.43) return 0.43;
  if (margin < 0.60) return 0.60;
  return null;
}

function calculate() {
  const baseCost = parseFloat(baseCostEl.value) || 0;
  const lead = leadSourceEl.value;
  const truck = companyTruckEl.value;
  const accel = parseFloat(acceleratorEl.value);
  const margin = parseFloat(marginSliderEl.value) / 100;

  marginLabel.textContent = Math.round(margin * 100) + "%";

  if (!lead || !baseCost) return;

  const marketingCost = lead === "company" ? 250 : 0;
  const adjustedCost = baseCost + marketingCost;
  const salePrice = adjustedCost / (1 - margin);
  const profitDollars = salePrice - adjustedCost;
  const profitMargin = profitDollars / salePrice;

  const band = determineCommissionBand(profitMargin);
  const baseCommission = commissionLookup(band, lead, truck);
  const finalPercent = baseCommission + accel;
  const commissionDollars = salePrice * finalPercent;

  adjustedCostEl.textContent = formatCurrency(adjustedCost);
  salePriceEl.textContent = formatCurrency(salePrice);
  profitDollarsEl.textContent = formatCurrency(profitDollars);
  commissionPercentEl.textContent = (finalPercent * 100).toFixed(2) + "%";
  commissionDollarsEl.textContent = formatCurrency(commissionDollars);

  // Warning
  if (margin * 100 < 40) {
    warningBox.classList.remove("hidden");
  } else {
    warningBox.classList.add("hidden");
  }

  // Next tier
  const nextTier = findNextTier(margin);
  if (!nextTier) {
    nextTierBox.textContent = "Top commission tier reached.";
    return;
  }

  const requiredSalePrice = adjustedCost / (1 - nextTier);
  const difference = requiredSalePrice - salePrice;

  nextTierBox.innerHTML = `
    Next Commission Tier: ${(nextTier * 100).toFixed(0)}%<br>
    Increase price by ${formatCurrency(difference)} to reach this tier.
  `;
}

document.querySelectorAll("input, select").forEach(el => {
  el.addEventListener("input", calculate);
});

marginSliderEl.addEventListener("input", calculate);
