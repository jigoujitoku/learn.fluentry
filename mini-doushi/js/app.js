/**
 * MiniDoushi Main Application Script
 */
class MiniDoushiApp {
  constructor() {
    this.state = {
      lang: localStorage.getItem('minidoushi_lang') || 'en',
      showKanji: localStorage.getItem('minidoushi_show_kanji') === 'true',
      mode: 'verbs',
      grammar: 'masu',
      selectedLessons: new Set(),
      currentWord: null,
      lastWord: null,
      currentAnswer: '',
      total: 0,
      correct: 0,
      wrong: 0,
      mistakes: [],
      words: { verbs: [], adjectives: [] },
      i18n: {},
      isDictExpanded: false,
      dictSearchQuery: ''
    };
  }

  async init() {
    try {
      const [vRes, aRes, hrRes, enRes] = await Promise.all([
        fetch('data/verbs.json'),
        fetch('data/adjectives.json'),
        fetch('locales/hr.json'),
        fetch('locales/en.json')
      ]);

      this.state.words.verbs = await vRes.json();
      this.state.words.adjectives = await aRes.json();
      this.state.i18n.hr = await hrRes.json();
      this.state.i18n.en = await enRes.json();

      const langSelect = document.getElementById('lang-select');
      if (langSelect) langSelect.value = this.state.lang;

      const kanjiCb = document.getElementById('kanji-toggle');
      if (kanjiCb) kanjiCb.checked = this.state.showKanji;

      this.bindEvents();
      this.syncSelectedLessons();
      this.updateGrammarDropdownOptions();
      this.updateUI();
      this.renderDictionary();
      this.nextQuestion();
    } catch (e) {
      console.error('Greška pri učitavanju podataka:', e);
    }
  }

  bindEvents() {
    document.getElementById('btn-mode-verbs').addEventListener('click', () => this.setMode('verbs'));
    document.getElementById('btn-mode-adjectives').addEventListener('click', () => this.setMode('adjectives'));
    document.getElementById('lang-select').addEventListener('change', (e) => this.setLanguage(e.target.value));
    document.getElementById('grammar-form-select').addEventListener('change', (e) => this.setGrammar(e.target.value));
    document.getElementById('btn-check').addEventListener('click', () => this.checkAnswer());
    document.getElementById('btn-clear-mistakes').addEventListener('click', () => this.clearMistakes());

    const kanjiCb = document.getElementById('kanji-toggle');
    if (kanjiCb) {
      kanjiCb.addEventListener('change', (e) => this.setKanjiToggle(e.target.checked));
    }

    document.getElementById('btn-toggle-dictionary').addEventListener('click', () => this.toggleDictionary());
    document.getElementById('dict-search-input').addEventListener('input', (e) => {
      this.state.dictSearchQuery = e.target.value.toLowerCase().trim();
      this.renderDictionary();
    });

    document.querySelectorAll('.filter-lesson').forEach(cb => {
      cb.addEventListener('change', () => {
        this.syncSelectedLessons();
        this.renderDictionary();
        this.nextQuestion();
      });
    });

    document.getElementById('btn-select-all').addEventListener('click', () => {
      document.querySelectorAll('.filter-lesson').forEach(cb => cb.checked = true);
      this.syncSelectedLessons();
      this.renderDictionary();
      this.nextQuestion();
    });

    document.getElementById('btn-reset-all').addEventListener('click', () => {
      document.querySelectorAll('.filter-lesson').forEach(cb => cb.checked = false);
      this.syncSelectedLessons();
      this.renderDictionary();
      this.nextQuestion();
    });

    document.getElementById('answer-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.checkAnswer();
    });
  }

  setKanjiToggle(enabled) {
    this.state.showKanji = enabled;
    localStorage.setItem('minidoushi_show_kanji', enabled.toString());
    this.updateKanjiToggleLabel();
    this.updateWordDisplay();
    this.renderDictionary();
  }

  updateKanjiToggleLabel() {
    const labelElem = document.getElementById('lbl-kanji-toggle');
    if (labelElem) {
      const statusText = this.state.showKanji ? 'ON' : 'OFF';
      labelElem.innerText = `Kanji: ${statusText}`;
    }
  }

  toggleDictionary() {
    this.state.isDictExpanded = !this.state.isDictExpanded;
    const content = document.getElementById('dictionary-content');
    const toggleBtn = document.getElementById('btn-toggle-dictionary');
    const dict = this.state.i18n[this.state.lang] || {};

    if (this.state.isDictExpanded) {
      content.classList.remove('collapsed');
      toggleBtn.innerText = dict.btn_hide || (this.state.lang === 'hr' ? 'Sakrij ▲' : 'Hide ▲');
    } else {
      content.classList.add('collapsed');
      toggleBtn.innerText = dict.btn_show || (this.state.lang === 'hr' ? 'Prikaži ▼' : 'Show ▼');
    }
  }

  renderDictionary() {
    const gridElem = document.getElementById('dictionary-grid');
    const countElem = document.getElementById('lbl-dict-count');
    if (!gridElem) return;

    const currentWords = this.getFilteredPool();
    const query = this.state.dictSearchQuery;

    const filtered = currentWords.filter(w => {
      if (!query) return true;
      const kanji = (w.kanji || '').toLowerCase();
      const reading = (w.reading || '').toLowerCase();
      const romaji = (w.romaji || '').toLowerCase();
      const meaningHr = (w.meaning?.hr || '').toLowerCase();
      const meaningEn = (w.meaning?.en || '').toLowerCase();

      return kanji.includes(query) || reading.includes(query) || romaji.includes(query) || 
             meaningHr.includes(query) || meaningEn.includes(query);
    });

    if (countElem) {
      const countSuffix = this.state.lang === 'hr' ? 'riječi' : 'words';
      countElem.innerText = `${filtered.length} ${countSuffix}`;
    }

    const grouped = {};
    filtered.forEach(w => {
      const les = w.lesson || 0;
      if (!grouped[les]) grouped[les] = [];
      grouped[les].push(w);
    });

    const sortedLessons = Object.keys(grouped).map(Number).sort((a, b) => a - b);

    if (sortedLessons.length === 0) {
      const noResultsMsg = this.state.lang === 'hr' ? 'Nije pronađena nijedna riječ u odabranim lekcijama.' : 'No words found in selected lessons.';
      gridElem.innerHTML = `<p class="empty-mistakes-msg">${noResultsMsg}</p>`;
      return;
    }

    let html = '';
    sortedLessons.forEach(les => {
      const lessonTitle = this.state.lang === 'hr' ? `Genki Lekcija ${les}` : `Genki Lesson ${les}`;
      html += `
        <div class="lesson-section">
          <div class="lesson-section-title">${lessonTitle} (${grouped[les].length})</div>
          <div class="dict-word-grid">
      `;

      grouped[les].forEach(w => {
        const meaning = w.meaning ? (w.meaning[this.state.lang] || w.meaning.en) : '';
        
        let mainJp = w.reading;
        let subJp = '';
        if (this.state.showKanji && w.kanji && w.kanji !== w.reading) {
          mainJp = w.kanji;
          subJp = `(${w.reading})`;
        }

        html += `
          <div class="dict-word-card">
            <span class="dict-word-jp">${mainJp} ${subJp}</span>
            <span class="dict-word-romaji">${w.romaji || ''}</span>
            <span class="dict-word-meaning">${meaning}</span>
            <span class="dict-word-tag">${w.group || ''}</span>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    gridElem.innerHTML = html;
  }

  syncSelectedLessons() {
    const checkedNodes = document.querySelectorAll('.filter-lesson:checked');
    this.state.selectedLessons = new Set(Array.from(checkedNodes).map(cb => parseInt(cb.value, 10)));
  }

  setMode(m) {
    this.state.mode = m;
    this.state.lastWord = null;
    document.getElementById('btn-mode-verbs').classList.toggle('active', m === 'verbs');
    document.getElementById('btn-mode-adjectives').classList.toggle('active', m === 'adjectives');
    this.updateGrammarDropdownOptions();
    this.renderDictionary();
    this.nextQuestion();
  }

  updateGrammarDropdownOptions() {
    const selectElem = document.getElementById('grammar-form-select');
    const dict = this.state.i18n[this.state.lang] || {};
    const formsKey = this.state.mode === 'verbs' ? 'verb_forms' : 'adj_forms';
    const activeForms = dict[formsKey] || {};

    let html = '';
    for (const key in activeForms) {
      html += `<option value="${key}">${activeForms[key]}</option>`;
    }
    selectElem.innerHTML = html;
    this.state.grammar = Object.keys(activeForms)[0] || 'masu';
  }

  setGrammar(g) {
    this.state.grammar = g;
    this.nextQuestion();
  }

  setLanguage(l) {
    this.state.lang = l;
    localStorage.setItem('minidoushi_lang', l);
    this.updateGrammarDropdownOptions();
    this.updateUI();
    this.renderDictionary();
    this.renderMistakes();
    this.nextQuestion();
  }

  getFilteredPool() {
    const pool = this.state.words[this.state.mode] || [];
    if (this.state.selectedLessons.size === 0) return pool;
    const filtered = pool.filter(w => this.state.selectedLessons.has(w.lesson));
    return filtered.length > 0 ? filtered : pool;
  }

  updatePromptHeader() {
    const dict = this.state.i18n[this.state.lang] || {};
    const prefix = dict.prompt_conjugate || (this.state.lang === 'hr' ? 'Stavite riječ u sljedeći oblik:' : 'Conjugate word into:');
    const formsKey = this.state.mode === 'verbs' ? 'verb_forms' : 'adj_forms';
    const activeForms = dict[formsKey] || {};
    const label = activeForms[this.state.grammar] || this.state.grammar;
    
    document.getElementById('prompt-instruction').innerText = `${prefix} ${label}`;
  }

  updateWordDisplay() {
    if (!this.state.currentWord) return;

    const wordElem = document.getElementById('target-word');
    if (this.state.showKanji && this.state.currentWord.kanji) {
      wordElem.innerText = this.state.currentWord.kanji;
    } else {
      wordElem.innerText = this.state.currentWord.reading;
    }
  }

  nextQuestion() {
    const pool = this.getFilteredPool();
    if (!pool || pool.length === 0) return;

    let candidatePool = pool;
    if (pool.length > 1 && this.state.lastWord) {
      candidatePool = pool.filter(w => w !== this.state.lastWord);
    }

    const picked = candidatePool[Math.floor(Math.random() * candidatePool.length)];
    this.state.currentWord = picked;
    this.state.lastWord = picked;
    this.state.currentAnswer = JapaneseConjugator.conjugate(this.state.currentWord, this.state.grammar);

    this.updateWordDisplay();

    const meaningObj = this.state.currentWord.meaning;
    let meaningText = '';
    if (meaningObj) {
      meaningText = meaningObj[this.state.lang] || meaningObj.en || '';
    }
    document.getElementById('target-meaning').innerText = meaningText ? `(${meaningText})` : '';

    const inputElem = document.getElementById('answer-input');
    inputElem.value = '';
    inputElem.disabled = false;
    inputElem.focus();

    document.getElementById('feedback-area').innerText = '';
    this.updatePromptHeader();
  }

  romajiToHiragana(romaji) {
    let str = romaji.toLowerCase().trim();
    str = str.replace(/(kk|tt|pp|ss|cch|tch)/g, (match) => 'っ' + match.charAt(match.length - 1));

    const mapping = {
      'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
      'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
      'shi': 'し', 'chi': 'ち', 'tsu': 'つ', 'fu': 'ふ',
      'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
      'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
      'sa': 'さ', 'su': 'す', 'se': 'せ', 'so': 'そ',
      'za': 'ざ', 'ji': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
      'ta': 'た', 'te': 'て', 'to': 'と',
      'da': 'だ', 'de': 'で', 'do': 'ど',
      'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
      'ha': 'は', 'hi': 'ひ', 'ho': 'ほ',
      'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
      'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
      'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
      'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
      'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
      'wa': 'わ', 'wo': 'を', 'n': 'ん',
      'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お'
    };

    const keys = Object.keys(mapping).sort((a, b) => b.length - a.length);
    for (const k of keys) {
      str = str.split(k).join(mapping[k]);
    }
    return str;
  }

  checkAnswer() {
    const inputElem = document.getElementById('answer-input');
    const val = inputElem.value.trim();
    const fb = document.getElementById('feedback-area');
    const dict = this.state.i18n[this.state.lang] || {};

    if (!val) return;

    const convertedInput = this.romajiToHiragana(val);
    const expected = this.state.currentAnswer;

    const isCorrect = val.toLowerCase() === expected.toLowerCase() || convertedInput === expected;

    this.state.total++;

    if (isCorrect) {
      this.state.correct++;
      fb.className = 'feedback-area feedback-correct';
      fb.innerText = dict.feedback_correct || 'Točno!';
      inputElem.disabled = true;

      this.updateStats();
      setTimeout(() => this.nextQuestion(), 1500);
    } else {
      this.state.wrong++;
      fb.className = 'feedback-area feedback-incorrect';
      const prefix = dict.feedback_incorrect || 'Netočno! Pokušajte ponovno. Točan odgovor je:';
      fb.innerText = `${prefix} ${expected}`;

      this.logMistake(val, expected);
      inputElem.focus();
      inputElem.select();
      this.updateStats();
    }
  }

  logMistake(userVal, correctVal) {
    const wordText = (this.state.showKanji && this.state.currentWord.kanji) ? 
      `${this.state.currentWord.kanji} (${this.state.currentWord.reading})` : 
      this.state.currentWord.reading;

    const meaningObj = this.state.currentWord.meaning;
    const meaningText = meaningObj ? (meaningObj[this.state.lang] || meaningObj.en || '') : '';
    
    const dict = this.state.i18n[this.state.lang] || {};
    const formsKey = this.state.mode === 'verbs' ? 'verb_forms' : 'adj_forms';
    const activeForms = dict[formsKey] || {};
    const formLabel = activeForms[this.state.grammar] || this.state.grammar;

    // Sprečavanje dupliciranja uzastopno istih pogrešaka
    if (this.state.mistakes.length > 0) {
      const lastMistake = this.state.mistakes[0];
      if (
        lastMistake.word === wordText &&
        lastMistake.form === formLabel &&
        lastMistake.userAns.toLowerCase() === userVal.toLowerCase()
      ) {
        return;
      }
    }

    this.state.mistakes.unshift({
      word: wordText,
      meaning: meaningText,
      form: formLabel,
      userAns: userVal,
      correctAns: correctVal
    });
    this.renderMistakes();
  }

  renderMistakes() {
    const listElem = document.getElementById('mistakes-list');
    const emptyMsg = document.getElementById('msg-no-mistakes');
    const dict = this.state.i18n[this.state.lang] || {};

    if (this.state.mistakes.length === 0) {
      if (emptyMsg) {
        emptyMsg.style.display = 'block';
        emptyMsg.innerText = dict.no_mistakes || 'Još nema zabilježenih pogrešaka.';
      }
      listElem.innerHTML = '';
      if (emptyMsg) listElem.appendChild(emptyMsg);
      return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';

    let html = '';
    const userLabel = dict.user_answer || 'Tvoj odgovor:';
    const correctLabel = dict.correct_answer || 'Točan odgovor:';

    this.state.mistakes.forEach(m => {
      html += `
        <div class="mistake-card">
          <div>
            <span class="mistake-prompt-title">${m.word}</span> 
            ${m.meaning ? `(${m.meaning})` : ''} 
            <span class="mistake-prompt-form">➔ ${m.form}</span>
          </div>
          <div class="mistake-details">
            <span class="user-ans">${userLabel} ${m.userAns}</span>
            <span class="correct-ans">${correctLabel} ${m.correctAns}</span>
          </div>
        </div>
      `;
    });

    listElem.innerHTML = html;
  }

  clearMistakes() {
    this.state.mistakes = [];
    this.renderMistakes();
  }

  updateStats() {
    const dict = this.state.i18n[this.state.lang] || {};
    document.getElementById('stat-total').innerText = `${dict.total || 'Ukupno:'} ${this.state.total}`;
    document.getElementById('stat-correct').innerText = `${dict.correct_stat || 'Točno:'} ${this.state.correct}`;

    const wrongLabel = dict.wrong_stat || 'Pogreške:';
    const wrongElem = document.getElementById('stat-wrong');
    if (wrongElem) wrongElem.innerText = `${wrongLabel} ${this.state.wrong}`;

    const acc = this.state.total === 0 ? 0 : Math.round((this.state.correct / this.state.total) * 100);
    document.getElementById('stat-accuracy').innerText = `${dict.accuracy || 'Točnost:'} ${acc}%`;
  }

  updateUI() {
    const dict = this.state.i18n[this.state.lang] || {};

    if (dict.app_title) {
      document.title = dict.app_title;
    }

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.innerText = dict[key];
    });

    this.updateKanjiToggleLabel();

    const mistakesTitle = document.getElementById('lbl-mistakes-title');
    if (mistakesTitle) {
      mistakesTitle.innerText = dict.mistakes_title || 'Evidencija pogrešaka za učenje';
    }

    const clearBtn = document.getElementById('btn-clear-mistakes');
    if (clearBtn) {
      clearBtn.innerText = dict.clear_log || 'Očisti listu';
    }

    const dictTitle = document.getElementById('lbl-dictionary-title');
    if (dictTitle) {
      dictTitle.innerText = dict.dict_title || 'Mini Rječnik (Odabrani Vokabular)';
    }

    const dictSearchInput = document.getElementById('dict-search-input');
    if (dictSearchInput) {
      dictSearchInput.placeholder = dict.dict_search_placeholder || 'Pretraži vokabular...';
    }

    const toggleBtn = document.getElementById('btn-toggle-dictionary');
    if (toggleBtn) {
      toggleBtn.innerText = this.state.isDictExpanded 
        ? (dict.btn_hide || 'Sakrij ▲')
        : (dict.btn_show || 'Prikaži ▼');
    }

    const dropdownLabel = document.getElementById('lbl-lessons-dropdown');
    if (dropdownLabel) {
      dropdownLabel.innerText = dict.lessons_dropdown || 'Odaberi vokabular ▼';
    }

    const selectAllBtn = document.getElementById('btn-select-all');
    if (selectAllBtn) {
      selectAllBtn.innerText = dict.select_all || 'Select all';
    }

    const resetBtn = document.getElementById('btn-reset-all');
    if (resetBtn) {
      resetBtn.innerText = dict.reset || 'Reset';
    }

    if (dict.btn_check) document.getElementById('btn-check').innerText = dict.btn_check;
    if (dict.input_placeholder) document.getElementById('answer-input').placeholder = dict.input_placeholder;

    this.updateStats();
    this.renderMistakes();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new MiniDoushiApp();
  window.app.init();
});