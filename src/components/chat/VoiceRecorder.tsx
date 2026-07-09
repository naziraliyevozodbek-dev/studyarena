import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';

interface VoiceRecorderProps {
  onSend: (file: File) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioChunks(chunks);
        setRecordedUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      alert("Mikrofonga ruxsat yo'q yoki xatolik yuz berdi.");
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSend = () => {
    if (audioChunks.length > 0) {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
      onSend(file);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-3 w-full bg-bg-secondary rounded-2xl p-2 border border-border">
      {isRecording ? (
        <>
          <button 
            onClick={stopRecording}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-error/20 text-error hover:bg-error/30 transition-colors"
          >
            <Square size={16} fill="currentColor" />
          </button>
          <div className="flex-1 flex items-center justify-center gap-2 text-error font-medium">
            <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
            {formatTime(recordingTime)}
          </div>
          <button 
            onClick={() => {
              stopRecording();
              onCancel();
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-tertiary text-text-secondary transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </>
      ) : recordedUrl ? (
        <>
          <button onClick={onCancel} className="p-2 text-text-secondary hover:text-error">
            <Trash2 size={20} />
          </button>
          <div className="flex-1">
            <audio src={recordedUrl!} controls className="w-full h-8" />
          </div>
          <button 
            onClick={handleSend}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white"
          >
            <Send size={18} className="ml-1" />
          </button>
        </>
      ) : null}
      
      {!isRecording && !recordedUrl && (
        <button onClick={onCancel} className="ml-auto p-2 text-text-secondary">
          Bekor qilish
        </button>
      )}
    </div>
  );
}
