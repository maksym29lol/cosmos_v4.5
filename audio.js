// ── GENERATIVE AUDIO ENGINE ──
let audioCtx = null;
let osc1, osc2, lfo, gainNode;
let isAudioPlaying = false;

function toggleAudio() {
  const btn = document.getElementById('btn-audio');
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    osc1 = audioCtx.createOscillator();
    osc2 = audioCtx.createOscillator();
    lfo = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();
    
    // Deep drone setup
    osc1.type = 'sine';
    osc1.frequency.value = 55; // A1
    
    osc2.type = 'triangle';
    osc2.frequency.value = 110; // A2
    
    // LFO for slow pulsing volume
    lfo.type = 'sine';
    lfo.frequency.value = 0.05; // 20 second cycle
    
    let lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 0.5;
    
    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);
    
    gainNode.gain.value = 0.15; // Base volume very low
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc1.start();
    osc2.start();
    lfo.start();
  }

  if (isAudioPlaying) {
    audioCtx.suspend();
    btn.classList.remove('active');
    showToast("Космічне Радіо вимкнено", "🔇");
  } else {
    audioCtx.resume();
    btn.classList.add('active');
    showToast("Відтворення: Сигнал Глибокого Космосу", "📡");
  }
  isAudioPlaying = !isAudioPlaying;
}
