class JishoGetter {
  constructor() {
    this.meaningList = [];
    this.wordList = [];
    this.wordMap = new Map();
  }

  // Calls the local server proxy to query Jisho API without CORS issues
  async fetchJishoData(word) {
    if (!word) return null;
    // Relative path ensures it queries /kurutta-kotoba/api/jisho on deployment
    const url = `api/jisho?keyword=${encodeURIComponent(word.toLowerCase())}`;
    
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

  // Corresponds to JishoGetter.parseMeaning()
  parseMeaning(data) {
    if (!data || !data.data || data.data.length === 0) return null;
    const firstSense = data.data[0]?.senses[0];
    if (firstSense && firstSense.english_definitions) {
      return firstSense.english_definitions.join(", ");
    }
    return null;
  }

  // Corresponds to JishoGetter.parseReading()
  parseReading(data) {
    if (!data || !data.data || data.data.length === 0) return "";
    const japanese = data.data[0]?.japanese[0];
    return japanese?.reading || "";
  }

  // Corresponds to JishoGetter.parseJapanese()
  parseJapanese(data) {
    if (!data || !data.data || data.data.length === 0) return "";
    const japanese = data.data[0]?.japanese[0];
    return japanese?.word || japanese?.reading || "";
  }

  // Corresponds to JishoGetter.testJson() logic
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
          case 0: // Kanji mode
            if (itemWord && itemWord.includes(currentWord)) {
              this.wordMap.set(`word_${r}`, itemWord);
              result.word = itemWord;
            }
            break;
          case 1: // English mode
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
          case 2: // Hiragana mode
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

  jishoMeaning(meaning) {
    if (meaning && !this.meaningList.includes(meaning)) {
      this.meaningList.push(meaning);
    }
    return this.meaningList;
  }

  jishoWords(word) {
    if (word && !this.wordList.includes(word)) {
      this.wordList.push(word);
    }
    return this.wordList;
  }

  resetState() {
    this.meaningList = [];
    this.wordList = [];
    this.wordMap.clear();
  }
}

// Export singleton instance for global browser usage
window.jishoGetter = new JishoGetter();