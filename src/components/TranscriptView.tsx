import { useRef, useEffect, useState } from 'react';
import { Download, Copy, Search, ChevronUp, ChevronDown, GripHorizontal } from 'lucide-react';
import { Message } from '../types';
import MessageBubble from './MessageBubble';

interface TranscriptViewProps {
  messages: Message[];
  onPlayMessage?: (videoUrl: string | undefined, videoUrls: string[] | undefined, transcript: string) => void;
  transcriptHeight: number;
  onHeightChange: (height: number) => void;
}

export default function TranscriptView({ messages, onPlayMessage, transcriptHeight, onHeightChange }: TranscriptViewProps) {
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  function downloadAsPDF() {
    const content = messages
      .map((msg) => {
        const time = msg.createdAt.toLocaleString();
        const sender = msg.sender === 'user' ? 'You' : 'AI';
        return `[${time}] ${sender}: ${msg.text}`;
      })
      .join('\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function copyTranscript() {
    const content = messages
      .map((msg) => {
        const time = msg.createdAt.toLocaleString();
        const sender = msg.sender === 'user' ? 'You' : 'AI';
        return `[${time}] ${sender}: ${msg.text}`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(content).then(() => {
      alert('Transcript copied to clipboard!');
    });
  }

  function increaseHeight() {
    if (transcriptHeight < 70) {
      onHeightChange(Math.min(transcriptHeight + 10, 70));
    }
  }

  function decreaseHeight() {
    if (transcriptHeight > 20) {
      onHeightChange(Math.max(transcriptHeight - 10, 20));
    }
  }

  function handleMouseDown() {
    setIsDragging(true);
  }

  useEffect(() => {
    if (!isDragging) return;

    function handleMouseMove(e: MouseEvent) {
      const containerHeight = window.innerHeight;
      const mouseY = e.clientY;
      const newHeight = Math.round(((containerHeight - mouseY) / containerHeight) * 100);
      onHeightChange(Math.max(20, Math.min(70, newHeight)));
    }

    function handleMouseUp() {
      setIsDragging(false);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onHeightChange]);

  const filteredMessages = searchQuery
    ? messages.filter((msg) =>
        msg.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  return (
    <div className="px-6" style={{ height: `${transcriptHeight}%`, minHeight: '200px' }}>
      <div className="max-w-2xl mx-auto h-full flex flex-col">
        <div
          className="flex items-center justify-center py-1 cursor-ns-resize hover:bg-gray-200 rounded-t-lg transition-colors"
          onMouseDown={handleMouseDown}
        >
          <GripHorizontal className="w-5 h-5 text-gray-400" />
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Transcript
            </span>
            <span className="text-xs text-gray-400">{messages.length} messages</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={copyTranscript}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              title="Copy Transcript"
              disabled={messages.length === 0}
            >
              <Copy className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={downloadAsPDF}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              title="Download Transcript"
              disabled={messages.length === 0}
            >
              <Download className="w-4 h-4 text-gray-600" />
            </button>
            <div className="flex items-center gap-1 ml-2 border-l pl-2">
              <button
                onClick={decreaseHeight}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Decrease Height"
              >
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={increaseHeight}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Increase Height"
              >
                <ChevronUp className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {showSearch && (
          <div className="mb-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
        )}

        <div
          ref={transcriptRef}
          className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-sm"
        >
          {filteredMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full p-6">
              <p className="text-sm text-gray-400 text-center">
                {searchQuery
                  ? 'No messages match your search'
                  : 'Start speaking or type a message to begin the conversation'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredMessages.map((msg, index) => (
                <MessageBubble
                  key={index}
                  message={msg}
                  onPlay={onPlayMessage}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
