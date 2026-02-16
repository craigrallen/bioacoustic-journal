interface Props {
  isRecording: boolean;
  elapsed: number;
  maxDuration: number;
  onToggle: () => void;
}

export default function RecordButton({ isRecording, elapsed, maxDuration, onToggle }: Props) {
  const progress = elapsed / maxDuration;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const remaining = Math.max(0, maxDuration - elapsed);

  return (
    <div className="relative flex items-center justify-center" onClick={onToggle}>
      {/* Circular progress */}
      <svg width="180" height="180" className="absolute">
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke="rgba(139, 92, 246, 0.15)"
          strokeWidth="6"
        />
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke="url(#progressGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 90 90)"
          className="transition-all duration-200"
        />
        <defs>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>

      {/* Button */}
      <button
        className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
          isRecording
            ? 'bg-gradient-to-br from-red-500 to-pink-600 shadow-[0_0_40px_rgba(239,68,68,0.4)] scale-95'
            : 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-[0_0_40px_rgba(139,92,246,0.3)] hover:scale-105'
        }`}
      >
        {isRecording ? (
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-sm bg-white" />
            <span className="text-white text-xs mt-1 font-mono">{remaining}s</span>
          </div>
        ) : (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm-1 14.93A7.01 7.01 0 0 1 5 9h2a5 5 0 0 0 10 0h2a7.01 7.01 0 0 1-6 6.93V20h4v2H7v-2h4v-4.07z" />
          </svg>
        )}
      </button>
    </div>
  );
}
