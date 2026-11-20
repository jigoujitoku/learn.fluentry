class DictionaryManager {
  constructor() {
    this.checkDictionary = [];
    this.guessedWords = [];
    this.wordMap = new Map();
    this.pw = "";
    this.counter = 0;
  }

  // Bi-directional path fallback (handles files with or without .txt extension)
  async loadFile(path) {
    try {
      let response = await fetch(path);

      // If initial fetch fails, try the inverse extension path
      if (!response.ok) {
        const altPath = path.endsWith('.txt') 
          ? path.slice(0, -4) 
          : path + '.txt';
        response = await fetch(altPath);
      }

      if (!response.ok) {
        throw new Error(`Failed to load asset from ${path}`);
      }

      const text = await response.text();
      return text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
    } catch (error) {
      console.error(`Dictionary import error [${path}]:`, error);
      return [];
    }
  }

  async setCheckDictionary(path) {
    this.checkDictionary = await this.loadFile(path);
  }

  generateBoardTiles(diceLines, boardSize = 4) {
    const totalTiles = boardSize * boardSize;
    const tiles = [];
    const usedIndices = new Set();

    for (let i = 0; i < totalTiles; i++) {
      let randIndex;
      let attempts = 0;
      do {
        randIndex = Math.floor(Math.random() * diceLines.length);
        attempts++;
      } while (usedIndices.has(randIndex) && usedIndices.size < diceLines.length && attempts < 100);

      usedIndices.add(randIndex);
      const line = diceLines[randIndex];
      const chars = Array.from(line);
      const charPos = Math.floor(Math.random() * chars.length);
      const letter = chars[charPos] || chars[0];
      tiles.push(letter);
    }

    return tiles;
  }

  checkWord(word) {
    if (!word) return false;
    const lowerWord = word.toLowerCase();
    for (const entry of this.checkDictionary) {
      if (entry.toLowerCase() === lowerWord) {
        return true;
      }
    }
    return false;
  }

  addGuessedWord(wordEntry) {
    const exists = this.guessedWords.some(
      item => item.input.toLowerCase() === wordEntry.input.toLowerCase() || item.word === wordEntry.word
    );
    if (!exists) {
      this.guessedWords.push(wordEntry);
    }
  }

  resetState() {
    this.guessedWords = [];
    this.wordMap.clear();
    this.pw = "";
    this.counter = 0;
  }
}

window.dictionaryManager = new DictionaryManager();