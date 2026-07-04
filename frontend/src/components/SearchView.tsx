import { useState, useRef } from 'react';
import { Search, Trash2, Download, History, Upload, X, Filter, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface DocLog {
  action: string;
  user: string;
  date: string;
}

interface DocumentItem {
  id: string;
  name: string;
  dateModified: string;
  type: string;
  size: string;
  logs: DocLog[];
}

const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: '1',
    name: 'Q4_Financial_Report.pdf',
    dateModified: '2026-06-15 14:32',
    type: 'PDF',
    size: '2.4 MB',
    logs: [
      { action: 'Uploaded', user: 'admin@company.com', date: '2026-06-15 14:32' },
      { action: 'Downloaded', user: 'finance_manager@company.com', date: '2026-06-16 09:15' }
    ]
  },
  {
    id: '2',
    name: 'Employee_Handbook.docx',
    dateModified: '2026-05-20 10:05',
    type: 'DOCX',
    size: '1.1 MB',
    logs: [
      { action: 'Uploaded', user: 'hr@company.com', date: '2026-05-20 10:05' }
    ]
  },
  {
    id: '3',
    name: 'Product_Roadmap_2026.pptx',
    dateModified: '2026-06-01 11:20',
    type: 'PPTX',
    size: '4.8 MB',
    logs: [
      { action: 'Uploaded', user: 'product@company.com', date: '2026-06-01 11:20' },
      { action: 'Downloaded', user: 'dev_lead@company.com', date: '2026-06-02 16:45' }
    ]
  },
  {
    id: '4',
    name: 'Quarterly_Goals.xlsx',
    dateModified: '2026-06-10 16:00',
    type: 'XLSX',
    size: '850 KB',
    logs: [
      { action: 'Uploaded', user: 'ceo@company.com', date: '2026-06-10 16:00' },
      { action: 'Downloaded', user: 'admin@company.com', date: '2026-06-11 08:30' }
    ]
  }
];

interface SearchViewProps {
  onAddHistoryLog: (docName: string, action: string) => void;
}

export default function SearchView({ onAddHistoryLog }: SearchViewProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [logDoc, setLogDoc] = useState<DocumentItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter and search computation
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || doc.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredDocuments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDocuments.map(doc => doc.id));
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      setSelectedIds(prev => prev.filter(item => item !== id));
      toast.success(`Deleted ${name} successfully.`);
      onAddHistoryLog(name, 'Deleted');
    }
  };

  const handleDownload = (name: string) => {
    toast.success(`Downloading ${name}...`);
    onAddHistoryLog(name, 'Downloaded');
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete the selected ${selectedIds.length} documents?`)) {
      const deletedDocs = documents.filter(doc => selectedIds.includes(doc.id));
      setDocuments(prev => prev.filter(doc => !selectedIds.includes(doc.id)));
      toast.success(`Deleted ${selectedIds.length} documents successfully.`);
      deletedDocs.forEach(doc => {
        onAddHistoryLog(doc.name, 'Deleted');
      });
      setSelectedIds([]);
    }
  };

  const handleBulkDownload = () => {
    if (selectedIds.length === 0) return;
    const selectedDocs = documents.filter(doc => selectedIds.includes(doc.id));
    toast.success(`Downloading ${selectedIds.length} selected documents in bulk...`);
    selectedDocs.forEach(doc => {
      onAddHistoryLog(doc.name, 'Downloaded');
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const extension = file.name.split('.').pop()?.toUpperCase() || 'FILE';

    const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (date: Date) => {
      const pad = (num: number) => num.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const newDoc: DocumentItem = {
      id: Date.now().toString(),
      name: file.name,
      dateModified: formatDate(new Date()),
      type: extension,
      size: formatSize(file.size),
      logs: [
        { action: 'Uploaded', user: 'current_user@company.com', date: formatDate(new Date()) }
      ]
    };

    setDocuments(prev => [newDoc, ...prev]);
    toast.success(`Uploaded ${file.name} successfully.`);
    onAddHistoryLog(file.name, 'Uploaded');

    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uniqueTypes = ['All', ...Array.from(new Set(documents.map(doc => doc.type)))];

  return (
    <div className="w-full px-6 sm:px-10 py-6 h-full flex flex-col overflow-hidden">

      {/* Control Actions Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm mb-6 shrink-0">

        {/* Search & Filter */}
        <div className="flex flex-1 w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900"
            >
              {uniqueTypes.map(t => (
                <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Upload Action */}
        <div className="shrink-0 w-full sm:w-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            onClick={handleUploadClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-900 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-800 cursor-pointer text-xs"
          >
            <Upload className="h-4 w-4" /> Upload Document
          </Button>
        </div>

      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50/80 border border-blue-100 px-4 py-3 rounded-xl mb-4 text-xs font-medium text-blue-900 animate-in fade-in slide-in-from-top-2 duration-200 shrink-0">
          <div className="flex items-center gap-2">
            <span>{selectedIds.length} document{selectedIds.length > 1 ? 's' : ''} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleBulkDownload}
              className="inline-flex items-center gap-1 bg-white border-slate-200 text-slate-700 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Bulk Download
            </Button>
            <Button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-red-700 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Bulk Delete
            </Button>
          </div>
        </div>
      )}

      {/* Documents Table Container */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-auto">
        {filteredDocuments.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6">
            <FileText className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-800">No documents found</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing search queries or filters</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredDocuments.length && filteredDocuments.length > 0}
                    onChange={handleSelectAll}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-900 focus:ring-blue-900 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Date Modified</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Size</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredDocuments.map(doc => {
                const isSelected = selectedIds.includes(doc.id);
                return (
                  <tr
                    key={doc.id}
                    className={`hover:bg-slate-50/30 transition-colors ${isSelected ? 'bg-blue-50/10' : ''}`}
                  >
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(doc.id)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-900 focus:ring-blue-900 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 truncate max-w-[200px]">
                      {doc.name}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {doc.dateModified}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {doc.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {doc.size}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          title="View logs"
                          onClick={() => setLogDoc(doc)}
                          className="h-8 w-8 p-0 inline-flex items-center justify-center hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer rounded-lg"
                        >
                          <History className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          title="Download document"
                          onClick={() => handleDownload(doc.name)}
                          className="h-8 w-8 p-0 inline-flex items-center justify-center hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer rounded-lg"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          title="Delete document"
                          onClick={() => handleDelete(doc.id, doc.name)}
                          className="h-8 w-8 p-0 inline-flex items-center justify-center hover:bg-red-50 text-slate-500 hover:text-red-600 cursor-pointer rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Document Log */}
      {logDoc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="text-left">
                <h3 className="text-sm font-bold text-slate-900">Document Activity Log</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[280px]" title={logDoc.name}>
                  {logDoc.name}
                </p>
              </div>
              <button
                onClick={() => setLogDoc(null)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[300px] overflow-y-auto">
              <div className="relative border-l border-slate-200 pl-4 space-y-4">
                {logDoc.logs.map((log, index) => (
                  <div key={index} className="relative text-left">
                    {/* Log bullet indicator */}
                    <span className="absolute -left-[21px] top-1 bg-white border border-blue-900 rounded-full h-2.5 w-2.5 flex items-center justify-center" />

                    <p className="text-xs font-semibold text-slate-800">
                      {log.action}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      By: <span className="font-medium text-slate-700">{log.user}</span>
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      {log.date}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 px-6 py-4 flex justify-end bg-slate-50/50">
              <Button
                onClick={() => setLogDoc(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold cursor-pointer text-xs border border-slate-200"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
