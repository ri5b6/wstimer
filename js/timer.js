// Sound Toggle Funktionalität
(function() {
  const soundToggle = document.getElementById('soundToggle');
  const alarmSound = document.getElementById('alarmSound');
  let soundOn = false;
  alarmSound.muted = true;
  
  const soundOnSVG = '<svg viewBox="0 0 24 24"><path fill="black" d="M3 10v4h4l5 5V5l-5 5H3z"/><path fill="black" d="M14.5 12c0-1.77-1.02-3.29-2.5-4.03v8.06c1.48-.74 2.5-2.26 2.5-4.03z"/></svg>';
  const soundOffSVG = '<svg viewBox="0 0 24 24"><path fill="black" d="M3 10v4h4l5 5V5l-5 5H3z"/><line x1="16" y1="8" x2="22" y2="14" stroke="black" stroke-width="2"/><line x1="22" y1="8" x2="16" y2="14" stroke="black" stroke-width="2"/></svg>';
  
  soundToggle.innerHTML = soundOffSVG;
  soundToggle.setAttribute('data-tooltip', 'Alarm sound off, click to turn on');
  
  soundToggle.addEventListener('click', () => {
    soundOn = !soundOn;
    alarmSound.muted = !soundOn;
    soundToggle.innerHTML = soundOn ? soundOnSVG : soundOffSVG;
    soundToggle.setAttribute('data-tooltip', soundOn ? 'Alarm sound on, click to turn off' : 'Alarm sound off, click to turn on');
  });
})();

// Timer-Funktionalität
(function() {
  const playIconSVG = '<svg width="40" height="40" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" fill="black"/></svg>';
  const pauseIconSVG = '<svg width="40" height="40" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" fill="black"/><rect x="14" y="4" width="4" height="16" fill="black"/></svg>';

  class WSTimer {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext("2d");
      this.totalTime = 60 * 60; // 1 Stunde in Sekunden
      this.remainingTime = 0;
      this.running = false;
      this.interval = null;
      this.dragging = false;
      this.alarmSound = document.getElementById("alarmSound");
      this.firstStart = true;
      this.lastTick = null;

      this.resizeCanvas();
      window.addEventListener("resize", () => this.resizeCanvas());

      // Maus-Events für Drag
      this.canvas.addEventListener("mousedown", (e) => this.startDrag(e));
      this.canvas.addEventListener("mousemove", (e) => this.dragTime(e));
      window.addEventListener("mouseup", () => this.stopDrag());

      // Touch-Events für mobile Geräte
      this.canvas.addEventListener("touchstart", (e) => this.startDrag(e.touches[0]));
      this.canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        this.dragTime(e.touches[0]);
      });
      window.addEventListener("touchend", () => this.stopDrag());

      // Play/Pause Button
      document.getElementById("playPauseButton").addEventListener("click", () => this.toggleTimer());

      this.drawTimer();
    }

    resizeCanvas() {
      const container = document.getElementById("timerContainer");
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
      this.drawTimer();
    }

    startDrag(event) {
      if (this.interval) clearInterval(this.interval);
      this.running = false;
      this.dragging = true;
      document.getElementById("playPauseButton").innerHTML = playIconSVG;
      this.updateTime(event);
    }

    dragTime(event) {
      if (!this.dragging) return;
      this.updateTime(event);
    }

    stopDrag() {
      if (this.dragging) {
        this.dragging = false;
        if (this.firstStart && this.remainingTime > 0) {
          this.startTimer();
          document.getElementById("playPauseButton").innerHTML = pauseIconSVG;
          document.getElementById("playPauseButton").classList.add("pulsing");
          this.firstStart = false;
        }
      }
    }

    updateTime(event) {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left - this.canvas.width / 2;
      const y = event.clientY - rect.top - this.canvas.height / 2;
      let angle = Math.atan2(y, x) + Math.PI / 2;
      if (angle < 0) angle += 2 * Math.PI;
      this.remainingTime = Math.round((angle / (2 * Math.PI)) * 60) * 60;
      this.updateDigitalTimer();
      if (!this.running) this.drawTimer();
    }

    toggleTimer() {
      if (this.running) {
        this.stopTimer();
        document.getElementById("playPauseButton").innerHTML = playIconSVG;
        playPauseButton.classList.remove("pulsing");
      } else {
        if (this.remainingTime > 0) {
          this.startTimer();
          document.getElementById("playPauseButton").innerHTML = pauseIconSVG;
          playPauseButton.classList.add("pulsing");
        }
      }
    }

    startTimer() {
      if (this.remainingTime > 0 && !this.running) {
        this.running = true;
        this.lastTick = Date.now();
        this.interval = setInterval(() => this.tick(), 200);
      }
    }

    tick() {
      const now = Date.now();
      const elapsed = Math.floor((now - this.lastTick) / 1000);
      if (elapsed > 0) {
        this.remainingTime = Math.max(0, this.remainingTime - elapsed);
        this.lastTick = now;
      }
      this.drawTimer();
      this.updateDigitalTimer();
      if (this.remainingTime <= 0) {
        this.stopTimer();
        this.playAlarm();
        document.title = 'Times Up!';
        document.getElementById("digitalTimer").innerText = "Time's up!";
        document.getElementById("playPauseButton").innerHTML = playIconSVG;
        const playButton = document.getElementById("playPauseButton");
        playButton.classList.add("pulse");
        setTimeout(() => {
          playButton.classList.remove("pulse");
        }, 2400);
      }
    }

    stopTimer() {
      this.running = false;
      if (this.interval) clearInterval(this.interval);
    }

    playAlarm() {
      this.alarmSound.currentTime = 0;
      this.alarmSound.play().catch(error => {
        console.error("Alarm-Sound konnte nicht abgespielt werden:", error);
      });
    }

    updateDigitalTimer() {
      const minutes = String(Math.floor(this.remainingTime / 60)).padStart(2, '0');
      const seconds = String(this.remainingTime % 60).padStart(2, '0');
      document.getElementById("digitalTimer").innerText = `${minutes}:${seconds}`;
      document.title = `${minutes}:${seconds}`;
    }

    drawTimer() {
      const ctx = this.ctx;
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 50;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Uhrmarkierungen zeichnen
      for (let i = 0; i <= 60; i++) {
        let angle = (-Math.PI / 2 + (i / 60) * 2 * Math.PI);
        let isMajor = i % 5 === 0;
        let x1 = centerX + Math.cos(angle) * (radius - (isMajor ? 25 : 15));
        let y1 = centerY + Math.sin(angle) * (radius - (isMajor ? 25 : 15));
        let x2 = centerX + Math.cos(angle) * radius;
        let y2 = centerY + Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = "black";
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.stroke();

        if (isMajor && i !== 60) {
          let textX = centerX + Math.cos(angle) * (radius + 20);
          let textY = centerY + Math.sin(angle) * (radius + 20);
          ctx.font = "16px Arial";
          ctx.fillStyle = "black";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(i.toString(), textX, textY);
        }
      }

      // Fortschrittsbereich zeichnen
      if (this.remainingTime > 0 || this.dragging) {
        const endAngle = (-Math.PI / 2 + (this.remainingTime / 3600) * 2 * Math.PI);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, endAngle, false);
        ctx.closePath();
        ctx.fillStyle = "red";
        ctx.fill();
      }
    }
  }

  window.timerInstance = new WSTimer("timerCanvas");

  // Event-Listener für Zeit hinzufügen-Buttons
  document.getElementById("add1").addEventListener("click", () => {
    timerInstance.remainingTime = Math.min(timerInstance.remainingTime + 60, 3600);
    timerInstance.updateDigitalTimer();
    timerInstance.drawTimer();
  });
  document.getElementById("add5").addEventListener("click", () => {
    timerInstance.remainingTime = Math.min(timerInstance.remainingTime + 300, 3600);
    timerInstance.updateDigitalTimer();
    timerInstance.drawTimer();
  });
})();
