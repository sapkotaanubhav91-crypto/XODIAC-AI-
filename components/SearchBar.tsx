import React, { useState, useRef, useEffect } from 'react';
import { 
  SearchIcon, AttachIcon, MicIcon, ArrowRightIcon, BrainIcon, 
  ImageIcon, FilePlusIcon, TelescopeIcon, BookIcon, MoreHorizontalIcon 
} from './Icons';

interface SearchBarProps {
  onSearch: (query: string, isDeepThink: boolean, isImageGen: boolean) => void;
  isLoading: boolean;
  isCentered?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading, isCentered = true }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isDeepThink, setIsDeepThink] = useState(false);
  const [isImageGen, setIsImageGen] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query, isDeepThink, isImageGen);
      if (isCentered) {
        setQuery('');
        setIsImageGen(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAttachOption = (option: string) => {
      if (option === 'image') {
          setIsImageGen(true);
      } else if (option === 'thinking') {
          setIsDeepThink(true);
      }
      setShowAttachMenu(false);
      if (textareaRef.current) {
          textareaRef.current.focus();
      }
  };

  return (
    <div 
      className={`relative w-full transition-all duration-300 ${
        isCentered ? 'max-w-[700px]' : 'max-w-4xl'
      }`}
    >
      <div 
        className={`
          relative flex flex-col w-full bg-white border transition-shadow duration-200
          ${isFocused ? 'border-gray-300 shadow-md' : 'border-gray-200 shadow-sm'}
          rounded-[32px] overflow-hidden group
        `}
      >
        <div className="flex items-start p-4">
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isImageGen ? "Describe the image you want to generate..." : (isCentered ? "Ask anything..." : "Ask a follow-up...")}
            rows={1}
            className="w-full resize-none bg-transparent outline-none text-gray-800 placeholder-gray-400 text-lg leading-relaxed max-h-48 py-1 ml-1"
            style={{ minHeight: '28px' }}
          />
        </div>

        {(isDeepThink || isImageGen) && (
             <div className="flex items-center space-x-2 px-4 pb-2">
                 {isImageGen && (
                     <span className="flex items-center space-x-1 bg-purple-50 text-purple-600 text-xs px-2 py-1 rounded-md border border-purple-100">
                         <ImageIcon className="w-3 h-3" />
                         <span>Image Gen</span>
                         <button onClick={() => setIsImageGen(false)} className="ml-1 hover:text-purple-800">×</button>
                     </span>
                 )}
                 {isDeepThink && (
                      <span className="flex items-center space-x-1 bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-md border border-blue-100">
                         <BrainIcon className="w-3 h-3" />
                         <span>Deep Think</span>
                         <button onClick={() => setIsDeepThink(false)} className="ml-1 hover:text-blue-800">×</button>
                     </span>
                 )}
             </div>
        )}

        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center space-x-2 pl-2 relative">
            <button 
              onClick={() => setIsDeepThink(!isDeepThink)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isDeepThink 
                  ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                  : 'bg-gray-50/50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <BrainIcon className={`w-3.5 h-3.5 ${isDeepThink ? 'text-blue-500' : ''}`} />
              <span>Deep Think</span>
            </button>
            
            <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 hover:bg-gray-100 rounded-full text-xs font-medium text-gray-500 transition-colors ${showAttachMenu ? 'bg-gray-100' : 'bg-gray-50/50'}`}
                >
                  <AttachIcon className="w-3.5 h-3.5" />
                  <span>Attach</span>
                </button>

                {showAttachMenu && (
                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-bottom-left">
                        <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Options</div>
                        
                        <button className="w-full text-left flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition-colors">
                            <FilePlusIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">Add photos & files</span>
                        </button>
                        
                        <button 
                            onClick={() => handleAttachOption('image')}
                            className="w-full text-left flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                            <ImageIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">Create image</span>
                        </button>

                         <button 
                            onClick={() => handleAttachOption('thinking')}
                            className="w-full text-left flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                            <BrainIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">Thinking</span>
                        </button>
                        
                        <button className="w-full text-left flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition-colors">
                            <TelescopeIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">Deep research</span>
                        </button>
                        
                        <button className="w-full text-left flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition-colors">
                            <BookIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">Study and learn</span>
                        </button>
                        
                        <div className="my-1 border-t border-gray-100"></div>
                        
                        <button className="w-full text-left flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition-colors">
                            <MoreHorizontalIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">More</span>
                        </button>
                    </div>
                )}
            </div>
          </div>

          <div className="flex items-center space-x-2 pr-2">
            <button className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full">
              <MicIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handleSubmit()}
              disabled={!query.trim() || isLoading}
              className={`
                px-4 py-2 rounded-full transition-all duration-200 flex items-center space-x-2
                ${query.trim() 
                  ? 'bg-[#115e59] text-white hover:bg-[#0f534f]' 
                  : 'bg-gray-100 text-gray-300'}
              `}
            >
              <span className="text-sm font-medium">Search</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;