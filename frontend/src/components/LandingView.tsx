import { ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import LoginView from './LoginView';

interface LandingViewProps {
  onLoginSuccess: (user: { email: string; name: string }) => void;
}

export default function LandingView({ onLoginSuccess }: LandingViewProps) {
  const handleEnterPortalClick = () => {
    const emailInput = document.getElementById('email');
    if (emailInput) {
      emailInput.focus();
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

        {/* Left Column: System Introduction */}
        <div className="space-y-5 text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight">
            Secure Smart Document Search for <br className="hidden sm:inline" />
            <span className="text-blue-900">OmniDoc</span>
          </h1>

          <p className="text-base text-slate-600 leading-relaxed max-w-lg">
            OmniDoc is a high-performance application designed to index and search company documents. It allows employees to search for documentation using vector-based semantic analysis.
          </p>

          <div className="pt-1">
            <Button
              onClick={handleEnterPortalClick}
              className="inline-flex items-center gap-2 bg-blue-900 text-white px-4.5 py-2.5 rounded-lg font-semibold hover:bg-blue-800 cursor-pointer text-xs"
            >
              Enter Portal
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right Column: Embedded Login View */}
        <div className="w-full flex justify-center lg:justify-end">
          <LoginView onLoginSuccess={onLoginSuccess} />
        </div>

      </div>
    </section>
  );
}
