
(() => {
  const KEY = "nfl-week2-picks-v3";

  function rowCells(tr) {
    return {
      bd: tr.querySelector('td.pick[data-col="bd"]'),
      ms: tr.querySelector('td.pick[data-col="ms"]'),
      gill: tr.querySelector('td.pick[data-col="gill"]'),
      open: tr.querySelector('td.pick[data-col="open"]'),
      live: tr.querySelector('td.pick[data-col="live"]'),
    };
  }

  function revealPair(bd, ms) {
    const bv = (bd.dataset.value || "").trim();
    const mv = (ms.dataset.value || "").trim();
    const both = bv && mv;
    bd.textContent = both ? bv : "";
    ms.textContent = both ? mv : "";
    bd.classList.toggle("locked", !both);
    ms.classList.toggle("locked", !both);
    bd.title = both ? "" : "Hidden until BD and MS are both in";
    ms.title = both ? "" : "Hidden until BD and MS are both in";
  }

  function refreshAll() {
    document.querySelectorAll("tbody tr").forEach((tr) => {
      const c = rowCells(tr);
      if (c.bd && c.ms) revealPair(c.bd, c.ms);
    });
  }

  // Load any local overrides (editor device)
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (_) {}

  document.querySelectorAll("tbody tr").forEach((tr, rowIdx) => {
    const c = rowCells(tr);
    ["bd", "ms", "gill", "open", "live"].forEach((col) => {
      const cell = c[col];
      if (!cell) return;
      const k = rowIdx + ":" + col;
      if (saved[k] != null) cell.dataset.value = saved[k];
      if (col === "gill" || col === "open" || col === "live") {
        cell.contentEditable = "true";
        if (cell.dataset.value) cell.textContent = cell.dataset.value;
        const persist = () => {
          cell.dataset.value = cell.textContent.trim();
          const next = {};
          document.querySelectorAll("tbody tr").forEach((r, i) => {
            const rc = rowCells(r);
            ["bd", "ms", "gill", "open", "live"].forEach((cc) => {
              if (!rc[cc]) return;
              const v = (rc[cc].dataset.value || rc[cc].textContent || "").trim();
              if (v) next[i + ":" + cc] = v;
            });
          });
          localStorage.setItem(KEY, JSON.stringify(next));
          refreshAll();
        };
        cell.addEventListener("input", () => {
          cell.dataset.value = cell.textContent.trim();
          persist();
        });
        cell.addEventListener("blur", persist);
      } else {
        // BD/MS: not casually editable on the public board; values come from data-value
        cell.contentEditable = "false";
      }
    });
  });

  refreshAll();
})();
