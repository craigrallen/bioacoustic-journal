import type { EmotionPoint } from '../lib/audioAnalysis';

interface Props {
  emotion: EmotionPoint | null;
}

const EMOTIONS = [
  { label: 'Excited', x: 0.7, y: -0.7 },
  { label: 'Happy', x: 0.9, y: -0.2 },
  { label: 'Content', x: 0.7, y: 0.5 },
  { label: 'Calm', x: 0.3, y: 0.8 },
  { label: 'Sad', x: -0.7, y: 0.7 },
  { label: 'Anxious', x: -0.5, y: -0.7 },
  { label: 'Angry', x: -0.8, y: -0.3 },
  { label: 'Neutral', x: 0, y: 0 },
];

export default function EmotionWheel({ emotion }: Props) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 20;

  const dotX = emotion ? cx + emotion.valence * r * 0.8 : cx;
  const dotY = emotion ? cy - emotion.arousal * r * 0.8 : cy;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="drop-shadow-lg">
        {/* Background circles */}
        {[1, 0.66, 0.33].map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r * s}
            fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="1" />
        ))}
        {/* Axes */}
        <line x1={cx} y1={20} x2={cx} y2={size - 20} stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
        <line x1={20} y1={cy} x2={size - 20} y2={cy} stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
        {/* Labels */}
        <text x={cx} y={16} textAnchor="middle" fill="#94a3b8" fontSize="10">High Arousal</text>
        <text x={cx} y={size - 6} textAnchor="middle" fill="#94a3b8" fontSize="10">Low Arousal</text>
        <text x={size - 4} y={cy - 6} textAnchor="end" fill="#94a3b8" fontSize="10">Positive</text>
        <text x={4} y={cy - 6} textAnchor="start" fill="#94a3b8" fontSize="10">Negative</text>
        {/* Emotion labels */}
        {EMOTIONS.filter(e => e.label !== 'Neutral').map(e => (
          <text key={e.label} x={cx + e.x * r * 0.65} y={cy - e.y * r * 0.65}
            textAnchor="middle" fill="rgba(139,92,246,0.4)" fontSize="9">{e.label}</text>
        ))}
        {/* Current emotion dot */}
        {emotion && (
          <>
            <circle cx={dotX} cy={dotY} r="16" fill="url(#dotGrad)" opacity="0.3" />
            <circle cx={dotX} cy={dotY} r="8" fill="url(#dotGrad)" className="drop-shadow-lg" />
          </>
        )}
        <defs>
          <radialGradient id="dotGrad">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </radialGradient>
        </defs>
      </svg>
      {emotion && (
        <div className="text-center">
          <span className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {emotion.label}
          </span>
          <div className="text-xs text-slate-500 mt-0.5">
            Arousal: {emotion.arousal.toFixed(2)} · Valence: {emotion.valence.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
