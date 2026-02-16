import { useState, useRef } from 'react';
import type { JournalEntry } from '../lib/db';
import { getAudioBlob, deleteEntry } from '../lib/db';

interface Props {
  entries: JournalEntry[];
  onDelete: (id: string) => void;
}

const MOOD_COLORS: Record<string, string> = {
  Excited: '#f59e0b',
  Happy: '#22c55e',
  Content: '#3b82f6',
  Calm: '#06b6d4',
  Relaxed: '#14b8a6',
  Sad: '#6366f1',
  Melancholy: '#8b5cf6',
  Anxious: '#ef4444',
  Angry: '#dc2626',
  Energized: '#f97316',
  Passionate: '#ec4899',
  Neutral: '#94a3b8',
};

export default function Timeline({ entries, onDelete }: Props) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = async (id: string) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (playingId === id) { setPlayingId(null); return; }
    const blob = await getAudioBlob(id);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => { setPlayingId(null); URL.revokeObjectURL(url); };
    audio.play();
    audioRef.current = audio;
    setPlayingId(id);
  };

  const handleDelete = (id: string) => {
    if (audioRef.current && playingId === id) { audioRef.current.pause(); }
    deleteEntry(id);
    onDelete(id);
  };

  if (entries.length === 0) {
    return (
      <div className="text-center text-slate-500 py-12">
        <p className="text-lg">No entries yet</p>
        <p className="text-sm mt-1">Record your first voice journal entry</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(entry => {
        const date = new Date(entry.timestamp);
        const color = MOOD_COLORS[entry.emotion.label] || MOOD_COLORS.Neutral;
        return (
          <div key={entry.id}
            className="flex items-center gap-4 p-4 rounded-xl bg-[#1a1a3e]/60 border border-purple-500/10 hover:border-purple-500/30 transition-all"
          >
            {/* Mood indicator */}
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-sm">{entry.emotion.label}</span>
                <span className="text-xs text-slate-500">
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {entry.duration}s · Pitch {entry.features.avgPitch.toFixed(0)}Hz · Energy {(entry.features.energy * 100).toFixed(0)}%
              </div>
            </div>

            {/* Play button */}
            <button onClick={() => play(entry.id)}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-purple-500/20 hover:bg-purple-500/30 transition cursor-pointer shrink-0"
            >
              {playingId === entry.id ? (
                <div className="w-3 h-3 rounded-sm bg-purple-400" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#a78bfa"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>

            {/* Delete */}
            <button onClick={() => handleDelete(entry.id)}
              className="text-slate-600 hover:text-red-400 transition cursor-pointer text-lg shrink-0"
            >×</button>
          </div>
        );
      })}
    </div>
  );
}
