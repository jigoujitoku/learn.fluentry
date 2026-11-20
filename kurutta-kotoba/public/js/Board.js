class BoardManager {
  constructor() {
    this.gridElement = document.getElementById('board-grid');
    this.japaneseWordEl = document.getElementById('japanska-rijec');
    this.readingWordEl = document.getElementById('citanje');
    this.englishMeaningEl = document.getElementById('engleska-rijec');
    this.prevWordsEl = document.getElementById('prev-words-container');
    this.foundCountBadge = document.getElementById('found-count-badge');
    this.statusEl = document.getElementById('input-status');
    this.btnExportAnki = document.getElementById('btn-export-anki');

    this.selectedTiles = [];
    this.currentTiles = [];
    this.currentLanguage = 0;

    if (this.btnExportAnki) {
      this.btnExportAnki.addEventListener('click', () => this.exportToAnki());
    }
  }

  renderBoard(tiles) {
    this.currentTiles = tiles;
    this.selectedTiles = [];
    this.gridElement.innerHTML = '';

    tiles.forEach((letter, index) => {
      const tileBtn = document.createElement('button');
      tileBtn.className = 'tile-btn';
      tileBtn.textContent = letter;
      tileBtn.dataset.index = index;
      tileBtn.dataset.letter = letter;

      tileBtn.addEventListener('click', () => this.toggleTile(tileBtn));
      this.gridElement.appendChild(tileBtn);
    });

    this.updateCurrentWordDisplay();
  }

  toggleTile(tileBtn) {
    const idx = this.selectedTiles.indexOf(tileBtn);
    if (idx === -1) {
      this.selectedTiles.push(tileBtn);
      tileBtn.classList.add('selected');
    } else {
      this.selectedTiles.splice(idx, 1);
      tileBtn.classList.remove('selected');
    }
    this.updateCurrentWordDisplay();
  }

  getCurrentWord() {
    return this.selectedTiles.map(btn => btn.dataset.letter).join('');
  }

  clearSelection() {
    this.selectedTiles.forEach(btn => btn.classList.remove('selected'));
    this.selectedTiles = [];
    this.updateCurrentWordDisplay();
  }

  updateCurrentWordDisplay() {
    const word = this.getCurrentWord();
    if (this.japaneseWordEl) {
      this.japaneseWordEl.textContent = word;
    }
  }

  showStatus(message, isSuccess = true) {
    if (!this.statusEl) return;
    this.statusEl.textContent = message;
    this.statusEl.className = `status-badge ${isSuccess ? 'success' : 'error'}`;
  }

  async submitWord() {
    const word = this.getCurrentWord();
    if (!word) {
      this.showStatus("Nema odabrane riječi!", false);
      return;
    }

    this.showStatus("Provjera...", true);

    let isMatch = window.dictionaryManager.checkWord(word);
    let jishoData = null;

    if (!isMatch && this.currentLanguage === 2) {
      jishoData = await window.jishoGetter.fetchJishoData(word);
      if (jishoData && jishoData.data && jishoData.data.length > 0) {
        isMatch = true;
      }
    }

    if (isMatch) {
      this.showStatus("Pronađena riječ!", true);

      if (!jishoData) {
        jishoData = await window.jishoGetter.fetchJishoData(word);
      }

      const meaning = window.jishoGetter.parseMeaning(jishoData) || "Značenje nije pronađeno.";
      const reading = window.jishoGetter.parseReading(jishoData) || "";
      const jpWord = window.jishoGetter.parseJapanese(jishoData) || word;

      await window.jishoGetter.testJson(word, this.currentLanguage, word);

      if (this.japaneseWordEl) this.japaneseWordEl.textContent = jpWord;
      if (this.readingWordEl) this.readingWordEl.textContent = reading ? `【 ${reading} 】` : '';
      if (this.englishMeaningEl) this.englishMeaningEl.textContent = meaning;

      // Pohrana bogatog zapisa za učenje
      window.dictionaryManager.addGuessedWord({
        input: word,
        word: jpWord,
        reading: reading,
        meaning: meaning
      });

      this.updateGuessedWordsDisplay();
    } else {
      this.showStatus(`"${word}" nije u rječniku!`, false);
    }

    this.clearSelection();
  }

  updateGuessedWordsDisplay() {
    const words = window.dictionaryManager.guessedWords;
    
    if (this.foundCountBadge) {
      this.foundCountBadge.textContent = words.length;
    }

    if (this.prevWordsEl) {
      if (words.length === 0) {
        this.prevWordsEl.innerHTML = `<div class="empty-words-msg">Još nema pronađenih riječi. Složite riječ na ploči i predajte je!</div>`;
      } else {
        this.prevWordsEl.innerHTML = words
          .map((item, index) => `
            <div class="vocab-card" onclick="window.boardManager.focusWordDetails(${index})">
              <div class="vocab-header">
                <span class="vocab-kanji">${item.word}</span>
                ${item.reading ? `<span class="vocab-reading">【 ${item.reading} 】</span>` : ''}
              </div>
              <div class="vocab-meaning">${item.meaning}</div>
            </div>
          `)
          .join('');
      }
    }
  }

  focusWordDetails(index) {
    const item = window.dictionaryManager.guessedWords[index];
    if (!item) return;

    if (this.japaneseWordEl) this.japaneseWordEl.textContent = item.word;
    if (this.readingWordEl) this.readingWordEl.textContent = item.reading ? `【 ${item.reading} 】` : '';
    if (this.englishMeaningEl) this.englishMeaningEl.textContent = item.meaning;
  }

  exportToAnki() {
    const words = window.dictionaryManager.guessedWords;
    if (words.length === 0) {
      alert("Nema pronađenih riječi za izvoz!");
      return;
    }

    // Formatiranje u CSV za Anki (Riječ, Čitanje, Značenje)
    const csvContent = words.map(w => `"${w.word}","${w.reading}","${w.meaning.replace(/"/g, '""')}"`).join('\n');
    
    navigator.clipboard.writeText(csvContent).then(() => {
      alert(`Kopirano ${words.length} riječi u meduspremnik (TSV/CSV format spreman za Anki import)!`);
    }).catch(err => {
      console.error('Neuspješno kopiranje:', err);
    });
  }

  resetUI() {
    this.clearSelection();
    if (this.japaneseWordEl) this.japaneseWordEl.textContent = '';
    if (this.readingWordEl) this.readingWordEl.textContent = '';
    if (this.englishMeaningEl) {
      this.englishMeaningEl.textContent = 'Pritisnite Razmak za početak tajmera ili odaberite slova i kliknite Predaj riječ.';
    }
    if (this.statusEl) {
      this.statusEl.textContent = '';
      this.statusEl.className = 'status-badge';
    }
    this.updateGuessedWordsDisplay();
  }
}

window.boardManager = new BoardManager();