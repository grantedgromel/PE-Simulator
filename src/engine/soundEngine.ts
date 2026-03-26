/**
 * Procedural sound engine using Web Audio API.
 * No audio files — all sounds generated from oscillators and noise.
 */

let audioContext: AudioContext | null = null
let masterGain: GainNode | null = null
let muted = false
let volume = 0.3

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
    masterGain = audioContext.createGain()
    masterGain.gain.value = muted ? 0 : volume
    masterGain.connect(audioContext.destination)
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
  return audioContext
}

function getGain(): GainNode {
  getContext()
  return masterGain!
}

export function setMuted(m: boolean) {
  muted = m
  if (masterGain) masterGain.gain.value = m ? 0 : volume
}

export function setVolume(v: number) {
  volume = Math.max(0, Math.min(1, v))
  if (masterGain && !muted) masterGain.gain.value = volume
}

export function isMuted(): boolean { return muted }
export function getVolume(): number { return volume }

// === SOUND GENERATORS ===

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volumeMult: number = 1) {
  const ctx = getContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.15 * volumeMult, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  osc.connect(gain)
  gain.connect(getGain())
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

function playNoise(duration: number, volumeMult: number = 0.3) {
  const ctx = getContext()
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.05 * volumeMult, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  source.connect(gain)
  gain.connect(getGain())
  source.start()
}

// === GAME SOUNDS ===

export function playEbitdaIncrease(magnitude: number = 1) {
  const vol = Math.min(2, 0.5 + magnitude)
  playTone(880, 0.3, 'sine', vol)
  setTimeout(() => playTone(1100, 0.2, 'sine', vol * 0.7), 100)
}

export function playEbitdaDecrease(magnitude: number = 1) {
  const vol = Math.min(2, 0.5 + magnitude)
  playTone(330, 0.4, 'triangle', vol)
}

export function playRecordEbitda() {
  playTone(660, 0.2, 'sine', 1.2)
  setTimeout(() => playTone(880, 0.2, 'sine', 1), 100)
  setTimeout(() => playTone(1100, 0.3, 'sine', 0.8), 200)
}

export function playDealClose() {
  playNoise(0.1, 0.5)
  setTimeout(() => playTone(440, 0.15, 'square', 0.4), 100)
  setTimeout(() => playTone(660, 0.3, 'sine', 0.6), 200)
}

export function playCashFlow(isIncoming: boolean = true) {
  if (isIncoming) {
    playTone(523, 0.15, 'sine', 0.4)
    setTimeout(() => playTone(659, 0.15, 'sine', 0.3), 80)
  } else {
    playTone(392, 0.2, 'triangle', 0.3)
  }
}

export function playCostCut() {
  playNoise(0.05, 0.3) // cash register
  playTone(770, 0.15, 'sine', 0.5)
}

export function playDividendRecap() {
  playCashFlow(true)
  setTimeout(() => playTone(220, 0.5, 'triangle', 0.2), 300) // structural creak
}

export function playCovenantBreach() {
  playTone(110, 0.8, 'sawtooth', 0.3)
  setTimeout(() => playTone(100, 0.6, 'sawtooth', 0.2), 200)
}

export function playWriteOff() {
  // Silence. The absence of reward is the feedback.
}

export function playExitSuccess(proceeds: number) {
  const vol = Math.min(2, 0.5 + proceeds / 50)
  playCashFlow(true)
  setTimeout(() => playTone(880, 0.3, 'sine', vol), 200)
  setTimeout(() => playTone(1100, 0.4, 'sine', vol * 0.7), 350)
}

export function playQuarterlyPulse(positive: boolean) {
  if (positive) {
    playTone(440, 0.3, 'sine', 0.4)
    playTone(554, 0.3, 'sine', 0.3)
    playTone(659, 0.4, 'sine', 0.3)
  } else {
    playTone(415, 0.3, 'sine', 0.4)
    playTone(494, 0.3, 'triangle', 0.3)
    playTone(370, 0.5, 'triangle', 0.3)
  }
}

export function playOPDeployment() {
  playTone(330, 0.1, 'sine', 0.2)
  setTimeout(() => playTone(440, 0.1, 'sine', 0.2), 100)
  setTimeout(() => playTone(550, 0.2, 'sine', 0.3), 200)
}

export function playConsultantArrive() {
  playTone(1200, 0.05, 'square', 0.2) // presentation clicker
  setTimeout(() => playTone(1200, 0.05, 'square', 0.15), 300)
}

export function playLawyerTick() {
  playTone(2000, 0.02, 'square', 0.1)
}
