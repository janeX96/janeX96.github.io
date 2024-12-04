function calculateSurebet(odd1, odd2, oddDraw = null, budget, taxRate = 0) {
  const surebetValue = oddDraw
    ? 1 / odd1 + 1 / odd2 + 1 / oddDraw
    : 1 / odd1 + 1 / odd2;

  const stake1 = budget / odd1 / surebetValue;
  const stake2 = budget / odd2 / surebetValue;
  const stakeDraw = oddDraw ? budget / oddDraw / surebetValue : 0;

  const win1 = stake1 * odd1 * (1 - taxRate / 100);
  const win2 = stake2 * odd2 * (1 - taxRate / 100);
  const winDraw = oddDraw ? stakeDraw * oddDraw * (1 - taxRate / 100) : 0;

  const netProfit = oddDraw
    ? Math.min(win1, win2, winDraw) - budget
    : Math.min(win1, win2) - budget;

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

function calculate() {
  const odd1 = parseFloat(document.getElementById("type1").value);
  const odd2 = parseFloat(document.getElementById("type2").value);
  const oddDraw = parseFloat(document.getElementById("typeDraw").value) || null;
  const budget = parseFloat(document.getElementById("budget").value);
  const taxRate = parseFloat(document.getElementById("taxRate").value);

  const result = calculateSurebet(odd1, odd2, oddDraw, budget, taxRate);

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
    stop();
    document.getElementById("stopButton").style.display = "none";
  }
}

function play() {
  const audio = document.getElementById("audioPlayer");
  audio.play();
}

function stop() {
  const audio = document.getElementById("audioPlayer");
  audio.pause();
  audio.currentTime = 0;
  document.getElementById("stopButton").style.display = "none";
}
