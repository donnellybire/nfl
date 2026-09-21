(() => {
  const KEY = "nfl-week3-picks-v2";
  const PICK_COLS = ["bd", "ms", "gill", "opening", "supercontest", "splash", "nats", "live"];
  const EDITABLE_PICKS = ["gill", "opening", "supercontest", "splash", "nats", "live"];

  function rowCells(tr) {
    return {
      bd: tr.querySelector('td.pick[data-col="bd"]'),
      ms: tr.querySelector('td.pick[data-col="ms"]'),
      gill: tr.querySelector('td.pick[data-col="gill"]'),
      opening: tr.querySelector('td.pick[data-col="opening"]'),
      supercontest: tr.querySelector('td.pick[data-col="supercontest"]'),
      splash: tr.querySelector('td.pick[data-col="splash"]'),
      nats: tr.querySelector('td.pick[data-col="nats"]'),
      live: tr.querySelector('td.pick[data-col="live"]'),
      notes: tr.querySelector('td.notes[data-col="notes"]'),
      away: tr.querySelector("td.away"),
      home: tr.querySelector("td.home"),
    };
  }

  function revealCell(cell) {
    const v = (cell.dataset.value || "").trim();
    cell.textContent = v || "";
    cell.classList.toggle("locked", !v);
    cell.title = v ? "" : "Hidden until this pick is in";
  }

  function revealPair(bd, ms) {
    revealCell(bd);
    revealCell(ms);
  }

  // Normalize pick text to a home-team spread (home favored = negative).
  // Accepts bare home spreads (+6, -7, 6, PK) and legacy "Team ±N".
  function homeSpread(raw, awayName, homeName) {
    const s = (raw || "").trim().replace(/\*+$/, "").trim();
    if (!s) return null;

    // Already a home-relative number / pick'em
    const bare = s.match(/^(PK|[+-]?\d+(?:\.\d+)?)$/i);
    if (bare) {
      return bare[1].toUpperCase() === "PK" ? 0 : parseFloat(bare[1]);
    }

    const m = s.match(/^(.+?)\s+(PK|[+-]?\d+(?:\.\d+)?)$/i);
    if (!m) return null;
    const team = m[1].trim().toLowerCase();
    let pts = m[2].toUpperCase() === "PK" ? 0 : parseFloat(m[2]);
    if (Number.isNaN(pts)) return null;
    const away = (awayName || "").trim().toLowerCase();
    const home = (homeName || "").trim().toLowerCase();
    const teamMatches = (name) =>
      name && (team === name || name.endsWith(team) || team.endsWith(name));
    if (teamMatches(home)) return pts;
    if (teamMatches(away)) return -pts;
    // Fallback: if team string appears in home cell text
    if (home.includes(team) || team.includes(home.split(" ").pop())) return pts;
    if (away.includes(team) || team.includes(away.split(" ").pop())) return -pts;
    return null;
  }

  function updateScore() {
    let bdWins = 0, msWins = 0, ties = 0;
    let bdErr = 0, msErr = 0;
    let scored = 0;

    document.querySelectorAll("tbody tr").forEach((tr) => {
      const c = rowCells(tr);
      if (!c.bd || !c.ms || !c.opening) return;
      c.bd.classList.remove("closer");
      c.ms.classList.remove("closer");

      const away = c.away ? c.away.textContent : "";
      const home = c.home ? c.home.textContent : "";
      const open = homeSpread(c.opening.dataset.value, away, home);
      const bd = homeSpread(c.bd.dataset.value, away, home);
      const ms = homeSpread(c.ms.dataset.value, away, home);
      if (open == null || bd == null || ms == null) return;

      scored += 1;
      const eBd = Math.abs(bd - open);
      const eMs = Math.abs(ms - open);
      bdErr += eBd;
      msErr += eMs;
      if (eBd < eMs) {
        bdWins += 1;
        c.bd.classList.add("closer");
      } else if (eMs < eBd) {
        msWins += 1;
        c.ms.classList.add("closer");
      } else {
        ties += 1;
      }
    });

    const bdCard = document.getElementById("score-bd");
    const msCard = document.getElementById("score-ms");
    const tiesEl = document.querySelector(".score-ties");
    const leaderEl = document.querySelector(".score-leader");
    if (!bdCard || !msCard) return;

    bdCard.querySelector(".score-wins").textContent = bdWins + " win" + (bdWins === 1 ? "" : "s");
    msCard.querySelector(".score-wins").textContent = msWins + " win" + (msWins === 1 ? "" : "s");
    bdCard.querySelector(".score-err").textContent = "Total error " + bdErr;
    msCard.querySelector(".score-err").textContent = "Total error " + msErr;

    bdCard.classList.toggle("lead", scored > 0 && bdWins > msWins);
    msCard.classList.toggle("lead", scored > 0 && msWins > bdWins);
    if (scored > 0 && bdWins === msWins) {
      const bdLeads = bdErr < msErr;
      const msLeads = msErr < bdErr;
      bdCard.classList.toggle("lead", bdLeads);
      msCard.classList.toggle("lead", msLeads);
    }

    if (tiesEl) {
      tiesEl.textContent = scored === 0 ? "0 scored" : ties + " tie" + (ties === 1 ? "" : "s");
    }
    if (leaderEl) {
      if (scored === 0) leaderEl.textContent = "Fill Opening + BD + MS";
      else if (bdWins > msWins) leaderEl.textContent = "BD leads";
      else if (msWins > bdWins) leaderEl.textContent = "MS leads";
      else if (bdErr < msErr) leaderEl.textContent = "BD leads (error)";
      else if (msErr < bdErr) leaderEl.textContent = "MS leads (error)";
      else leaderEl.textContent = "Tied";
    }
  }

  function refreshAll() {
    document.querySelectorAll("tbody tr").forEach((tr) => {
      const c = rowCells(tr);
      if (c.bd && c.ms) revealPair(c.bd, c.ms);
    });
    updateScore();
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
        cell.contentEditable = "false";
      }
    });

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
