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

  useEffect(() => {
    console.log('📹 [CAMERA STATE] isCameraActive changed to:', isCameraActive);
    console.log('📹 [CAMERA STATE] videoRef.current exists:', !!videoRef.current);
    console.log('📹 [CAMERA STATE] streamRef.current exists:', !!streamRef.current);
    if (videoRef.current) {
      console.log('📹 [CAMERA STATE] video srcObject:', videoRef.current.srcObject);
      console.log('📹 [CAMERA STATE] video paused:', videoRef.current.paused);
      console.log('📹 [CAMERA STATE] video readyState:', videoRef.current.readyState);
    }
  }, [isCameraActive]);

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      console.log('🔄 [ASSIGN STREAM] Video element is now mounted! Assigning stream...');
      console.log('🔄 [ASSIGN STREAM] videoRef.current:', videoRef.current);
      console.log('🔄 [ASSIGN STREAM] streamRef.current:', streamRef.current);

      videoRef.current.srcObject = streamRef.current;

      videoRef.current.onloadedmetadata = () => {
        console.log('🎬 [VIDEO METADATA] Metadata loaded!');
        console.log('🎬 [VIDEO METADATA] Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
        console.log('🎬 [VIDEO METADATA] Video readyState:', videoRef.current?.readyState);
      };

      videoRef.current.oncanplay = () => {
        console.log('▶️ [VIDEO CANPLAY] Video can play now');
      };

      videoRef.current.onplay = () => {
        console.log('✅ [VIDEO PLAYING] Video is now playing!');
      };

      videoRef.current.onerror = (e) => {
        console.error('❌ [VIDEO ERROR] Video element error:', e);
      };

      console.log('🔄 [ASSIGN STREAM] Stream assigned to video element!');
    }
  }, [isCameraActive, videoRef.current, streamRef.current]);

  async function startCamera() {
    try {
      console.log('🎥 [START CAMERA] Button clicked - requesting camera access...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      console.log('🎥 [START CAMERA] Stream obtained:', stream);
      console.log('🎥 [START CAMERA] Video tracks:', stream.getVideoTracks());
      console.log('🎥 [START CAMERA] Track enabled:', stream.getVideoTracks()[0]?.enabled);
      console.log('🎥 [START CAMERA] Track readyState:', stream.getVideoTracks()[0]?.readyState);

      console.log('🎥 [START CAMERA] Storing stream in streamRef...');
      streamRef.current = stream;

      console.log('🎥 [START CAMERA] Setting isCameraActive to true (video element will now render)...');
      setIsCameraActive(true);
      console.log('✅ [START CAMERA] State updated! Video element should render now.');
    } catch (error) {
      console.error('❌ [START CAMERA] Failed to get camera stream:', error);
      alert('Failed to access camera. Please check permissions and ensure you are using HTTPS.');
    }
  }

  function stopCamera() {
    console.log('🛑 [STOP CAMERA] Stopping camera...');
    if (streamRef.current) {
      console.log('🛑 [STOP CAMERA] Stopping all tracks...');
      streamRef.current.getTracks().forEach(track => {
        console.log('🛑 [STOP CAMERA] Stopping track:', track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      console.log('🛑 [STOP CAMERA] Clearing video srcObject...');
      videoRef.current.srcObject = null;
    }
    console.log('🛑 [STOP CAMERA] Setting isCameraActive to false');
    setIsCameraActive(false);
  }

  async function captureAndProcessVision(): Promise<VisionContext | null> {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) {
      console.log('Vision capture skipped - camera not active or refs not ready');
      return null;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('Video dimensions not ready yet');
      return null;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Failed to get canvas context');
      return null;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    console.log('Captured frame from video:', canvas.width, 'x', canvas.height);

    setIsProcessingVision(true);
    try {
      const visionContext = await processVisionSnapshot(canvas);
      console.log('Vision processing complete:', visionContext);
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
        console.log('Vision context added to prompt:', visionContext.description);
      } else {
        console.log('No vision context captured');
      }

      const systemPrompt = contextWindow
        ? `IMPORTANT: You are an AI assistant with LIVE CAMERA ACCESS. You can SEE through the camera in real-time.

WHAT YOU CAN SEE RIGHT NOW (from camera):
${contextWindow}

USER'S QUESTION: "${userMessage}"

INSTRUCTIONS:
- Answer the user's question based on what you SEE in the camera feed
- If they ask "what's in my hand", describe the objects you detected that are close/foreground
- Be specific about what objects were detected and their positions
- If you see objects, describe them confidently
- If no objects were detected, say so honestly
- Always reference the visual information when answering`
        : userMessage;

      console.log('Sending prompt to AI with vision context:', contextWindow ? 'YES' : 'NO');

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
        <div className="flex-1 flex flex-col border-r border-gray-200">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Virtual Eyes Mode</h3>
                  <p className="text-gray-600 mb-4">AI can see and understand your surroundings through the camera</p>

                  {(() => {
                    console.log('💬 [EMPTY STATE] Rendering status message - isCameraActive:', isCameraActive);
                    return !isCameraActive ? (
                      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-md mx-auto">
                        <p className="text-sm text-amber-800 font-medium mb-2">📷 Camera is currently off</p>
                        <p className="text-xs text-amber-700">Click "Start Camera" in the top right to enable AI vision</p>
                      </div>
                    ) : (
                      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg max-w-md mx-auto">
                        <p className="text-sm text-green-800 font-medium mb-2">✅ Camera Active</p>
                        <p className="text-xs text-green-700">AI can now see what's in front of your camera. Ask me anything!</p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-gray-200">
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
        </div>

        <div className="w-[500px] bg-gray-50 flex flex-col relative">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">AI Assistant</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Camera: {isCameraActive ? '🟢 Active' : '🔴 Inactive'}
              </p>
            </div>
            <button
              onClick={() => {
                console.log('🔘 [BUTTON] Camera button clicked! Current state:', isCameraActive);
                if (isCameraActive) {
                  stopCamera();
                } else {
                  startCamera();
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                isCameraActive
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {isCameraActive ? (
                <>
                  <CameraOff className="w-4 h-4" />
                  <span>Stop Camera</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Start Camera</span>
                </>
              )}
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-6">
            <VideoPlayer
              state={videoState}
              avatarImageUrl={settings.avatarPreviewImageUrl}
              speakingVideoUrl={currentVideoUrl}
              speakingVideoUrls={gooeyResponse?.videoUrls || []}
              caption={currentCaption}
              onVideoEnded={handleVideoEnd}
            />
          </div>

          {(() => {
            console.log('🖼️ [RENDER] Camera preview conditional render check - isCameraActive:', isCameraActive);
            return isCameraActive && (
              <div className="absolute bottom-6 right-6 w-64 h-48 bg-black rounded-lg overflow-hidden shadow-2xl border-4 border-green-500 z-10">
                {console.log('🖼️ [RENDER] Camera preview div is rendering!')}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                  onLoadStart={() => console.log('🖼️ [VIDEO] onLoadStart event')}
                  onLoadedData={() => console.log('🖼️ [VIDEO] onLoadedData event')}
                  onPlay={() => console.log('🖼️ [VIDEO] onPlay event')}
                  onCanPlay={() => console.log('🖼️ [VIDEO] onCanPlay event')}
                />
                {isProcessingVision && (
                  <div className="absolute inset-0 bg-blue-600/50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                      <Eye className="w-4 h-4 animate-pulse" />
                      <span>Analyzing Vision...</span>
                    </div>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-black/80 rounded text-xs text-white font-medium">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span>Your Camera (Live)</span>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2">
                  <div className="px-2 py-1 bg-green-600/90 rounded text-xs text-white font-medium">
                    AI Vision Active
                  </div>
                </div>
              </div>
            );
          })()}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
}
