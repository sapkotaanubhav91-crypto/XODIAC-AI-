import React from 'react';
import { UserButton } from '@clerk/clerk-react';
import { 
  LogoIcon, PlusIcon, HomeIcon, DiscoverIcon, 
  SpacesIcon, GraphIcon, BellIcon 
} from './Icons';

interface SidebarProps {
  onNewThread: () => void;
}

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <button className={`flex flex-col items-center justify-center space-y-1 w-full p-2 rounded-lg transition-colors ${active ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
    <div className={`w-6 h-6 ${active ? 'text-white' : ''}`}>
      {icon}
    </div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ onNewThread }) => {
  return (
    <div className="fixed left-0 top-0 h-full w-[72px] bg-black border-r border-gray-800 flex flex-col items-center py-4 z-50">
       {/* Logo */}
       <div className="mb-6 cursor-pointer text-white" onClick={() => window.location.reload()}>
         <LogoIcon className="w-8 h-8" />
       </div>

       {/* New Thread */}
       <button 
         onClick={onNewThread} 
         className="mb-8 p-2.5 bg-gray-900 hover:bg-gray-800 rounded-full transition-colors border border-gray-700 shadow-sm group"
         title="New Thread"
       >
         <PlusIcon className="w-5 h-5 text-gray-400 group-hover:text-white" />
       </button>

       {/* Nav Items */}
       <div className="flex flex-col space-y-4 w-full px-2">
          <NavItem icon={<HomeIcon />} label="Home" active />
          <NavItem icon={<DiscoverIcon />} label="Discover" />
          <NavItem icon={<SpacesIcon />} label="Spaces" />
          <NavItem icon={<GraphIcon />} label="Finance" />
       </div>

       {/* Footer */}
       <div className="mt-auto flex flex-col space-y-6 items-center w-full pb-6">
          <button className="text-gray-500 hover:text-gray-300">
            <BellIcon className="w-5 h-5" />
          </button>
          
          <div className="relative group cursor-pointer flex justify-center">
             <div className="scale-110">
                <UserButton appearance={{
                    elements: {
                        avatarBox: "w-8 h-8"
                    }
                }} />
             </div>
          </div>
       </div>
    </div>
  );
}