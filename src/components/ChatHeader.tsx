import { Settings, Upload } from 'lucide-react';
import { ConversationSettings } from '../types';

interface ChatHeaderProps {
  settings: ConversationSettings;
  onSettingsClick: () => void;
  onInviteClick?: () => void;
  showInviteButton?: boolean;
  onRagClick?: () => void;
  showRagButton?: boolean;
}

export default function ChatHeader({
  settings,
  onSettingsClick,
  onInviteClick,
  showInviteButton = false,
  onRagClick,
  showRagButton = false
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm font-medium text-gray-700">Video Call Active</span>
        {settings.language === 'hi' && (
          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">Hindi</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showRagButton && onRagClick && (
          <button
            onClick={onRagClick}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Add to RAG</span>
            <span className="sm:hidden">RAG</span>
          </button>
        )}
        {showInviteButton && onInviteClick && (
          <button
            onClick={onInviteClick}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Add People
          </button>
        )}
        <button
          onClick={onSettingsClick}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
