import { useRef, useEffect, useState } from 'react';
import { Loader2, User } from 'lucide-react';

export type VideoState = 'idle' | 'listening' | 'thinking' | 'speaking';

const DEFAULT_AVATAR_URL = 'https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=800';

interface VideoPlayerProps {
  state: VideoState;
  avatarImageUrl?: string;
  speakingVideoUrl?: string | null;
  caption?: string;
  onVideoEnded?: () => void;
  showFullTranscript?: boolean;
}

function splitIntoLines(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.map(s => s.trim()).filter(Boolean);
}

export default function VideoPlayer({
  state,
  avatarImageUrl,
  speakingVideoUrl,
  caption,
  onVideoEnded,
  showFullTranscript = false
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [captionLines, setCaptionLines] = useState<string[]>([]);

  const displayAvatar = avatarImageUrl || DEFAULT_AVATAR_URL;
  const hasGooeyVideo = speakingVideoUrl && state === 'speaking' && !videoError;

  useEffect(() => {
    if (caption && state === 'speaking') {
      const lines = splitIntoLines(caption);
      setCaptionLines(lines);
      setCurrentLineIndex(0);

      if (lines.length > 1) {
        const interval = setInterval(() => {
          setCurrentLineIndex((prev) => {
            if (prev < lines.length - 1) {
              return prev + 1;
            }
            clearInterval(interval);
            return prev;
          });
        }, 3000);

        return () => clearInterval(interval);
      }
    } else {
      setCaptionLines([]);
      setCurrentLineIndex(0);
    }
  }, [caption, state]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.dataset.state = state;
    }
  }, [state]);

  useEffect(() => {
    if (speakingVideoUrl && videoRef.current) {
      setVideoLoaded(false);
      setVideoError(false);
      videoRef.current.src = speakingVideoUrl;
      videoRef.current.load();
    }
  }, [speakingVideoUrl]);

  useEffect(() => {
    if (state === 'speaking' && videoLoaded && videoRef.current && !videoError) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch((err) => {
        console.error('Failed to play video:', err);
        setVideoError(true);
      });
    }
  }, [state, videoLoaded, videoError]);

  useEffect(() => {
    if (state !== 'speaking' && videoRef.current) {
      videoRef.current.pause();
    }
  }, [state]);

  function handleVideoLoaded() {
    setVideoLoaded(true);
  }

  function handleVideoError() {
    console.error('Video failed to load');
    setVideoError(true);
  }

  function handleVideoEnded() {
    onVideoEnded?.();
  }

  function getStatusIndicator() {
    switch (state) {
      case 'listening':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/80 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-xs font-medium text-white">Listening...</span>
          </div>
        );
      case 'thinking':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/80 rounded-full">
            <Loader2 className="w-3 h-3 text-white animate-spin" />
            <span className="text-xs font-medium text-white">AI is thinking...</span>
          </div>
        );
      case 'speaking':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/80 rounded-full">
            <div className="flex gap-0.5">
              <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs font-medium text-white">Speaking</span>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl">
        {hasGooeyVideo ? (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            onCanPlayThrough={handleVideoLoaded}
            onError={handleVideoError}
            onEnded={handleVideoEnded}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {displayAvatar ? (
              <div className="relative w-full h-full">
                <img
                  src={displayAvatar}
                  alt="AI Avatar"
                  className={`w-full h-full object-cover transition-transform duration-200 ${
                    state === 'speaking' ? 'avatar-speaking' : ''
                  }`}
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent transition-opacity duration-300 ${
                    state === 'speaking' ? 'opacity-100' : 'opacity-60'
                  }`}
                />
                {state === 'speaking' && (
                  <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 w-16 h-4 flex items-center justify-center">
                    <div className="speaking-mouth-animation">
                      <div className="mouth-shape" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center">
                <User className="w-16 h-16 text-gray-500" />
              </div>
            )}
          </div>
        )}

        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
          state === 'speaking' && !hasGooeyVideo ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent speaking-glow" />
        </div>

        <div className="absolute top-4 left-4 z-10">
          {getStatusIndicator()}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          {caption && state === 'speaking' && captionLines.length > 0 && (
            <div className="mb-3 px-4 py-3 bg-black/70 backdrop-blur-sm rounded-xl">
              <p className="text-white text-sm leading-relaxed">
                {captionLines[currentLineIndex]}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                state === 'idle' ? 'bg-green-500' :
                state === 'listening' ? 'bg-green-500 animate-pulse' :
                state === 'thinking' ? 'bg-amber-500 animate-pulse' :
                'bg-blue-500 animate-pulse'
              }`} />
              <span className="text-xs text-white/80">
                {state === 'idle' ? 'Ready' :
                 state === 'listening' ? 'Listening' :
                 state === 'thinking' ? 'Processing' : 'Speaking'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .avatar-speaking {
          animation: subtle-breathing 2s ease-in-out infinite;
        }

        @keyframes subtle-breathing {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.01);
          }
        }

        .speaking-mouth-animation {
          position: relative;
          width: 40px;
          height: 16px;
        }

        .mouth-shape {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 50%;
          animation: mouth-move 150ms ease-in-out infinite;
        }

        @keyframes mouth-move {
          0%, 100% {
            transform: scaleY(0.3);
            opacity: 0.6;
          }
          50% {
            transform: scaleY(1);
            opacity: 0.8;
          }
        }

        .speaking-glow {
          animation: glow-pulse 1.5s ease-in-out infinite;
        }

        @keyframes glow-pulse {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}
