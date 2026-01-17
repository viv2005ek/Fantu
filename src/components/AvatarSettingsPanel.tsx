/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useRef } from 'react';
import { X, Upload, User, Check, AlertCircle, Link, Lock } from 'lucide-react';
import { ConversationSettings, AvatarVoiceGender, Language, PREDEFINED_AVATARS, GEMINI_MODELS } from '../types';

interface AvatarSettingsPanelProps {
  conversationId: string;
  settings: ConversationSettings;
  onSettingsChange: (settings: ConversationSettings) => void;
  onClose: () => void;
}

export default function AvatarSettingsPanel({
  settings,
  onSettingsChange,
  onClose
}: AvatarSettingsPanelProps) {
  const [imageUrl, setImageUrl] = useState(settings.avatarImageUrl || '');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    setImageUrl(e.target.value);
    setUrlError(null);
  }

  function handleUrlSave() {
    if (!imageUrl.trim()) {
      onSettingsChange({ ...settings, avatarImageUrl: undefined });
      return;
    }

    try {
      new URL(imageUrl);
      onSettingsChange({ ...settings, avatarImageUrl: imageUrl.trim() });
      setUrlError(null);
    } catch {
      setUrlError('Please enter a valid URL');
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUrlError('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUrlError('Image must be less than 2MB for base64 storage');
      return;
    }

    setProcessing(true);
    setUrlError(null);

    try {
      const base64 = await fileToBase64(file);
      setImageUrl(base64);
      onSettingsChange({ ...settings, avatarImageUrl: base64 });
    } catch (error) {
      console.error('Failed to process image:', error);
      setUrlError('Failed to process image');
    } finally {
      setProcessing(false);
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function handleDescriptionChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onSettingsChange({ ...settings, description: e.target.value });
  }

  function handlePersonalityChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onSettingsChange({ ...settings, personality: e.target.value });
  }

  function handleToneChange(tone: ConversationSettings['tone']) {
    onSettingsChange({ ...settings, tone });
  }

  function handleResponseLengthChange(responseLength: ConversationSettings['responseLength']) {
    onSettingsChange({ ...settings, responseLength });
  }

  function handleVoiceGenderChange(avatarVoiceGender: AvatarVoiceGender) {
    onSettingsChange({ ...settings, avatarVoiceGender });
  }

  function handleLanguageChange(language: Language) {
    onSettingsChange({ ...settings, language });
  }

  function handleAvatarSelect(avatarId: string) {
    const avatar = PREDEFINED_AVATARS.find(a => a.id === avatarId);
    if (avatar) {
      onSettingsChange({
        ...settings,
        avatarId,
        avatarImageUrl: avatar.imageUrl,
        avatarVoiceGender: avatar.defaultGender,
        tone: avatar.defaultTone,
        personality: avatar.defaultPersonality
      });
      setImageUrl(avatar.imageUrl);
    }
  }

  function handleModelChange(modelId: string) {
    onSettingsChange({ ...settings, selectedGeminiModel: modelId });
  }

  function clearAvatar() {
    setImageUrl('');
    onSettingsChange({ ...settings, avatarImageUrl: undefined });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Conversation Settings</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Avatar
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PREDEFINED_AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => handleAvatarSelect(avatar.id)}
                  className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                    settings.avatarId === avatar.id
                      ? 'bg-gray-900 border-gray-900'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden mb-2">
                    <img src={avatar.imageUrl} alt={avatar.name} className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-xs font-medium text-center ${
                    settings.avatarId === avatar.id ? 'text-white' : 'text-gray-700'
                  }`}>
                    {avatar.name}
                  </span>
                  {settings.avatarId === avatar.id && (
                    <Check className="absolute top-2 right-2 w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Custom Avatar Image (Optional)
            </label>
            <div className="flex items-start gap-4">
              <div className="relative w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden ring-4 ring-gray-50 flex-shrink-0">
                {settings.avatarImageUrl ? (
                  <img src={settings.avatarImageUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-gray-400" />
                )}
                {processing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={handleUrlChange}
                      onBlur={handleUrlSave}
                      placeholder="Paste image URL..."
                      className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processing}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {processing ? 'Processing...' : 'Upload File'}
                  </button>
                  {settings.avatarImageUrl && (
                    <button
                      onClick={clearAvatar}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
               
              </div>
            </div>
            {urlError && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {urlError}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <p className="text-xs text-gray-500 mb-3">
              What is this AI being used for?
            </p>
            <textarea
              value={settings.description}
              onChange={handleDescriptionChange}
              rows={2}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 resize-none transition-all"
              placeholder="E.g., Customer support assistant, Learning companion, Technical advisor..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Gemini Model
            </label>
            <select
              value={settings.selectedGeminiModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
            >
              {GEMINI_MODELS.map((model) => (
                <option key={model.id} value={model.id} disabled={model.locked}>
                  {model.name} {model.locked ? '(Locked)' : ''}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">
              Automatically falls back to alternative models if unavailable
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Avatar Voice Gender
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Select the voice gender for the avatar
            </p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' }
              ] as const).map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleVoiceGenderChange(option.value)}
                  className={`relative py-3 px-4 text-sm rounded-xl border-2 transition-all ${
                    settings.avatarVoiceGender === option.value
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {settings.avatarVoiceGender === option.value && (
                    <Check className="absolute top-1.5 right-1.5 w-3 h-3" />
                  )}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Language
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Both AI responses and avatar speech will use this language
            </p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'en', label: 'English' },
                { value: 'hi', label: 'Hindi' }
              ] as const).map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleLanguageChange(option.value)}
                  className={`relative py-3 px-4 text-sm rounded-xl border-2 transition-all ${
                    settings.language === option.value
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {settings.language === option.value && (
                    <Check className="absolute top-1.5 right-1.5 w-3 h-3" />
                  )}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Personality
            </label>
            <textarea
              value={settings.personality}
              onChange={handlePersonalityChange}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 resize-none transition-all"
              placeholder="Describe how the AI should behave..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Conversation Tone
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Affects both AI responses and voice synthesis
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['Professional', 'Friendly', 'Mentor'] as const).map((tone) => (
                <button
                  key={tone}
                  onClick={() => handleToneChange(tone)}
                  className={`relative py-3 px-4 text-sm rounded-xl border-2 transition-all ${
                    settings.tone === tone
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {settings.tone === tone && (
                    <Check className="absolute top-1.5 right-1.5 w-3 h-3" />
                  )}
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Response Depth
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Short', 'Normal', 'Detailed'] as const).map((length) => {
                const isLocked = length === 'Detailed';
                return (
                  <button
                    key={length}
                    onClick={() => !isLocked && handleResponseLengthChange(length)}
                    disabled={isLocked}
                    className={`relative py-3 px-4 text-sm rounded-xl border-2 transition-all ${
                      settings.responseLength === length
                        ? 'bg-gray-900 text-white border-gray-900'
                        : isLocked
                        ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {settings.responseLength === length && !isLocked && (
                      <Check className="absolute top-1.5 right-1.5 w-3 h-3" />
                    )}
                    {isLocked && (
                      <Lock className="absolute top-1.5 right-1.5 w-3 h-3" />
                    )}
                    {length}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Settings apply only to this conversation
          </p>
        </div>
      </div>
    </div>
  );
}
