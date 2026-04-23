import { getState, subscribe, selectDigitCount, nextDigit, setInput, submitRecall, playAgain, goToSelect, } from './store';
const DIGIT_OPTIONS = [10, 15, 20, 25, 30];
// ── Screen renderers ─────────────────────────────────────────────────────────
function renderSelect() {
    return `
    <div class="screen" id="screen-select">
      <p class="label">digits to memorize</p>
      <div class="digit-options">
        ${DIGIT_OPTIONS.map(n => `
          <button class="digit-btn" data-n="${n}">${n}</button>
        `).join('')}
      </div>
    </div>
  `;
}
function renderMemorize(s) {
    const isLast = s.currentIndex === s.sequence.length - 1;
    return `
    <div class="screen" id="screen-memorize">
      <span class="progress">${s.currentIndex + 1} / ${s.sequence.length}</span>
      <span class="digit-display">${s.sequence[s.currentIndex]}</span>
      <button class="next-btn" id="btn-next">
        ${isLast ? 'done' : 'next →'}
      </button>
      <span class="hint">or press → / space</span>
    </div>
  `;
}
function renderRecall(s) {
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
          placeholder="${'_'.repeat(s.sequence.length)}"
          value="${s.input}"
          maxlength="${s.sequence.length}"
        />
        <p class="recall-count">${s.input.length} / ${s.sequence.length}</p>
      </div>
      <button class="submit-btn" id="btn-submit" ${s.input.length === 0 ? 'disabled' : ''}>
        submit
      </button>
    </div>
  `;
}
function buildComparison(sequence, input) {
    // correct sequence — mark each char
    const correctSpans = sequence.map((digit, i) => {
        const inputChar = input[i];
        const cls = inputChar === undefined
            ? 'char-missing'
            : inputChar === String(digit) ? 'char-correct' : 'char-wrong';
        return `<span class="${cls}">${digit}</span>`;
    }).join('');
    // player's answer — mark each char
    const inputSpans = sequence.map((digit, i) => {
        const inputChar = input[i];
        if (inputChar === undefined)
            return `<span class="char-missing">_</span>`;
        const cls = inputChar === String(digit) ? 'char-correct' : 'char-wrong';
        return `<span class="${cls}">${inputChar}</span>`;
    }).join('');
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
function renderResult(s) {
    const showComparison = !s.isCorrect;
    return `
    <div class="screen" id="screen-result">
      <p class="result-verdict ${s.isCorrect ? 'correct' : 'wrong'}">
        ${s.isCorrect ? 'correct' : 'wrong'}
      </p>

      ${showComparison ? buildComparison(s.sequence, s.input) : `
        <div class="comparison">
          <div class="comparison-col">
            <p class="label">sequence</p>
            <div class="sequence-display">
              ${s.sequence.map(d => `<span class="char-correct">${d}</span>`).join('')}
            </div>
          </div>
        </div>
      `}

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
// ── Mount & event binding ────────────────────────────────────────────────────
function render(s) {
    const app = document.getElementById('app');
    switch (s.phase) {
        case 'select':
            app.innerHTML = renderSelect();
            break;
        case 'memorize':
            app.innerHTML = renderMemorize(s);
            break;
        case 'recall':
            app.innerHTML = renderRecall(s);
            break;
        case 'result':
            app.innerHTML = renderResult(s);
            break;
    }
    bindEvents(s);
}
function bindEvents(s) {
    if (s.phase === 'select') {
        document.querySelectorAll('.digit-btn').forEach(btn => {
            btn.addEventListener('click', () => selectDigitCount(Number(btn.dataset.n)));
        });
    }
    if (s.phase === 'memorize') {
        document.getElementById('btn-next')?.addEventListener('click', nextDigit);
    }
    if (s.phase === 'recall') {
        const input = document.getElementById('recall-input');
        input?.focus();
        input?.addEventListener('input', () => setInput(input.value));
        input?.addEventListener('keydown', e => {
            if (e.key === 'Enter' && s.input.length > 0)
                submitRecall();
        });
        document.getElementById('btn-submit')?.addEventListener('click', submitRecall);
    }
    if (s.phase === 'result') {
        document.getElementById('btn-again')?.addEventListener('click', playAgain);
        document.getElementById('btn-select')?.addEventListener('click', goToSelect);
    }
}
// Global keyboard handler for memorize screen
document.addEventListener('keydown', e => {
    const s = getState();
    if (s.phase === 'memorize' && (e.key === 'ArrowRight' || e.key === ' ')) {
        e.preventDefault();
        nextDigit();
    }
});
// Boot
const app = document.getElementById('app');
app.insertAdjacentHTML('beforebegin', '<span class="wordmark">numgame</span>');
subscribe(render);
render(getState());
