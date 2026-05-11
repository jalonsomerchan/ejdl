import '../css/main.css';

const STORAGE_KEY = 'ejdl-secret-lizard-progress';
const TRANSITION_MS = 620;
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
let isTransitioning = false;

init();

async function init() {
  createAmbientParticles();

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
    revealScreen(els.introScreen);
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
    if (isTransitioning) return;

    state = { ...DEFAULT_STATE };
    saveState();
    typedAnswer = '';
    renderLevel();
    renderLevelTrack();
    setFeedback('El progreso del templo se ha reiniciado.', 'neutral');
    playPanelAnimation('is-unlocked');
  });

  els.playAgainButton.addEventListener('click', () => {
    state = { ...DEFAULT_STATE };
    saveState();
    showIntro();
    updateContinueButton();
  });

  document.querySelectorAll('[data-key]').forEach((button) => {
    button.addEventListener('click', () => {
      if (isTransitioning || typedAnswer.length >= 8) return;
      typedAnswer += button.dataset.key;
      updateAnswerDisplay();
      pulseElement(els.answerDisplay, 'is-typing');
    });
  });

  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      if (isTransitioning) return;

      const action = button.dataset.action;

      if (action === 'clear') typedAnswer = '';
      if (action === 'delete') typedAnswer = typedAnswer.slice(0, -1);

      updateAnswerDisplay();
      pulseElement(els.answerDisplay, 'is-typing');
    });
  });

  els.answerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    checkAnswer();
  });

  window.addEventListener('keydown', (event) => {
    if (els.gameScreen.classList.contains('is-hidden') || isTransitioning) return;

    if (/^\d$/.test(event.key) && typedAnswer.length < 8) {
      typedAnswer += event.key;
      updateAnswerDisplay();
      pulseElement(els.answerDisplay, 'is-typing');
    }

    if (event.key === 'Backspace') {
      typedAnswer = typedAnswer.slice(0, -1);
      updateAnswerDisplay();
      pulseElement(els.answerDisplay, 'is-typing');
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
  playPanelAnimation('is-level-entering');
}

function renderLevelTrack() {
  els.levelTrack.innerHTML = '';

  riddles.forEach((_, index) => {
    const step = document.createElement('span');
    step.className = 'level-dot';
    step.textContent = String(index + 1);
    step.title = `Nivel ${index + 1}`;
    step.style.setProperty('--step-delay', `${index * 55}ms`);

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
  if (isTransitioning) return;

  const level = riddles[state.currentLevel];

  if (!typedAnswer) {
    setFeedback('Escribe una respuesta con el teclado numérico.', 'warning');
    pulseElement(els.answerDisplay, 'is-warning');
    return;
  }

  if (Number(typedAnswer) !== Number(level.answer)) {
    setFeedback('La piedra no se mueve... prueba otra respuesta.', 'error');
    typedAnswer = '';
    updateAnswerDisplay();
    playPanelAnimation('is-wrong');
    pulseElement(els.answerDisplay, 'is-error');
    return;
  }

  unlockCurrentLevel();
}

function unlockCurrentLevel() {
  isTransitioning = true;
  setFeedback('¡Correcto! Los jeroglíficos se iluminan...', 'success');
  playPanelAnimation('is-unlocked');
  pulseElement(els.answerDisplay, 'is-success');

  if (!state.solvedLevels.includes(state.currentLevel)) {
    state.solvedLevels.push(state.currentLevel);
  }

  window.setTimeout(() => {
    if (state.currentLevel >= riddles.length - 1) {
      state.finished = true;
      saveState();
      isTransitioning = false;
      showPrize();
      return;
    }

    state.currentLevel += 1;
    saveState();
    renderLevel();
    renderLevelTrack();
    setFeedback('La cámara siguiente se ha abierto.', 'success');
    isTransitioning = false;
  }, TRANSITION_MS);
}

function updateAnswerDisplay() {
  els.answerInput.value = typedAnswer;
  els.answerDisplay.textContent = typedAnswer || '—';
}

function setFeedback(message, type) {
  els.feedback.textContent = message;
  els.feedback.dataset.type = type;

  if (message) {
    pulseElement(els.feedback, 'is-visible-now');
  }
}

function showIntro() {
  transitionScreens(els.introScreen);
}

function showGame() {
  transitionScreens(els.gameScreen);
}

function showPrize() {
  transitionScreens(els.prizeScreen);
  els.prizeTitle.textContent = prize.title;
  els.prizeText.textContent = prize.text;
  updateContinueButton();
  pulseElement(els.prizeScreen, 'is-prize-revealed');
}

function transitionScreens(activeScreen) {
  [els.introScreen, els.gameScreen, els.prizeScreen].forEach((screen) => {
    if (screen === activeScreen) {
      revealScreen(screen);
    } else {
      screen.classList.add('is-hidden');
      screen.classList.remove('is-screen-entering');
    }
  });
}

function revealScreen(screen) {
  screen.classList.remove('is-hidden');
  pulseElement(screen, 'is-screen-entering');
}

function updateContinueButton() {
  const hasProgress = state.solvedLevels.length > 0 || state.currentLevel > 0 || state.finished;
  els.continueButton.disabled = !hasProgress;
  els.continueButton.textContent = state.finished ? 'Ver premio' : 'Continuar';
}

function pulseElement(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function playPanelAnimation(className) {
  pulseElement(els.gameScreen, className);
}

function createAmbientParticles() {
  const layer = document.createElement('div');
  layer.className = 'sand-layer';
  layer.setAttribute('aria-hidden', 'true');

  for (let index = 0; index < 34; index += 1) {
    const grain = document.createElement('span');
    grain.style.setProperty('--x', `${Math.random() * 100}%`);
    grain.style.setProperty('--delay', `${Math.random() * -18}s`);
    grain.style.setProperty('--duration', `${12 + Math.random() * 15}s`);
    grain.style.setProperty('--size', `${2 + Math.random() * 5}px`);
    grain.style.setProperty('--drift', `${-28 + Math.random() * 56}px`);
    layer.append(grain);
  }

  document.body.prepend(layer);
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
