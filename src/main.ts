console.log("main.ts loaded");

import {
  getState,
  subscribe,
  startGame,
  goToSelect,
  goToLanding,
  playAgain,
  setGameMode,
  setDisplayStyle,
  setDigitCount,
  nextDigit,
  startRecall,
  setInput,
  submitRecall,
  getTimedDuration,
  initAuth,
  setUser,
  type State,
  type GameMode,
  type DisplayStyle,
} from "./store";
import {
  signInWithGitHub,
  signInWithGoogle,
  signOut,
  ensureUserProfile,
} from "./auth";
import { getLeaderboard, getUserRank } from "./leaderboard";
import { supabase } from "./supabase";

const PRESETS = [4, 6, 8, 10, 15];

// ── Renderers ────────────────────────────────────────────────────────────────

function renderLanding(): string {
  return `
    <div class="screen" id="screen-landing">
      <p class="wordmark-inline">numgame</p>
      <p class="label">sign in to track your elo</p>
      <div class="auth-btns">
        <button class="auth-btn" id="btn-github">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
          Continue with GitHub
        </button>
        <button class="auth-btn" id="btn-google">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <button class="guest-btn" id="btn-guest">play as guest</button>
      </div>
    </div>
  `;
}

function renderSelect(s: State): string {
  return `
    <div class="screen" id="screen-select">
      ${
        s.user
          ? `
        <div class="user-bar">
          ${s.user.avatar_url ? `<img class="avatar" src="${s.user.avatar_url}" alt="avatar"/>` : ""}
          <div class="user-info">
            <span class="username">${s.user.username}</span>
            <span class="elo-badge">${s.user.elo} elo</span>
          </div>
          <button class="icon-btn" id="btn-leaderboard" title="Leaderboard">⊞</button>
          <button class="icon-btn" id="btn-signout" title="Sign out">↩</button>
        </div>
      `
          : `<div class="guest-bar"><span class="label">guest mode</span><button class="text-btn" id="btn-login">sign in</button></div>`
      }

      <p class="label">digits to memorize</p>
      <div class="digit-options">
        ${PRESETS.map(
          (n) => `
          <button class="digit-btn ${s.digitCount === n ? "active" : ""}" data-n="${n}">${n}</button>
        `,
        ).join("")}
        <input
          class="digit-custom"
          id="custom-digit-input"
          type="number"
          min="1"
          max="999"
          placeholder="custom"
          value="${PRESETS.includes(s.digitCount) ? "" : s.digitCount}"
        />
      </div>

      <div class="options-group">
        <p class="label">display</p>
        <div class="toggle-row">
          <button class="toggle-btn ${s.displayStyle === "one-at-a-time" ? "active" : ""}" data-display="one-at-a-time">one at a time</button>
          <button class="toggle-btn ${s.displayStyle === "all-at-once" ? "active" : ""}" data-display="all-at-once">all at once</button>
        </div>
      </div>

      <div class="options-group">
        <p class="label">mode</p>
        <div class="toggle-row">
          <button class="toggle-btn ${s.gameMode === "freetime" ? "active" : ""}" data-mode="freetime">free-time</button>
          <button class="toggle-btn ${s.gameMode === "timed" ? "active" : ""}" data-mode="timed">timed</button>
        </div>
      </div>

      ${
        s.gameMode === "timed"
          ? `
        <p class="timing-hint">
          ${
            s.displayStyle === "one-at-a-time"
              ? `1.5s per digit · ${(1.5 * s.digitCount).toFixed(1)}s total`
              : `${((3000 + s.digitCount * 500) / 1000).toFixed(1)}s to memorize all ${s.digitCount} digits`
          }
        </p>
      `
          : ""
      }

      <button class="start-btn" id="btn-start">start</button>
    </div>
  `;
}

function renderMemorizeOne(s: State): string {
  const isLast = s.currentIndex === s.sequence.length - 1;
  const isTimed = s.gameMode === "timed";
  const duration = getTimedDuration("one-at-a-time", s.digitCount);
  return `
    <div class="screen" id="screen-memorize-one">
      <span class="progress">${s.currentIndex + 1} / ${s.sequence.length}</span>
      <span class="digit-display ${isTimed ? "timed-flash" : ""}"
        ${isTimed ? `style="animation-duration:${duration}ms"` : ""}
      >${s.sequence[s.currentIndex]}</span>
      ${
        isTimed
          ? `<span class="hint">auto-advancing every ${(duration / 1000).toFixed(1)}s</span>`
          : `<button class="next-btn" id="btn-next">${isLast ? "done" : "next →"}</button>
           <span class="hint">or press → / space</span>`
      }
    </div>
  `;
}

function renderMemorizeAll(s: State): string {
  const isTimed = s.gameMode === "timed";
  const duration = getTimedDuration("all-at-once", s.digitCount);
  const chunks = chunkSequence(s.sequence, 5);
  return `
    <div class="screen" id="screen-memorize-all">
      <p class="label">${isTimed ? `memorize · ${(duration / 1000).toFixed(1)}s` : "memorize"}</p>
      <div class="sequence-all">
        ${chunks
          .map(
            (chunk) => `
          <div class="sequence-chunk">${chunk.map((d) => `<span class="seq-digit">${d}</span>`).join("")}</div>
        `,
          )
          .join("")}
      </div>
      ${
        isTimed
          ? `<div class="timer-bar-wrap"><div class="timer-bar" style="animation-duration:${duration}ms"></div></div>`
          : `<button class="next-btn" id="btn-recall">i'm ready →</button>`
      }
    </div>
  `;
}

function chunkSequence(seq: number[], size: number): number[][] {
  const chunks: number[][] = [];
  for (let i = 0; i < seq.length; i += size)
    chunks.push(seq.slice(i, i + size));
  return chunks;
}

function renderRecall(s: State): string {
  return `
    <div class="screen" id="screen-recall">
      <p class="label">type the sequence</p>
      <div class="recall-input-wrap">
        <input
          class="recall-input"
          id="recall-input"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder="${"_".repeat(Math.min(s.sequence.length, 30))}"
          value="${s.input}"
          maxlength="${s.sequence.length}"
        />
        <p class="recall-count">${s.input.length} / ${s.sequence.length}</p>
      </div>
      <button class="submit-btn" id="btn-submit" ${s.input.length === 0 ? "disabled" : ""}>
        submit
      </button>
    </div>
  `;
}

function buildComparison(sequence: number[], input: string): string {
  const correctSpans = sequence
    .map((digit, i) => {
      const inputChar = input[i];
      const cls =
        inputChar === undefined
          ? "char-missing"
          : inputChar === String(digit)
            ? "char-correct"
            : "char-wrong";
      return `<span class="${cls}">${digit}</span>`;
    })
    .join("");

  const inputSpans = sequence
    .map((digit, i) => {
      const inputChar = input[i];
      if (inputChar === undefined) return `<span class="char-missing">_</span>`;
      const cls = inputChar === String(digit) ? "char-correct" : "char-wrong";
      return `<span class="${cls}">${inputChar}</span>`;
    })
    .join("");

  return `
    <div class="comparison">
      <div class="comparison-col">
        <p class="label">correct</p>
        <div class="sequence-display">${correctSpans}</div>
      </div>
      <div class="divider"></div>
      <div class="comparison-col">
        <p class="label">your answer</p>
        <div class="sequence-display">${inputSpans}</div>
      </div>
    </div>
  `;
}

function renderResult(s: State): string {
  return `
    <div class="screen" id="screen-result">
      <p class="result-verdict ${s.isCorrect ? "correct" : "wrong"}">
        ${s.isCorrect ? "correct" : "wrong"}
      </p>

      ${buildComparison(s.sequence, s.input)}

      <div class="streak-row">
        <div class="streak-stat">
          <span class="label">streak</span>
          <span class="streak-num">${s.streak}</span>
        </div>
        <div class="streak-stat">
          <span class="label">best</span>
          <span class="streak-num">${s.bestStreak}</span>
        </div>
        ${
          s.eloChange !== null
            ? `
          <div class="streak-stat">
            <span class="label">elo</span>
            <span class="streak-num elo-change ${s.eloChange >= 0 ? "positive" : "negative"}">
              ${s.eloChange >= 0 ? "+" : ""}${s.eloChange}
            </span>
          </div>
        `
            : ""
        }
      </div>

      <div class="action-row">
        <button class="play-again-btn" id="btn-again">play again</button>
        <button class="change-digits-btn" id="btn-select">settings</button>
      </div>
    </div>
  `;
}

async function renderLeaderboard() {
  const app = document.getElementById("app")!;
  app.innerHTML = `<div class="screen"><p class="label">loading...</p></div>`;

  const s = getState();
  const [board, rank] = await Promise.all([
    getLeaderboard(),
    s.user ? getUserRank(s.user.id) : null,
  ]);

  app.innerHTML = `
    <div class="screen" id="screen-leaderboard">
      <div class="lb-header">
        <button class="icon-btn" id="btn-back">←</button>
        <p class="label">world ranking</p>
        ${rank ? `<span class="label">your rank: #${rank}</span>` : "<span></span>"}
      </div>
      <div class="lb-list">
        ${board
          .map(
            (u: any, i: number) => `
          <div class="lb-row ${s.user?.id === u.id ? "lb-me" : ""}">
            <span class="lb-rank">${i + 1}</span>
            ${u.avatar_url ? `<img class="lb-avatar" src="${u.avatar_url}" alt=""/>` : '<div class="lb-avatar-placeholder"></div>'}
            <span class="lb-name">${u.username}</span>
            <span class="lb-elo">${u.elo}</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
  document
    .getElementById("btn-back")
    ?.addEventListener("click", () => render(getState()));
}

// ── Render & binding ─────────────────────────────────────────────────────────

let currentPhase: State["phase"] | null = null;

function render(s: State) {
  const app = document.getElementById("app")!;

  if (s.phase === "recall" && currentPhase === "recall") {
    const count = document.querySelector(".recall-count");
    const btn = document.getElementById(
      "btn-submit",
    ) as HTMLButtonElement | null;
    if (count) count.textContent = `${s.input.length} / ${s.sequence.length}`;
    if (btn) btn.disabled = s.input.length === 0;
    return;
  }

  currentPhase = s.phase;

  switch (s.phase) {
    case "landing":
      app.innerHTML = renderLanding();
      break;
    case "select":
      app.innerHTML = renderSelect(s);
      break;
    case "memorize-one":
      app.innerHTML = renderMemorizeOne(s);
      break;
    case "memorize-all":
      app.innerHTML = renderMemorizeAll(s);
      break;
    case "recall":
      app.innerHTML = renderRecall(s);
      break;
    case "result":
      app.innerHTML = renderResult(s);
      break;
  }
  bindEvents(s);
}

function bindEvents(s: State) {
  if (s.phase === "landing") {
    document
      .getElementById("btn-github")
      ?.addEventListener("click", signInWithGitHub);
    document
      .getElementById("btn-google")
      ?.addEventListener("click", signInWithGoogle);
    document.getElementById("btn-guest")?.addEventListener("click", () => {
      setUser(null);
      goToSelect();
    });
  }

  if (s.phase === "select") {
    document
      .getElementById("btn-signout")
      ?.addEventListener("click", async () => {
        await signOut();
        setUser(null);
        goToLanding();
      });

    document
      .getElementById("btn-leaderboard")
      ?.addEventListener("click", renderLeaderboard);
    document
      .getElementById("btn-login")
      ?.addEventListener("click", goToLanding);

    document
      .querySelectorAll<HTMLButtonElement>(".digit-btn")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          setDigitCount(Number(btn.dataset.n));
          const customInput = document.getElementById(
            "custom-digit-input",
          ) as HTMLInputElement;
          if (customInput) customInput.value = "";
        });
      });

    const customInput = document.getElementById(
      "custom-digit-input",
    ) as HTMLInputElement;
    customInput?.addEventListener("blur", () => {
      const val = parseInt(customInput.value);
      if (val > 0) {
        setDigitCount(val);
        document
          .querySelectorAll(".digit-btn")
          .forEach((b) => b.classList.remove("active"));
      }
    });

    document
      .querySelectorAll<HTMLButtonElement>("[data-display]")
      .forEach((btn) => {
        btn.addEventListener("click", () =>
          setDisplayStyle(btn.dataset.display as DisplayStyle),
        );
      });

    document
      .querySelectorAll<HTMLButtonElement>("[data-mode]")
      .forEach((btn) => {
        btn.addEventListener("click", () =>
          setGameMode(btn.dataset.mode as GameMode),
        );
      });

    document.getElementById("btn-start")?.addEventListener("click", () => {
      const customInput = document.getElementById(
        "custom-digit-input",
      ) as HTMLInputElement;
      const val = parseInt(customInput.value);
      startGame(val > 0 ? val : undefined);
    });
  }

  if (s.phase === "memorize-one" && s.gameMode === "freetime") {
    document.getElementById("btn-next")?.addEventListener("click", nextDigit);
  }

  if (s.phase === "memorize-all" && s.gameMode === "freetime") {
    document
      .getElementById("btn-recall")
      ?.addEventListener("click", startRecall);
  }

  if (s.phase === "recall") {
    const input = document.getElementById("recall-input") as HTMLInputElement;
    input?.focus();
    input?.addEventListener("input", () => {
      const clean = input.value.replace(/\D/g, "").slice(0, s.sequence.length);
      if (input.value !== clean) input.value = clean;
      setInput(clean);
    });
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.value.length > 0) submitRecall();
    });
    document
      .getElementById("btn-submit")
      ?.addEventListener("click", () => submitRecall());
  }

  if (s.phase === "result") {
    document.getElementById("btn-again")?.addEventListener("click", () => {
      currentPhase = null;
      playAgain();
    });
    document.getElementById("btn-select")?.addEventListener("click", () => {
      currentPhase = null;
      goToSelect();
    });
  }
}

document.addEventListener("keydown", (e) => {
  const s = getState();
  if (
    s.phase === "memorize-one" &&
    s.gameMode === "freetime" &&
    (e.key === "ArrowRight" || e.key === " ")
  ) {
    e.preventDefault();
    nextDigit();
  }
});

// ── Auth listener ─────────────────────────────────────────────────────────────

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "SIGNED_IN" && session?.user) {
    await ensureUserProfile(session.user);
    const { data } = await supabase
      .from("users")
      .select("id, username, avatar_url, elo")
      .eq("id", session.user.id)
      .single();
    if (data) setUser(data);
  } else if (event === "SIGNED_OUT") {
    setUser(null);
  }
});

// ── Boot ──────────────────────────────────────────────────────────────────────
let authReady = false

supabase.auth.onAuthStateChange(async (event, session) => {
  if (!authReady) {
    authReady = true
    await initAuth()
  }
})

subscribe(render)
render(getState())