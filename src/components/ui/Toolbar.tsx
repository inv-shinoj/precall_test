import React from 'react';

interface ToolbarProps {
  language: string;
  languageDisabled: boolean;
  isEnableCloudProxy: boolean;
  fixProxyPort: boolean;
  testing: boolean;
  onSwitchLanguage: () => void;
  onToggleCloudProxy: () => void;
  onSetProxyModeFixed: (fixed: boolean) => void;
  onStartTest: () => void;
  onResetTest: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  language,
  languageDisabled,
  isEnableCloudProxy,
  fixProxyPort,
  testing,
  onSwitchLanguage,
  onToggleCloudProxy,
  onSetProxyModeFixed,
  onStartTest,
  onResetTest,
}) => (
  <header className="flex items-center justify-between gap-4 border-b pb-4 mb-8">
    <h1 className="text-2xl font-bold tracking-tight">Agora Precall Test</h1>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onSwitchLanguage}
        disabled={languageDisabled}
        className="px-3 py-1 rounded border border-gray-200 bg-white hover:bg-gray-100 transition"
      >
        {language.toUpperCase()}
      </button>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Cloud Proxy</span>
        <input
          type="checkbox"
          checked={isEnableCloudProxy}
          onChange={onToggleCloudProxy}
          className="accent-black h-4 w-4"
        />
        <select
          className="border border-gray-200 rounded px-2 py-1 text-xs bg-white"
          value={fixProxyPort ? 'fixed' : 'default'}
          onChange={e => onSetProxyModeFixed(e.target.value === 'fixed')}
          disabled={!isEnableCloudProxy}
        >
          <option value="default">default</option>
          <option value="fixed">fixed</option>
        </select>
      </div>
      <button
        type="button"
        onClick={onStartTest}
        className="px-3 py-1 rounded bg-black text-white hover:bg-gray-900 transition"
      >
        {testing ? 'Restart' : 'Start'}
      </button>
      {testing && (
        <button
          type="button"
          onClick={onResetTest}
          className="px-3 py-1 rounded border border-gray-200 bg-white hover:bg-gray-100 transition"
        >
          Reset
        </button>
      )}
    </div>
  </header>
);

export default Toolbar;
