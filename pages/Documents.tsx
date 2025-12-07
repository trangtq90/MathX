import React, { useState } from 'react';
import { MOCK_DOCS } from '../constants';
import { Card, Button, Badge, Pagination } from '../components/ui';

export const DocumentsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const totalPages = Math.ceil(MOCK_DOCS.length / ITEMS_PER_PAGE);
  const currentDocs = MOCK_DOCS.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Kho Tài liệu</h2>
        <Button className="text-sm">+ Tải lên tài liệu</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {currentDocs.map(doc => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold ${doc.type === 'PDF' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                          {doc.type}
                      </div>
                      <button className="text-slate-400 hover:text-slate-600">•••</button>
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors truncate">{doc.title}</h3>
                  <p className="text-xs text-slate-500 mb-4">Ngày đăng: {doc.uploadDate} • {doc.size}</p>
                  <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                      <Badge color="gray">Lớp 6-12</Badge>
                      <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Tải xuống</button>
                  </div>
              </Card>
          ))}
          
          {currentPage === totalPages && (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer min-h-[200px]">
                <span className="text-4xl mb-2">☁️</span>
                <p className="font-medium">Kéo thả file vào đây</p>
                <p className="text-xs">hoặc nhấn để chọn file</p>
            </div>
          )}
      </div>

      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
        totalItems={MOCK_DOCS.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  );
};