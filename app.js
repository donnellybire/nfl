
(() => {
  const KEY = "nfl-week2-picks-v3";

  function rowCells(tr) {
    return {
      bd: tr.querySelector('td.pick[data-col="bd"]'),
      ms: tr.querySelector('td.pick[data-col="ms"]'),
      gill: tr.querySelector('td.pick[data-col="gill"]'),
      open: tr.querySelector('td.pick[data-col="open"]'),
      super: tr.querySelector('td.pick[data-col="super"]'),
      live: tr.querySelector('td.pick[data-col="live"]'),
    };
  }

  function revealCell(cell) {
    const v = (cell.dataset.value || "").trim();
    cell.textContent = v || "";
    cell.classList.toggle("locked", !v);
    cell.title = v ? "" : "Hidden until this pick is in";
  }

  function revealPair(bd, ms) {
    // Each column reveals independently when it has a value
    revealCell(bd);
    revealCell(ms);
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
    ["bd", "ms", "gill", "open", "super", "live"].forEach((col) => {
      const cell = c[col];
      if (!cell) return;
      const k = rowIdx + ":" + col;
      if (saved[k] != null) cell.dataset.value = saved[k];
      if (col === "gill" || col === "open" || col === "super" || col === "live") {
        cell.contentEditable = "true";
        if (cell.dataset.value) cell.textContent = cell.dataset.value;
        const persist = () => {
          cell.dataset.value = cell.textContent.trim();
          const next = {};
          document.querySelectorAll("tbody tr").forEach((r, i) => {
            const rc = rowCells(r);
            ["bd", "ms", "gill", "open", "super", "live"].forEach((cc) => {
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
