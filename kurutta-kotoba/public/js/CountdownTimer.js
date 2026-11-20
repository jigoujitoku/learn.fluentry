class CountdownTimer {
  constructor(displayElementId, options = {}) {
    this.displayElement = document.getElementById(displayElementId);
    this.duration = 180000; // 3 minutes in milliseconds (180,000 ms)
    this.remainingTime = this.duration;
    this.timerId = null;
    this.startTime = null;
    this.isRunning = false;
    this.isPaused = false;

    // Callbacks
    this.onTick = options.onTick || null;
    this.onComplete = options.onComplete || null;
    this.onPauseToggle = options.onPauseToggle || null;
  }

  start() {
    if (this.isRunning && !this.isPaused) return;

    if (this.isPaused) {
      this.isPaused = false;
      this.startTime = Date.now() - (this.duration - this.remainingTime);
    } else {
      this.remainingTime = this.duration;
      this.startTime = Date.now();
    }

    this.isRunning = true;
    if (this.onPauseToggle) this.onPauseToggle(false);

    clearInterval(this.timerId);
    this.timerId = setInterval(() => this.update(), 10);
  }

  pause() {
    if (!this.isRunning && !this.isPaused) return;

    this.isPaused = true;
    this.isRunning = false;
    clearInterval(this.timerId);

    if (this.onPauseToggle) this.onPauseToggle(true);
  }

  togglePause() {
    if (this.isPaused || !this.isRunning) {
      this.start();
    } else {
      this.pause();
    }
  }

  reset() {
    clearInterval(this.timerId);
    this.isRunning = false;
    this.isPaused = false;
    this.remainingTime = this.duration;
    this.updateDisplay();
    if (this.onPauseToggle) this.onPauseToggle(false);
  }

  update() {
    const elapsed = Date.now() - this.startTime;
    this.remainingTime = Math.max(0, this.duration - elapsed);

    this.updateDisplay();

    if (this.onTick) {
      this.onTick(this.remainingTime);
    }

    if (this.remainingTime <= 0) {
      clearInterval(this.timerId);
      this.isRunning = false;
      this.isPaused = false;
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }

  updateDisplay() {
    if (!this.displayElement) return;

    const minutes = Math.floor(this.remainingTime / 60000);
    const seconds = Math.floor((this.remainingTime % 60000) / 1000);
    const millis = Math.floor(this.remainingTime % 1000);

    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    const SSS = String(millis).padStart(3, '0');

    this.displayElement.textContent = `${mm}:${ss}:${SSS}`;
  }
}

// Export singleton instance for global browser usage
window.CountdownTimer = CountdownTimer;