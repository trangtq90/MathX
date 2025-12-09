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

  const [filterGrade, setFilterGrade] = useState('All');
  const [sortBy, setSortBy] = useState<'GRADE' | 'DATE'>('GRADE');

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentFile | null>(null);
  
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({ title: '', grade: 'All' });
  
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

  const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });
  };

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

  const handleUploadSubmit = async () => {
      if (!uploadFile || !formData.title) return;
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
              url: '#',
              size: fileSize,
              grade: formData.grade,
              content: base64Content
          };

          await documentService.add(newDoc);
          setToast({ msg: "Tải lên tài liệu thành công!", type: 'success' });
          setIsUploadModalOpen(false);
          loadDocs();
      } catch (e) {
          setToast({ msg: "Lỗi khi xử lý file.", type: 'error' });
      } finally {
          setLoading(false);
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
      }
  };
  
  const handleDelete = async (id: string) => {
      if(window.confirm('Bạn có chắc muốn xóa tài liệu này?')) {
          await documentService.delete(id);
          const newDocs = docs.filter(d => d.id !== id);
          setDocs(newDocs);
          setToast({msg: 'Đã xóa tài liệu', type: 'success'});
          setIsViewModalOpen(false);
      }
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
        <div className="w-full h-[300px] bg-slate-50 flex items-center justify-center">
            <Button onClick={() => handleDownload(doc)}>Tải xuống để xem</Button>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Kho Tài liệu</h2>
        <Button onClick={() => setIsUploadModalOpen(true)}>+ Tải lên</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentDocs.map(doc => (
              <Card key={doc.id} className="hover:shadow-lg transition-all duration-300 group flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-sm">
                          {doc.type}
                      </div>
                      <Badge color="indigo">{doc.grade === 'All' ? 'Chung' : `Lớp ${doc.grade}`}</Badge>
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2">{doc.title}</h3>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
                       <Button variant="ghost" onClick={() => { setSelectedDoc(doc); setIsViewModalOpen(true); }} className="text-xs">Xem</Button>
                       <Button variant="ghost" onClick={() => handleDelete(doc.id)} className="text-xs text-red-500">Xóa</Button>
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

      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Tải lên tài liệu mới">
          <div className="space-y-4">
              <input type="file" onChange={(e) => e.target.files && setUploadFile(e.target.files[0])} />
              <Input label="Tên hiển thị" value={formData.title} onChange={(e: any) => setFormData({...formData, title: e.target.value})} />
              <Select label="Lớp" value={formData.grade} onChange={(e: any) => setFormData({...formData, grade: e.target.value})} options={[{ label: 'Tất cả', value: 'All' }, ...Object.values(Grade).map(g => ({ label: `Lớp ${g}`, value: g }))]} />
              <Button onClick={handleUploadSubmit} disabled={loading}>{loading ? 'Đang xử lý...' : 'Tải lên'}</Button>
          </div>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Chi tiết tài liệu" maxWidth="sm:max-w-5xl">
          {selectedDoc && (
              <div>
                  <div className="mb-4 flex justify-between">
                    <h3 className="font-bold">{selectedDoc.title}</h3>
                    <Button onClick={() => handleDownload(selectedDoc)}>Tải xuống</Button>
                  </div>
                  {renderFilePreview(selectedDoc)}
              </div>
          )}
      </Modal>
    </div>
  );
};