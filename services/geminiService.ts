import { GoogleGenAI, Modality } from "@google/genai";
import { Song, Language } from '../types';

// Initialize Gemini Client
// NOTE: In a real app, never expose API keys on the client side.
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateLyrics = async (topic: string, language: Language): Promise<string> => {
  const client = getClient();
  if (!client) throw new Error("API Client not initialized");

  const prompt = `Write a short, rhythmic rhyme or song lyrics in ${language} about: ${topic}. 
  Keep it under 8 lines. Structure it clearly. 
  If it is Telugu, provide the script and a phonetic English transliteration in brackets.`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Failed to generate lyrics.";
  } catch (error) {
    console.error("Lyrics generation failed", error);
    throw error;
  }
};

/**
 * Uses Gemini TTS to generate audio.
 * Since direct "Music Generation" with instruments isn't a standard public endpoint yet,
 * we utilize the advanced Speech generation which can handle rhythmic speech/poetry.
 */
export const generateAudioFromLyrics = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const client = getClient();
  if (!client) throw new Error("API Client not initialized");

  try {
    // We use the TTS model
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data received");
    }

    // Convert base64 to Blob URL
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/mp3' }); // Gemini returns raw, but browser often handles as mp3/wav container context
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Audio generation failed", error);
    throw error;
  }
};

export const getRandomCoverImage = () => {
  const id = Math.floor(Math.random() * 100);
  return `https://picsum.photos/id/${id}/400/400`;
};