import { useState, useRef, useCallback, useEffect } from 'react';
import RecordButton from './components/RecordButton';
import Waveform from './components/Waveform';
import EmotionWheel from './components/EmotionWheel';
import Timeline from './components/Timeline';
import Trends from './components/Trends';
import { analyzeAudioBuffer, inferEmotion, type EmotionPoint, type AudioFeatures } from './lib/audioAnalysis';
import { saveAudioBlob, saveEntry, getEntries, type JournalEntry } from './lib/db';

type Tab = 'record' | 'timeline' | 'trends';
const MAX_DURATION = 60;

export default function App() {
  const [tab, setTab] = useState<Tab>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [lastEmotion, setLastEmotion] = useState<EmotionPoint | null>(null);
  const [lastFeatures, setLastFeatures] = useState<AudioFeatures | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>(getEntries);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const stopRecording = useCallback(async () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === 'inactive') return;
    
    return new Promise<void>((resolve) => {
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);

        // Decode and analyze
        const actx = audioContextRef.current || new AudioContext();
        try {
          const arrayBuf = await blob.arrayBuffer();
          const audioBuffer = await actx.decodeAudioData(arrayBuf);
          const features = analyzeAudioBuffer(audioBuffer);
          const emotion = inferEmotion(features);

          const id = `entry-${Date.now()}`;
          await saveAudioBlob(id, blob);
          const entry: JournalEntry = { id, timestamp: Date.now(), duration, features, emotion };
          saveEntry(entry);
          setEntries(getEntries());
          setLastEmotion(emotion);
          setLastFeatures(features);
        } catch (e) {
          console.error('Analysis failed:', e);
        }

        clearInterval(timerRef.current);
        setIsRecording(false);
        setElapsed(0);
        resolve();
      };
      mr.stop();
    });
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const actx = new AudioContext();
      audioContextRef.current = actx;
      const source = actx.createMediaStreamSource(stream);
      const analyserNode = actx.createAnalyser();
      analyserNode.fftSize = 2048;
      source.connect(analyserNode);
      setAnalyser(analyserNode);

      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorderRef.current = mr;
      mr.start(100);

      startTimeRef.current = Date.now();
      setIsRecording(true);
      setLastEmotion(null);
      setLastFeatures(null);

      timerRef.current = window.setInterval(() => {
        const s = Math.round((Date.now() - startTimeRef.current) / 1000);
        setElapsed(s);
        if (s >= MAX_DURATION) stopRecording();
      }, 200);
    } catch (e) {
      console.error('Mic access denied:', e);
    }
  }, [stopRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  // Cleanup
  useEffect(() => {
    return () => { clearInterval(timerRef.current); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
          Bioacoustic Journal
        </h1>
        <p className="text-xs text-slate-500 mt-1">Your voice is your journal</p>
      </header>

      {/* Tabs */}
      <nav className="flex gap-1 bg-[#12122a] rounded-xl p-1 mb-6">
        {(['record', 'timeline', 'trends'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm rounded-lg transition cursor-pointer ${
              tab === t ? 'bg-purple-600/30 text-purple-300 font-medium' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t === 'record' ? '🎙 Record' : t === 'timeline' ? '📋 Timeline' : '📈 Trends'}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1">
        {tab === 'record' && (
          <div className="flex flex-col items-center gap-8">
            <Waveform analyser={analyser} isRecording={isRecording} />
            <RecordButton
              isRecording={isRecording}
              elapsed={elapsed}
              maxDuration={MAX_DURATION}
              onToggle={toggleRecording}
            />
            {isRecording && (
              <p className="text-sm text-slate-400 animate-pulse">Listening to your voice...</p>
            )}
            {!isRecording && lastEmotion && lastFeatures && (
              <div className="w-full space-y-6">
                <EmotionWheel emotion={lastEmotion} />
                <div className="grid grid-cols-2 gap-3 text-center">
                  {[
                    { label: 'Pitch', value: `${lastFeatures.avgPitch.toFixed(0)} Hz` },
                    { label: 'Variability', value: `${lastFeatures.pitchVariability.toFixed(1)} Hz` },
                    { label: 'Speech Pace', value: `${lastFeatures.speechPace.toFixed(0)} ZCR` },
                    { label: 'Energy', value: `${(lastFeatures.energy * 100).toFixed(1)}%` },
                    { label: 'Pause Ratio', value: `${(lastFeatures.pauseRatio * 100).toFixed(0)}%` },
                  ].map(m => (
                    <div key={m.label} className="bg-[#1a1a3e]/60 rounded-xl p-3 border border-purple-500/10">
                      <div className="text-xs text-slate-500">{m.label}</div>
                      <div className="text-lg font-semibold text-purple-300">{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {tab === 'timeline' && (
          <Timeline entries={entries} onDelete={(id) => setEntries(prev => prev.filter(e => e.id !== id))} />
        )}
        {tab === 'trends' && <Trends entries={entries} />}
      </main>
    </div>
  );
}
