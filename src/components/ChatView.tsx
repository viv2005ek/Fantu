/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react';

import {
  Message,
  ConversationSettings,
  DEFAULT_CONVERSATION_SETTINGS
} from '../types';
import { subscribeToMessages, addMessage, subscribeToConversation, updateConversationSettings } from '../services/firestore';
import { generateAIResponse } from '../services/mockAI';
import { generateAvatarVideo, GooeyVideoResponse } from '../services/gooey';
import { speakText, stopSpeaking } from '../services/tts';
import AvatarSettingsPanel from './AvatarSettingsPanel';
import VideoPlayer, { VideoState } from './VideoPlayer';
import ChatHeader from './ChatHeader';
import TranscriptView from './TranscriptView';
import MessageInput from './MessageInput';

interface ChatViewProps {
  conversationId: string;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function ChatView({ conversationId }: ChatViewProps) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentContext, setAttachmentContext] = useState<string>('');
  const [isProcessingAttachments, setIsProcessingAttachments] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [videoState, setVideoState] = useState<VideoState>('idle');
  const [currentCaption, setCurrentCaption] = useState<string>('');
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ConversationSettings>(DEFAULT_CONVERSATION_SETTINGS);
  const [transcriptMessages, setTranscriptMessages] = useState<Message[]>([]);
  const [gooeyResponse, setGooeyResponse] = useState<GooeyVideoResponse | null>(null);
  const [transcriptHeight, setTranscriptHeight] = useState(40);

  const currentConversationRef = useRef<string>(conversationId);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const pendingTranscriptRef = useRef<string>('');
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = settings.language === 'hi' ? 'hi-IN' : 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        pendingTranscriptRef.current = finalTranscript.trim();
        setInput(finalTranscript.trim());
      } else if (interimTranscript) {
        setInput(interimTranscript);
      }
    };

    recognition.onerror = (event: { error: string }) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setSpeechError('Microphone access denied');
      } else if (event.error === 'no-speech') {
        setSpeechError('No speech detected');
      }
      setIsListening(false);
      setVideoState('idle');
    };

    recognition.onend = () => {
      setIsListening(false);
      if (pendingTranscriptRef.current) {
        const transcript = pendingTranscriptRef.current;
        pendingTranscriptRef.current = '';
        handleSendWithText(transcript);
      } else {
        setVideoState('idle');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopSpeaking();
    };
  }, [settings.language]);

  useEffect(() => {
    currentConversationRef.current = conversationId;

    stopSpeaking();
    setMessages([]);
    setInput('');
    setVideoState('idle');
    setCurrentCaption('');
    setCurrentVideoUrl(null);
    setGooeyResponse(null);
    setSettings(DEFAULT_CONVERSATION_SETTINGS);
    setTranscriptMessages([]);

    const unsubscribeMessages = subscribeToMessages(conversationId, (msgs) => {
      if (currentConversationRef.current === conversationId) {
        setMessages(msgs);
        setTranscriptMessages(msgs);
      }
    });

    const unsubscribeConversation = subscribeToConversation(conversationId, (conv) => {
      if (conv && currentConversationRef.current === conversationId) {
        setSettings(conv.settings || DEFAULT_CONVERSATION_SETTINGS);
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeConversation();
      stopSpeaking();
    };
  }, [conversationId]);

  const handleSendWithText = useCallback(async (text: string) => {
    if (!text.trim() || videoState === 'thinking' || videoState === 'speaking') return;

    const userMessage = text.trim();
    const targetConversationId = currentConversationRef.current;
    const currentSettings = settings;
    const conversationHistory = messagesRef.current;

    setInput('');
    setVideoState('thinking');
    setCurrentVideoUrl(null);
    setGooeyResponse(null);

    try {
      // Add user message
      await addMessage({
        conversationId: targetConversationId,
        sender: 'user',
        text: userMessage,
        createdAt: new Date()
      });

      const enhancedUserMessage = attachmentContext
        ? `Attached content context:\n${attachmentContext}\n\nUser query:\n${userMessage}`
        : userMessage;

      // Generate AI response
      const responseText = await generateAIResponse(
        enhancedUserMessage,
        currentSettings,
        conversationHistory
      );

      if (currentConversationRef.current !== targetConversationId) {
        return;
      }

      setCurrentCaption(responseText);

      function prepareTextForVideo(text: string): string {
        const cleaned = text
          .replace(/\s+/g, ' ')
          .replace(/\n/g, ' ')
          .trim();

        if (!/[.!?।]$/.test(cleaned)) {
          return cleaned + '।';
        }

        return cleaned;
      }

      const safeText = prepareTextForVideo(responseText);

      // Generate avatar video
      const gooeyResponseResult = await generateAvatarVideo({
        text: safeText,
        language: currentSettings.language,
        avatarUrl: currentSettings.avatarMediaUrl,
        gender: currentSettings.avatarVoiceGender
      });

      setGooeyResponse(gooeyResponseResult);

      if (currentConversationRef.current !== targetConversationId) {
        return;
      }

      // Prepare AI message data - ensure no undefined values
      const aiMessageData: any = {
        conversationId: targetConversationId,
        sender: 'ai' as const,
        text: responseText,
        transcript: responseText,
        createdAt: new Date()
      };

      // Only add videoUrl if it exists and is not undefined
      if (gooeyResponseResult?.videoUrl !== undefined && gooeyResponseResult?.videoUrl !== null) {
        aiMessageData.videoUrl = gooeyResponseResult.videoUrl;
      }

      // Only add videoUrls if it exists and is not undefined
      if (gooeyResponseResult?.videoUrls !== undefined && gooeyResponseResult?.videoUrls !== null) {
        aiMessageData.videoUrls = gooeyResponseResult.videoUrls;
      }

      // Add AI message to Firestore
      await addMessage(aiMessageData);

      // Clear attachments
      setAttachments([]);
      setAttachmentContext('');

      // Handle video playback
      if (gooeyResponseResult?.success) {
        if (gooeyResponseResult?.videoUrls && gooeyResponseResult.videoUrls.length > 0) {
          setVideoState('speaking');
        } else if (gooeyResponseResult?.videoUrl) {
          setCurrentVideoUrl(gooeyResponseResult.videoUrl);
          setVideoState('speaking');
        } else {
          // Fallback to TTS if no video
          setVideoState('speaking');
          await speakText(
            responseText,
            currentSettings.tone,
            undefined,
            () => {
              if (currentConversationRef.current === targetConversationId) {
                setVideoState('idle');
                setCurrentCaption('');
                setCurrentVideoUrl(null);
                setGooeyResponse(null);
              }
            }
          );
        }
      } else {
        // If Gooey failed, fallback to TTS
        setVideoState('speaking');
        await speakText(
          responseText,
          currentSettings.tone,
          undefined,
          () => {
            if (currentConversationRef.current === targetConversationId) {
              setVideoState('idle');
              setCurrentCaption('');
              setCurrentVideoUrl(null);
              setGooeyResponse(null);
            }
          }
        );
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      setVideoState('idle');
      setCurrentCaption('');
      setCurrentVideoUrl(null);
      setGooeyResponse(null);
    }
  }, [videoState, settings, attachmentContext]);

  async function handleSend() {
    await handleSendWithText(input);
  }

  function handleVideoEnded() {
    setTimeout(() => {
      setVideoState('idle');
      setCurrentCaption('');
      setCurrentVideoUrl(null);
      setGooeyResponse(null);
    }, 700);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function toggleListening() {
    if (!speechSupported) {
      setSpeechError('Voice input not supported in this browser');
      return;
    }

    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setVideoState('idle');
    } else {
      setSpeechError(null);
      pendingTranscriptRef.current = '';
      recognitionRef.current.lang = settings.language === 'hi' ? 'hi-IN' : 'en-US';
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setVideoState('listening');
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setSpeechError('Failed to start voice input');
      }
    }
  }

  function removeAttachment(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setAttachmentContext('');
  }

  async function handleAttachmentSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    if (files.length + attachments.length > 5) {
      alert('You can upload a maximum of 5 attachments.');
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} exceeds 5MB limit`);
        return;
      }
    }

    setAttachments(prev => [...prev, ...files]);
    await processAttachments(files);
    e.target.value = '';
  }

  async function processAttachments(files: File[]) {
    setIsProcessingAttachments(true);

    try {
      const extractedResults: string[] = [];

      for (const file of files) {
        const base64 = await fileToBase64(file);
        const result = await extractAttachmentWithGemini(file.type, base64);
        extractedResults.push(result);
      }

      const combinedContext = extractedResults.join('\n\n');
      setAttachmentContext(prev =>
        prev ? `${prev}\n\n${combinedContext}` : combinedContext
      );

    } catch (err) {
      console.error('Attachment extraction failed:', err);
    } finally {
      setIsProcessingAttachments(false);
    }
  }

  async function extractAttachmentWithGemini(mimeType: string, base64Data: string): Promise<string> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    const body = {
      contents: [
        {
          parts: [
            {
              text: `You are a document analysis and information extraction assistant. Extract ALL meaningful information from the attached file.`
            },
            {
              inlineData: {
                mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 32,
        topP: 0.9,
        maxOutputTokens: 4096
      }
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No extractable content found.';
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function sanitizeSettings(settings: ConversationSettings): ConversationSettings {
    const cleaned = { ...settings };
    Object.keys(cleaned).forEach((key) => {
      if ((cleaned as any)[key] === undefined) {
        delete (cleaned as any)[key];
      }
    });
    return cleaned;
  }

  async function handleSettingsChange(newSettings: ConversationSettings) {
    const sanitized = sanitizeSettings(newSettings);
    setSettings(sanitized);

    try {
      await updateConversationSettings(conversationId, sanitized);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  function handlePlayMessage(videoUrl: string | undefined, videoUrls: string[] | undefined, transcript: string) {
    setCurrentCaption(transcript);
    setCurrentVideoUrl(videoUrl || null);
    setGooeyResponse(videoUrls ? { success: true, videoUrls } : null);
    setVideoState('speaking');
  }

  const isBusy = videoState === 'thinking' || videoState === 'speaking';

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden relative z-10">
      <ChatHeader
        settings={settings}
        onSettingsClick={() => setShowSettings(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex-shrink-0 p-2 sm:p-3 overflow-hidden">
          <div className="max-w-full md:max-w-xl mx-auto">
            <VideoPlayer
              state={videoState}
              avatarImageUrl={settings.avatarPreviewImageUrl}
              speakingVideoUrl={currentVideoUrl}
              speakingVideoUrls={gooeyResponse?.videoUrls}
              caption={currentCaption}
              onVideoEnded={handleVideoEnded}
            />
          </div>
        </div>

        <div className="flex-shrink-0 overflow-hidden" style={{ maxHeight: '28vh' }}>
          <TranscriptView
            messages={transcriptMessages}
            onPlayMessage={handlePlayMessage}
            transcriptHeight={transcriptHeight}
            onHeightChange={setTranscriptHeight}
          />
        </div>

        <div className="flex-shrink-0">
          <MessageInput
            input={input}
            onInputChange={setInput}
            onSend={handleSend}
            onKeyDown={handleKeyDown}
            isListening={isListening}
            onToggleListening={toggleListening}
            isBusy={isBusy}
            speechError={speechError}
            attachments={attachments}
            onAttachmentSelect={handleAttachmentSelect}
            onRemoveAttachment={removeAttachment}
            isProcessingAttachments={isProcessingAttachments}
          />
        </div>
      </div>

      {showSettings && (
        <AvatarSettingsPanel
          conversationId={conversationId}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}