import React, { useState, useEffect } from 'react';
import { Logo } from './components/Logo';
import { AudioPlayer } from './components/AudioPlayer';
import { VoiceRecorder } from './components/VoiceRecorder';
import { generateLyrics, generateAudioFromLyrics, getRandomCoverImage } from './services/geminiService';
import { Song, Language, Voice } from './types';
import { GoogleGenAI } from "@google/genai";

// --- Constants ---
const PREMADE_VOICES: Voice[] = [
  { id: 'Kore', name: 'Kore (Warm)', type: 'premade' },
  { id: 'Fenrir', name: 'Fenrir (Deep)', type: 'premade' },
  { id: 'Puck', name: 'Puck (Energetic)', type: 'premade' },
  { id: 'Zephyr', name: 'Zephyr (Soft)', type: 'premade' },
  { id: 'Charon', name: 'Charon (Steady)', type: 'premade' },
];

const NAV_ITEMS = [
  { id: 'create', label: 'Create', icon: (active: boolean) => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={active ? "#FF8C00" : "currentColor"}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg> },
  { id: 'library', label: 'Library', icon: (active: boolean) => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={active ? "#FF8C00" : "currentColor"}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg> },
  { id: 'voices', label: 'Voices', icon: (active: boolean) => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={active ? "#FF8C00" : "currentColor"}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg> },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('create');
  const [songs, setSongs] = useState<Song[]>([]);
  const [customVoices, setCustomVoices] = useState<Voice[]>([]);
  
  // Create Form State
  const [inputMode, setInputMode] = useState<'topic' | 'lyrics'>('topic');
  const [inputText, setInputText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.ENGLISH);
  const [selectedVoice, setSelectedVoice] = useState<string>(PREMADE_VOICES[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Player State
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);

  const currentSong = songs.find(s => s.id === currentSongId);

  // --- Handlers ---

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    if (!process.env.API_KEY) {
        alert("Please set the API_KEY in the environment variables.");
        return;
    }

    setIsGenerating(true);
    
    // We generate 2 versions like Suno
    const batchId = Date.now().toString();
    const tempSongs: Song[] = [1, 2].map(i => ({
      id: `${batchId}-${i}`,
      title: inputMode === 'topic' ? inputText : "Custom Lyrics",
      lyrics: "Generating...",
      audioUrl: null,
      coverImage: getRandomCoverImage(),
      createdAt: new Date(),
      duration: "--:--",
      style: "HOMA Style",
      language: selectedLanguage,
      status: 'generating'
    }));

    setSongs(prev => [...tempSongs, ...prev]);
    setActiveTab('library'); // Switch to library to see progress

    try {
      // Step 1: Get Lyrics if Topic
      let lyricsToUse = inputText;
      if (inputMode === 'topic') {
        lyricsToUse = await generateLyrics(inputText, selectedLanguage);
      }

      // Step 2: Generate Audio for both versions (using different voices or slight prompts if possible, here we iterate voices)
      // For demo variation: If user selected 'Kore', we might use 'Fenrir' for the second version automatically to give variety
      
      const generationPromises = tempSongs.map(async (song, index) => {
        try {
           // Variation logic: Use selected voice for #1, and a random different one for #2 to show range
           const voiceIdToUse = index === 0 ? selectedVoice : PREMADE_VOICES[(PREMADE_VOICES.findIndex(v=>v.id===selectedVoice)+1) % PREMADE_VOICES.length].id;
           
           // If custom voice, we fallback to a specific premade one for now as API doesn't support instant cloning upload yet
           // In a real production app with custom backend, we'd send the voice ID.
           const effectiveVoiceId = customVoices.find(v => v.id === voiceIdToUse) ? 'Kore' : voiceIdToUse;
           
           const audioUrl = await generateAudioFromLyrics(lyricsToUse, effectiveVoiceId);
           
           setSongs(prev => prev.map(s => s.id === song.id ? {
             ...s,
             lyrics: lyricsToUse,
             audioUrl: audioUrl,
             status: 'completed',
             duration: "0:45" // Mock duration until we load metadata
           } : s));
        } catch (e) {
          setSongs(prev => prev.map(s => s.id === song.id ? { ...s, status: 'failed' } : s));
        }
      });

      await Promise.all(generationPromises);

    } catch (error) {
      console.error(error);
      // Update status to failed
      setSongs(prev => prev.map(s => s.id.startsWith(batchId) ? { ...s, status: 'failed' } : s));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVoiceRecord = (blob: Blob) => {
    // In a real app, upload blob to backend to train/finetune. 
    // Here we just simulate adding it to the list.
    const newVoice: Voice = {
      id: `custom-${Date.now()}`,
      name: `My Voice ${customVoices.length + 1}`,
      type: 'cloned'
    };
    setCustomVoices([...customVoices, newVoice]);
    alert("Voice profile saved! You can now use it in generations.");
  };

  const downloadSong = (song: Song) => {
    if (song.audioUrl) {
      const link = document.createElement('a');
      link.href = song.audioUrl;
      link.download = `HOMA-${song.title.replace(/\s+/g, '-')}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans text-white bg-black selection:bg-homa-orange selection:text-black">
      {/* Sidebar (Desktop) */}
      <aside className="hidden w-64 border-r border-gray-800 lg:flex lg:flex-col bg-homa-dark">
        <div className="p-8">
          <Logo />
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center w-full gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                activeTab === item.id ? 'bg-gray-800 text-homa-orange' : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
            >
              {item.icon(activeTab === item.id)}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 text-center text-xs text-gray-600">
          v1.0.0 &copy; 2025 HOMA
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed top-0 z-10 flex items-center justify-between w-full p-4 bg-black/90 lg:hidden backdrop-blur">
         <Logo className="scale-75 origin-left" />
         <div className="flex gap-4">
             {NAV_ITEMS.map(item => (
                 <button key={item.id} onClick={() => setActiveTab(item.id)} className={`${activeTab === item.id ? 'text-homa-orange' : 'text-gray-400'}`}>
                     {item.icon(activeTab === item.id)}
                 </button>
             ))}
         </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 h-full pt-20 overflow-y-auto lg:pt-0 pb-28">
        <div className="max-w-5xl p-6 mx-auto space-y-8 lg:p-12">
          
          {/* --- CREATE TAB --- */}
          {activeTab === 'create' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="space-y-2">
                <h2 className="text-4xl font-bold font-display">Create Song</h2>
                <p className="text-gray-400">Turn your ideas into music with the power of HOMA AI.</p>
              </header>

              {/* Input Section */}
              <div className="p-6 space-y-6 border bg-homa-gray rounded-2xl border-gray-800">
                
                {/* Language & Mode Toggle */}
                <div className="flex flex-wrap gap-4">
                   <div className="flex p-1 bg-black rounded-lg">
                      {['topic', 'lyrics'].map(m => (
                        <button
                          key={m}
                          onClick={() => setInputMode(m as any)}
                          className={`px-4 py-2 rounded-md text-sm font-semibold capitalize transition-all ${inputMode === m ? 'bg-homa-orange text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                          {m}
                        </button>
                      ))}
                   </div>
                   <div className="flex p-1 bg-black rounded-lg">
                      {[Language.ENGLISH, Language.TELUGU].map(l => (
                        <button
                          key={l}
                          onClick={() => setSelectedLanguage(l)}
                          className={`px-4 py-2 rounded-md text-sm font-semibold capitalize transition-all ${selectedLanguage === l ? 'bg-homa-orange text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                          {l}
                        </button>
                      ))}
                   </div>
                </div>

                {/* Text Area */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                        {inputMode === 'topic' ? 'What should the song be about?' : 'Enter your lyrics'}
                    </label>
                    <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={inputMode === 'topic' ? "A song about a space traveler finding home..." : "Enter verse 1..."}
                        className="w-full h-40 p-4 text-lg text-white placeholder-gray-600 bg-black border border-gray-700 resize-none rounded-xl focus:border-homa-orange focus:ring-1 focus:ring-homa-orange focus:outline-none"
                    />
                </div>

                {/* Voice Selection */}
                <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-300">Select Voice</label>
                   <select 
                     value={selectedVoice} 
                     onChange={(e) => setSelectedVoice(e.target.value)}
                     className="w-full p-3 text-white bg-black border border-gray-700 rounded-xl focus:border-homa-orange focus:outline-none"
                   >
                      <optgroup label="HOMA Band Voices">
                        {PREMADE_VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </optgroup>
                      {customVoices.length > 0 && (
                        <optgroup label="Your Cloned Voices">
                            {customVoices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </optgroup>
                      )}
                   </select>
                </div>

                {/* Action Button */}
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !inputText}
                    className="w-full py-4 text-xl font-bold text-black transition-all transform shadow-lg rounded-xl bg-homa-orange hover:bg-orange-400 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                   {isGenerating ? (
                     <>
                       <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                       Creating Magic...
                     </>
                   ) : (
                     <>
                       Create <span className="text-sm font-normal">(10 credits)</span>
                     </>
                   )}
                </button>

              </div>
            </div>
          )}

          {/* --- LIBRARY TAB --- */}
          {activeTab === 'library' && (
             <div className="space-y-8 animate-in fade-in duration-500">
               <header>
                 <h2 className="text-4xl font-bold font-display">Your Library</h2>
               </header>
               
               {songs.length === 0 ? (
                 <div className="py-20 text-center">
                    <div className="inline-block p-4 mb-4 rounded-full bg-gray-800/50">
                        <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white">No songs yet</h3>
                    <p className="mt-2 text-gray-400">Create your first masterpiece in the Create tab.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {songs.map(song => (
                        <div key={song.id} className="relative overflow-hidden transition-all border group rounded-2xl bg-homa-gray border-gray-800 hover:border-homa-orange/50">
                            <div className="aspect-square relative bg-gray-900">
                                <img src={song.coverImage} alt={song.title} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/40 group-hover:opacity-100">
                                    {song.status === 'generating' ? (
                                         <div className="w-12 h-12 border-4 rounded-full border-homa-orange border-t-transparent animate-spin"></div>
                                    ) : song.status === 'failed' ? (
                                        <span className="font-bold text-red-500">Failed</span>
                                    ) : (
                                        <button onClick={() => setCurrentSongId(song.id)} className="p-4 text-black transition-transform transform scale-90 bg-white rounded-full hover:scale-100 hover:bg-homa-orange">
                                            <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                        </button>
                                    )}
                                </div>
                                <span className="absolute px-2 py-1 text-xs font-bold text-black rounded top-2 right-2 bg-homa-orange">
                                    {song.language}
                                </span>
                            </div>
                            <div className="p-4">
                                <h3 className="text-lg font-bold text-white truncate">{song.title}</h3>
                                <p className="text-sm text-gray-400 truncate">{song.style}</p>
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-xs text-gray-500">{new Date(song.createdAt).toLocaleDateString()}</span>
                                    <div className="flex gap-2">
                                        <button 
                                          onClick={() => downloadSong(song)} 
                                          disabled={song.status !== 'completed'}
                                          className="p-2 text-gray-400 hover:text-homa-orange disabled:opacity-20"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-white">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {/* Show lyrics preview if expanded could go here */}
                        </div>
                    ))}
                 </div>
               )}
             </div>
          )}

          {/* --- VOICES TAB --- */}
          {activeTab === 'voices' && (
            <div className="space-y-8 animate-in fade-in duration-500">
                <header>
                    <h2 className="text-4xl font-bold font-display">Voice Studio</h2>
                    <p className="text-gray-400">Clone your voice or manage existing profiles.</p>
                </header>

                <div className="grid gap-8 lg:grid-cols-2">
                    <div>
                        <h3 className="mb-4 text-xl font-bold text-white">Record New Voice</h3>
                        <VoiceRecorder onRecordingComplete={handleVoiceRecord} />
                        <div className="p-4 mt-6 text-sm border rounded-lg bg-blue-900/20 border-blue-500/30 text-blue-200">
                            <strong>Tip:</strong> Ensure you are in a quiet room. The clearer the recording, the better the clone will perform in songs.
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="mb-4 text-xl font-bold text-white">My Voices</h3>
                        <div className="space-y-3">
                            {customVoices.length === 0 ? (
                                <div className="p-8 text-center border border-dashed rounded-xl border-gray-700 text-gray-500">
                                    No custom voices yet. Record one!
                                </div>
                            ) : (
                                customVoices.map(voice => (
                                    <div key={voice.id} className="flex items-center justify-between p-4 border rounded-xl bg-homa-gray border-gray-800">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-10 h-10 text-black rounded-full bg-homa-orange font-display">
                                                {voice.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">{voice.name}</div>
                                                <div className="text-xs text-gray-400">Cloned • Ready to use</div>
                                            </div>
                                        </div>
                                        <button className="text-gray-500 hover:text-red-500">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <h3 className="mt-8 mb-4 text-xl font-bold text-white">HOMA Band Preset Voices</h3>
                        <div className="space-y-3 opacity-75">
                            {PREMADE_VOICES.map(voice => (
                                <div key={voice.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/40">
                                     <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-xs text-gray-300">AI</div>
                                     <span className="text-gray-300">{voice.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Player */}
      <AudioPlayer src={currentSong?.audioUrl || null} title={currentSong?.title || ""} />
    </div>
  );
}