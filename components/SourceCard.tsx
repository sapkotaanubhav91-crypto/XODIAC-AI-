import React from 'react';
import { Source } from '../types';

export const SourceCard: React.FC<{ source: Source; index: number }> = ({ source, index }) => {
  return (
    <a 
      href={source.uri} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex-shrink-0 w-36 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200/60 rounded-lg transition-all flex flex-col justify-between h-24 no-underline group hover:border-gray-300"
    >
      <div className="text-xs text-gray-800 line-clamp-3 mb-1 font-medium leading-relaxed group-hover:text-black transition-colors">
        {source.title}
      </div>
      <div className="flex items-center space-x-2 mt-auto">
        <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[9px] text-gray-500 font-medium">
            <img src={`https://www.google.com/s2/favicons?domain=${new URL(source.uri).hostname}&sz=32`} className="w-3 h-3 opacity-70" alt="" onError={(e) => e.currentTarget.style.display='none'} />
        </div>
        <div className="text-[10px] text-gray-400 truncate font-medium">
          {new URL(source.uri).hostname.replace('www.', '')}
        </div>
        <div className="text-[9px] text-gray-300 ml-auto">
            {index + 1}
        </div>
      </div>
    </a>
  );
};