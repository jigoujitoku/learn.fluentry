document.addEventListener('DOMContentLoaded', () => {

  const I18N = {
    en: {
      navHelp: "❓ How to Play",
      navAbout: "ℹ️ About",
      selectionLabel: "Current Selection",
      btnSubmit: "Submit Word",
      btnReset: "Clear",
      timerTitle: "⏱️ Time Remaining",
      timerHint: "Click tile board or press Space to Start/Pause",
      timerPaused: "PAUSED",
      timerRunning: "RUNNING",
      timerFinished: "FINISHED",
      dictTitle: "📖 Jisho Definition",
      dictDefault: "Press Space or tap the timer to start, select tiles to form words, and press Enter to submit.",
      dictNotFound: "Meaning not found in Jisho dictionary.",
      foundTitle: "✨ Found Vocabulary",
      btnAnki: "📋 Copy for Anki",
      emptyWords: "No words found yet. Combine tiles on the board and submit!",
      helpTitle: "How to Play | Kurutta Kotoba",
      helpBody: "1. Press Space or tap the timer/board to start the 3-minute game clock.\n\n" +
                "2. Click/tap letter tiles to select them (highlighted green) and form valid words.\n\n" +
                "3. Press Enter or click 'Submit Word' to check your word against the dictionary.\n\n" +
                "4. Use Esc or 'Clear' to deselect tiles.\n\n" +
                "5. Switch modes anytime (Kanji, Hiragana, English) or press F5 for a fresh tile set.\n\n" +
                "6. Click 'Copy for Anki' to export all discovered words with meanings directly to your clipboard!",
      aboutTitle: "About Kurutta Kotoba | Fluentry Learn Hub",
      aboutBody: "Kurutta Kotoba (狂った言葉 - 'Crazy Words') is an interactive Japanese vocabulary puzzle game originally created in 2016 by Memazija.\n\n" +
                 "Re-engineered as part of the Fluentry Learn Hub (learn.fluentry.co.uk), this web app helps learners build Japanese kanji intuition, expand active vocabulary, and study effectively through instant Jisho dictionary definitions and Anki flashcard exports.\n\n" +
                 "Powered by the Jisho.org API. Dedicated to language learners worldwide!"
    },
    hr: {
      navHelp: "❓ Uputa za igru",
      navAbout: "ℹ️ O aplikaciji",
      selectionLabel: "Trenutni odabir",
      btnSubmit: "Predaj riječ",
      btnReset: "Poništi",
      timerTitle: "⏱️ Preostalo vrijeme",
      timerHint: "Klikni na ploču ili pritisni Razmak za pokretanje/pauzu",
      timerPaused: "PAUZIRANO",
      timerRunning: "U TIJEKU",
      timerFinished: "ISTEKLO",
      dictTitle: "📖 Jisho Definicija",
      dictDefault: "Pritisnite Razmak ili tajmer za početak, odaberite slova na ploči i pritisnite Enter za predaju.",
      dictNotFound: "Značenje nije pronađeno u Jisho rječniku.",
      foundTitle: "✨ Pronađeni vokabular",
      btnAnki: "📋 Kopiraj za Anki",
      emptyWords: "Još nema pronađenih riječi. Složite riječ na ploči i predajte je!",
      helpTitle: "Uputa za igru | Kurutta Kotoba",
      helpBody: "1. Pokrenite mjerač vremena (3 min) pritiskom na razmak ili klikom na mjerač.\n\n" +
                "2. Odaberite slova ili kanjije klikom (označeni zeleno) i složite što više riječi.\n\n" +
                "3. Pritisnite Enter ili 'Predaj riječ' za provjeru u rječniku.\n\n" +
                "4. Poništite odabir pritiskom na Esc ili gumb 'Poništi'.\n\n" +
                "5. Promijenite način rada (Kanji, Hiragana, English) ili pritisnite F5 za novu ploču.\n\n" +
                "6. Kliknite 'Kopiraj za Anki' za izvoz svih pronađenih riječi sa značenjima!",
      aboutTitle: "O aplikaciji Kurutta Kotoba | Fluentry Learn Hub",
      aboutBody: "Kurutta Kotoba (狂った言葉 - 'Lude riječi') je igra slaganja riječi iz kanjija i slova, originalno nastala 2016. godine (autor Memazija).\n\n" +
                 "Danas je dio Fluentry Learn Hub platforme (learn.fluentry.co.uk), moderna web aplikacija razvijena za jačanje intuicije o kanjijima, širenje vokabulara i lagan izvoz kartica u Anki.\n\n" +
                 "Aplikacija koristi Jisho.org API. Besplatno za sve učenje japanskog!"
    }
  };

  window.I18N = I18N;
  window.currentUiLang = 'en';

  const LANG_CONFIG = {
    0: { dicName: 'resources/letters_kanji', checkDicName: 'resources/dictionary_jap.txt' },
    1: { dicName: 'resources/letters_eng',   checkDicName: 'resources/dictionary_eng.txt' },
    2: { dicName: 'resources/letters_hira',  checkDicName: 'resources/dictionary_jap.txt' }
  };
  
  let currentMode = 0;

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
  const timerStateBadge = document.getElementById('timer-status-badge');
  const uiLangEn = document.getElementById('ui-lang-en');
  const uiLangHr = document.getElementById('ui-lang-hr');

  const timer = new window.CountdownTimer('timer-display', {
    onPauseToggle: (isPaused) => {
      const dict = I18N[window.currentUiLang];
      if (isPaused) {
        if (timerPanel) timerPanel.classList.remove('running');
        if (timerStateBadge) timerStateBadge.textContent = dict.timerPaused;
      } else {
        if (timerPanel) timerPanel.classList.add('running');
        if (timerStateBadge) timerStateBadge.textContent = dict.timerRunning;
      }
    },
    onComplete: () => {
      const dict = I18N[window.currentUiLang];
      if (timerPanel) timerPanel.classList.remove('running');
      if (timerStateBadge) timerStateBadge.textContent = dict.timerFinished;
      alert(window.currentUiLang === 'hr' ? 'Vrijeme je isteklo!' : 'Time is up!');
    }
  });

  function setUiLanguage(lang) {
    window.currentUiLang = lang;
    const dict = I18N[lang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    if (uiLangEn) uiLangEn.classList.toggle('active', lang === 'en');
    if (uiLangHr) uiLangHr.classList.toggle('active', lang === 'hr');

    if (timerStateBadge) {
      if (timer.isRunning && !timer.isPaused) {
        timerStateBadge.textContent = dict.timerRunning;
      } else {
        timerStateBadge.textContent = dict.timerPaused;
      }
    }

    if (window.boardManager) {
      window.boardManager.updateGuessedWordsDisplay();
    }
  }

  if (uiLangEn) uiLangEn.addEventListener('click', () => setUiLanguage('en'));
  if (uiLangHr) uiLangHr.addEventListener('click', () => setUiLanguage('hr'));

  async function startGame(modeCode = 0) {
    currentMode = modeCode;
    window.boardManager.currentLanguage = modeCode;
    window.dictionaryManager.resetState();
    window.jishoGetter.resetState();
    window.boardManager.resetUI();

    [langKanji, langHira, langEng].forEach((btn, idx) => {
      const targetMode = idx === 0 ? 0 : idx === 1 ? 2 : 1;
      if (btn) btn.classList.toggle('active', targetMode === modeCode);
    });

    const config = LANG_CONFIG[modeCode] || LANG_CONFIG[0];
    await window.dictionaryManager.setCheckDictionary(config.checkDicName);
    
    // Attempt loading file with and without .txt extension
    let diceLines = await window.dictionaryManager.loadFile(config.dicName);
    if (diceLines.length === 0 && !config.dicName.endsWith('.txt')) {
      diceLines = await window.dictionaryManager.loadFile(config.dicName + '.txt');
    }

    if (diceLines.length > 0) {
      const tiles = window.dictionaryManager.generateBoardTiles(diceLines, 4);
      window.boardManager.renderBoard(tiles);
    }

    timer.reset();
    if (timerStateBadge) timerStateBadge.textContent = I18N[window.currentUiLang].timerPaused;
  }

  if (btnSubmit) btnSubmit.addEventListener('click', () => window.boardManager.submitWord());
  if (btnReset) btnReset.addEventListener('click', () => window.boardManager.clearSelection());

  if (langKanji) langKanji.addEventListener('click', () => startGame(0));
  if (langHira) langHira.addEventListener('click', () => startGame(2));
  if (langEng) langEng.addEventListener('click', () => startGame(1));

  if (btnHelpUputa) {
    btnHelpUputa.addEventListener('click', () => {
      const dict = I18N[window.currentUiLang];
      showModal(dict.helpTitle, dict.helpBody);
    });
  }

  if (btnHelpAbout) {
    btnHelpAbout.addEventListener('click', () => {
      const dict = I18N[window.currentUiLang];
      showModal(dict.aboutTitle, dict.aboutBody);
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

  if (timerPanel) {
    timerPanel.addEventListener('click', () => timer.togglePause());
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      timer.togglePause();
    }

    if (e.code === 'Enter') {
      e.preventDefault();
      window.boardManager.submitWord();
    }

    if (e.code === 'Escape' || (e.altKey && e.code === 'KeyR')) {
      e.preventDefault();
      window.boardManager.clearSelection();
    }

    if (e.code === 'F5') {
      e.preventDefault();
      startGame(currentMode);
    }
  });

  setUiLanguage('en');
  startGame(0);
});
