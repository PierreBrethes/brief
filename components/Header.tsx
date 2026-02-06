
import React from 'react';
import { LayoutGrid } from 'lucide-react';

interface HeaderProps {
  onBack?: () => void;
  showBack?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onBack, showBack }) => {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-black/20 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white uppercase italic">
            BRIEF<span className="text-blue-500">.</span>
          </span>
        </div>

        {showBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-all group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Flux de veille
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
