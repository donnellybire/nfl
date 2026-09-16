
(() => {
  const KEY = "nfl-week2-picks-v3";
  const PICK_COLS = ["bd", "ms", "gill", "open", "super", "splash", "nats", "live"];
  const EDITABLE_PICKS = ["gill", "open", "super", "splash", "nats", "live"];

  function rowCells(tr) {
    return {
      bd: tr.querySelector('td.pick[data-col="bd"]'),
      ms: tr.querySelector('td.pick[data-col="ms"]'),
      gill: tr.querySelector('td.pick[data-col="gill"]'),
      open: tr.querySelector('td.pick[data-col="open"]'),
      super: tr.querySelector('td.pick[data-col="super"]'),
      splash: tr.querySelector('td.pick[data-col="splash"]'),
      nats: tr.querySelector('td.pick[data-col="nats"]'),
      live: tr.querySelector('td.pick[data-col="live"]'),
      notes: tr.querySelector('td.notes[data-col="notes"]'),
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

  function persistAll() {
    const next = {};
    document.querySelectorAll("tbody tr").forEach((r, i) => {
      const rc = rowCells(r);
      PICK_COLS.forEach((cc) => {
        if (!rc[cc]) return;
        const v = (rc[cc].dataset.value || rc[cc].textContent || "").trim();
        if (v) next[i + ":" + cc] = v;
      });
      if (rc.notes) {
        const v = (rc.notes.dataset.value || rc.notes.textContent || "").trim();
        if (v) next[i + ":notes"] = v;
      }
    });
    localStorage.setItem(KEY, JSON.stringify(next));
    refreshAll();
  }

  // Load any local overrides (editor device)
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (_) {}

  document.querySelectorAll("tbody tr").forEach((tr, rowIdx) => {
    const c = rowCells(tr);
    PICK_COLS.forEach((col) => {
      const cell = c[col];
      if (!cell) return;
      const k = rowIdx + ":" + col;
      if (saved[k] != null) cell.dataset.value = saved[k];
      if (EDITABLE_PICKS.includes(col)) {
        cell.contentEditable = "true";
        if (cell.dataset.value) cell.textContent = cell.dataset.value;
        cell.addEventListener("input", () => {
          cell.dataset.value = cell.textContent.trim();
          persistAll();
        });
        cell.addEventListener("blur", persistAll);
      } else {
        // BD/MS: not casually editable on the public board; values come from data-value
        cell.contentEditable = "false";
      }
    });

    // Notes: plain editable text (not a pick/spread column)
    if (c.notes) {
      const k = rowIdx + ":notes";
      if (saved[k] != null) {
        c.notes.dataset.value = saved[k];
        c.notes.textContent = saved[k];
      }
      c.notes.contentEditable = "true";
      c.notes.addEventListener("input", () => {
        c.notes.dataset.value = c.notes.textContent.trim();
        persistAll();
      });
      c.notes.addEventListener("blur", persistAll);
    }
  });

  refreshAll();
})();
