import React from 'react';

export interface FooterProps {
  APP_ID: string;
  SUPPORTED_LANGUAGES: readonly string[];
  sdkVersion?: string;
}

const Footer: React.FC<FooterProps> = ({ APP_ID, SUPPORTED_LANGUAGES, sdkVersion }) => (
  <footer className="mt-12 border-t border-gray-200 pt-4 px-2 text-xs text-gray-500 bg-white">
    <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-700">APP_ID:</span>
        <span className={APP_ID ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
          {APP_ID ? 'set' : 'missing'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-700">Languages:</span>
        <span className="hover:text-blue-600 transition-colors cursor-pointer">{SUPPORTED_LANGUAGES.join(', ').toUpperCase()}</span>
      </div>
      {sdkVersion && (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700">SDK Version:</span>
          <span className="text-blue-600 font-mono">{sdkVersion}</span>
        </div>
      )}
    </div>
  </footer>
);

export default Footer;
