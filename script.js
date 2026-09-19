/* ==========================================================================
   A Letter For Almika - Interactive Animation & Magic Particle Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const envelopeStage = document.getElementById('envelope-stage');
  const envelope = document.getElementById('envelope');
  const letter = document.getElementById('letter');
  const waxSeal = document.getElementById('wax-seal');
  const hintBadge = document.getElementById('hint-badge');
  const hintText = document.getElementById('hint-text');
  const soundToggle = document.getElementById('sound-toggle');
  const soundIcon = document.getElementById('sound-icon');
  const replayBtn = document.getElementById('replay-btn');
  const lovePulseBtn = document.getElementById('love-pulse-btn');
  const butterflyContainer = document.getElementById('butterfly-container');
  const heartBurstContainer = document.getElementById('heart-burst-container');

  // State Management: 0 = Closed, 1 = Flap Opened, 2 = Letter Out, 3 = Unfolded
  let currentState = 0;
  let isSoundEnabled = true;

  // Sound Engine using Web Audio API
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    if (!isSoundEnabled) return;
    try {
      initAudio();
      const now = audioCtx.currentTime;

      if (type === 'flap') {
        // Soft paper flap swoosh
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.3);

      } else if (type === 'slide') {
        // Paper slide sound
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(550, now + 0.4);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.4);

      } else if (type === 'unfold') {
        // Magical Arpeggio Chime
        const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
        freqs.forEach((freq, index) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + index * 0.08);
          gain.gain.setValueAtTime(0.12, now + index * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.8);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + index * 0.08);
          osc.stop(now + index * 0.08 + 0.8);
        });

      } else if (type === 'pop') {
        // Heart click pop
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch (e) {
      console.log('Audio playback notice:', e);
    }
  }

  // Toggle Sound Button
  soundToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    isSoundEnabled = !isSoundEnabled;
    soundIcon.textContent = isSoundEnabled ? '🔊' : '🔇';
    soundToggle.childNodes[2].nodeValue = isSoundEnabled ? ' Sound ON' : ' Sound OFF';
  });

  // User Click Handler for Progressive Envelope Unfolding
  function advanceStage() {
    initAudio();

    if (currentState === 0) {
      // Step 1: Flap Opens
      currentState = 1;
      envelopeStage.className = 'envelope-stage state-1';
      hintText.textContent = 'Click the letter to pull it out';
      playSound('flap');

    } else if (currentState === 1) {
      // Step 2: Letter Slides Out
      currentState = 2;
      envelopeStage.className = 'envelope-stage state-2';
      hintText.textContent = 'Click the letter to unfold it';
      playSound('slide');

    } else if (currentState === 2) {
      // Step 3: Letter Unfolds & Releases Magic (Butterflies + Raining Flowers + Message)
      currentState = 3;
      envelopeStage.className = 'envelope-stage state-3';
      letter.classList.add('unfolded-fullscreen');
      hintBadge.style.opacity = '0';
      replayBtn.classList.remove('hidden');

      playSound('unfold');

      // Trigger Butterflies Burst
      spawnPaperButterflies(25);

      // Start Raining Flower Petals
      startFlowerRain();
    }
  }

  // Click Listeners on Envelope & Letter
  envelope.addEventListener('click', (e) => {
    // Only process envelope clicks if in state 0 or state 1
    if (currentState < 2) {
      advanceStage();
    }
  });

  letter.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentState >= 1 && currentState < 3) {
      advanceStage();
    }
  });

  // Replay Functionality
  replayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentState = 0;
    envelopeStage.className = 'envelope-stage state-0';
    letter.classList.remove('unfolded-fullscreen');
    hintBadge.style.opacity = '1';
    hintText.textContent = 'Click the envelope to open it';
    replayBtn.classList.add('hidden');
    butterflyContainer.innerHTML = '';
  });

  // Forgiveness Modal & Logging Engine
  const forgiveBtn = document.getElementById('forgive-btn');
  const forgiveModal = document.getElementById('forgive-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const forgiveYesBtn = document.getElementById('forgive-yes-btn');
  const forgiveNoBtn = document.getElementById('forgive-no-btn');
  const modalButtonsRow = document.getElementById('modal-buttons-row');
  const modalSuccessMsg = document.getElementById('modal-success-msg');

  const adminLogModal = document.getElementById('admin-log-modal');
  const adminCloseBtn = document.getElementById('admin-close-btn');
  const secretAdminBtn = document.getElementById('secret-admin-btn');
  const adminLogList = document.getElementById('admin-log-list');
  const clearLogsBtn = document.getElementById('clear-logs-btn');

  // Open Forgive Modal Prompt
  if (forgiveBtn) {
    forgiveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playSound('pop');
      forgiveModal.classList.remove('hidden');
      createHeartBurst(e.clientX, e.clientY, 10);
    });
  }

  // Close Modal
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      forgiveModal.classList.add('hidden');
    });
  }

  // Handle YES Click - Save Log & Notify Vercel API
  if (forgiveYesBtn) {
    forgiveYesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playSound('unfold');

      const now = new Date();
      const formattedTime = now.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      // 1. Save Log Locally
      const logEntry = {
        action: 'YES - Forgiven! 💖',
        timestamp: formattedTime,
        iso: now.toISOString()
      };

      const existingLogs = JSON.parse(localStorage.getItem('almika_forgiveness_logs') || '[]');
      existingLogs.unshift(logEntry);
      localStorage.setItem('almika_forgiveness_logs', JSON.stringify(existingLogs));

      // 2. Send Log to Vercel Serverless Function (Shows in Vercel Dashboard Logs)
      fetch('/api/log-forgiveness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choice: 'YES - Forgiven!',
          timestamp: now.toISOString()
        })
      }).catch(err => console.log('Log server endpoint note:', err));

      // 3. UI Feedback
      createHeartBurst(window.innerWidth / 2, window.innerHeight / 2, 30);
      modalButtonsRow.classList.add('hidden');
      modalSuccessMsg.classList.remove('hidden');
    });
  }

  // Playful "No" button dodge effect
  if (forgiveNoBtn) {
    let dodgeCount = 0;
    const moveNoBtn = () => {
      dodgeCount++;
      if (dodgeCount > 3) {
        forgiveNoBtn.textContent = "Okay fine, Yes! 💖";
        forgiveNoBtn.style.background = "#ff758c";
        forgiveNoBtn.style.color = "#fff";
      } else {
        const randomX = (Math.random() - 0.5) * 120;
        const randomY = (Math.random() - 0.5) * 60;
        forgiveNoBtn.style.transform = `translate(${randomX}px, ${randomY}px)`;
      }
    };
    forgiveNoBtn.addEventListener('mouseover', moveNoBtn);
    forgiveNoBtn.addEventListener('click', moveNoBtn);
  }

  // Admin Dashboard Log Viewer
  function renderAdminLogs() {
    const logs = JSON.parse(localStorage.getItem('almika_forgiveness_logs') || '[]');
    if (logs.length === 0) {
      adminLogList.innerHTML = '<div class="no-logs-msg">No logs recorded yet. Waiting for Almika to press Yes! 💖</div>';
    } else {
      adminLogList.innerHTML = logs.map(item => `
        <div class="admin-log-item">
          <span class="log-action">🎉 ${item.action}</span>
          <span class="log-time">🕒 ${item.timestamp}</span>
        </div>
      `).join('');
    }
  }

  if (secretAdminBtn) {
    secretAdminBtn.addEventListener('click', () => {
      renderAdminLogs();
      adminLogModal.classList.remove('hidden');
    });
  }

  if (adminCloseBtn) {
    adminCloseBtn.addEventListener('click', () => {
      adminLogModal.classList.add('hidden');
    });
  }

  if (clearLogsBtn) {
    clearLogsBtn.addEventListener('click', () => {
      localStorage.removeItem('almika_forgiveness_logs');
      renderAdminLogs();
    });
  }

  // Shortcut key (Ctrl + Shift + L) to open Admin Logs
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
      renderAdminLogs();
      adminLogModal.classList.remove('hidden');
    }
  });

  // ==========================================================================
  // Dynamic 3D Paper Butterfly Spawner
  // ==========================================================================
  function spawnPaperButterflies(count) {
    butterflyContainer.innerHTML = '';
    const rect = envelopeStage.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
      const butterfly = document.createElement('div');
      butterfly.className = 'paper-butterfly';

      const wingLeft = document.createElement('div');
      wingLeft.className = 'butterfly-wing-left';

      const wingRight = document.createElement('div');
      wingRight.className = 'butterfly-wing-right';

      butterfly.appendChild(wingLeft);
      butterfly.appendChild(wingRight);

      // Random color variations for butterflies
      const hue = Math.floor(Math.random() * 40) + 330; // Pink/red/magenta shades
      wingLeft.style.background = `linear-gradient(135deg, hsl(${hue}, 100%, 85%), hsl(${hue + 20}, 100%, 70%))`;
      wingRight.style.background = `linear-gradient(135deg, hsl(${hue}, 100%, 85%), hsl(${hue + 20}, 100%, 70%))`;

      butterfly.style.left = `${startX}px`;
      butterfly.style.top = `${startY}px`;

      butterflyContainer.appendChild(butterfly);

      // Animate trajectory using Web Animations API
      const targetX = (Math.random() - 0.5) * window.innerWidth * 1.2;
      const targetY = -Math.random() * window.innerHeight * 0.8 - 100;
      const scale = Math.random() * 0.6 + 0.6;
      const rotation = (Math.random() - 0.5) * 60;
      const duration = Math.random() * 3000 + 3500;
      const delay = Math.random() * 800;

      butterfly.animate([
        {
          transform: `translate(0, 0) scale(0.2) rotate(0deg)`,
          opacity: 0
        },
        {
          opacity: 1,
          offset: 0.15
        },
        {
          transform: `translate(${targetX}px, ${targetY}px) scale(${scale}) rotate(${rotation}deg)`,
          opacity: 0
        }
      ], {
        duration: duration,
        delay: delay,
        easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        fill: 'forwards'
      });
    }
  }

  // Floating Heart Particles Generator
  function createHeartBurst(x, y, count) {
    const emojis = ['💖', '💕', '💗', '❤️', '🌸', '✨'];
    for (let i = 0; i < count; i++) {
      const heart = document.createElement('div');
      heart.className = 'burst-heart';
      heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];

      const dx = (Math.random() - 0.5) * 180;
      const dy = -Math.random() * 150 - 30;
      const rot = (Math.random() - 0.5) * 90;

      heart.style.left = `${x}px`;
      heart.style.top = `${y}px`;
      heart.style.setProperty('--dx', `${dx}px`);
      heart.style.setProperty('--dy', `${dy}px`);
      heart.style.setProperty('--rot', `${rot}deg`);

      heartBurstContainer.appendChild(heart);

      setTimeout(() => {
        heart.remove();
      }, 1800);
    }
  }

  // ==========================================================================
  // Raining Flower Canvas Particle Engine
  // ==========================================================================
  const canvas = document.getElementById('flower-canvas');
  const ctx = canvas.getContext('2d');
  let animationFrameId = null;
  let petals = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Petal {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * canvas.width;
      this.y = initial ? Math.random() * canvas.height : -30;
      this.size = Math.random() * 14 + 10;
      this.speedY = Math.random() * 1.5 + 1.0;
      this.speedX = Math.random() * 0.8 - 0.4;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.03;
      this.oscillationSpeed = Math.random() * 0.02 + 0.01;
      this.oscillationStep = Math.random() * Math.PI * 2;
      this.opacity = Math.random() * 0.7 + 0.3;

      // Color variation: Sakura pinks, gentle peach, rose red
      const colors = [
        { r: 255, g: 182, b: 193 }, // Light pink
        { r: 255, g: 192, b: 203 }, // Pink
        { r: 255, g: 105, b: 180 }, // Hot pink
        { r: 244, g: 63,  b: 94  }, // Rose
        { r: 255, g: 240, b: 245 }  // Lavender blush
      ];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.oscillationStep += this.oscillationSpeed;
      this.x += this.speedX + Math.sin(this.oscillationStep) * 0.8;
      this.y += this.speedY;
      this.rotation += this.rotationSpeed;

      if (this.y > canvas.height + 40 || this.x < -50 || this.x > canvas.width + 50) {
        this.reset(false);
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = this.opacity;

      // Draw a organic flower petal shape
      ctx.beginPath();
      ctx.fillStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
      
      // Petal curve path
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        this.size / 2, -this.size / 2,
        this.size, -this.size / 4,
        this.size, this.size / 2
      );
      ctx.bezierCurveTo(
        this.size / 2, this.size,
        -this.size / 2, this.size,
        0, 0
      );
      ctx.fill();

      // Soft petal center vein highlight
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 255, 255, 0.4)`;
      ctx.lineWidth = 1;
      ctx.moveTo(0, 0);
      ctx.lineTo(this.size * 0.4, this.size * 0.4);
      ctx.stroke();

      ctx.restore();
    }
  }

  function initPetals(count = 60) {
    petals = [];
    for (let i = 0; i < count; i++) {
      petals.push(new Petal());
    }
  }

  function animateFlowerRain() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    petals.forEach((petal) => {
      petal.update();
      petal.draw();
    });
    animationFrameId = requestAnimationFrame(animateFlowerRain);
  }

  function startFlowerRain() {
    if (!animationFrameId) {
      initPetals(65);
      animateFlowerRain();
    }
  }

  // Also start gentle initial flower rain ambiently
  initPetals(30);
  animateFlowerRain();
});
