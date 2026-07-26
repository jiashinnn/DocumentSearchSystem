import { useState, useEffect } from 'react';
import Header from './components/Header';
import LandingView from './components/LandingView';
import SearchView from './components/SearchView';
import HistoryView from './components/HistoryView';
import Footer from './components/Footer';
import { Toaster } from "@/components/ui/sonner";

interface AuditLogItem {
  id: string;
  fileId: string | null;
  docName: string;
  action: string;
  user: string;
  date: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
  const [view, setView] = useState<'landing' | 'search'>('landing');
  const [searchTab, setSearchTab] = useState<'home' | 'history' | 'doc-logs'>('home');
  const [historyLogs, setHistoryLogs] = useState<AuditLogItem[]>([]);
  const [selectedDocIdForLogs, setSelectedDocIdForLogs] = useState<string | null>(null);
  const [selectedDocNameForLogs, setSelectedDocNameForLogs] = useState<string | null>(null);


  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      setView('landing');
      setSearchTab('home');
      setSelectedDocIdForLogs(null); // Reset
      setSelectedDocNameForLogs(null);
      setCurrentUser(null);
    }
  };


  const handleAddHistoryLog = (docName: string, action: string) => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

    const newLog: AuditLogItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      fileId: null,
      docName,
      action,
      user: currentUser?.email || "",
      date: dateStr
    };
    setHistoryLogs(prev => [newLog, ...prev]);
  };

  const handleViewDocLogs = (fileId: string, docName: string) => {
    setSelectedDocIdForLogs(fileId);
    setSelectedDocNameForLogs(docName);
    setSearchTab('doc-logs');
  };


  const fetchHistoryLogs = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents/history`);
      if (response.ok) {
        const data = await response.json();

        // Map backend RecordDto to frontend AuditLogItem structure
        const mappedLogs: AuditLogItem[] = data.map((log: any) => ({
          id: log.id.toString(),
          fileId: log.fileId ? log.fileId.toString() : null, // Mapped here
          docName: log.docName,
          action: log.action,
          user: log.userEmail,
          date: new Date(log.dateAction).toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        }));


        setHistoryLogs(mappedLogs);
      }
    } catch (error) {
      console.error("Error loading audit history logs:", error);
    }
  };

  // Fetch logs on startup and reload whenever view/tab changes
  useEffect(() => {
    if (view === 'search') {
      fetchHistoryLogs();
    }
  }, [view, searchTab]);

  return (
    <div className="w-full min-h-screen lg:h-screen lg:overflow-hidden bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <Header
        view={view}
        currentTab={searchTab}
        onChangeTab={setSearchTab}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      <main className="flex-1 flex items-center justify-center py-6 overflow-hidden">
        {view === 'landing' ? (
          <LandingView onLoginSuccess={(user) => {
            setCurrentUser(user);
            setView('search');
          }} />
        ) : searchTab === 'home' ? (
          <SearchView
            onAddHistoryLog={handleAddHistoryLog}
            onViewDocLogs={handleViewDocLogs}
            currentUser={currentUser}
          />
        ) : searchTab === 'history' ? (
          <HistoryView logs={historyLogs} />
        ) : (
          <HistoryView
            logs={historyLogs}
            selectedDocId={selectedDocIdForLogs} // Passed
            selectedDocName={selectedDocNameForLogs}
            onBack={() => {
              setSearchTab('home');
              setSelectedDocIdForLogs(null);
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
