import { useState } from 'react';
import Header from './components/Header';
import LandingView from './components/LandingView';
import LoginView from './components/LoginView';
import Footer from './components/Footer';
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  const [view, setView] = useState<'landing' | 'login'>('landing');

  return (
    <div className="w-full min-h-screen lg:h-screen lg:overflow-hidden bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <Header view={view} onNavigate={setView} />

      <main className="flex-1 flex items-center justify-center py-6 overflow-hidden">
        {view === 'landing' ? (
          <LandingView onEnterPortal={() => setView('login')} />
        ) : (
          <LoginView onBack={() => setView('landing')} />
        )}
      </main>

      <Footer />
      <Toaster position="top-right" closeButton richColors />
    </div>
  );
}
