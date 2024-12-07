let audio = null;
let taxMode = "common";

function toggleTaxInputs() {
  const taxMode = document.getElementById("taxMode").value;
  const isSeparate = taxMode === "separate";

  document.getElementById("taxes").style.display = isSeparate ? "flex" : "none";
  document.getElementById("taxRateContainer").style.display = isSeparate
    ? "none"
    : "block";
}

function calculateSurebet(
  odd1,
  odd2,
  oddDraw = null,
  budget,
  taxRate = 0,
  taxRate1 = null,
  taxRate2 = null,
  taxRateDraw = null
) {
  const surebetValue = oddDraw
    ? 1 / odd1 + 1 / odd2 + 1 / oddDraw
    : 1 / odd1 + 1 / odd2;

  // Obliczenie stawek na poszczególne kursy
  const stake1 = budget / odd1 / surebetValue;
  const stake2 = budget / odd2 / surebetValue;
  const stakeDraw = oddDraw ? budget / oddDraw / surebetValue : 0;

  // Uwzględnienie podatków indywidualnych
  const tax1 = taxRate1 !== null ? taxRate1 : taxRate;
  const tax2 = taxRate2 !== null ? taxRate2 : taxRate;
  const taxDraw = taxRateDraw !== null ? taxRateDraw : taxRate;

  // Obliczenie wygranych po podatkach
  const win1 = stake1 * odd1 * (1 - tax1 / 100);
  const win2 = stake2 * odd2 * (1 - tax2 / 100);
  const winDraw = oddDraw ? stakeDraw * oddDraw * (1 - taxDraw / 100) : 0;

  // Znalezienie minimalnej wygranej netto
  const netWin = oddDraw ? Math.min(win1, win2, winDraw) : Math.min(win1, win2);

  const netProfit = netWin - budget;
  const profitPercent = (netProfit / budget) * 100;

  return {
    isSurebet: surebetValue < 1,
    profitPercent: profitPercent.toFixed(2),
    netProfit: netProfit.toFixed(2),
    stake1: stake1.toFixed(2),
    stake2: stake2.toFixed(2),
    stakeDraw: oddDraw ? stakeDraw.toFixed(2) : undefined,
  };
}

function validateInputs() {
  let isValid = true;
  const inputs = ["type1", "type2", "budget"]; // Lista wymaganych pól

  inputs.forEach((id) => {
    const inputContainer = document.getElementById(id).parentNode; // Pobierz kontener inputa
    const input = document.getElementById(id);
    const value = parseFloat(input.value);
    let errorMessage = inputContainer.querySelector(".error-message");

    if (!errorMessage) {
      // Jeśli brak komunikatu, stwórz go
      errorMessage = document.createElement("span");
      errorMessage.className = "error-message";
      errorMessage.textContent = "Pole wymagane";
      inputContainer.appendChild(errorMessage);
    }

    if (isNaN(value) || value <= 0) {
      input.classList.add("error");
      errorMessage.style.display = "block"; // Wyświetl komunikat
      isValid = false;
    } else {
      input.classList.remove("error");
      errorMessage.style.display = "none"; // Ukryj komunikat
    }
  });

  // Dodatkowa walidacja dla podatku
  const taxRateInput = document.getElementById("taxRate");
  if (taxRateInput.value === "") {
    taxRateInput.value = "0"; // Ustaw domyślną wartość, jeśli puste
  }

  return isValid;
}

function calculate() {
  if (audio) {
    stop();
  }

  if (!validateInputs()) {
    return;
  }

  const odd1 = parseFloat(document.getElementById("type1").value);
  const odd2 = parseFloat(document.getElementById("type2").value);
  const oddDraw = parseFloat(document.getElementById("typeDraw").value) || null;
  const budget = parseFloat(document.getElementById("budget").value);

  const taxRate1 =
    parseFloat(document.getElementById("taxRate1").value) || null;
  const taxRate2 =
    parseFloat(document.getElementById("taxRate2").value) || null;
  const taxRateDraw =
    parseFloat(document.getElementById("taxRateDraw").value) || null;
  const taxRate = parseFloat(document.getElementById("taxRate").value);

  const result = calculateSurebet(
    odd1,
    odd2,
    oddDraw,
    budget,
    taxRate,
    taxRate1,
    taxRate2,
    taxRateDraw
  );

  // Aktualizacja treści w HTML
  document.getElementById("results").style.display = "flex";
  document.getElementById("surebetStatus").textContent = result.isSurebet
    ? "Surebet możliwy!"
    : "Surebet nie jest możliwy.";

  document.getElementById("profitPercent").textContent =
    result.profitPercent + "%";
  document.getElementById("netProfit").textContent = result.netProfit;
  document.getElementById("stake1").textContent = result.stake1;
  document.getElementById("stake2").textContent = result.stake2;

  if (result.stakeDraw !== undefined) {
    document.getElementById("stakeDraw").textContent = result.stakeDraw;
    document.getElementById("stakeDrawRow").style.display = "block";
  } else {
    document.getElementById("stakeDrawRow").style.display = "none";
  }

  if (result.isSurebet && result.profitPercent > 0) {
    document.getElementById("profitPercent").classList.remove("lose");
    document.getElementById("surebetStatus").classList.remove("lose");
    document.getElementById("profitPercent").classList.add("success");
    document.getElementById("surebetStatus").classList.add("success");
    play();
    document.getElementById("stopButton").style.display = "flex";
  } else {
    document.getElementById("profitPercent").classList.remove("success");
    document.getElementById("surebetStatus").classList.remove("success");
    document.getElementById("profitPercent").classList.add("lose");
    document.getElementById("surebetStatus").classList.add("lose");
    document.getElementById("stopButton").style.display = "none";

    loss();
  }
}

function play() {
  audio = document.getElementById("barka");
  audio.play();
}

function stop() {
  audio.pause();
  audio.currentTime = 0;
  document.getElementById("stopButton").style.display = "none";
  audio = null;
}

function loss() {
  const scaryRandom = Math.random();
  if (scaryRandom <= 0.05) {
    audio = document.getElementById("scary-audio");
    if (audio) {
      audio.play();
    } else {
      console.error(`Element o ID "${audioId}" nie został znaleziony.`);
    }
    setTimeout(() => {
      document.getElementById("scary").style.display = "block";
      document.getElementById("container").style.display = "none";
    }, 200);

    setTimeout(() => {
      document.getElementById("scary").style.display = "none";
      document.getElementById("container").style.display = "flex";
    }, 2000);
  } else {
    const randomNumber = Math.floor(Math.random() * 3);
    const audioId = `loss-${randomNumber}`;
    audio = document.getElementById(audioId);
    if (audio) {
      audio.play();
    } else {
      console.error(`Element o ID "${audioId}" nie został znaleziony.`);
    }
  }
}
