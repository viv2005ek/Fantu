import { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Eye } from 'lucide-react';
import {
  Message,
  ConversationSettings,
  DEFAULT_CONVERSATION_SETTINGS,
  VisionContext
} from '../types';
import { subscribeToMessages, addMessage, subscribeToConversation, updateConversationSettings } from '../services/firestore';
import { generateAIResponse } from '../services/mockAI';
import { generateAvatarVideo, GooeyVideoResponse } from '../services/gooey';
import { processVisionSnapshot, loadObjectDetectionModel } from '../services/vision';
import AvatarSettingsPanel from './AvatarSettingsPanel';
import VideoPlayer, { VideoState } from './VideoPlayer';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';

interface VirtualEyesChatProps {
  conversationId: string;
}

export default function VirtualEyesChat({ conversationId }: VirtualEyesChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [videoState, setVideoState] = useState<VideoState>('idle');
  const [currentCaption, setCurrentCaption] = useState<string>('');
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ConversationSettings>(DEFAULT_CONVERSATION_SETTINGS);
  const [gooeyResponse, setGooeyResponse] = useState<GooeyVideoResponse | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessingVision, setIsProcessingVision] = useState(false);
  const [visionContextHistory, setVisionContextHistory] = useState<VisionContext[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadObjectDetectionModel();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
    });
    return unsubscribe;
  }, [conversationId]);

  useEffect(() => {
    const unsubscribe = subscribeToConversation(conversationId, (conv) => {
      if (conv?.settings) {
        setSettings(conv.settings);
      }
    });
    return unsubscribe;
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
      alert('Failed to access camera. Please check permissions.');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }

  async function captureAndProcessVision(): Promise<VisionContext | null> {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) {
      return null;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setIsProcessingVision(true);
    try {
      const visionContext = await processVisionSnapshot(canvas);
      return visionContext;
    } catch (error) {
      console.error('Failed to process vision:', error);
      return null;
    } finally {
      setIsProcessingVision(false);
    }
  }

  async function handleSendMessage() {
    if (!input.trim() || videoState === 'speaking' || videoState === 'thinking') return;

    const userMessage = input.trim();
    setInput('');

    await addMessage({
      conversationId,
      sender: 'user',
      text: userMessage,
      createdAt: new Date()
    });

    setVideoState('thinking');

    try {
      const visionContext = await captureAndProcessVision();

      let contextWindow = '';
      if (visionContextHistory.length > 0) {
        contextWindow = visionContextHistory.map(vc =>
          `[${vc.timestamp.toLocaleTimeString()}] ${vc.description}`
        ).join('\n');
      }

      if (visionContext) {
        setVisionContextHistory(prev => [...prev, visionContext].slice(-10));
        contextWindow += contextWindow ? '\n' : '';
        contextWindow += `[Current view - ${visionContext.timestamp.toLocaleTimeString()}] ${visionContext.description}`;
      }

      const systemPrompt = contextWindow
        ? `You are an AI assistant with visual perception through a camera. You can see the user's surroundings and help them understand their environment.\n\nVISUAL CONTEXT (from camera):\n${contextWindow}\n\n[USER QUESTION]\n${userMessage}`
        : userMessage;

      const responseText = await generateAIResponse(
        systemPrompt,
        settings,
        messages
      );

      setCurrentCaption(responseText);

      function prepareTextForVideo(text: string): string {
        const cleaned = text.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim();
        if (!/[.!?।]$/.test(cleaned)) {
          return cleaned + '।';
        }
        return cleaned;
      }

      const safeText = prepareTextForVideo(responseText);

      const gooeyResponseResult = await generateAvatarVideo({
        text: safeText,
        language: settings.language,
        avatarUrl: settings.avatarMediaUrl,
        gender: settings.avatarVoiceGender
      });

      setGooeyResponse(gooeyResponseResult);

      await addMessage({
        conversationId,
        sender: 'ai',
        text: responseText,
        transcript: responseText,
        videoUrl: gooeyResponseResult.videoUrl,
        videoUrls: gooeyResponseResult.videoUrls,
        createdAt: new Date(),
        visionContext: visionContext || undefined
      });

      if (gooeyResponseResult.success && (gooeyResponseResult.videoUrls?.length || gooeyResponseResult.videoUrl)) {
        if (gooeyResponseResult.videoUrl) setCurrentVideoUrl(gooeyResponseResult.videoUrl);
        setVideoState('speaking');
      } else {
        setVideoState('idle');
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      setVideoState('idle');
      setCurrentCaption('');
      setCurrentVideoUrl(null);
      setGooeyResponse(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  function handleVideoEnd() {
    setVideoState('idle');
    setCurrentCaption('');
    setCurrentVideoUrl(null);
    setGooeyResponse(null);
  }

  async function handleSettingsSave(newSettings: ConversationSettings) {
    await updateConversationSettings(conversationId, newSettings);
    setSettings(newSettings);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <ChatHeader
        settings={settings}
        onSettingsClick={() => setShowSettings(true)}
      />

      {showSettings && (
        <AvatarSettingsPanel
          conversationId={conversationId}
          settings={settings}
          onSettingsChange={handleSettingsSave}
          onClose={() => setShowSettings(false)}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Virtual Eyes Mode</h3>
                  <p className="text-gray-600">AI can see and understand your surroundings through the camera</p>
                </div>
              )}

              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <MessageInput
            input={input}
            onInputChange={setInput}
            onSend={handleSendMessage}
            onKeyDown={handleKeyDown}
            isBusy={videoState === 'speaking' || videoState === 'thinking'}
            isListening={false}
            onToggleListening={() => {}}
            speechError={null}
            attachments={[]}
            onAttachmentSelect={() => {}}
            onRemoveAttachment={() => {}}
            isProcessingAttachments={isProcessingVision}
          />
        </div>

        <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Camera View
              </h3>
              <button
                onClick={isCameraActive ? stopCamera : startCamera}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isCameraActive
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {isCameraActive ? (
                  <>
                    <CameraOff className="w-4 h-4 inline mr-1" />
                    Stop
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 inline mr-1" />
                    Start
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-900">
            {isCameraActive ? (
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isProcessingVision && (
                  <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                    <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                      Processing...
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <CameraOff className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Camera is off</p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="p-4 bg-gray-50">
            <VideoPlayer
              state={videoState}
              avatarImageUrl={settings.avatarPreviewImageUrl}
              speakingVideoUrl={currentVideoUrl}
              speakingVideoUrls={gooeyResponse?.videoUrls || []}
              caption={currentCaption}
              onVideoEnded={handleVideoEnd}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
