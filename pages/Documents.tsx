import React, { useState, useEffect, useRef } from 'react';
import { documentService } from '../services/mockService';
import { Card, Button, Badge, Pagination, Modal, Input, Select, Toast } from '../components/ui';
import { DocumentFile, Grade } from '../types';

export const DocumentsPage = () => {
  const [docs, setDocs] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  const [toast, setToast] = useState<any>(null);

  // Filters & Sort
  const [filterGrade, setFilterGrade] = useState('All');
  const [sortBy, setSortBy] = useState<'GRADE' | 'DATE'>('GRADE');

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Data selection
  const [selectedDoc, setSelectedDoc] = useState<DocumentFile | null>(null);
  
  // Upload/Edit Form Data
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
      title: '',
      grade: 'All'
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
      setLoading(true);
      const data = await documentService.getAll();
      setDocs(data);
      setLoading(false);
  };

  // Helper to convert file to Base64
  const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });
  };

  // Filter & Sort Logic
  const filteredDocs = docs.filter(doc => filterGrade === 'All' || doc.grade === filterGrade || doc.grade === 'All');
  
  const sortedDocs = [...filteredDocs].sort((a, b) => {
      if (sortBy === 'GRADE') {
          const gradeA = a.grade === 'All' ? 0 : parseInt(a.grade || '0');
          const gradeB = b.grade === 'All' ? 0 : parseInt(b.grade || '0');
          return gradeA - gradeB;
      } else {
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      }
  });

  const totalPages = Math.ceil(sortedDocs.length / ITEMS_PER_PAGE);
  const currentDocs = sortedDocs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // --- Actions ---

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
          prepareUpload(files[0]);
      }
  };

  const prepareUpload = (file: File) => {
    // Check size limit for LocalStorage (approx 2MB safety net)
    if (file.size > 2 * 1024 * 1024) {
        setToast({ msg: "Cảnh báo: File lớn hơn 2MB có thể làm chậm hệ thống (Demo Mode).", type: 'error' });
    }
    setUploadFile(file);
    setFormData({ title: file.name, grade: filterGrade !== 'All' ? filterGrade : 'All' });
    setIsUploadModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          prepareUpload(e.target.files[0]);
      }
  };

  const handleUploadSubmit = async () => {
      if (!uploadFile) {
          setToast({ msg: "Vui lòng chọn file", type: 'error' });
          return;
      }
      if (!formData.title) {
          setToast({ msg: "Vui lòng nhập tên tài liệu", type: 'error' });
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
              uploadDate: new Date().toISOString().split('T')[0],
              url: '#', // Not used in this version
              size: fileSize,
              grade: formData.grade,
              content: base64Content // Store real file data
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

  const handleEditClick = (doc: DocumentFile) => {
      setSelectedDoc(doc);
      setFormData({
          title: doc.title,
          grade: doc.grade || 'All'
      });
      setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async () => {
      if (!selectedDoc) return;
      if (!formData.title) {
          setToast({ msg: "Vui lòng nhập tên tài liệu", type: 'error' });
          return;
      }

      const updatedDoc: DocumentFile = {
          ...selectedDoc,
          title: formData.title,
          grade: formData.grade
      };

      await documentService.update(updatedDoc);
      setToast({ msg: "Cập nhật tài liệu thành công!", type: 'success' });
      resetModals();
      loadDocs();
  };

  const handleDelete = async (id: string) => {
      if(window.confirm('Bạn có chắc muốn xóa tài liệu này? Hành động này không thể hoàn tác.')) {
          await documentService.delete(id);
          // Update UI immediately
          const newDocs = docs.filter(d => d.id !== id);
          setDocs(newDocs);
          setToast({msg: 'Đã xóa tài liệu khỏi hệ thống', type: 'success'});
          
          if (selectedDoc && selectedDoc.id === id) {
              setIsViewModalOpen(false);
          }
      }
  };

  const handleDownload = (doc: DocumentFile) => {
      if (doc.content) {
          // Real download from Base64
          const link = document.createElement('a');
          link.href = doc.content;
          link.download = doc.title; // Browser will detect extension from MIME type or we can append
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setToast({ msg: `Đã bắt đầu tải xuống: ${doc.title}`, type: 'success' });
      } else {
          // Mock download for sample data
          const element = document.createElement("a");
          const fileContent = `Đây là nội dung giả lập của tài liệu: ${doc.title}\nĐược tải về từ hệ thống MathX.`;
          const fileType = doc.type === 'PDF' ? 'application/pdf' : 'text/plain';
          const fileExtension = doc.type.toLowerCase();
          
          const file = new Blob([fileContent], {type: fileType});
          element.href = URL.createObjectURL(file);
          element.download = `${doc.title}.${fileExtension}`;
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
          setToast({ msg: `Đang tải file mẫu (Mock): ${doc.title}`, type: 'success' });
      }
  };

  const handleViewDetails = (doc: DocumentFile) => {
      setSelectedDoc(doc);
      setIsViewModalOpen(true);
  };

  const resetModals = () => {
      setIsUploadModalOpen(false);
      setIsEditModalOpen(false);
      setIsViewModalOpen(false);
      setUploadFile(null);
      setSelectedDoc(null);
      setFormData({ title: '', grade: 'All' });
  };

  // Content Preview Renderer
  const renderFilePreview = (doc: DocumentFile) => {
    // 1. If we have real content (Base64)
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
        // Fallback for real content but non-previewable type
        return (
            <div className="w-full h-[300px] bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-8">
                 <p className="font-bold text-slate-700 mb-2">Đã lưu file gốc</p>
                 <p className="text-sm text-slate-500 mb-4">Trình duyệt không hỗ trợ xem trước định dạng {doc.type} trực tiếp.</p>
                 <Button onClick={() => handleDownload(doc)}>Tải xuống để xem</Button>
            </div>
        );
    }

    // 2. Mock Data Fallback (Simulation)
    const imgUrl = `https://picsum.photos/seed/${doc.id}/800/500`;
    if (doc.type === 'IMG') {
        return (
            <div className="w-full h-[400px] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                <img src={imgUrl} alt={doc.title} className="max-w-full max-h-full object-contain" />
            </div>
        );
    }
    
    // Fallback for Mock PDF/Docs
    return (
        <div className="w-full h-[300px] bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
             <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold mb-4 ${doc.type === 'DOCX' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                {doc.type}
            </div>
            <p className="font-medium text-slate-700 mb-1">File mẫu (Mock Data)</p>
            <p className="text-sm mb-4">Vui lòng tải xuống để xem nội dung.</p>
            <Button variant="secondary" onClick={() => handleDownload(doc)}>
                Tải xuống file mẫu
            </Button>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Kho Tài liệu</h2>
            <p className="text-slate-500 text-sm">Quản lý và chia sẻ tài liệu học tập.</p>
        </div>
        <div className="flex gap-3">
             <div className="relative">
                <select 
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 text-slate-700 py-2 pl-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                >
                    <option value="GRADE">Sắp xếp theo Lớp</option>
                    <option value="DATE">Mới nhất</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                </div>
            </div>
            <Button className="text-sm shadow-indigo-200" onClick={() => setIsUploadModalOpen(true)}>+ Tải lên</Button>
        </div>
      </div>

      {/* Grade Filter Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
          <button 
             onClick={() => setFilterGrade('All')}
             className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterGrade === 'All' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
              Tất cả
          </button>
          {Object.values(Grade).map(g => (
              <button 
                  key={g}
                  onClick={() => setFilterGrade(g)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterGrade === g ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                  Lớp {g}
              </button>
          ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Upload Box */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => setIsUploadModalOpen(true)}
            className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-500 transition-all cursor-pointer min-h-[220px] group"
          >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
              </div>
              <p className="font-medium">Tải lên tài liệu mới</p>
              <p className="text-xs mt-1">Kéo thả hoặc nhấn để chọn</p>
          </div>

          {currentDocs.map(doc => (
              <Card key={doc.id} className="hover:shadow-lg transition-all duration-300 group flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm ${doc.type === 'PDF' ? 'bg-red-50 text-red-600 border border-red-100' : doc.type === 'DOCX' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                          {doc.type}
                      </div>
                      <Badge color="indigo">{doc.grade === 'All' ? 'Chung' : `Lớp ${doc.grade}`}</Badge>
                  </div>
                  
                  <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2 leading-tight h-10" title={doc.title}>{doc.title}</h3>
                      <p className="text-xs text-slate-400 mb-2">Đăng ngày: {doc.uploadDate} • {doc.size}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
                      <div className="flex gap-1">
                          <button 
                            onClick={() => handleViewDetails(doc)} 
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Xem chi tiết"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          </button>
                          <button 
                            onClick={() => handleEditClick(doc)} 
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            title="Sửa"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                          </button>
                          <button 
                            onClick={() => handleDelete(doc.id)} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Xóa"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          </button>
                      </div>
                      <button 
                        onClick={() => handleDownload(doc)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 9.75l-3 3m0 0l3 3m-3-3H2.25" transform="rotate(-90 12 12)" /></svg>
                          Tải xuống
                      </button>
                  </div>
              </Card>
          ))}
      </div>

      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
        totalItems={filteredDocs.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* Upload Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={resetModals} title="Tải lên tài liệu mới">
          <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative">
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
                        <p className="text-slate-500 font-medium">Chọn file từ máy tính</p>
                        <p className="text-xs text-slate-400">Hỗ trợ PDF, Word, Excel, Hình ảnh</p>
                      </>
                  )}
              </div>

              <Input 
                label="Tên hiển thị" 
                value={formData.title} 
                onChange={(e: any) => setFormData({...formData, title: e.target.value})}
                placeholder="Nhập tên tài liệu..."
              />

              <Select
                label="Dành cho lớp"
                value={formData.grade}
                onChange={(e: any) => setFormData({...formData, grade: e.target.value})}
                options={[
                    { label: 'Tất cả các lớp', value: 'All' },
                    ...Object.values(Grade).map(g => ({ label: `Lớp ${g}`, value: g }))
                ]}
              />

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

              <Select
                label="Dành cho lớp"
                value={formData.grade}
                onChange={(e: any) => setFormData({...formData, grade: e.target.value})}
                options={[
                    { label: 'Tất cả các lớp', value: 'All' },
                    ...Object.values(Grade).map(g => ({ label: `Lớp ${g}`, value: g }))
                ]}
              />

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
                  {/* Metadata Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold flex-shrink-0 ${selectedDoc.type === 'PDF' ? 'bg-red-100 text-red-600' : selectedDoc.type === 'DOCX' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                          {selectedDoc.type}
                      </div>
                      <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-slate-800 break-words">{selectedDoc.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                               <Badge color="indigo">{selectedDoc.grade === 'All' ? 'Tất cả lớp' : `Lớp ${selectedDoc.grade}`}</Badge>
                               <span className="text-sm text-slate-500">• {selectedDoc.size} • {selectedDoc.uploadDate}</span>
                          </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                          <Button variant="danger" onClick={() => handleDelete(selectedDoc.id)} className="flex-1 sm:flex-none justify-center">Xóa</Button>
                          <Button onClick={() => handleDownload(selectedDoc)} className="flex-1 sm:flex-none justify-center">Tải xuống</Button>
                      </div>
                  </div>

                  {/* Content Preview Area */}
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