import React, { useState, useEffect, useRef } from 'react';
import { documentService } from '../services/mockService';
import { Card, Button, Badge, Pagination, Modal, Input, Select, Toast } from '../components/ui';
import { DocumentFile, Grade, DocumentCategory } from '../types';

// Define categories for UI mapping
const CATEGORIES = [
    { label: 'Tài liệu học tập', value: DocumentCategory.LEARNING_MATERIAL, icon: '📖' },
    { label: 'Đề cương', value: DocumentCategory.SYLLABUS, icon: '📋' },
    { label: 'Đề thi', value: DocumentCategory.EXAM, icon: '📝' },
    { label: 'Đề thi HSG', value: DocumentCategory.GIFTED_EXAM, icon: '🏆' },
    { label: 'Khác', value: DocumentCategory.OTHER, icon: '📂' },
];

export const DocumentsPage = () => {
  const [docs, setDocs] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  const [toast, setToast] = useState<any>(null);

  // View States for File Manager Layout
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  
  // Navigation State
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL'); // 'ALL', 'COMMON', '6', '7'...
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL'); // 'ALL' or specific category value
  const [expandedGrades, setExpandedGrades] = useState<string[]>([]); // Track expanded sidebar items

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'NAME' | 'DATE'>('DATE');

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentFile | null>(null);
  
  // Form Data
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({ 
      title: '', 
      grade: 'All',
      category: DocumentCategory.LEARNING_MATERIAL as string
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocs();
  }, []);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFolder, selectedCategory, searchTerm]);

  const loadDocs = async () => {
      setLoading(true);
      const data = await documentService.getAll();
      setDocs(data);
      setLoading(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });
  };

  // --- Filtering Logic ---
  const filteredDocs = docs.filter(doc => {
      // 1. Folder Filter (Grade)
      let matchFolder = true;
      if (selectedFolder === 'ALL') matchFolder = true;
      else if (selectedFolder === 'COMMON') matchFolder = doc.grade === 'All';
      else matchFolder = doc.grade === selectedFolder;

      // 2. Category Filter
      let matchCategory = true;
      if (selectedCategory !== 'ALL') {
          matchCategory = doc.category === selectedCategory;
      }

      // 3. Search Filter
      const matchSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());

      return matchFolder && matchCategory && matchSearch;
  });
  
  const sortedDocs = [...filteredDocs].sort((a, b) => {
      if (sortBy === 'NAME') {
          return a.title.localeCompare(b.title);
      } else {
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      }
  });

  const totalPages = Math.ceil(sortedDocs.length / ITEMS_PER_PAGE);
  const currentDocs = sortedDocs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Helper to get counts for sidebar
  const getCount = (folderKey: string, categoryKey: string = 'ALL') => {
      return docs.filter(d => {
          const matchGrade = folderKey === 'ALL' ? true : (folderKey === 'COMMON' ? d.grade === 'All' : d.grade === folderKey);
          const matchCategory = categoryKey === 'ALL' ? true : d.category === categoryKey;
          return matchGrade && matchCategory;
      }).length;
  };

  // --- Actions ---

  const toggleGradeExpand = (grade: string) => {
      setExpandedGrades(prev => 
          prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
      );
  };

  // Handle File Selection with Auto-fill Title Logic
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setUploadFile(file);

          const lastDotIndex = file.name.lastIndexOf('.');
          const nameWithoutExt = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
          
          setFormData(prev => ({ 
              ...prev, 
              title: nameWithoutExt,
              grade: (selectedFolder !== 'ALL' && selectedFolder !== 'COMMON') ? selectedFolder : prev.grade,
              category: (selectedCategory !== 'ALL') ? selectedCategory : prev.category
          }));
      }
  };

  const handleUploadSubmit = async () => {
      if (!uploadFile || !formData.title) {
          setToast({ msg: "Vui lòng chọn file và nhập tên", type: 'error' });
          return;
      }
      setLoading(true);
      try {
          const base64Content = await fileToBase64(uploadFile);
          const fileSize = (uploadFile.size / 1024 / 1024).toFixed(2) + ' MB';
          const fileExt = uploadFile.name.split('.').pop()?.toUpperCase() || 'FILE';
          
          const newDoc: DocumentFile = {
              id: `doc_${Date.now()}`,
              title: formData.title,
              type: (['PDF', 'DOCX', 'XLSX', 'IMG'].includes(fileExt) ? fileExt : 'PDF') as any,
              category: formData.category,
              uploadDate: new Date().toISOString().split('T')[0],
              url: '#',
              size: fileSize,
              grade: formData.grade,
              content: base64Content
          };

          await documentService.add(newDoc);
          setToast({ msg: "Tải lên tài liệu thành công!", type: 'success' });
          resetModals();
          loadDocs();
      } catch (e) {
          setToast({ msg: "Lỗi khi xử lý file.", type: 'error' });
      } finally {
          setLoading(false);
      }
  };

  const handleUpdateSubmit = async () => {
      if (!selectedDoc || !formData.title) return;
      const updatedDoc = { 
          ...selectedDoc, 
          title: formData.title, 
          grade: formData.grade,
          category: formData.category 
      };
      await documentService.update(updatedDoc);
      setToast({ msg: "Cập nhật thành công!", type: 'success' });
      resetModals();
      loadDocs();
  }

  const handleDelete = async (id: string) => {
      if(window.confirm('Bạn có chắc muốn xóa tài liệu này?')) {
          await documentService.delete(id);
          setDocs(prev => prev.filter(d => d.id !== id));
          setToast({msg: 'Đã xóa tài liệu', type: 'success'});
          setIsViewModalOpen(false);
      }
  };

  const handleDownload = (doc: DocumentFile) => {
      if (doc.content) {
          const link = document.createElement('a');
          link.href = doc.content;
          link.download = doc.title;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setToast({ msg: `Đang tải xuống: ${doc.title}`, type: 'success' });
      } else {
          setToast({ msg: "File mẫu không có nội dung thực", type: 'error' });
      }
  };

  const resetModals = () => {
      setIsUploadModalOpen(false);
      setIsEditModalOpen(false);
      setIsViewModalOpen(false);
      setUploadFile(null);
      setSelectedDoc(null);
      setFormData({ title: '', grade: 'All', category: DocumentCategory.LEARNING_MATERIAL });
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const prepareEdit = (doc: DocumentFile) => {
      setSelectedDoc(doc);
      setFormData({ 
          title: doc.title, 
          grade: doc.grade || 'All',
          category: (doc.category as string) || DocumentCategory.LEARNING_MATERIAL
      });
      setIsEditModalOpen(true);
  }

  // --- Render Helpers ---

  const renderFileIcon = (type: string) => {
      const colors: any = {
          'PDF': 'bg-red-100 text-red-600',
          'DOCX': 'bg-blue-100 text-blue-600',
          'XLSX': 'bg-green-100 text-green-600',
          'IMG': 'bg-purple-100 text-purple-600'
      };
      return (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${colors[type] || 'bg-gray-100 text-gray-600'}`}>
              {type}
          </div>
      );
  };

  const renderFilePreview = (doc: DocumentFile) => {
    if (doc.content) {
        if (doc.type === 'PDF') {
            return (
                <div className="w-full h-[600px] bg-slate-800 rounded-lg overflow-hidden border border-slate-200">
                    <iframe src={doc.content} className="w-full h-full" title={doc.title} />
                </div>
            );
        }
        if (doc.type === 'IMG') {
            return (
                <div className="w-full h-[500px] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                    <img src={doc.content} alt={doc.title} className="max-w-full max-h-full object-contain" />
                </div>
            );
        }
    }
    return (
        <div className="w-full h-[300px] bg-slate-50 flex flex-col items-center justify-center text-slate-500 gap-2 border-2 border-dashed border-slate-200 rounded-lg">
             <p>Không hỗ trợ xem trước định dạng này.</p>
             <Button onClick={() => handleDownload(doc)}>Tải xuống để xem</Button>
        </div>
    );
  }

  // Helper to get Category Badge Color
  const getCategoryColor = (cat?: string) => {
      switch(cat) {
          case DocumentCategory.EXAM: return 'red';
          case DocumentCategory.GIFTED_EXAM: return 'yellow';
          case DocumentCategory.SYLLABUS: return 'blue';
          case DocumentCategory.LEARNING_MATERIAL: return 'green';
          default: return 'gray';
      }
  }

  // Sidebar Folder Item Component
  const FolderItem = ({ id, label, icon, count, hasSubmenu = false }: any) => {
      const isExpanded = expandedGrades.includes(id);
      const isSelected = selectedFolder === id;
      
      return (
          <div className="mb-1">
            <button 
                onClick={() => {
                    setSelectedFolder(id);
                    setSelectedCategory('ALL');
                    if(hasSubmenu) toggleGradeExpand(id);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isSelected 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
                <div className="flex items-center gap-3">
                    <span className="text-lg">{icon}</span>
                    <span>{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    {count > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                            {count}
                        </span>
                    )}
                    {hasSubmenu && (
                        <span className={`text-xs transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                    )}
                </div>
            </button>

            {/* Submenu for Categories */}
            {hasSubmenu && isExpanded && (
                <div className="ml-9 mt-1 space-y-0.5 border-l-2 border-slate-100 pl-2">
                    {CATEGORIES.map(cat => {
                        const catCount = getCount(id, cat.value);
                        const isCatSelected = isSelected && selectedCategory === cat.value;
                        return (
                            <button
                                key={cat.value}
                                onClick={() => {
                                    setSelectedFolder(id);
                                    setSelectedCategory(cat.value);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                    isCatSelected
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span>{cat.icon}</span>
                                    <span>{cat.label}</span>
                                </div>
                                {catCount > 0 && <span>{catCount}</span>}
                            </button>
                        )
                    })}
                </div>
            )}
          </div>
      );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Header Mobile */}
      <div className="md:hidden mb-4 space-y-2">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Kho Tài liệu</h2>
        <select 
            className="w-full p-2 border rounded-lg"
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
        >
            <option value="ALL">📂 Tất cả tài liệu</option>
            <option value="COMMON">🌐 Tài liệu chung</option>
            {Object.values(Grade).map(g => <option key={g} value={g}>📚 Lớp {g}</option>)}
        </select>
        <select 
            className="w-full p-2 border rounded-lg"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
        >
             <option value="ALL">Tất cả danh mục</option>
             {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
          {/* Sidebar - Desktop (File Manager Style) */}
          <Card className="hidden lg:flex w-64 flex-col flex-shrink-0 h-full p-4 overflow-y-auto">
              <Button className="w-full mb-6 justify-center shadow-indigo-200" onClick={() => setIsUploadModalOpen(true)}>
                  ☁️ Tải lên
              </Button>
              
              <div className="space-y-6">
                  <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">Thư mục chính</h3>
                      <FolderItem id="ALL" label="Tất cả tài liệu" icon="📂" count={getCount('ALL')} />
                      <FolderItem id="COMMON" label="Tài liệu chung" icon="🌐" count={getCount('COMMON')} />
                  </div>

                  <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">Theo lớp học</h3>
                      <div className="space-y-0.5">
                          {Object.values(Grade).map(g => (
                              <FolderItem 
                                key={g} 
                                id={g} 
                                label={`Lớp ${g}`} 
                                icon="📚" 
                                count={getCount(g)}
                                hasSubmenu={true} 
                              />
                          ))}
                      </div>
                  </div>
              </div>
          </Card>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full min-h-0 bg-white lg:bg-transparent lg:rounded-none rounded-xl shadow-sm lg:shadow-none border lg:border-0 border-slate-200 overflow-hidden">
              
              {/* Toolbar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0">
                  <div className="relative w-full sm:max-w-md">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </span>
                      <input 
                          type="text" 
                          placeholder="Tìm kiếm tài liệu..." 
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                          <button 
                              onClick={() => setViewMode('GRID')}
                              className={`p-1.5 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                              title="Lưới"
                          >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                          </button>
                          <button 
                              onClick={() => setViewMode('LIST')}
                              className={`p-1.5 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                              title="Danh sách"
                          >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                          </button>
                      </div>
                      
                      <div className="lg:hidden">
                         <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>+ Tải lên</Button>
                      </div>
                  </div>
              </div>

              {/* Content List */}
              <div className="flex-1 overflow-y-auto min-h-0 pr-1 pb-4">
                  {currentDocs.length === 0 ? (
                      <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                          <span className="text-4xl mb-2">📭</span>
                          <p>Không tìm thấy tài liệu nào.</p>
                          <p className="text-sm mt-1">{selectedFolder !== 'ALL' ? 'Thư mục trống' : 'Hãy tải lên tài liệu đầu tiên'}</p>
                      </div>
                  ) : viewMode === 'GRID' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {currentDocs.map(doc => (
                              <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col">
                                  <div className="flex items-start justify-between mb-3">
                                      {renderFileIcon(doc.type)}
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => prepareEdit(doc)} className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-amber-600">
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                          </button>
                                          <button onClick={() => handleDelete(doc.id)} className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-red-600">
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                          </button>
                                      </div>
                                  </div>
                                  <h4 className="font-semibold text-slate-800 mb-1 line-clamp-2 cursor-pointer hover:text-indigo-600" onClick={() => {setSelectedDoc(doc); setIsViewModalOpen(true);}}>
                                      {doc.title}
                                  </h4>
                                  <div className="mt-auto pt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-y-1">
                                      <span>{doc.size} • {doc.uploadDate}</span>
                                      <div className="flex gap-1">
                                         {doc.category && (
                                            <Badge color={getCategoryColor(doc.category as string)}>
                                                {CATEGORIES.find(c => c.value === doc.category)?.label || 'Khác'}
                                            </Badge>
                                         )}
                                         <Badge color="indigo">{doc.grade === 'All' ? 'Chung' : `Lớp ${doc.grade}`}</Badge>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                          <table className="min-w-full text-left border-collapse">
                              <thead className="bg-slate-50 border-b border-slate-200">
                                  <tr>
                                      <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Tên tài liệu</th>
                                      <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase w-32">Phân loại</th>
                                      <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase w-24">Lớp</th>
                                      <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase w-32">Ngày đăng</th>
                                      <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase w-24 text-right">Hành động</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {currentDocs.map(doc => (
                                      <tr key={doc.id} className="hover:bg-slate-50 group">
                                          <td className="py-3 px-4">
                                              <div className="flex items-center gap-3">
                                                  {renderFileIcon(doc.type)}
                                                  <div className="flex flex-col">
                                                      <span 
                                                          className="font-medium text-slate-700 cursor-pointer hover:text-indigo-600 truncate max-w-[200px] md:max-w-xs"
                                                          onClick={() => {setSelectedDoc(doc); setIsViewModalOpen(true);}}
                                                      >
                                                          {doc.title}
                                                      </span>
                                                      <span className="text-xs text-slate-400">{doc.size}</span>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="py-3 px-4">
                                              {doc.category && (
                                                <Badge color={getCategoryColor(doc.category as string)}>
                                                    {CATEGORIES.find(c => c.value === doc.category)?.label || 'Khác'}
                                                </Badge>
                                              )}
                                          </td>
                                          <td className="py-3 px-4"><Badge color="indigo">{doc.grade === 'All' ? 'Chung' : `Lớp ${doc.grade}`}</Badge></td>
                                          <td className="py-3 px-4 text-sm text-slate-500">{doc.uploadDate}</td>
                                          <td className="py-3 px-4 text-right">
                                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <button onClick={() => handleDownload(doc)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded" title="Tải xuống">
                                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                  </button>
                                                  <button onClick={() => prepareEdit(doc)} className="text-amber-600 hover:bg-amber-50 p-1.5 rounded" title="Sửa">
                                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                  </button>
                                                  <button onClick={() => handleDelete(doc.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded" title="Xóa">
                                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                  </button>
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  )}
                  
                  <div className="mt-4">
                      <Pagination 
                        currentPage={currentPage} 
                        totalPages={totalPages} 
                        onPageChange={setCurrentPage} 
                        totalItems={filteredDocs.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                      />
                  </div>
              </div>
          </div>
      </div>

      {/* Upload Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={resetModals} title="Tải lên tài liệu mới">
          <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative cursor-pointer">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                  />
                  {uploadFile ? (
                      <div>
                          <p className="text-indigo-600 font-bold mb-1">📄 {uploadFile.name}</p>
                          <p className="text-xs text-slate-500">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                  ) : (
                      <>
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        </div>
                        <p className="text-slate-600 font-medium">Chọn file từ máy tính</p>
                        <p className="text-xs text-slate-400 mt-1">Hỗ trợ PDF, Word, Excel, Ảnh</p>
                      </>
                  )}
              </div>

              <Input 
                label="Tên hiển thị" 
                value={formData.title} 
                onChange={(e: any) => setFormData({...formData, title: e.target.value})}
                placeholder="Nhập tên tài liệu..."
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                    label="Dành cho lớp"
                    value={formData.grade}
                    onChange={(e: any) => setFormData({...formData, grade: e.target.value})}
                    options={[
                        { label: 'Tất cả các lớp', value: 'All' },
                        ...Object.values(Grade).map(g => ({ label: `Lớp ${g}`, value: g }))
                    ]}
                />

                <Select
                    label="Loại tài liệu"
                    value={formData.category}
                    onChange={(e: any) => setFormData({...formData, category: e.target.value})}
                    options={CATEGORIES.map(c => ({ label: c.label, value: c.value }))}
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                  <Button variant="ghost" onClick={resetModals}>Hủy</Button>
                  <Button onClick={handleUploadSubmit} disabled={loading}>{loading ? 'Đang xử lý...' : 'Tải lên'}</Button>
              </div>
          </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={resetModals} title="Chỉnh sửa tài liệu">
          <div className="space-y-4">
              <Input 
                label="Tên tài liệu" 
                value={formData.title} 
                onChange={(e: any) => setFormData({...formData, title: e.target.value})}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                    label="Dành cho lớp"
                    value={formData.grade}
                    onChange={(e: any) => setFormData({...formData, grade: e.target.value})}
                    options={[
                        { label: 'Tất cả các lớp', value: 'All' },
                        ...Object.values(Grade).map(g => ({ label: `Lớp ${g}`, value: g }))
                    ]}
                />

                <Select
                    label="Loại tài liệu"
                    value={formData.category}
                    onChange={(e: any) => setFormData({...formData, category: e.target.value})}
                    options={CATEGORIES.map(c => ({ label: c.label, value: c.value }))}
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                  <Button variant="ghost" onClick={resetModals}>Hủy</Button>
                  <Button onClick={handleUpdateSubmit}>Lưu thay đổi</Button>
              </div>
          </div>
      </Modal>

       {/* View Details Modal with Content Preview */}
      <Modal isOpen={isViewModalOpen} onClose={resetModals} title="Chi tiết tài liệu" maxWidth="sm:max-w-5xl">
          {selectedDoc && (
              <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {renderFileIcon(selectedDoc.type)}
                      <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-slate-800 break-words">{selectedDoc.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                               {selectedDoc.category && (
                                    <Badge color={getCategoryColor(selectedDoc.category as string)}>
                                        {CATEGORIES.find(c => c.value === selectedDoc.category)?.label || 'Khác'}
                                    </Badge>
                               )}
                               <Badge color="indigo">{selectedDoc.grade === 'All' ? 'Tất cả lớp' : `Lớp ${selectedDoc.grade}`}</Badge>
                               <span className="text-sm text-slate-500">• {selectedDoc.size} • {selectedDoc.uploadDate}</span>
                          </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                          <Button onClick={() => handleDownload(selectedDoc)} className="flex-1 sm:flex-none justify-center">Tải xuống</Button>
                      </div>
                  </div>
                  <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Xem trước nội dung</h4>
                      {renderFilePreview(selectedDoc)}
                  </div>
              </div>
          )}
      </Modal>
    </div>
  );
};