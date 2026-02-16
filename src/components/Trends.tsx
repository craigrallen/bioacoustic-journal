import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { JournalEntry } from '../lib/db';

interface Props {
  entries: JournalEntry[];
}

export default function Trends({ entries }: Props) {
  if (entries.length < 2) {
    return (
      <div className="text-center text-slate-500 py-8">
        <p>Need at least 2 entries to show trends</p>
      </div>
    );
  }

  const data = [...entries].reverse().map(e => ({
    date: new Date(e.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    arousal: +(e.emotion.arousal).toFixed(2),
    valence: +(e.emotion.valence).toFixed(2),
    pitch: +e.features.avgPitch.toFixed(0),
    energy: +(e.features.energy * 100).toFixed(0),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-slate-400 mb-3">Emotion Dimensions</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis domain={[-1, 1]} tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1a1a3e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8 }} />
            <Line type="monotone" dataKey="arousal" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Arousal" />
            <Line type="monotone" dataKey="valence" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} name="Valence" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-400 mb-3">Vocal Biomarkers</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1a1a3e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8 }} />
            <Line type="monotone" dataKey="pitch" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Pitch (Hz)" />
            <Line type="monotone" dataKey="energy" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} name="Energy %" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
