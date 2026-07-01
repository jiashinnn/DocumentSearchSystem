import { LogIn } from 'lucide-react';
import logoOmniDoc from '../assets/omnidoc_logo.png';
import { Button } from './ui/button';

interface HeaderProps {
  view: 'landing' | 'login';
  onNavigate: (view: 'landing' | 'login') => void;
}

export default function Header({ view, onNavigate }: HeaderProps) {
  return (
    <header className="w-full border-b border-slate-200 bg-white shadow-sm shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        {/* Logo */}
        <div 
          className="flex items-center gap-1.5 cursor-pointer select-none" 
          onClick={() => onNavigate('landing')}
        >
          <div className="flex items-center select-none">
            <img src={logoOmniDoc} alt="OmniDoc Logo" className="h-7 w-auto object-contain" />
          </div>
          <div className="flex items-center">
            <span className="text-lg font-bold tracking-tight text-slate-900">OmniDoc</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3.5">
          {view !== 'login' && (
            <Button
              id="login-btn"
              variant="outline"
              onClick={() => onNavigate('login')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <LogIn className="h-3.5 w-3.5 text-slate-500" /> Log In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
