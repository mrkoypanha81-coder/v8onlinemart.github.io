// =========================================================================
// WEB AUDIO API REAL-TIME POS RINGTONE & NOTIFICATION SOUND SYNTHESIZER
// Multi-Event Sound Engine: New Order, Low Stock Alert, Delivery, Registration
// No external mp3 dependency required - works across all browsers & OS!
// =========================================================================

const playTone = (ctx, freq, startTime, duration, type = 'sine', volume = 0.35) => {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

    // Envelope: Fast attack, exponential decay
    gain.gain.setValueAtTime(volume, ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration);
  } catch (e) {
    console.error('Tone synth error', e);
  }
};

// 1. POS Cash Register New Order Chime Ringtone (C5 -> E5 -> G5 -> C6)
export const playNewOrderRingtone = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    playTone(ctx, 523.25, 0, 0.18, 'triangle', 0.4);     // C5
    playTone(ctx, 659.25, 0.12, 0.2, 'triangle', 0.4);   // E5
    playTone(ctx, 783.99, 0.24, 0.22, 'triangle', 0.45);  // G5
    playTone(ctx, 1046.50, 0.36, 0.7, 'sine', 0.5);      // C6 (Clear sustained bell)
  } catch (err) {
    console.warn('AudioContext error:', err);
  }
};

// 2. Urgent Low Stock Warning Ringtone (Double Beep Alert!)
export const playStockAlertRingtone = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    playTone(ctx, 880.00, 0, 0.15, 'sawtooth', 0.3);    // A5
    playTone(ctx, 880.00, 0.18, 0.2, 'sawtooth', 0.35); // A5 (Urgent double chime)
  } catch (err) {
    console.warn('AudioContext error:', err);
  }
};

// 3. Delivery Tracking Success Ringtone (Friendly Upward Chime)
export const playDeliveryRingtone = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    playTone(ctx, 587.33, 0, 0.15, 'sine', 0.35);    // D5
    playTone(ctx, 739.99, 0.12, 0.18, 'sine', 0.4);   // F#5
    playTone(ctx, 880.00, 0.24, 0.4, 'sine', 0.45);   // A5
  } catch (err) {
    console.warn('AudioContext error:', err);
  }
};

// 4. New Customer Registration Ringtone (Pop Bell)
export const playCustomerAlertRingtone = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    playTone(ctx, 659.25, 0, 0.15, 'triangle', 0.35);  // E5
    playTone(ctx, 987.77, 0.15, 0.35, 'sine', 0.45);   // B5
  } catch (err) {
    console.warn('AudioContext error:', err);
  }
};

// Central Ringtone Dispatcher
export const playNotificationSound = (type = 'order') => {
  switch (type) {
    case 'order':
      playNewOrderRingtone();
      break;
    case 'stock':
      playStockAlertRingtone();
      break;
    case 'delivery':
      playDeliveryRingtone();
      break;
    case 'customer':
      playCustomerAlertRingtone();
      break;
    default:
      playNewOrderRingtone();
      break;
  }
};

export const playTestRingtone = () => {
  playNewOrderRingtone();
};
