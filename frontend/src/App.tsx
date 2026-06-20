import {
  Search,
  Lock,
  FileText,
  ArrowRight,
  ShieldAlert,
  LogIn,
  UserPlus
} from 'lucide-react';
import logoOmniDoc from './assets/omnidoc_logo.png';

// Import shadcn UI components
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export default function App() {
  const handleLogin = () => {
    toast.info("Redirecting to the Secure Corporate Login Portal...");
  };

  const handleRegister = () => {
    toast.success("Opening employee registration form...");
  };

  return (
    <div className="w-full min-h-screen lg:h-screen lg:overflow-hidden bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">

      {/* Top Banner Notice */}
      <div className="w-full bg-amber-500/15 border-b border-amber-500/20 text-amber-800 text-[11px] py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 shrink-0">
        <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
        <span>INTERNAL USE ONLY. Unauthorised access is prohibited and subject to monitoring.</span>
      </div>

      {/* Header */}
      <header className="w-full border-b border-slate-200 bg-white shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center select-none">
              <img src={logoOmniDoc} alt="OmniDoc Logo" className="h-7 w-auto object-contain" />
            </div>
            <div className="flex items-center">
              <span className="text-lg font-bold tracking-tight text-slate-900">OmniDoc</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3.5">
            <Button
              id="login-btn"
              variant="outline"
              onClick={handleLogin}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <LogIn className="h-3.5 w-3.5 text-slate-500" /> Log In
            </Button>

            <Button
              id="register-btn"
              onClick={handleRegister}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" /> Register Account
            </Button>
          </div>
        </div>
      </header>

      {/* System Introduction */}
      <main className="flex-1 flex items-center justify-center py-6 overflow-hidden">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

            {/* Left Column: System Introduction */}
            <div className="space-y-5 text-left">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-300 tracking-tight leading-tight">
                Secure Smart Document Search for <br className="hidden sm:inline" />
                <span className="text-blue-900">OmniDoc</span>
              </h1>

              <p className="text-base text-slate-600 leading-relaxed max-w-lg">
                OmniDoc is a high-performance application designed to index and search company documents. It allows employees to search for documentation using vector-based semantic analysis.
              </p>

              <div className="pt-1">
                <Button
                  onClick={handleLogin}
                  className="inline-flex items-center gap-2 bg-blue-900 text-white px-4.5 py-2.5 rounded-lg font-semibold hover:bg-blue-800 cursor-pointer text-xs"
                >
                  Enter Portal
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Right Column: Core Capability */}
            <div className="space-y-3.5">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex gap-3.5 items-center hover:border-slate-300 transition-colors">
                <Search className="h-5 w-5 text-blue-900 shrink-0" />
                <div className="text-left">
                  <h3 className="text-xs font-bold text-slate-900">Smart Concept Search</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Finds internal documents by understanding the actual meaning and intent behind your query, instead of just looking for exact, rigid word-for-word matches.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex gap-3.5 items-center hover:border-slate-300 transition-colors">
                <Lock className="h-5 w-5 text-blue-900 shrink-0" />
                <div className="text-left">
                  <h3 className="text-xs font-bold text-slate-900">Company-Wide Protection</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Protects company documents by requiring secure employee logins, ensuring that only verified team members can search and view internal files.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex gap-3.5 items-center hover:border-slate-300 transition-colors">
                <FileText className="h-5 w-5 text-blue-900 shrink-0" />
                <div className="text-left">
                  <h3 className="text-xs font-bold text-slate-900">Automatic Document Reading</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Handles the heavy lifting for you by automatically reading, extracting, and organizing text from uploaded files the moment they are added.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-4 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} OmniDoc. Credit to Lim Jia Shin.</p>
          <div className="flex gap-4">
            <span className="font-semibold text-slate-400">Internal Use Only</span>
          </div>
        </div>
      </footer>

      {/* Sonner Toast Notification Center */}
      <Toaster position="top-right" closeButton richColors />

    </div>
  );
}
