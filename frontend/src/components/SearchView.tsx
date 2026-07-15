import { useState, useRef, useEffect } from 'react';
import { Search, Trash2, Download, History, Upload, Filter, FileText } from 'lucide-react';
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

interface SearchViewProps {
  onAddHistoryLog: (docName: string, action: string) => void;
  onViewDocLogs: (docName: string) => void;
  currentUser: { email: string; name: string } | null;
}

export default function SearchView({ onAddHistoryLog, onViewDocLogs, currentUser }: SearchViewProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]); // Initialized empty
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch documents from Spring Boot backend on mount
  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents`);
      if (response.ok) {
        const data = await response.json();

        // Map backend file objects to frontend DocumentItem structure
        const mappedDocs: DocumentItem[] = data.map((file: any) => {
          const extension = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
          const displaySize = file.size > 1024 * 1024
            ? (file.size / (1024 * 1024)).toFixed(1) + " MB"
            : (file.size / 1024).toFixed(1) + " KB";

          return {
            id: file.id.toString(),
            name: file.name,
            // Format creation date nicely
            dateModified: new Date(file.createdAt).toLocaleString('en-GB', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }),
            type: extension,
            size: displaySize,
            logs: [] // Document-specific logs are pulled dynamically from global state
          };
        });

        setDocuments(mappedDocs);
      } else {
        toast.error("Failed to load documents from database.");
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Could not connect to document database.");
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

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

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      const deleteToastId = toast.loading(`Deleting ${name}...`);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents/${id}?userEmail=${currentUser?.email || ""}`, {
          method: "DELETE",
        });

        if (response.ok) {
          // Remove from local React state
          setDocuments(prev => prev.filter(doc => doc.id !== id));
          setSelectedIds(prev => prev.filter(item => item !== id));

          setSearchResults(prev => prev.filter(result => result.fileId.toString() !== id));

          toast.dismiss(deleteToastId);
          toast.success(`Deleted ${name} successfully.`);

          // Trigger history log append/fetch
          onAddHistoryLog(name, 'Deleted');
        } else {
          const errorText = await response.text();
          toast.dismiss(deleteToastId);
          toast.error(errorText || "Failed to delete document.");
        }
      } catch (error) {
        console.error("Delete error:", error);
        toast.dismiss(deleteToastId);
        toast.error("Unable to connect to server to delete document.");
      }
    }
  };


  const handleDownload = async (id: string, name: string) => {
    try {
      // 1. Verify file exists on disk first
      const checkResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents/download/${id}/check`);

      if (!checkResponse.ok) {
        const errorMsg = await checkResponse.text();
        toast.error(errorMsg || "File does not exist on the server!");
        return;
      }

      // 2. Trigger native browser download using temporary anchor link
      const downloadUrl = `${import.meta.env.VITE_API_BASE_URL}/api/documents/download/${id}?userEmail=${currentUser?.email || ""}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', name);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`Downloaded ${name} successfully.`);

      // 3. Register history log
      onAddHistoryLog(name, 'Downloaded');
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document.");
    }
  };


  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    if (window.confirm(`Are you sure you want to delete the selected ${selectedIds.length} documents?`)) {
      const deleteToastId = toast.loading(`Deleting ${selectedIds.length} documents...`);
      const docsToDelete = documents.filter(doc => selectedIds.includes(doc.id));

      try {
        // Trigger all delete requests concurrently to update status to INACTIVE in the database
        await Promise.all(
          docsToDelete.map(doc =>
            fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents/${doc.id}?userEmail=${currentUser?.email || ""}`, {
              method: "DELETE",
            })
          )
        );

        // Update local React state to hide the deleted files
        setDocuments(prev => prev.filter(doc => !selectedIds.includes(doc.id)));

        toast.dismiss(deleteToastId);
        toast.success(`Deleted ${selectedIds.length} documents successfully.`);

        // Register history audit logs
        docsToDelete.forEach(doc => {
          onAddHistoryLog(doc.name, 'Deleted');
        });

        setSelectedIds([]);
      } catch (error) {
        console.error("Bulk delete error:", error);
        toast.dismiss(deleteToastId);
        toast.error("Failed to delete some documents from the server.");
      }
    }
  };


  const handleBulkDownload = () => {
    if (selectedIds.length === 0) return;
    const selectedDocs = documents.filter(doc => selectedIds.includes(doc.id));
    selectedDocs.forEach(doc => {
      handleDownload(doc.id, doc.name);
    });
    setSelectedIds([]);
  };


  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    // 1. Frontend Check: Reject non-text files like .exe
    const allowedExtensions = ['txt', 'pdf', 'docx', 'xlsx', 'pptx'];
    if (!allowedExtensions.includes(extension)) {
      toast.error("Only text-based files (.txt, .pdf, .docx, .xlsx, .pptx) are allowed!");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userEmail", currentUser?.email || ""); // Dynamic email from active user context
    const uploadToastId = toast.loading(`Uploading and processing ${file.name}...`);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents/upload`, {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const uploadedFile = await response.json();

        // Format size from bytes to KB/MB
        const displaySize = uploadedFile.size > 1024 * 1024
          ? (uploadedFile.size / (1024 * 1024)).toFixed(1) + " MB"
          : (uploadedFile.size / 1024).toFixed(1) + " KB";
        const newDoc: DocumentItem = {
          id: uploadedFile.id.toString(),
          name: uploadedFile.name,
          dateModified: new Date(uploadedFile.createdAt).toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          type: extension.toUpperCase(),
          size: displaySize,
          logs: []
        };
        setDocuments(prev => [newDoc, ...prev]);
        onAddHistoryLog(file.name, 'Uploaded');

        toast.dismiss(uploadToastId);
        toast.success("File uploaded and vectorized successfully.");
      } else {
        const errorText = await response.text();
        toast.dismiss(uploadToastId);
        toast.error(errorText || "Upload failed.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.dismiss(uploadToastId);
      toast.error("Unable to connect to upload server.");
    } finally {
      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const uniqueTypes = ['All', ...Array.from(new Set(documents.map(doc => doc.type)))];

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const executeSearch = async () => {
    if (!searchQuery.trim()) return;

    const searchToastId = toast.loading(`Performing hybrid search for "${searchQuery}"...`);
    try {
      // Query our new backend search endpoint (70% Semantic, 30% Fuzzy/Filename weight, limit 5)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents/search?query=${encodeURIComponent(searchQuery)}&alpha=0.7&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setIsSearchActive(true);
        toast.dismiss(searchToastId);
        toast.success(`Found ${data.length} matching document${data.length !== 1 ? 's' : ''}.`);
      } else {
        toast.dismiss(searchToastId);
        toast.error("Failed to execute search.");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.dismiss(searchToastId);
      toast.error("Unable to connect to search server.");
    }
  };
  // Revert back to standard document list when user clears the search bar input
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setIsSearchActive(false);
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Highlight matching words in yellow
  const highlightText = (text: string, search: string) => {
    if (!search || !search.trim()) return text;

    // Split search query by spaces to highlight individual keywords
    const keywords = search.trim().split(/\s+/).filter(Boolean);
    if (keywords.length === 0) return text;

    // Escape regex characters and join keywords into a single pattern (OR logic)
    const escapedKeywords = keywords.map(kw => kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const pattern = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');

    // Split text by the matched keywords
    const parts = text.split(pattern);

    return (
      <>
        {parts.map((part, index) =>
          pattern.test(part) ? (
            <mark key={index} className="bg-yellow-200 text-slate-900 px-0.5 rounded font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };


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
              placeholder="Search documents semantically or by keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  executeSearch();
                }
              }}
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
        {isSearchActive ? (
          // RENDER SEARCH RESULTS TABLE 
          searchResults.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6">
              <FileText className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-800">No matching documents found</p>
              <p className="text-xs text-slate-500 mt-1">Try another concept, file name, or keyword</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center"></th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Date Modified</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {searchResults.map(result => {
                  // Find file metadata dynamically from local documents list
                  const matchedDoc = documents.find(doc => String(doc.id) === String(result.fileId));
                  return (
                    <tr
                      key={result.id}
                      className="hover:bg-slate-50/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-center align-top"></td>

                      {/* Layer 2 */}
                      <td className="py-3 px-4 font-semibold text-slate-800 max-w-[400px] align-top">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-900 shrink-0" />
                          <span className="truncate">
                            {highlightText(result.docName, searchQuery)}
                          </span>
                        </div>
                        {result.semanticScore !== 0 && (
                          <div className="text-[11px] font-normal text-slate-500 mt-1.5 leading-normal bg-slate-50/50 border border-slate-100 p-2.5 rounded-lg whitespace-pre-wrap font-sans">
                            {highlightText(result.chunkText, searchQuery)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 align-top">
                        {matchedDoc ? matchedDoc.dateModified : '-'}
                      </td>
                      <td className="py-3 px-4 align-top">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {matchedDoc ? matchedDoc.type : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 align-top">
                        {matchedDoc ? matchedDoc.size : '-'}
                      </td>
                      <td className="py-3 px-4 text-right align-top">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            title="View logs"
                            onClick={() => onViewDocLogs(result.docName)}
                            className="h-8 w-8 p-0 inline-flex items-center justify-center hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer rounded-lg"
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            title="Download document"
                            onClick={() => handleDownload(result.fileId.toString(), result.docName)}
                            className="h-8 w-8 p-0 inline-flex items-center justify-center hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer rounded-lg"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            title="Delete document"
                            onClick={() => handleDelete(result.fileId.toString(), result.docName)}
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
          )
        ) : (
          // RENDER STANDARD FILE LIST TABLE (WHEN NOT SEARCHING)
          filteredDocuments.length === 0 ? (
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
                            onClick={() => onViewDocLogs(doc.name)}
                            className="h-8 w-8 p-0 inline-flex items-center justify-center hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer rounded-lg"
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            title="Download document"
                            onClick={() => handleDownload(doc.id, doc.name)}
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
          )
        )}
      </div>
    </div>
  );
}
