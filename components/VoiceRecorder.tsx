import React, { useState, useRef } from 'react';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        onRecordingComplete(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-homa-gray rounded-xl border border-homa-orange/20">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-white">Voice Cloning Studio</h3>
        <p className="text-sm text-gray-400">Read the following text clearly to clone your voice:</p>
        <p className="italic text-homa-orange p-3 bg-black/30 rounded-lg">
          "The quick brown fox jumps over the lazy dog. I am ready to sing with the Homa Band."
        </p>
      </div>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`
          w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
          ${isRecording ? 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]' : 'bg-homa-orange hover:bg-orange-500'}
        `}
      >
        {isRecording ? (
          <div className="w-6 h-6 bg-white rounded-sm" />
        ) : (
          <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {isRecording && (
        <div className="flex items-center gap-2 text-red-500 font-mono">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Recording: 00:{recordingTime.toString().padStart(2, '0')}
        </div>
      )}
    </div>
  );
};