import '../css/main.css';

const STORAGE_KEY = 'ejdl-secret-lizard-progress';
const DEFAULT_STATE = {
  currentLevel: 0,
  solvedLevels: [],
  finished: false,
};

const els = {
  introScreen: document.querySelector('#introScreen'),
  gameScreen: document.querySelector('#gameScreen'),
  prizeScreen: document.querySelector('#prizeScreen'),
  startButton: document.querySelector('#startButton'),
  continueButton: document.querySelector('#continueButton'),
  resetButton: document.querySelector('#resetButton'),
  playAgainButton: document.querySelector('#playAgainButton'),
  currentLevelLabel: document.querySelector('#currentLevelLabel'),
  riddleTitle: document.querySelector('#riddleTitle'),
  riddleText: document.querySelector('#riddleText'),
  progressText: document.querySelector('#progressText'),
  levelTrack: document.querySelector('#levelTrack'),
  answerForm: document.querySelector('#answerForm'),
  answerInput: document.querySelector('#answerInput'),
  answerDisplay: document.querySelector('#answerDisplay'),
  feedback: document.querySelector('#feedback'),
  prizeTitle: document.querySelector('#prizeTitle'),
  prizeText: document.querySelector('#prizeText'),
};

let riddles = [];
let prize = null;
let state = loadState();
let typedAnswer = '';

init();

async function init() {
  try {
    const response = await fetch('./riddles.json');

    if (!response.ok) {
      throw new Error('No se pudo cargar el archivo de acertijos.');
    }

    const data = await response.json();
    riddles = Array.isArray(data.levels) ? data.levels : [];
    prize = data.prize ?? {
      title: 'Has descubierto el secreto de la lagartija',
      text: 'La sabiduría del templo ya es tuya.',
    };

    bindEvents();
    updateContinueButton();
    renderLevelTrack();
  } catch (error) {
    showGame();
    els.riddleTitle.textContent = 'Error al cargar el templo';
    els.riddleText.textContent = error.message;
    els.feedback.textContent = 'Revisa que public/riddles.json exista y sea un JSON válido.';
  }
}

function bindEvents() {
  els.startButton.addEventListener('click', () => {
    state = { ...DEFAULT_STATE };
    saveState();
    startGame();
  });

  els.continueButton.addEventListener('click', () => {
    if (state.finished) {
      showPrize();
      return;
    }

    startGame();
  });

  els.resetButton.addEventListener('click', () => {
    state = { ...DEFAULT_STATE };
    saveState();
    typedAnswer = '';
    renderLevel();
    renderLevelTrack();
    setFeedback('El progreso del templo se ha reiniciado.', 'neutral');
  });

  els.playAgainButton.addEventListener('click', () => {
    state = { ...DEFAULT_STATE };
    saveState();
    showIntro();
    updateContinueButton();
  });

  document.querySelectorAll('[data-key]').forEach((button) => {
    button.addEventListener('click', () => {
      if (typedAnswer.length >= 8) return;
      typedAnswer += button.dataset.key;
      updateAnswerDisplay();
    });
  });

  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;

      if (action === 'clear') typedAnswer = '';
      if (action === 'delete') typedAnswer = typedAnswer.slice(0, -1);

      updateAnswerDisplay();
    });
  });

  els.answerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    checkAnswer();
  });

  window.addEventListener('keydown', (event) => {
    if (els.gameScreen.classList.contains('is-hidden')) return;

    if (/^\d$/.test(event.key) && typedAnswer.length < 8) {
      typedAnswer += event.key;
      updateAnswerDisplay();
    }

    if (event.key === 'Backspace') {
      typedAnswer = typedAnswer.slice(0, -1);
      updateAnswerDisplay();
    }

    if (event.key === 'Enter') {
      checkAnswer();
    }
  });
}

function startGame() {
  if (!riddles.length) {
    showGame();
    els.riddleTitle.textContent = 'Sin acertijos';
    els.riddleText.textContent = 'Añade niveles en public/riddles.json para empezar la aventura.';
    return;
  }

  if (state.currentLevel >= riddles.length) {
    state.currentLevel = riddles.length - 1;
  }

  showGame();
  renderLevel();
  renderLevelTrack();
}

function renderLevel() {
  const level = riddles[state.currentLevel];

  typedAnswer = '';
  updateAnswerDisplay();
  setFeedback('', 'neutral');

  els.currentLevelLabel.textContent = String(state.currentLevel + 1);
  els.riddleTitle.textContent = level.title ?? `Acertijo ${state.currentLevel + 1}`;
  els.riddleText.textContent = level.question;
  els.progressText.textContent = `${state.solvedLevels.length}/${riddles.length}`;
}

function renderLevelTrack() {
  els.levelTrack.innerHTML = '';

  riddles.forEach((_, index) => {
    const step = document.createElement('span');
    step.className = 'level-dot';
    step.textContent = String(index + 1);
    step.title = `Nivel ${index + 1}`;

    if (state.solvedLevels.includes(index)) {
      step.classList.add('is-solved');
    }

    if (index === state.currentLevel && !state.finished) {
      step.classList.add('is-current');
    }

    els.levelTrack.append(step);
  });
}

function checkAnswer() {
  const level = riddles[state.currentLevel];

  if (!typedAnswer) {
    setFeedback('Escribe una respuesta con el teclado numérico.', 'warning');
    return;
  }

  if (Number(typedAnswer) !== Number(level.answer)) {
    setFeedback('La piedra no se mueve... prueba otra respuesta.', 'error');
    typedAnswer = '';
    updateAnswerDisplay();
    return;
  }

  if (!state.solvedLevels.includes(state.currentLevel)) {
    state.solvedLevels.push(state.currentLevel);
  }

  if (state.currentLevel >= riddles.length - 1) {
    state.finished = true;
    saveState();
    showPrize();
    return;
  }

  state.currentLevel += 1;
  saveState();
  renderLevel();
  renderLevelTrack();
  setFeedback('¡Correcto! La cámara siguiente se ha abierto.', 'success');
}

function updateAnswerDisplay() {
  els.answerInput.value = typedAnswer;
  els.answerDisplay.textContent = typedAnswer || '—';
}

function setFeedback(message, type) {
  els.feedback.textContent = message;
  els.feedback.dataset.type = type;
}

function showIntro() {
  els.introScreen.classList.remove('is-hidden');
  els.gameScreen.classList.add('is-hidden');
  els.prizeScreen.classList.add('is-hidden');
}

function showGame() {
  els.introScreen.classList.add('is-hidden');
  els.gameScreen.classList.remove('is-hidden');
  els.prizeScreen.classList.add('is-hidden');
}

function showPrize() {
  els.introScreen.classList.add('is-hidden');
  els.gameScreen.classList.add('is-hidden');
  els.prizeScreen.classList.remove('is-hidden');
  els.prizeTitle.textContent = prize.title;
  els.prizeText.textContent = prize.text;
  updateContinueButton();
}

function updateContinueButton() {
  const hasProgress = state.solvedLevels.length > 0 || state.currentLevel > 0 || state.finished;
  els.continueButton.disabled = !hasProgress;
  els.continueButton.textContent = state.finished ? 'Ver premio' : 'Continuar';
}

function loadState() {
  try {
    const rawState = localStorage.getItem(STORAGE_KEY);
    if (!rawState) return { ...DEFAULT_STATE };

    const parsedState = JSON.parse(rawState);

    return {
      currentLevel: Number(parsedState.currentLevel) || 0,
      solvedLevels: Array.isArray(parsedState.solvedLevels) ? parsedState.solvedLevels : [],
      finished: Boolean(parsedState.finished),
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateContinueButton();
}
