import { Send, Mic, MicOff, Paperclip } from 'lucide-react';
import { motion } from 'framer-motion';

interface MessageInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isListening: boolean;
  onToggleListening: () => void;
  isBusy: boolean;
  speechError: string | null;
  attachments: File[];
  onAttachmentSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (index: number) => void;
  isProcessingAttachments: boolean;
}

export default function MessageInput({
  input,
  onInputChange,
  onSend,
  onKeyDown,
  isListening,
  onToggleListening,
  isBusy,
  speechError,
  attachments,
  onAttachmentSelect,
  onRemoveAttachment,
  isProcessingAttachments
}: MessageInputProps) {
  return (
    <div className="flex-shrink-0 p-6 pt-4">
      <div className="max-w-2xl mx-auto">
        {speechError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 px-4 py-2 glass-effect border border-red-500/30 rounded-xl"
          >
            <p className="text-xs text-red-400">{speechError}</p>
          </motion.div>
        )}

        <div className="flex items-center gap-3 glass-effect rounded-2xl border border-cyan-500/20 shadow-2xl p-2 hover:neon-border transition-all duration-300">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleListening}
            disabled={isBusy}
            className={`flex-shrink-0 p-4 rounded-xl transition-all ${
              isListening
                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/50 animate-pulse-glow'
                : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </motion.button>

          <input
            id="attachment-input"
            type="file"
            multiple
            accept="image/*,application/pdf,video/*,audio/*"
            hidden
            onChange={onAttachmentSelect}
          />

          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-xs"
                >
                  <span className="truncate max-w-[120px]">
                    {file.name}
                  </span>

                  {isProcessingAttachments && (
                    <span className="text-gray-400">processing…</span>
                  )}

                  <button
                    onClick={() => onRemoveAttachment(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              isListening
                ? 'Listening...'
                : attachments.length > 0
                ? `Message (${attachments.length} attachment${attachments.length > 1 ? 's' : ''})`
                : 'Type your message...'
            }
            disabled={isBusy || isListening}
            className="flex-1 px-4 py-3 bg-transparent text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => document.getElementById('attachment-input')?.click()}
            disabled={isBusy || isProcessingAttachments}
            className="p-3 rounded-xl bg-gradient-to-r from-slate-700 to-slate-600 text-cyan-300 hover:from-slate-600 hover:to-slate-500 disabled:opacity-50 border border-cyan-500/20"
            title="Add attachment"
          >
            <Paperclip className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSend}
            disabled={
              !input.trim() ||
              isBusy ||
              isListening ||
              isProcessingAttachments
            }
            className="flex-shrink-0 p-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:neon-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>

        <p className="mt-3 text-xs text-slate-400 text-center">
          {isListening
            ? 'Speak now... your message will be sent automatically'
            : 'Press the microphone to speak or type your message'}
        </p>
      </div>
    </div>
  );
}
