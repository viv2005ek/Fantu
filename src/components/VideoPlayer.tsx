import { useRef, useEffect, useState } from 'react';
import { Loader2, User } from 'lucide-react';

export type VideoState = 'idle' | 'listening' | 'thinking' | 'speaking';

const DEFAULT_AVATAR_URL = 'https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=800';

interface VideoPlayerProps {
  state: VideoState;
  avatarImageUrl?: string;
  speakingVideoUrl?: string | null;
  speakingVideoUrls?: string[];
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
  speakingVideoUrls = [],
  caption,
  onVideoEnded,
  showFullTranscript = false
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [captionLines, setCaptionLines] = useState<string[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videosPreloaded, setVideosPreloaded] = useState<boolean[]>([]);

  const displayAvatar = avatarImageUrl || DEFAULT_AVATAR_URL;
  
  const videoUrls = speakingVideoUrls.length > 0 ? speakingVideoUrls : 
                   (speakingVideoUrl ? [speakingVideoUrl] : []);
  
  const hasGooeyVideo = videoUrls.length > 0 && state === 'speaking' && !videoError;
  const currentVideoUrl = videoUrls[currentVideoIndex] || null;

  // Initialize preload status array
  useEffect(() => {
    if (videoUrls.length > 0) {
      setVideosPreloaded(new Array(videoUrls.length).fill(false));
    }
  }, [videoUrls.length]);

  // Preload all videos sequentially
  useEffect(() => {
    if (videoUrls.length > 0 && state === 'speaking') {
      const preloadPromises = videoUrls.map((url, index) => {
        return new Promise<void>((resolve) => {
          const video = document.createElement('video');
          video.muted = true;
          video.preload = 'auto';
          video.src = url;
          
          // Try to load in the background
          video.load();
          
          const handleCanPlay = () => {
            setVideosPreloaded(prev => {
              const newArr = [...prev];
              newArr[index] = true;
              return newArr;
            });
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('error', handleError);
            resolve();
          };
          
          const handleError = () => {
            console.warn(`Failed to preload video ${index}: ${url}`);
            setVideosPreloaded(prev => {
              const newArr = [...prev];
              newArr[index] = true; // Mark as "loaded" even if error to continue
              return newArr;
            });
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('error', handleError);
            resolve();
          };
          
          video.addEventListener('canplay', handleCanPlay, { once: true });
          video.addEventListener('error', handleError, { once: true });
          
          // Timeout after 3 seconds
          setTimeout(() => {
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('error', handleError);
            setVideosPreloaded(prev => {
              const newArr = [...prev];
              newArr[index] = true;
              return newArr;
            });
            resolve();
          }, 3000);
        });
      });

      // Cleanup function
      return () => {
        // Cleanup handled in individual promises
      };
    }
  }, [videoUrls, state]);

  useEffect(() => {
    if (caption && state === 'speaking') {
      const lines = splitIntoLines(caption);
      setCaptionLines(lines);
      setCurrentLineIndex(0);

      if (lines.length > 1) {
        const interval = setInterval(() => {
          setCurrentLineIndex(prev => {
            if (prev < lines.length - 1) return prev + 1;
            clearInterval(interval);
            return prev;
          });
        }, Math.max(2500, lines[currentLineIndex].split(' ').length * 400));

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

  // Reset when state changes
  useEffect(() => {
    if (state !== 'speaking') {
      setCurrentVideoIndex(0);
      setVideoLoaded(false);
      setVideoError(false);
      setVideosPreloaded([]);
    }
  }, [state]);

  // Load and play current video
  useEffect(() => {
    if (currentVideoUrl && mainVideoRef.current && state === 'speaking') {
      // Reset video state
      setVideoLoaded(false);
      setVideoError(false);
      
      // Set source and load
      mainVideoRef.current.src = currentVideoUrl;
      mainVideoRef.current.load();
      
      // Check if current video is preloaded
      const isCurrentPreloaded = videosPreloaded[currentVideoIndex];
      
      // Set up event listeners
      const handleCanPlay = () => {
        setVideoLoaded(true);
        // Play immediately when ready
        mainVideoRef.current?.play().catch(err => {
          console.error('Failed to play video:', err);
          setVideoError(true);
        });
      };
      
      const handleError = () => {
        console.error('Video failed to load:', currentVideoUrl);
        setVideoError(true);
        playNextVideoOrEnd();
      };
      
      mainVideoRef.current.addEventListener('canplay', handleCanPlay, { once: true });
      mainVideoRef.current.addEventListener('error', handleError, { once: true });
      
      // If preloaded, try to play immediately
      if (isCurrentPreloaded && mainVideoRef.current.readyState >= 3) {
        setTimeout(() => {
          if (!videoLoaded && !videoError) {
            mainVideoRef.current?.play().catch(console.error);
          }
        }, 100);
      }
      
      // Cleanup
      return () => {
        if (mainVideoRef.current) {
          mainVideoRef.current.removeEventListener('canplay', handleCanPlay);
          mainVideoRef.current.removeEventListener('error', handleError);
          mainVideoRef.current.pause();
        }
      };
    }
  }, [currentVideoUrl, currentVideoIndex, state, videosPreloaded]);

  // Handle video ended
  function handleVideoEnded() {
    playNextVideoOrEnd();
  }

  function playNextVideoOrEnd() {
    if (currentVideoIndex < videoUrls.length - 1) {
      // Move to next video
      setCurrentVideoIndex(prev => prev + 1);
    } else {
      // All videos played, keep last video visible
      setTimeout(() => {
        onVideoEnded?.();
      }, 700); // Show last video for 700ms before ending
    }
  }

  // Track all videos preloaded
  const allVideosPreloaded = videosPreloaded.length > 0 && videosPreloaded.every(Boolean);

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
          <>
            {/* Main video player */}
            <video
              ref={mainVideoRef}
              className="absolute inset-0 w-full h-full object-contain"
              playsInline
              muted={false}
              onEnded={handleVideoEnded}
              key={currentVideoIndex} // Force re-render when video changes
            />
            
            {/* Loading indicator while videos load */}
            {!allVideosPreloaded && videoUrls.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                  <p className="text-sm text-white/80">
                    Loading videos... ({videosPreloaded.filter(Boolean).length}/{videoUrls.length})
                  </p>
                </div>
              </div>
            )}
            
            {/* Buffering indicator */}
            {videoUrls.length > 0 && !videoLoaded && allVideosPreloaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {displayAvatar ? (
              <div className="relative w-full h-full">
                <img
                  src={displayAvatar}
                  alt="AI Avatar"
                  className={`w-full h-full object-contain transition-transform duration-200 ${
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