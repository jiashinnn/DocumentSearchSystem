import { useState } from 'react';
import Header from './components/Header';
import LandingView from './components/LandingView';
import SearchView from './components/SearchView';
import HistoryView from './components/HistoryView';
import Footer from './components/Footer';
import { Toaster } from "@/components/ui/sonner";

interface AuditLogItem {
  id: string;
  docName: string;
  action: string;
  user: string;
  date: string;
}

const INITIAL_HISTORY: AuditLogItem[] = [
  { id: 'h1', docName: 'Q4_Financial_Report.pdf', action: 'Uploaded', user: 'admin@company.com', date: '2026-06-15 14:32' },
  { id: 'h2', docName: 'Q4_Financial_Report.pdf', action: 'Downloaded', user: 'finance_manager@company.com', date: '2026-06-16 09:15' },
  { id: 'h3', docName: 'Employee_Handbook.docx', action: 'Uploaded', user: 'hr@company.com', date: '2026-05-20 10:05' },
  { id: 'h4', docName: 'Product_Roadmap_2026.pptx', action: 'Uploaded', user: 'product@company.com', date: '2026-06-01 11:20' },
  { id: 'h5', docName: 'Product_Roadmap_2026.pptx', action: 'Downloaded', user: 'dev_lead@company.com', date: '2026-06-02 16:45' },
  { id: 'h6', docName: 'Quarterly_Goals.xlsx', action: 'Uploaded', user: 'ceo@company.com', date: '2026-06-10 16:00' },
  { id: 'h7', docName: 'Quarterly_Goals.xlsx', action: 'Downloaded', user: 'admin@company.com', date: '2026-06-11 08:30' }
];

export default function App() {
  const [view, setView] = useState<'landing' | 'search'>('landing');
  const [searchTab, setSearchTab] = useState<'home' | 'history' | 'doc-logs'>('home');
  const [historyLogs, setHistoryLogs] = useState<AuditLogItem[]>(INITIAL_HISTORY);
  const [selectedDocNameForLogs, setSelectedDocNameForLogs] = useState<string | null>(null);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      setView('landing');
      setSearchTab('home'); // Reset tab view on logout
      setSelectedDocNameForLogs(null);
    }
  };

  const handleAddHistoryLog = (docName: string, action: string) => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    
    const newLog: AuditLogItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      docName,
      action,
      user: 'current_user@company.com',
      date: dateStr
    };
    setHistoryLogs(prev => [newLog, ...prev]);
  };

  const handleViewDocLogs = (docName: string) => {
    setSelectedDocNameForLogs(docName);
    setSearchTab('doc-logs');
  };

  return (
    <div className="w-full min-h-screen lg:h-screen lg:overflow-hidden bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <Header 
        view={view} 
        currentTab={searchTab} 
        onChangeTab={setSearchTab} 
        onLogout={handleLogout} 
      />

      <main className="flex-1 flex items-center justify-center py-6 overflow-hidden">
        {view === 'landing' ? (
          <LandingView onLoginSuccess={() => setView('search')} />
        ) : searchTab === 'home' ? (
          <SearchView 
            onAddHistoryLog={handleAddHistoryLog} 
            onViewDocLogs={handleViewDocLogs}
          />
        ) : searchTab === 'history' ? (
          <HistoryView logs={historyLogs} />
        ) : (
          <HistoryView 
            logs={historyLogs} 
            selectedDocName={selectedDocNameForLogs}
            onBack={() => {
              setSearchTab('home');
              setSelectedDocNameForLogs(null);
            }}
          />
        )}
      </main>

      <Footer />
      <Toaster position="top-right" closeButton richColors />
    </div>
  );
}
