export interface AudioFeatures {
  avgPitch: number;
  pitchVariability: number;
  speechPace: number;
  energy: number;
  pauseRatio: number;
}

export interface EmotionPoint {
  arousal: number; // -1 to 1
  valence: number; // -1 to 1
  label: string;
}

export function analyzeAudioBuffer(buffer: AudioBuffer): AudioFeatures {
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;

  // RMS energy
  let sumSq = 0;
  for (let i = 0; i < data.length; i++) sumSq += data[i] * data[i];
  const energy = Math.sqrt(sumSq / data.length);

  // Zero-crossing rate (speech pace proxy)
  let zeroCrossings = 0;
  for (let i = 1; i < data.length; i++) {
    if ((data[i] >= 0 && data[i - 1] < 0) || (data[i] < 0 && data[i - 1] >= 0)) {
      zeroCrossings++;
    }
  }
  const speechPace = zeroCrossings / (data.length / sampleRate);

  // Pitch via autocorrelation on frames
  const frameSize = 2048;
  const hopSize = 1024;
  const pitches: number[] = [];
  const silenceThreshold = 0.01;
  let silentFrames = 0;
  let totalFrames = 0;

  for (let start = 0; start + frameSize < data.length; start += hopSize) {
    totalFrames++;
    const frame = data.slice(start, start + frameSize);

    // Check if frame is silent
    let frameEnergy = 0;
    for (let i = 0; i < frame.length; i++) frameEnergy += frame[i] * frame[i];
    frameEnergy = Math.sqrt(frameEnergy / frame.length);

    if (frameEnergy < silenceThreshold) {
      silentFrames++;
      continue;
    }

    const pitch = detectPitch(frame, sampleRate);
    if (pitch > 50 && pitch < 500) pitches.push(pitch);
  }

  const avgPitch = pitches.length > 0 ? pitches.reduce((a, b) => a + b, 0) / pitches.length : 0;
  const pitchVariability = pitches.length > 1
    ? Math.sqrt(pitches.reduce((sum, p) => sum + (p - avgPitch) ** 2, 0) / pitches.length)
    : 0;
  const pauseRatio = totalFrames > 0 ? silentFrames / totalFrames : 0;

  return { avgPitch, pitchVariability, speechPace, energy, pauseRatio };
}

function detectPitch(frame: Float32Array, sampleRate: number): number {
  // Autocorrelation method
  const size = frame.length;
  const correlation = new Float32Array(size);

  for (let lag = 0; lag < size; lag++) {
    let sum = 0;
    for (let i = 0; i < size - lag; i++) {
      sum += frame[i] * frame[i + lag];
    }
    correlation[lag] = sum;
  }

  // Find first peak after first dip
  const minLag = Math.floor(sampleRate / 500); // 500Hz max
  const maxLag = Math.floor(sampleRate / 50);  // 50Hz min

  let foundDip = false;
  let bestLag = 0;
  let bestVal = 0;

  for (let lag = minLag; lag < Math.min(maxLag, size); lag++) {
    if (!foundDip && correlation[lag] < correlation[lag - 1]) {
      foundDip = true;
    }
    if (foundDip && correlation[lag] > bestVal) {
      bestVal = correlation[lag];
      bestLag = lag;
    }
  }

  return bestLag > 0 ? sampleRate / bestLag : 0;
}

export function inferEmotion(features: AudioFeatures): EmotionPoint {
  // Normalize features to -1..1 range (approximate)
  const pitchNorm = Math.min(1, Math.max(-1, (features.avgPitch - 180) / 120));
  const varNorm = Math.min(1, Math.max(-1, (features.pitchVariability - 30) / 40));
  const paceNorm = Math.min(1, Math.max(-1, (features.speechPace - 1500) / 1000));
  const energyNorm = Math.min(1, Math.max(-1, (features.energy - 0.05) / 0.1));

  // Arousal: high pitch + fast pace + high energy + high variability
  const arousal = Math.min(1, Math.max(-1,
    0.3 * pitchNorm + 0.25 * paceNorm + 0.25 * energyNorm + 0.2 * varNorm
  ));

  // Valence: moderate pitch + moderate variability + low pause ratio = positive
  const valence = Math.min(1, Math.max(-1,
    0.2 * pitchNorm + 0.3 * varNorm - 0.2 * (features.pauseRatio - 0.3) * 3 + 0.3 * energyNorm
  ));

  const label = getEmotionLabel(arousal, valence);
  return { arousal, valence, label };
}

function getEmotionLabel(arousal: number, valence: number): string {
  if (arousal > 0.3 && valence > 0.3) return 'Excited';
  if (arousal > 0.3 && valence < -0.3) return 'Anxious';
  if (arousal < -0.3 && valence > 0.3) return 'Calm';
  if (arousal < -0.3 && valence < -0.3) return 'Sad';
  if (arousal > 0.3 && Math.abs(valence) <= 0.3) return 'Energized';
  if (arousal < -0.3 && Math.abs(valence) <= 0.3) return 'Relaxed';
  if (Math.abs(arousal) <= 0.3 && valence > 0.3) return 'Content';
  if (Math.abs(arousal) <= 0.3 && valence < -0.3) return 'Melancholy';
  return 'Neutral';
}

export function getRealTimeFeatures(analyser: AnalyserNode): { waveform: Float32Array; rms: number } {
  const waveform = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(waveform);
  let sumSq = 0;
  for (let i = 0; i < waveform.length; i++) sumSq += waveform[i] * waveform[i];
  return { waveform, rms: Math.sqrt(sumSq / waveform.length) };
}
