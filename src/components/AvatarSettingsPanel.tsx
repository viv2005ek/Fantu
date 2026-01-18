/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useRef, useEffect } from 'react';
import { X, Check, Lock } from 'lucide-react';
  import { ChevronDown } from 'lucide-react';
import {
  ConversationSettings,
  AvatarVoiceGender,
  Language,
  PREDEFINED_AVATARS,
  GEMINI_MODELS
} from '../types';

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
  const [mediaUrl, setMediaUrl] = useState(
  settings.avatarMediaUrl ?? ''
);


function handleAvatarSelect(avatarId: string) {
  const avatar = PREDEFINED_AVATARS.find(a => a.id === avatarId);
  if (!avatar) return;

  onSettingsChange({
    ...settings,
    avatarId: avatar.id,
    avatarMediaUrl: avatar.avatarMediaUrl,
    avatarPreviewImageUrl: avatar.previewImageUrl,
    avatarVoiceGender: avatar.defaultGender,
    tone: avatar.defaultTone,
    personality: avatar.defaultPersonality,
    description: avatar.defaultDescription ?? settings.description,
    language: avatar.language ?? settings.language
  });

  setMediaUrl(avatar.avatarMediaUrl);
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

  function handleModelChange(modelId: string) {
    onSettingsChange({ ...settings, selectedGeminiModel: modelId });
  }

const [open, setOpen] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target as Node)
    ) {
      setOpen(false);
    }
  }

  if (open) {
    document.addEventListener('mousedown', handleClickOutside);
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [open]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Conversation Settings
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

          {/* AVATAR SELECTION */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Avatar
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PREDEFINED_AVATARS.map(avatar => (
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
                    <img
                      src={avatar.previewImageUrl}
                      alt={avatar.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span
                    className={`text-xs font-medium text-center ${
                      settings.avatarId === avatar.id
                        ? 'text-white'
                        : 'text-gray-700'
                    }`}
                  >
                    {avatar.name}
                  </span>
                  {settings.avatarId === avatar.id && (
                    <Check className="absolute top-2 right-2 w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* CUSTOM VIDEO URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Avatar Video URL (MP4 / MOV)
            </label>
           <input
  type="url"
  value={mediaUrl}
 onChange={(e) => {
  const value = e.target.value.trim();
  setMediaUrl(e.target.value);

  onSettingsChange({
    ...settings,
    avatarMediaUrl: value || settings.avatarMediaUrl
  });
}}

  placeholder="https://example.com/avatar.mp4"
  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
/>

            <p className="text-xs text-gray-500 mt-2">
              Use a short, front-facing talking-head video for best lip-sync
            </p>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={settings.description}
              onChange={handleDescriptionChange}
              rows={2}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          {/* GEMINI MODEL */}
       

<div className="relative" ref={dropdownRef}>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    AI Model
  </label>

  {/* Trigger */}
  <button
    type="button"
    onClick={() => setOpen(o => !o)}
    className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm hover:border-gray-400 transition"
  >
    <span>
      {GEMINI_MODELS.find(m => m.id === settings.selectedGeminiModel)?.name}
    </span>
    <ChevronDown
      className={`w-4 h-4 text-gray-500 transition-transform ${
        open ? 'rotate-180' : ''
      }`}
    />
  </button>

  {/* Dropdown */}
  {open && (
    <div
      className="
        absolute z-50 mt-2 w-full bg-white
        border border-gray-200 rounded-xl shadow-lg
        max-h-64 overflow-y-auto
      "
    >
      {/* AVAILABLE */}
      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 sticky top-0">
        Available
      </div>

      {GEMINI_MODELS.filter(m => !m.locked).map(model => (
        <button
          key={model.id}
          onClick={() => {
            handleModelChange(model.id);
            setOpen(false);
          }}
          className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition ${
            settings.selectedGeminiModel === model.id
              ? 'bg-gray-900 text-white'
              : 'hover:bg-gray-100'
          }`}
        >
          <span>{model.name}</span>
          {settings.selectedGeminiModel === model.id && (
            <Check className="w-4 h-4" />
          )}
        </button>
      ))}

      {/* UPCOMING */}
      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-t sticky top-[2.25rem]">
        Upcoming
      </div>

      {GEMINI_MODELS.filter(m => m.locked).map(model => (
        <div
          key={model.id}
          className="px-4 py-3 text-sm text-gray-400 flex items-center justify-between cursor-not-allowed"
        >
          <span>{model.name}</span>
          <Lock className="w-4 h-4" />
        </div>
      ))}
    </div>
  )}

  <p className="mt-2 text-xs text-gray-500">
    Model selection applies to this conversation only.
  </p>
</div>



          {/* VOICE GENDER */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Avatar Voice Gender
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['female', 'male'] as const).map(gender => (
                <button
                  key={gender}
                  onClick={() => handleVoiceGenderChange(gender)}
                  className={`py-3 rounded-xl border-2 ${
                    settings.avatarVoiceGender === gender
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-200'
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          {/* LANGUAGE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Language
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['en', 'hi'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`py-3 rounded-xl border-2 ${
                    settings.language === lang
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-200'
                  }`}
                >
                  {lang === 'en' ? 'English' : 'Hindi'}
                </button>
              ))}
            </div>
          </div>

          {/* PERSONALITY */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Personality
            </label>
            <textarea
              value={settings.personality}
              onChange={handlePersonalityChange}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          {/* RESPONSE DEPTH */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Response Depth
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Short', 'Normal', 'Detailed'] as const).map(depth => {
                const locked = depth === 'Detailed';
                return (
                  <button
                    key={depth}
                    disabled={locked}
                    onClick={() =>
                      !locked && handleResponseLengthChange(depth)
                    }
                    className={`py-3 rounded-xl border-2 ${
                      locked
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        : settings.responseLength === depth
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'border-gray-200'
                    }`}
                  >
                    {depth}
                    {locked && <Lock className="inline ml-1 w-3 h-3" />}
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
