import React, { useState, useEffect } from 'react';
import { studentService, tuitionService } from '../services/mockService';
import { MOCK_DOCS } from '../constants';
import { Student, Grade, StudentStatus, TuitionRecord, PaymentStatus } from '../types';
import { Button, Input, Select, Card, Badge, Modal, Toast, Pagination, Avatar } from '../components/ui';

export const StudentsPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentTuition, setStudentTuition] = useState<TuitionRecord[]>([]);

  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    fullName: '',
    grade: Grade.SIX,
    status: StudentStatus.ACTIVE,
    phone: '',
    parentName: '',
    startDate: new Date().toISOString().split('T')[0],
    avatar: ''
  });

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterClass, searchTerm]);

  const loadStudents = async () => {
    setLoading(true);
    try {
        const data = await studentService.getAll();
        setStudents(data);
    } catch (error) {
        console.error("Failed to load students", error);
        setToast({ msg: "Không thể tải danh sách học sinh", type: 'error' });
    } finally {
        setLoading(false);
    }
  };

  const handleViewStudent = async (student: Student) => {
    setSelectedStudent(student);
    try {
        const allTuition = await tuitionService.getAll();
        const records = allTuition.filter(t => t.studentId === student.id);
        setStudentTuition(records);
    } catch (e) {
        setStudentTuition([]);
    }
    setIsViewModalOpen(true);
  };

  const handleOpenAdd = () => {
      setIsEditMode(false);
      setFormData({
        fullName: '',
        grade: Grade.SIX,
        status: StudentStatus.ACTIVE,
        phone: '',
        parentName: '',
        startDate: new Date().toISOString().split('T')[0],
        avatar: `https://picsum.photos/seed/${Date.now()}/200`
      });
      setIsModalOpen(true);
  };

  const handleEditClick = (student: Student) => {
      setSelectedStudent(student);
      setFormData({
          fullName: student.fullName,
          grade: student.grade,
          status: student.status, // Load status hiện tại của học sinh vào form
          phone: student.phone || '',
          parentName: student.parentName || '',
          startDate: student.startDate,
          avatar: student.avatar
      });
      setIsEditMode(true);
      setIsModalOpen(true);
  };

  const handleSaveStudent = async () => {
    if(!formData.fullName) {
        setToast({msg: "Vui lòng nhập họ tên", type: 'error'});
        return;
    }

    // Default avatar if empty
    const finalAvatar = formData.avatar || `https://picsum.photos/seed/${Date.now()}/200`;

    try {
        if (isEditMode && selectedStudent) {
            // Update logic
            const updatedStudent: Student = {
                ...selectedStudent,
                fullName: formData.fullName,
                grade: formData.grade as Grade,
                status: formData.status as StudentStatus, // Quan trọng: Cập nhật status mới
                phone: formData.phone,
                parentName: formData.parentName,
                startDate: formData.startDate || selectedStudent.startDate,
                avatar: finalAvatar
            };
            
            await studentService.update(updatedStudent);
            setToast({msg: "Cập nhật thông tin thành công", type: 'success'});
        } else {
            // Add logic
            const newStudent: Student = {
                id: Date.now().toString(), // Backend sẽ ghi đè ID này
                fullName: formData.fullName || '',
                grade: formData.grade as Grade,
                status: formData.status as StudentStatus,
                startDate: formData.startDate || '',
                avatar: finalAvatar,
                phone: formData.phone,
                parentName: formData.parentName
            };
            await studentService.add(newStudent);
            setToast({msg: "Thêm học sinh thành công", type: 'success'});
        }

        setIsModalOpen(false);
        // Tải lại danh sách để đồng bộ dữ liệu mới nhất từ Backend
        loadStudents(); 
    } catch (error) {
        console.error("Save error:", error);
        setToast({msg: "Có lỗi xảy ra khi lưu dữ liệu", type: 'error'});
    }
  };

  const handleDelete = async (id: string) => {
    if(window.confirm('Bạn có chắc muốn xóa học sinh này không?')) {
        try {
            await studentService.delete(id);
            setToast({msg: "Đã xóa học sinh", type: 'success'});
            loadStudents();
        } catch (error) {
             setToast({msg: "Lỗi khi xóa học sinh", type: 'error'});
        }
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "ID,Ten,Lop,TrangThai,NgayNhapHoc,PhuHuynh,SDT\n"
        + students.map(e => `${e.id},${e.fullName},${e.grade},${e.status},${e.startDate},${e.parentName || ''},${e.phone || ''}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "danh_sach_hoc_sinh.csv");
    document.body.appendChild(link);
    link.click();
  };

  const filteredStudents = students.filter(s => {
      const matchGrade = filterClass === 'All' || s.grade === filterClass;
      const matchSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchGrade && matchSearch;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => parseInt(b.grade) - parseInt(a.grade));
  const totalPages = Math.ceil(sortedStudents.length / ITEMS_PER_PAGE);
  const currentStudents = sortedStudents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Quản lý Học sinh</h2>
            <p className="text-slate-500 text-sm md:text-base">Quản lý hồ sơ, nhập học và trạng thái học sinh.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <Button variant="secondary" onClick={handleExport} className="flex-1 lg:flex-none">Xuất Excel</Button>
            <Button onClick={handleOpenAdd} className="flex-1 lg:flex-none w-full lg:w-auto text-sm">+ Thêm học sinh</Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-md">
              <input
                  type="text"
                  placeholder="Tìm kiếm học sinh theo tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-4 pr-4 py-2 w-full border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-400 text-slate-700"
              />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
               <span className="text-sm font-medium text-slate-500 whitespace-nowrap hidden sm:inline">Lọc theo:</span>
               <div className="relative w-full sm:w-48">
                   <select
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                      className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer appearance-none"
                   >
                      <option value="All">Tất cả các lớp</option>
                      {Object.values(Grade).map(g => <option key={g} value={g}>Lớp {g}</option>)}
                   </select>
               </div>
          </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
                <table className="min-w-full text-left border-collapse">
                    <thead className="bg-slate-50">
                        <tr className="text-slate-500 border-b border-slate-200 text-xs uppercase tracking-wider font-semibold">
                            <th className="py-4 px-6 whitespace-nowrap">STT</th>
                            <th className="py-4 px-6 whitespace-nowrap">Họ tên & Liên hệ</th>
                            <th className="py-4 px-6 whitespace-nowrap">Lớp</th>
                            <th className="py-4 px-6 whitespace-nowrap">Ngày nhập học</th>
                            <th className="py-4 px-6 whitespace-nowrap">Trạng thái</th>
                            <th className="py-4 px-6 text-right whitespace-nowrap">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="py-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                        ) : currentStudents.map((s, idx) => (
                            <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors group">
                                <td className="py-4 px-6 text-slate-400 w-16">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <Avatar src={s.avatar} alt={s.fullName} fallback={s.fullName} className="w-10 h-10" />
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-900 truncate max-w-[180px] group-hover:text-indigo-700 transition-colors">{s.fullName}</p>
                                            <p className="text-xs text-slate-500">{s.phone || 'Chưa có SĐT'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6 whitespace-nowrap"><Badge color="indigo">Lớp {s.grade}</Badge></td>
                                <td className="py-4 px-6 text-slate-600 whitespace-nowrap">{new Date(s.startDate).toLocaleDateString('vi-VN')}</td>
                                <td className="py-4 px-6 whitespace-nowrap">
                                    <Badge color={s.status === StudentStatus.ACTIVE ? 'green' : 'red'}>
                                        {s.status === StudentStatus.ACTIVE ? 'Đang học' : (s.status === StudentStatus.GRADUATED ? 'Đã tốt nghiệp' : 'Đã nghỉ')}
                                    </Badge>
                                </td>
                                <td className="py-4 px-6 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleViewStudent(s)} className="text-slate-400 hover:text-indigo-600 p-2">👁️</button>
                                        <button onClick={() => handleEditClick(s)} className="text-slate-400 hover:text-amber-600 p-2">✏️</button>
                                        <button onClick={() => handleDelete(s.id)} className="text-slate-400 hover:text-red-600 p-2">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div className="p-4 border-t border-slate-100">
             <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={setCurrentPage} 
                totalItems={filteredStudents.length}
                itemsPerPage={ITEMS_PER_PAGE}
             />
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Cập nhật thông tin học sinh" : "Thêm học sinh mới"} maxWidth="sm:max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column: Avatar & Basic Info */}
              <div className="md:col-span-1 flex flex-col items-center gap-4 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4">
                  <div className="relative group">
                      <Avatar src={formData.avatar} alt="Avatar" fallback={formData.fullName} className="w-24 h-24 text-2xl" />
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <span className="text-white text-xs">Ảnh đại diện</span>
                      </div>
                  </div>
                  <div className="w-full">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Link Ảnh đại diện</label>
                      <input 
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.avatar}
                        onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                        placeholder="https://..."
                      />
                  </div>
              </div>

              {/* Right Column: Detailed Form */}
              <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Input 
                            label="Họ và tên" 
                            value={formData.fullName} 
                            onChange={(e: any) => setFormData({...formData, fullName: e.target.value})} 
                            placeholder="Nhập họ tên học sinh"
                        />
                      </div>
                      
                      <Select 
                        label="Lớp" 
                        options={Object.values(Grade).map(g => ({ label: `Lớp ${g}`, value: g }))}
                        value={formData.grade}
                        onChange={(e: any) => setFormData({...formData, grade: e.target.value})}
                      />
                      
                      <Select 
                        label="Trạng thái" 
                        options={[
                            { label: 'Đang học', value: StudentStatus.ACTIVE },
                            { label: 'Đã nghỉ', value: StudentStatus.DROPPED },
                            { label: 'Đã tốt nghiệp', value: StudentStatus.GRADUATED }
                        ]}
                        value={formData.status}
                        onChange={(e: any) => setFormData({...formData, status: e.target.value})}
                      />
                      
                      <Input 
                        label="Số điện thoại" 
                        value={formData.phone} 
                        onChange={(e: any) => setFormData({...formData, phone: e.target.value})} 
                        placeholder="09..."
                      />

                      <Input 
                        label="Ngày nhập học" 
                        type="date" 
                        value={formData.startDate} 
                        onChange={(e: any) => setFormData({...formData, startDate: e.target.value})} 
                      />

                      <div className="sm:col-span-2">
                          <Input 
                            label="Họ tên phụ huynh" 
                            value={formData.parentName} 
                            onChange={(e: any) => setFormData({...formData, parentName: e.target.value})} 
                            placeholder="Nhập tên phụ huynh (nếu có)"
                        />
                      </div>
                  </div>
              </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Hủy bỏ</Button>
              <Button onClick={handleSaveStudent}>{isEditMode ? "Lưu thay đổi" : "Tạo mới"}</Button>
          </div>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Hồ sơ chi tiết">
        {selectedStudent && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 border-b border-slate-100 pb-4 text-center sm:text-left">
               <Avatar src={selectedStudent.avatar} alt={selectedStudent.fullName} fallback={selectedStudent.fullName} className="w-20 h-20 text-xl" />
               <div className="w-full">
                  <h3 className="text-xl font-bold text-slate-800">{selectedStudent.fullName}</h3>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-1">
                      <Badge color="indigo">Lớp {selectedStudent.grade}</Badge>
                      <Badge color={selectedStudent.status === StudentStatus.ACTIVE ? 'green' : 'red'}>
                         {selectedStudent.status === StudentStatus.ACTIVE ? 'Đang học' : (selectedStudent.status === StudentStatus.GRADUATED ? 'Đã tốt nghiệp' : 'Đã nghỉ')}
                      </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-500">
                      <p>📞 SĐT: <span className="text-slate-700 font-medium">{selectedStudent.phone || '---'}</span></p>
                      <p>📅 Nhập học: <span className="text-slate-700 font-medium">{selectedStudent.startDate}</span></p>
                      <p className="sm:col-span-2">👨‍👩‍👧 Phụ huynh: <span className="text-slate-700 font-medium">{selectedStudent.parentName || '---'}</span></p>
                  </div>
               </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-3 border-l-4 border-indigo-500 pl-2">Lịch sử học phí</h4>
              <div className="bg-slate-50 rounded-lg p-3 max-h-48 overflow-y-auto border border-slate-100">
                   {studentTuition.length > 0 ? (
                       <table className="w-full text-sm text-left">
                           <thead>
                              <tr className="text-slate-500 text-xs uppercase border-b border-slate-200">
                                  <th className="pb-2">Tháng</th>
                                  <th className="pb-2">Số tiền</th>
                                  <th className="pb-2 text-right">Trạng thái</th>
                              </tr>
                           </thead>
                           <tbody>
                              {studentTuition.map(t => (
                                  <tr key={t.id} className="border-b border-slate-100 last:border-0">
                                      <td className="py-2.5 font-medium">{t.month}</td>
                                      <td className="py-2.5">{t.amount.toLocaleString()}đ</td>
                                      <td className="py-2.5 text-right">
                                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.status === PaymentStatus.PAID ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                              {t.status === PaymentStatus.PAID ? 'Đã đóng' : 'Chưa đóng'}
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                           </tbody>
                       </table>
                   ) : (
                       <p className="text-slate-400 text-sm text-center py-4">Học sinh chưa có lịch sử đóng học phí.</p>
                   )}
              </div>
            </div>

             <div>
              <h4 className="font-semibold text-slate-800 mb-3 border-l-4 border-blue-500 pl-2">Tài liệu học tập</h4>
              <div className="bg-slate-50 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 border border-slate-100">
                  {MOCK_DOCS.length > 0 ? MOCK_DOCS.map(doc => (
                       <div key={doc.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                           <div className="flex items-center gap-3 overflow-hidden">
                              <div className={`w-8 h-8 rounded flex-shrink-0 items-center justify-center text-xs font-bold ${doc.type === 'PDF' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                {doc.type}
                              </div>
                              <p className="text-sm font-medium text-slate-700 truncate">{doc.title}</p>
                           </div>
                       </div>
                  )) : (
                    <p className="text-slate-400 text-sm text-center py-4">Chưa có tài liệu nào.</p>
                  )}
              </div>
            </div>
            
            <div className="flex justify-end pt-2 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};