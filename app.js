
(() => {
  const KEY = "nfl-week2-picks-v2";
  const cells = [...document.querySelectorAll("td.pick")];
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (_) {}
  cells.forEach((cell, i) => {
    if (saved[i]) cell.textContent = saved[i];
    const persist = () => {
      const next = {};
      cells.forEach((c, idx) => { const t = c.textContent.trim(); if (t) next[idx] = t; });
      localStorage.setItem(KEY, JSON.stringify(next));
    };
    cell.addEventListener("input", persist);
    cell.addEventListener("blur", persist);
  });
})();
