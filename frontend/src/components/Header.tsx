import { LogOut } from 'lucide-react';
import logoOmniDoc from '../assets/omnidoc_logo.png';
import { Button } from './ui/button';

interface HeaderProps {
  view: 'landing' | 'search';
  currentTab: 'home' | 'history' | 'doc-logs';
  onChangeTab: (tab: 'home' | 'history') => void;
  onLogout?: () => void;
}

export default function Header({ view, currentTab, onChangeTab, onLogout }: HeaderProps) {
  return (
    <header className="w-full border-b border-slate-200 bg-white shadow-sm shrink-0">
      <div className="w-full px-6 sm:px-10 h-14 flex items-center justify-between relative">

        {/* Logo */}
        <div className="flex items-center select-none">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center select-none">
              <img src={logoOmniDoc} alt="OmniDoc Logo" className="h-7 w-auto object-contain" />
            </div>
            <div className="flex items-center">
              <span className="text-lg font-bold tracking-tight text-slate-900">OmniDoc</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        {view === 'search' && (
          <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 h-14">
            <button
              onClick={() => onChangeTab('home')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${currentTab === 'home'
                ? 'text-blue-900 bg-blue-50/60'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
            >
              Home
            </button>
            <button
              onClick={() => onChangeTab('history')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${currentTab === 'history'
                ? 'text-blue-900 bg-blue-50/60'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
            >
              History
            </button>
          </nav>
        )}

        {/* Log out Buttons */}
        <div className="flex items-center gap-3.5">
          {view === 'search' && (
            <Button
              id="logout-btn"
              variant="outline"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 text-slate-500" /> Log Out
            </Button>
          )}
        </div>

      </div>
    </header>
  );
}
