import { useState, useEffect } from 'react';
import { Search, History, Filter, ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface AuditLogItem {
  id: string;
  docName: string;
  action: string;
  user: string;
  date: string;
}

interface HistoryViewProps {
  logs: AuditLogItem[];
  selectedDocName?: string | null;
  onBack?: () => void;
}

export default function HistoryView({ logs, selectedDocName, onBack }: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('All');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filter logs by specific document if provided
  const targetLogs = selectedDocName
    ? logs.filter(log => log.docName.toLowerCase() === selectedDocName.toLowerCase())
    : logs;

  const filteredLogs = targetLogs.filter(log => {
    // If viewing single doc, search text filters on User or Action instead of docName
    const matchesSearch = selectedDocName
      ? log.user.toLowerCase().includes(searchQuery.toLowerCase()) || log.action.toLowerCase().includes(searchQuery.toLowerCase())
      : log.docName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = selectedAction === 'All' || log.action === selectedAction;
    return matchesSearch && matchesAction;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedAction, pageSize]);
  // 3. Compute Paginated Slices
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

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

      {/* Title & Back Button (shown only when viewing a specific doc's logs) */}
      {selectedDocName && onBack && (
        <div className="flex items-center gap-3 mb-6 shrink-0 text-left">
          <button
            onClick={onBack}
            className="flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 border border-slate-200 bg-white text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
            title="Back to documents"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Document Activity Logs</h1>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xl">
              Showing actions for <span className="font-semibold text-slate-800">{selectedDocName}</span>
            </p>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm mb-6 shrink-0">

        {/* Left Side: Search & Filter options */}
        <div className="flex flex-1 w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={selectedDocName ? "Search by action or user..." : "Search history by document name..."}
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
        {/* Right Side: Sleek Pagination controls */}
        {filteredLogs.length > 0 && (
          <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0 select-none w-full sm:w-auto justify-between sm:justify-end">

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border border-slate-200 rounded-lg py-1 px-1.5 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 cursor-pointer"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            {/* Range Indicator */}
            <div className="hidden lg:inline text-slate-400 font-medium">
              Showing {startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)} of {totalItems}
            </div>
            {/* Navigation Icons (4 Buttons) */}
            <div className="flex items-center gap-1">
              {/* 1. Go to First Page */}
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="h-8 w-8 p-0 inline-flex items-center justify-center border border-slate-200 bg-white rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="First Page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              {/* 2. Go to Previous Page */}
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="h-8 w-8 p-0 inline-flex items-center justify-center border border-slate-200 bg-white rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {/* Page Number Indicator */}
              <span className="px-1.5 text-[11px] font-bold text-slate-700 min-w-[50px] text-center">
                {currentPage} / {totalPages}
              </span>
              {/* 3. Go to Next Page */}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className="h-8 w-8 p-0 inline-flex items-center justify-center border border-slate-200 bg-white rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              {/* 4. Go to Last Page */}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="h-8 w-8 p-0 inline-flex items-center justify-center border border-slate-200 bg-white rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Last Page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
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
              {paginatedLogs.map(log => (
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