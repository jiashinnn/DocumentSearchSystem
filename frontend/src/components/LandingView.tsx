import { Search, Lock, FileText, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

interface LandingViewProps {
  onEnterPortal: () => void;
}

export default function LandingView({ onEnterPortal }: LandingViewProps) {
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
              onClick={onEnterPortal}
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
  );
}
