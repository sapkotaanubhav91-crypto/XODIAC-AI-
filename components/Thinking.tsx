import React, { useState } from 'react';
import { BrainIcon } from './Icons';

interface ThinkingProps {
  content: string;
}

const Thinking: React.FC<ThinkingProps> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!content) return null;

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200/80 transition-colors text-left"
      >
        <BrainIcon className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Thinking Process</span>
        <span className="ml-auto text-xs text-gray-400">
          {isOpen ? 'Hide' : 'Show'}
        </span>
      </button>
      
      {isOpen && (
        <div className="px-4 py-3 text-sm text-gray-600 bg-gray-50/50 leading-relaxed font-mono whitespace-pre-wrap border-t border-gray-200">
          {content}
        </div>
      )}
    </div>
  );
};

export default Thinking;