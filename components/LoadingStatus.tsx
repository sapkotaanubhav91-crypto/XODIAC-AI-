import React from 'react';
import { SearchIcon, LibraryIcon, BrainIcon, LoaderIcon } from './Icons';

interface LoadingStatusProps {
    status: 'searching' | 'reading' | 'thinking';
    sourceCount?: number;
}

export const LoadingStatus: React.FC<LoadingStatusProps> = ({ status, sourceCount = 0 }) => {
    return (
        <div className="flex items-center space-x-3 my-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#fcfcf9] border border-gray-100 shadow-sm">
                {status === 'searching' && <LoaderIcon className="w-4 h-4 text-gray-400 animate-spin" />}
                {status === 'reading' && <LibraryIcon className="w-4 h-4 text-[#115e59] animate-pulse" />}
                {status === 'thinking' && <BrainIcon className="w-4 h-4 text-blue-500 animate-pulse" />}
             </div>
             <div className="flex flex-col">
                 <span className="text-sm font-medium text-gray-700 animate-pulse">
                    {status === 'searching' && "Searching web..."}
                    {status === 'reading' && `Reading ${sourceCount} sources...`}
                    {status === 'thinking' && "Deep Thinking..."}
                 </span>
             </div>
        </div>
    );
};