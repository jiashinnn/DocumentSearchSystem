import { useState } from 'react';
import { Search, History, Filter } from 'lucide-react';

interface AuditLogItem {
  id: string;
  docName: string;
  action: string;
  user: string;
  date: string;
}

interface HistoryViewProps {
  logs: AuditLogItem[];
}

export default function HistoryView({ logs }: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('All');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.docName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = selectedAction === 'All' || log.action === selectedAction;
    return matchesSearch && matchesAction;
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'Uploaded':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
      case 'Downloaded':
        return 'bg-blue-50 text-blue-700 border-blue-200/50';
      case 'Deleted':
        return 'bg-rose-50 text-rose-700 border-rose-200/50';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200/50';
    }
  };

  const actionTypes = ['All', 'Uploaded', 'Downloaded', 'Deleted'];

  return (
    <div className="w-full px-6 sm:px-10 py-6 h-full flex flex-col overflow-hidden">
      
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm mb-6 shrink-0">
        <div className="flex flex-1 w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search history by document name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900"
            />
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900"
            >
              {actionTypes.map(action => (
                <option key={action} value={action}>
                  {action === 'All' ? 'All Actions' : action}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* History Logs List Container */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-auto">
        {filteredLogs.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6">
            <History className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-800">No history records found</p>
            <p className="text-xs text-slate-500 mt-1">Activities will appear here once actions are performed</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 tracking-wider">
                <th className="py-3.5 px-6">Document Name</th>
                <th className="py-3.5 px-6">Action</th>
                <th className="py-3.5 px-6">Performed By</th>
                <th className="py-3.5 px-6 text-right">Date / Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-800 truncate max-w-[250px]">
                    {log.docName}
                  </td>
                  <td className="py-3.5 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-semibold border ${getActionBadgeColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-slate-600">
                    {log.user}
                  </td>
                  <td className="py-3.5 px-6 text-slate-400 text-right">
                    {log.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
