import {
  getState,
  subscribe,
  startGame,
  goToSelect,
  playAgain,
  setGameMode,
  setDisplayStyle,
  setDigitCount,
  nextDigit,
  startRecall,
  setInput,
  submitRecall,
  getTimedDuration,
  type State,
  type GameMode,
  type DisplayStyle,
} from "./store";

const PRESETS = [4, 6, 8, 10, 15];

function renderSelect(s: State): string {
  return `
    <div class="screen" id="screen-select">
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
      </div>

      <div class="action-row">
        <button class="play-again-btn" id="btn-again">play again</button>
        <button class="change-digits-btn" id="btn-select">settings</button>
      </div>
    </div>
  `;
}

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
  if (s.phase === "select") {
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
      ?.addEventListener("click", submitRecall);
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

const app = document.getElementById("app")!;
app.insertAdjacentHTML("beforebegin", '<span class="wordmark">numgame</span>');
subscribe(render);
render(getState());
