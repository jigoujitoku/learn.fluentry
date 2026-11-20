class JishoGetter {
  constructor() {
    this.meaningList = [];
    this.wordList = [];
    this.wordMap = new Map();
  }

  async fetchJishoData(word) {
    if (!word) return null;
    const cleanWord = word.trim().toLowerCase();
    
    // Relative URL guarantees subpath mapping under /kurutta-kotoba/
    const url = `api/jisho?keyword=${encodeURIComponent(cleanWord)}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Proxy request failed: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Jisho fetch error:", error);
      return null;
    }
  }

  parseMeaning(data) {
    if (!data || !data.data || data.data.length === 0) return null;
    
    // Extract first valid english definitions list across senses
    for (const entry of data.data) {
      if (entry.senses) {
        for (const sense of entry.senses) {
          if (sense.english_definitions && sense.english_definitions.length > 0) {
            return sense.english_definitions.join(", ");
          }
        }
      }
    }
    return null;
  }

  parseReading(data) {
    if (!data || !data.data || data.data.length === 0) return "";
    const japanese = data.data[0]?.japanese?.[0];
    return japanese?.reading || "";
  }

  parseJapanese(data) {
    if (!data || !data.data || data.data.length === 0) return "";
    const japanese = data.data[0]?.japanese?.[0];
    return japanese?.word || japanese?.reading || "";
  }

  async testJson(word, lang, currentWord) {
    const data = await this.fetchJishoData(word);
    if (!data || !data.data || data.data.length === 0) return null;

    const r = Math.floor(Math.random() * 1000);
    const result = { word: "", reading: "" };

    for (const item of data.data) {
      const japaneseList = item.japanese || [];
      for (const jp of japaneseList) {
        const itemWord = jp.word || "";
        const itemReading = jp.reading || "";

        switch (lang) {
          case 0: // Kanji
            if (itemWord && itemWord.includes(currentWord)) {
              this.wordMap.set(`word_${r}`, itemWord);
              result.word = itemWord;
            }
            break;
          case 1: // English
            if (itemWord && !itemWord.includes(currentWord) && !/^[\x00-\x7F]+$/.test(itemWord)) {
              if (!this.wordMap.has(`word_${r}`)) {
                this.wordMap.set(`word_${r}`, itemWord);
                result.word = itemWord;
              }
            }
            if (itemReading && !this.wordMap.has(`reading_${r}`)) {
              this.wordMap.set(`reading_${r}`, itemReading);
              result.reading = itemReading;
            }
            break;
          case 2: // Hiragana
            if (itemWord && !/^[\x00-\x7F]+$/.test(itemWord)) {
              if (!this.wordMap.has(`word_${r}`)) {
                this.wordMap.set(`word_${r}`, itemWord);
                result.word = itemWord;
              }
            }
            break;
        }
      }
    }
    return result;
  }

  resetState() {
    this.meaningList = [];
    this.wordList = [];
    this.wordMap.clear();
  }
}

window.jishoGetter = new JishoGetter();