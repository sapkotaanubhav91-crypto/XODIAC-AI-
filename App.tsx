import React, { useState, useEffect, useRef } from 'react';
import SearchBar from './components/SearchBar';
import { SourceCard } from './components/SourceCard';
import { streamSearchResponse } from './services/geminiService';
import { Message, Source } from './types';
import { SourcesIcon, AnswerIcon, RelatedIcon, ImageIcon, LoaderIcon } from './components/Icons';
import Markdown from './components/Markdown';
import { LoadingStatus } from './components/LoadingStatus';

// Helper component for smooth image loading
const ImageWithLoad = ({ src, alt }: { src: string, alt: string }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 relative min-h-[300px] flex items-center justify-center">
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
           <div className="flex flex-col items-center space-y-2">
             <LoaderIcon className="w-8 h-8 animate-spin text-purple-500" />
             <span className="text-xs font-medium text-gray-500">Generating visual...</span>
           </div>
        </div>
      )}
      {error ? (
          <div className="text-sm text-red-500 p-4">Failed to load image</div>
      ) : (
          <img 
            src={src} 
            alt={alt} 
            className={`w-full h-auto object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            loading="lazy"
          />
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (query: string, isDeepThink: boolean = false, isImageGen: boolean = false) => {
    if (!query.trim()) return;

    // Check for explicit image generation intent in text if not already set
    const imageIntentRegex = /^(generate|create|draw|make) (an )?image|visual|picture|photo/i;
    const effectiveIsImageGen = isImageGen || imageIntentRegex.test(query);

    const wantsGrok = query.toLowerCase().includes("use grok");
    const effectiveDeepThink = isDeepThink || wantsGrok;

    setHasStarted(true);
    setIsLoading(true);

    const userMsg: Message = { role: 'user', text: query, isDeepThink: effectiveDeepThink };
    setMessages(prev => [...prev, userMsg]);

    if (effectiveIsImageGen) {
        // Handle Image Generation
        const modelMsg: Message = { role: 'model', text: '', isThinking: true };
        setMessages(prev => [...prev, modelMsg]);

        // Simulate a brief "processing" delay before showing the image loader
        setTimeout(() => {
             // Add random seed to prevent caching and ensure new images for same prompts
             const seed = Math.floor(Math.random() * 1000000);
             // Extract the prompt part if it starts with "generate an image of..."
             // Simple clean up: remove "generate an image of" to get a cleaner prompt for Pollinations
             let cleanPrompt = query.replace(/^(generate|create|draw|make) (an )?(image|visual|picture|photo) (of )?/i, '').trim();
             if (!cleanPrompt) cleanPrompt = query;

             const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?nologo=true&seed=${seed}`;
             
             setMessages(prev => {
                const newHistory = [...prev];
                const lastMsg = newHistory[newHistory.length - 1];
                lastMsg.isThinking = false;
                lastMsg.text = `Generated image for: **${cleanPrompt}**`;
                lastMsg.imageUrl = imageUrl;
                return newHistory;
             });
             setIsLoading(false);
        }, 800);
        return;
    }

    // Regular Search / Chat Flow
    setMessages(prev => [...prev, { role: 'model', text: '', isThinking: true, isDeepThink: effectiveDeepThink }]);

    await streamSearchResponse(
      query,
      messages.concat(userMsg),
      (chunk) => {
        setMessages(prev => {
          const newHistory = [...prev];
          const lastMsg = newHistory[newHistory.length - 1];
          if (lastMsg.role === 'model') {
            lastMsg.text += chunk;
            lastMsg.isThinking = false;
            
            if (lastMsg.text.includes("RELATED_QUESTIONS:")) {
                const parts = lastMsg.text.split("RELATED_QUESTIONS:");
                if (parts[1]) {
                    lastMsg.relatedQuestions = parts[1]
                        .split('\n')
                        .map(line => line.trim())
                        .filter(line => line.startsWith('-'))
                        .map(line => line.substring(1).trim());
                }
            }
          }
          return newHistory;
        });
      },
      (sources) => {
        setMessages(prev => {
          const newHistory = [...prev];
          const lastMsg = newHistory[newHistory.length - 1];
          if (lastMsg.role === 'model') {
             const existing = lastMsg.sources || [];
             const combined = [...existing, ...sources].filter((v,i,a)=>a.findIndex(t=>(t.uri===v.uri))===i);
             lastMsg.sources = combined;
          }
          return newHistory;
        });
      },
      effectiveDeepThink
    );

    setIsLoading(false);
  };

  useEffect(() => {
    const scrollToBottom = () => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (isLoading && messages[messages.length - 1]?.text === '') {
        scrollToBottom();
    }
    
    const isNearBottom = () => {
        const threshold = 150;
        const position = window.scrollY + window.innerHeight;
        const height = document.documentElement.scrollHeight;
        return height - position <= threshold;
    };

    if (isLoading && isNearBottom()) {
       scrollToBottom();
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length-1].isThinking) {
         bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const getDisplayText = (text: string) => {
    return text.split("RELATED_QUESTIONS:")[0].trim();
  };

  const getLoadingState = (msg: Message) => {
    if (msg.imageUrl && !msg.text) return 'thinking';
    if (msg.isDeepThink && (!msg.sources || msg.sources.length === 0)) {
        return 'thinking';
    }
    if (msg.sources && msg.sources.length > 0) {
        return 'reading';
    }
    return 'searching';
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-[#1f2937] bg-[#fcfcf9]">
      
      <main className={`flex-1 flex flex-col ${!hasStarted ? 'justify-center' : ''} transition-all duration-500`}>
        
        {!hasStarted && (
           <div className="flex flex-col items-center justify-center px-4 w-full -mt-20 fade-in">
             <h1 className="logo-text text-5xl mb-8 text-gray-900">Xodiac AI</h1>
             <div className="w-full flex justify-center">
                <SearchBar onSearch={handleSearch} isLoading={isLoading} isCentered={true} />
             </div>
             
             <div className="fixed bottom-8 right-8 flex space-x-4 text-gray-400">
               <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                 <div className="w-4 h-4 border border-current rounded-full flex items-center justify-center text-[10px]">?</div>
               </button>
             </div>
           </div>
        )}

        {hasStarted && (
          <div className="w-full max-w-[750px] mx-auto px-4 md:px-0 pt-8 pb-40">
            
            <header className="fixed top-0 left-0 w-full bg-[#fcfcf9]/95 backdrop-blur-sm z-30 border-b border-gray-100/50">
               <div className="max-w-[1200px] mx-auto flex items-center justify-between h-16 px-4">
                  <div className="logo-text text-2xl cursor-pointer text-gray-900" onClick={() => window.location.reload()}>Xodiac AI</div>
               </div>
            </header>

            <div className="mt-16 space-y-10">
              {messages.map((msg, idx) => (
                <div key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {msg.role === 'user' ? (
                    <div className="text-[32px] font-medium text-[#1f2937] tracking-tight mb-8 mt-6 leading-tight">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center space-x-2 mb-3">
                             <SourcesIcon className="w-5 h-5 text-gray-400" />
                             <span className="text-base font-medium text-gray-900">Sources</span>
                          </div>
                          <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                            {msg.sources.map((src, i) => (
                              <SourceCard key={i} source={src} index={i} />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="">
                         {(!msg.isThinking || getDisplayText(msg.text).length > 0) && (
                             <div className="flex items-center space-x-2 mb-3">
                                 {msg.imageUrl ? <ImageIcon className="w-5 h-5 text-gray-400" /> : <AnswerIcon className="w-5 h-5 text-gray-400" />}
                                 <div className="flex items-center space-x-2">
                                    <span className="text-base font-medium text-gray-900">
                                        {msg.imageUrl ? "Generated Image" : "Answer"}
                                    </span>
                                    {msg.isDeepThink && (
                                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Deep Think</span>
                                    )}
                                 </div>
                             </div>
                         )}
                         
                         <div className="prose prose-slate max-w-none text-[#1f2937]">
                           {msg.isThinking && getDisplayText(msg.text).length === 0 ? (
                               <LoadingStatus status={getLoadingState(msg)} sourceCount={msg.sources?.length} />
                           ) : (
                               <>
                                   <Markdown content={getDisplayText(msg.text)} />
                                   {msg.imageUrl && (
                                       <ImageWithLoad src={msg.imageUrl} alt={msg.text} />
                                   )}
                               </>
                           )}
                         </div>
                      </div>

                      {!msg.isThinking && msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                        <div className="mt-6 pt-2 border-t border-gray-100">
                            <div className="flex items-center space-x-2 mb-3 mt-4">
                                <RelatedIcon className="w-5 h-5 text-gray-400" />
                                <span className="text-lg font-medium text-gray-900">Related</span>
                            </div>
                            <div className="space-y-2">
                                {msg.relatedQuestions.map((question, i) => (
                                    <div key={i} className="group flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer border-b border-gray-100 last:border-0 transition-colors" onClick={() => handleSearch(question, false)}>
                                        <span className="text-gray-700 font-medium group-hover:text-[#115e59]">{question}</span>
                                        <div className="text-gray-300 group-hover:text-[#115e59] transition-colors">+</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} className="h-4" />
            </div>

            <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-[#fcfcf9] via-[#fcfcf9] to-transparent pt-12 pb-6 z-20">
               <div className="max-w-[750px] mx-auto px-4">
                 <SearchBar onSearch={handleSearch} isLoading={isLoading} isCentered={false} />
               </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;