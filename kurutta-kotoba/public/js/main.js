document.addEventListener('DOMContentLoaded', () => {
  // Configuration for game modes & asset files
  const LANG_CONFIG = {
    0: { // Kanji Mode
      dicName: 'resources/letters_kanji',
      checkDicName: 'resources/dictionary_jap.txt'
    },
    1: { // English Mode
      dicName: 'resources/letters_eng',
      checkDicName: 'resources/dictionary_eng.txt'
    },
    2: { // Hiragana Mode
      dicName: 'resources/letters_hira',
      checkDicName: 'resources/dictionary_jap.txt'
    }
  };

  let currentLang = 0; // Default mode: Kanji

  // DOM Element References
  const btnSubmit = document.getElementById('btn-submit');
  const btnReset = document.getElementById('btn-reset');
  const langKanji = document.getElementById('lang-kanji');
  const langHira = document.getElementById('lang-hira');
  const langEng = document.getElementById('lang-eng');
  const btnHelpUputa = document.getElementById('btn-help-uputa');
  const btnHelpAbout = document.getElementById('btn-help-about');
  const helpModal = document.getElementById('help-modal');
  const modalClose = document.getElementById('modal-close');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const timerPanel = document.getElementById('timer-panel');
  const boardGrid = document.getElementById('board-grid');

  // Initialize Countdown Timer (3-minute duration)
  const timer = new window.CountdownTimer('timer-display', {
    onPauseToggle: (isPaused) => {
      if (isPaused) {
        boardGrid.classList.add('hidden');
      } else {
        boardGrid.classList.remove('hidden');
      }
    },
    onComplete: () => {
      boardGrid.classList.add('hidden');
      alert('Vrijeme je isteklo!');
    }
  });

  // Launch a new game session with selected language mode
  async function startGame(langCode = 0) {
    currentLang = langCode;
    window.boardManager.currentLanguage = langCode;
    window.dictionaryManager.resetState();
    window.jishoGetter.resetState();
    window.boardManager.resetUI();

    const config = LANG_CONFIG[langCode] || LANG_CONFIG[0];

    // Asynchronously load check dictionary & letter dice assets
    await window.dictionaryManager.setCheckDictionary(config.checkDicName);
    const diceLines = await window.dictionaryManager.loadFile(config.dicName);

    if (diceLines.length > 0) {
      const tiles = window.dictionaryManager.generateBoardTiles(diceLines, 4);
      window.boardManager.renderBoard(tiles);
    } else {
      console.error('Failed to load letter tiles for path:', config.dicName);
    }

    timer.reset();
  }

  // Button Action Binding
  if (btnSubmit) {
    btnSubmit.addEventListener('click', () => {
      window.boardManager.submitWord();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      window.boardManager.clearSelection();
    });
  }

  if (langKanji) langKanji.addEventListener('click', () => startGame(0));
  if (langHira) langHira.addEventListener('click', () => startGame(2));
  if (langEng) langEng.addEventListener('click', () => startGame(1));

  // Help Modals (Replicating Swing JOptionPane behavior)
  if (btnHelpUputa) {
    btnHelpUputa.addEventListener('click', () => {
      showModal(
        "Uputa",
        "1. Pokrenite mjerač vremena stisnuvši razmak. Igra traje tri minute i može se pauzirati klikom na mjerač vremena.\n\n" +
        "2. Odaberite slova ili kanjije klikom (moraju biti zeleni) i složite što više riječi.\n" +
        "Moguće je otkazati izbor ponovnim klikom ili otkazati sve pritiskom Alt+R odnosno odgovarajućeg gumba.\n" +
        "Možete predati i samo jedan kanji, no pokušajte složiti i riječi.\n\n" +
        "3. Prihvaćene riječi se ispisuju iznad mjerača vremena. Pokušajte ih naći što više.\n\n" +
        "4. Odaberete li nešto iz izbornika Jezik, započet ćete novu igru. Također možete stisnuti F5 da osvježite izbor slova/kanjija.\n\n" +
        "5. Ukoliko nešto ne radi kako treba, provjerite internet vezu."
      );
    });
  }

  if (btnHelpAbout) {
    btnHelpAbout.addEventListener('click', () => {
      showModal(
        "Kurutta Kotoba by Memazija",
        "Ideja ove igre je razviti intuiciju o slaganju riječi preko kanjija, proširiti vokabular i pobuditi znatiželju u učenju.\n\n" +
        "Besplatna je za korištenje, ali svakako želimo čuti vašu povratnu informaciju.\n" +
        "Komentare i pitanja šaljite na memazija@gmail.com.\n\n" +
        "Ova igra koristi API rječnika Jisho i nije odgovorna za greške u njegovom sadržaju.\nMade in 2016."
      );
    });
  }

  function showModal(title, bodyText) {
    if (modalTitle) modalTitle.textContent = title;
    if (modalBody) modalBody.textContent = bodyText;
    if (helpModal) helpModal.classList.remove('hidden');
  }

  if (modalClose) {
    modalClose.addEventListener('click', () => {
      if (helpModal) helpModal.classList.add('hidden');
    });
  }

  // Click on timer panel to toggle pause/resume
  if (timerPanel) {
    timerPanel.addEventListener('click', () => {
      timer.togglePause();
    });
  }

  // Keyboard Shortcuts (MnemonicWorkaround.java equivalent)
  document.addEventListener('keydown', (e) => {
    // Toggle Timer & Grid visibility on Spacebar
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      timer.togglePause();
    }

    // F5: Restart game with current mode
    if (e.code === 'F5') {
      e.preventDefault();
      startGame(currentLang);
    }

    // Alt + S: Submit word
    if (e.altKey && (e.code === 'KeyS' || e.key.toLowerCase() === 's')) {
      e.preventDefault();
      window.boardManager.submitWord();
    }

    // Alt + R: Deselect tiles
    if (e.altKey && (e.code === 'KeyR' || e.key.toLowerCase() === 'r')) {
      e.preventDefault();
      window.boardManager.clearSelection();
    }

    // Ctrl + K: Kanji mode
    if (e.ctrlKey && e.code === 'KeyK') {
      e.preventDefault();
      startGame(0);
    }

    // Ctrl + H: Hiragana mode
    if (e.ctrlKey && e.code === 'KeyH') {
      e.preventDefault();
      startGame(2);
    }

    // Ctrl + E: English mode
    if (e.ctrlKey && e.code === 'KeyE') {
      e.preventDefault();
      startGame(1);
    }
  });

  // Launch initial game session in Kanji mode
  startGame(0);
});
