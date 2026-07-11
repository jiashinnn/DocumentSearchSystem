import { useState } from 'react';
import { LogOut, User } from 'lucide-react';
import logoOmniDoc from '../assets/omnidoc_logo.png';
import { Button } from './ui/button';

interface HeaderProps {
  view: 'landing' | 'search';
  currentTab: 'home' | 'history' | 'doc-logs';
  onChangeTab: (tab: 'home' | 'history') => void;
  onLogout?: () => void;
  currentUser?: { email: string; name: string } | null;
}

export default function Header({ view, currentTab, onChangeTab, onLogout, currentUser }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

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

        {/* Profile Dropdown */}
        <div className="flex items-center gap-3.5">
          {view === 'search' && (
            <div className="relative">
              {/* Profile Avatar Button */}
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="h-8 w-8 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors focus:outline-none cursor-pointer"
                title="User profile menu"
              >
                <User className="h-4 w-4" />
              </button>
              {/* Dropdown Card */}
              {showDropdown && (
                <>
                  {/* Invisible screen overlay to close the dropdown when clicking outside */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                  />

                  <div className="absolute right-0 mt-2.5 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-100">
                    {/* User profile info header */}
                    <div className="px-4 py-2 border-b border-slate-100 text-left">
                      <p className="text-xs font-bold text-slate-800 truncate">{currentUser?.name}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{currentUser?.email}</p>
                    </div>
                    {/* Log out Button */}
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onLogout?.();
                      }}
                      className="w-full text-left px-4 py-2 mt-1.5 text-xs text-rose-600 hover:bg-rose-50/50 transition-colors inline-flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
