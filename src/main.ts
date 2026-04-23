import {
  getState,
  subscribe,
  selectDigitCount,
  nextDigit,
  setInput,
  submitRecall,
  playAgain,
  goToSelect,
  type State,
} from "./store";

const DIGIT_OPTIONS = [10, 15, 20, 25, 30];

function renderSelect(): string {
  return `
    <div class="screen" id="screen-select">
      <p class="label">digits to memorize</p>
      <div class="digit-options">
        ${DIGIT_OPTIONS.map(
          (n) => `
          <button class="digit-btn" data-n="${n}">${n}</button>
        `,
        ).join("")}
      </div>
    </div>
  `;
}

function renderMemorize(s: State): string {
  const isLast = s.currentIndex === s.sequence.length - 1;
  return `
    <div class="screen" id="screen-memorize">
      <span class="progress">${s.currentIndex + 1} / ${s.sequence.length}</span>
      <span class="digit-display">${s.sequence[s.currentIndex]}</span>
      <button class="next-btn" id="btn-next">
        ${isLast ? "done" : "next →"}
      </button>
      <span class="hint">or press → / space</span>
    </div>
  `;
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
          placeholder="${"_".repeat(s.sequence.length)}"
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
  const showComparison = !s.isCorrect;
  return `
    <div class="screen" id="screen-result">
      <p class="result-verdict ${s.isCorrect ? "correct" : "wrong"}">
        ${s.isCorrect ? "correct" : "wrong"}
      </p>

      ${
        showComparison
          ? buildComparison(s.sequence, s.input)
          : `
        <div class="comparison">
          <div class="comparison-col">
            <p class="label">sequence</p>
            <div class="sequence-display">
              ${s.sequence.map((d) => `<span class="char-correct">${d}</span>`).join("")}
            </div>
          </div>
        </div>
      `
      }

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
        <button class="change-digits-btn" id="btn-select">change digits</button>
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
      app.innerHTML = renderSelect();
      break;
    case "memorize":
      app.innerHTML = renderMemorize(s);
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
        btn.addEventListener("click", () =>
          selectDigitCount(Number(btn.dataset.n)),
        );
      });
  }

  if (s.phase === "memorize") {
    document.getElementById("btn-next")?.addEventListener("click", nextDigit);
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
  if (s.phase === "memorize" && (e.key === "ArrowRight" || e.key === " ")) {
    e.preventDefault();
    nextDigit();
  }
});

const app = document.getElementById("app")!;
app.insertAdjacentHTML("beforebegin", '<span class="wordmark">numgame</span>');

subscribe(render);
render(getState());
