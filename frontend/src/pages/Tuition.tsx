import React, { useState, useEffect } from 'react';
import { studentService, tuitionService } from '../services/mockService';
import { Student, TuitionRecord, PaymentStatus, PaymentMethod, StudentStatus, Grade } from '../types';
import { Button, Input, Select, Card, Badge, Toast, Pagination, Avatar, Modal } from '../components/ui';

const DEFAULT_TUITION = 400000;

export const TuitionPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [tuitionRecords, setTuitionRecords] = useState<TuitionRecord[]>([]);
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('All');
  
  // UI State
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [toast, setToast] = useState<any>(null);
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<{
      studentId: string;
      studentName: string;
      month: string;
      amount: number;
      status: PaymentStatus;
      method: PaymentMethod; // Thêm trường method
      note: string;
      datePaid: string;
      isEdit: boolean; 
  }>({ 
      studentId: '', 
      studentName: '', 
      month: '', 
      amount: DEFAULT_TUITION, 
      status: PaymentStatus.UNPAID,
      method: PaymentMethod.TRANSFER,
      note: '',
      datePaid: '',
      isEdit: false 
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchData = async () => {
        const [s, t] = await Promise.all([studentService.getAll(), tuitionService.getAll()]);
        setStudents(s);
        setTuitionRecords(t);
    };
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, filterStatus, searchTerm, filterGrade]);

  const getStatus = (studentId: string, month: string) => {
    const record = tuitionRecords.find(t => t.studentId === studentId && t.month === month);
    // Return default tuition amount if no record exists
    return record || { status: PaymentStatus.UNPAID, amount: DEFAULT_TUITION, note: '' };
  };

  // Helper tạo danh sách tháng chính xác dựa trên startDate và endDate
  const getStudentMonthsRange = (student: Student) => {
      if (!student.startDate) return [];

      const start = new Date(student.startDate);
      const end = student.endDate ? new Date(student.endDate) : new Date();

      start.setDate(1); // Normalization
      
      const months = [];
      const current = new Date(start);

      while (current <= end) {
          const y = current.getFullYear();
          const m = String(current.getMonth() + 1).padStart(2, '0');
          months.push(`${y}-${m}`);
          current.setMonth(current.getMonth() + 1);
      }

      return months.reverse(); 
  };

  // Tính số tháng nợ (chưa đóng) - Không tính Exempt là nợ
  const calculateDebt = (student: Student) => {
      const months = getStudentMonthsRange(student);
      let debt = 0;
      months.forEach(m => {
          const record = tuitionRecords.find(t => t.studentId === student.id && t.month === m);
          // Nợ nếu không có record hoặc trạng thái không phải PAID và không phải EXEMPT
          if (!record || (record.status !== PaymentStatus.PAID && record.status !== PaymentStatus.EXEMPT)) {
              debt++;
          }
      });
      return debt;
  };

  // Open Modal to Confirm/Edit Payment
  const handleOpenPayment = (student: Student, month: string) => {
      const existing = tuitionRecords.find(t => t.studentId === student.id && t.month === month);
      
      const today = new Date().toISOString().split('T')[0];

      setPaymentData({
          studentId: student.id,
          studentName: student.fullName,
          month: month,
          amount: existing ? existing.amount : DEFAULT_TUITION,
          status: existing ? existing.status : PaymentStatus.UNPAID,
          method: existing?.method || PaymentMethod.TRANSFER,
          note: existing?.note || '',
          datePaid: existing?.datePaid || today,
          isEdit: !!existing
      });
      setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = async () => {
      const { studentId, month, amount, status, method, note, datePaid } = paymentData;
      
      const existing = tuitionRecords.find(t => t.studentId === studentId && t.month === month);
      
      // Logic xử lý dữ liệu khi lưu
      const finalDatePaid = status === PaymentStatus.PAID ? datePaid : undefined;
      const finalMethod = status === PaymentStatus.PAID ? method : undefined;

      const newRecord: TuitionRecord = {
          id: existing ? existing.id : `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          studentId,
          month,
          amount: Number(amount), 
          status: status,
          datePaid: finalDatePaid,
          method: finalMethod,
          note: note
      };

      await tuitionService.update(newRecord);
      
      const updated = tuitionRecords.filter(t => !(t.studentId === studentId && t.month === month));
      setTuitionRecords([...updated, newRecord]);
      
      setToast({
          msg: `Đã cập nhật thông tin tháng ${month}`, 
          type: 'success'
      });
      setIsPaymentModalOpen(false);
  };

  // Logic lọc và tìm kiếm
  const filteredStudents = students.filter(s => {
      const matchName = s.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGrade = filterGrade === 'All' || s.grade === filterGrade;
      let matchStatus = true;
      if (filterStatus !== 'All') {
          const st = getStatus(s.id, selectedMonth);
          matchStatus = st.status === filterStatus;
      }
      return matchName && matchGrade && matchStatus;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
      const aActive = a.status === StudentStatus.ACTIVE;
      const bActive = b.status === StudentStatus.ACTIVE;
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;

      const gradeDiff = parseInt(b.grade) - parseInt(a.grade);
      if (gradeDiff !== 0) return gradeDiff;

      return a.fullName.localeCompare(b.fullName, 'vi', { sensitivity: 'base' });
  });

  const totalPages = Math.ceil(sortedStudents.length / ITEMS_PER_PAGE);
  const currentStudents = sortedStudents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const toggleExpand = (id: string) => {
      if (expandedStudentId === id) setExpandedStudentId(null);
      else setExpandedStudentId(id);
  };

  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusBadge = (status: PaymentStatus) => {
      switch(status) {
          case PaymentStatus.PAID: return <Badge color="green">Đã đóng</Badge>;
          case PaymentStatus.EXEMPT: return <Badge color="gray">Miễn phí</Badge>;
          default: return <Badge color="red">Chưa đóng</Badge>;
      }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Quản lý Học phí</h2>
            <p className="text-slate-500 text-sm">Theo dõi và thu học phí định kỳ (Mức chuẩn: {formatCurrency(DEFAULT_TUITION)})</p>
        </div>
      </div>

      <Card className="min-h-[600px] flex flex-col">
          {/* Toolbar Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-1">
              <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Tìm kiếm học sinh</label>
                  <div className="relative">
                      <input 
                          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                          placeholder="Nhập tên học sinh..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Lọc theo lớp</label>
                  <select 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      value={filterGrade}
                      onChange={(e) => setFilterGrade(e.target.value)}
                  >
                      <option value="All">Tất cả các lớp</option>
                      {Object.values(Grade).map(g => <option key={g} value={g}>Lớp {g}</option>)}
                  </select>
              </div>

              <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Tháng thu (Focus)</label>
                  <input 
                      type="month" 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(e.target.value)} 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
              </div>

              <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Trạng thái (Tháng {selectedMonth})</label>
                  <select 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                  >
                      <option value="All">Tất cả</option>
                      <option value={PaymentStatus.PAID}>Đã đóng</option>
                      <option value={PaymentStatus.UNPAID}>Chưa đóng</option>
                      <option value={PaymentStatus.EXEMPT}>Miễn học phí</option>
                  </select>
              </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
                <table className="min-w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                            <th className="py-3 px-4 w-10"></th>
                            <th className="py-3 px-4">Học sinh</th>
                            <th className="py-3 px-4 w-24">Lớp</th>
                            <th className="py-3 px-4 w-32 text-right">Số tiền</th>
                            <th className="py-3 px-4 w-40">Trạng thái</th>
                            <th className="py-3 px-4 w-32 text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {currentStudents.map((s, idx) => {
                            const info = getStatus(s.id, selectedMonth) as any;
                            const isExpanded = expandedStudentId === s.id;
                            const studentMonths = isExpanded ? getStudentMonthsRange(s) : [];
                            const debtCount = calculateDebt(s);
                            const isDebtFree = debtCount === 0;
                            
                            return (
                            <React.Fragment key={s.id}>
                                <tr 
                                    className={`border-b border-slate-100 transition-colors cursor-pointer ${isExpanded ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                                    onClick={() => toggleExpand(s.id)}
                                >
                                    <td className="py-3 px-4 text-center text-slate-400">
                                        <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>▶</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar src={s.avatar} fallback={s.fullName} className="w-9 h-9" />
                                            <div>
                                                <p className="font-medium text-slate-900">{s.fullName}</p>
                                                {s.status !== StudentStatus.ACTIVE && <span className="text-xs text-red-500 italic">({s.status === StudentStatus.GRADUATED ? 'Đã tốt nghiệp' : 'Đã nghỉ'})</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 font-medium text-slate-600">Lớp {s.grade}</td>
                                    <td className="py-3 px-4 text-right font-bold text-slate-700">
                                        {info.status === PaymentStatus.UNPAID && isDebtFree ? <span className="text-slate-300">-</span> : formatCurrency(info.amount)}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex flex-col items-start gap-1">
                                            <div className="flex items-center gap-2">
                                                {!(info.status === PaymentStatus.UNPAID && isDebtFree) && getStatusBadge(info.status)}
                                                {info.note && <span className="text-xs text-amber-500" title={info.note}>📝</span>}
                                            </div>
                                            {info.status === PaymentStatus.PAID ? (
                                                <div className="text-[10px] text-slate-400">
                                                    {info.method === PaymentMethod.TRANSFER ? '💳 CK' : '💵 TM'} • {info.datePaid}
                                                </div>
                                            ) : info.status === PaymentStatus.UNPAID ? (
                                                <span className={`text-[11px] font-medium italic ${isDebtFree ? 'text-green-600' : 'text-red-500'}`}>
                                                    {isDebtFree ? '(Hoàn thành)' : `(Còn nợ ${debtCount} tháng)`}
                                                </span>
                                            ) : null}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            {info.status === PaymentStatus.UNPAID ? (
                                                <Button 
                                                    size="sm"
                                                    className="px-3 py-1 text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                                    onClick={() => handleOpenPayment(s, selectedMonth)}
                                                >
                                                    Thu ngay
                                                </Button>
                                            ) : (
                                                <Button 
                                                    variant="secondary"
                                                    className="px-3 py-1 text-xs h-8 border-slate-200 text-slate-600 hover:text-indigo-600"
                                                    onClick={() => handleOpenPayment(s, selectedMonth)}
                                                >
                                                    Chi tiết
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                
                                {/* Expanded Row: Full History Grid */}
                                {isExpanded && (
                                    <tr className="bg-indigo-50/30 border-b border-indigo-100 animate-fade-in-down">
                                        <td colSpan={6} className="p-4 sm:p-6">
                                            <div className="bg-white rounded-xl border border-indigo-100 p-4 shadow-sm">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                        <span>📅</span> Lịch sử đóng học phí 
                                                        <span className="font-normal text-slate-500 text-xs ml-1">(Từ {new Date(s.startDate).toLocaleDateString('vi-VN')} {s.endDate ? `đến ${new Date(s.endDate).toLocaleDateString('vi-VN')}` : 'đến nay'})</span>
                                                    </h4>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {studentMonths.map(m => {
                                                        const mStatus = getStatus(s.id, m) as any;
                                                        const isPaid = mStatus.status === PaymentStatus.PAID;
                                                        const isExempt = mStatus.status === PaymentStatus.EXEMPT;
                                                        const isCurrent = m === selectedMonth;
                                                        
                                                        return (
                                                            <div key={m} className={`p-3 rounded-lg border flex flex-col items-center justify-between text-center transition-all h-28 relative group ${
                                                                isCurrent ? 'ring-2 ring-indigo-400 ring-offset-1' : ''
                                                            } ${
                                                                isPaid 
                                                                ? 'bg-green-50 border-green-200' 
                                                                : isExempt 
                                                                    ? 'bg-slate-100 border-slate-200 opacity-80'
                                                                    : 'bg-white border-slate-200 hover:border-red-300'
                                                            }`}>
                                                                <span className="text-xs font-semibold text-slate-500">Tháng {m.substring(5)}/{m.substring(0,4)}</span>
                                                                
                                                                {isPaid ? (
                                                                    <div className="flex flex-col items-center w-full cursor-pointer" onClick={() => handleOpenPayment(s, m)} title="Chỉnh sửa">
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="font-bold text-green-700 text-sm">{formatCurrency(mStatus.amount)}</span>
                                                                            {mStatus.note && <span className="text-[10px] text-amber-500">📝</span>}
                                                                        </div>
                                                                        <span className="text-[10px] text-slate-400 mt-1">{mStatus.datePaid}</span>
                                                                        <span className="text-[9px] text-slate-400 uppercase">{mStatus.method === PaymentMethod.TRANSFER ? 'CK' : 'TM'}</span>
                                                                        <span className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-[10px] text-slate-400">✏️</span>
                                                                    </div>
                                                                ) : isExempt ? (
                                                                    <div className="flex flex-col items-center w-full cursor-pointer" onClick={() => handleOpenPayment(s, m)}>
                                                                         <span className="font-bold text-slate-500 text-xs mt-2">MIỄN PHÍ</span>
                                                                         {mStatus.note && <span className="text-[10px] text-amber-500">📝</span>}
                                                                         <span className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-[10px] text-slate-400">✏️</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center w-full gap-1.5">
                                                                         <div className="flex items-center gap-1">
                                                                             <span className="text-[10px] text-red-500 font-medium">Chưa đóng</span>
                                                                             {mStatus.note && <span className="text-[10px] text-amber-500">📝</span>}
                                                                         </div>
                                                                         <span className="text-xs font-bold text-slate-700">{formatCurrency(mStatus.amount)}</span>
                                                                         <button 
                                                                            onClick={() => handleOpenPayment(s, m)}
                                                                            className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded w-full transition-colors mt-auto"
                                                                         >
                                                                             Thu
                                                                         </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                    {studentMonths.length === 0 && (
                                                        <div className="col-span-full py-4 text-center text-slate-400 text-sm">
                                                            Không có dữ liệu tháng nào trong khoảng thời gian này.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        )})}
                        {currentStudents.length === 0 && (
                            <tr><td colSpan={6} className="py-12 text-center text-slate-400">Không tìm thấy học sinh nào.</td></tr>
                        )}
                    </tbody>
                </table>
          </div>
          
          <div className="p-4 border-t border-slate-100">
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={setCurrentPage} 
                totalItems={sortedStudents.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
          </div>
      </Card>

      {/* Payment/Adjustment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Cập nhật thông tin học phí">
          <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
                  <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-500">Học sinh:</span>
                      <span className="font-bold text-slate-800">{paymentData.studentName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Tháng thu:</span>
                      <span className="font-bold text-indigo-600">{paymentData.month}</span>
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                  <select 
                      value={paymentData.status}
                      onChange={(e) => setPaymentData({...paymentData, status: e.target.value as PaymentStatus})}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none font-medium ${
                          paymentData.status === PaymentStatus.PAID ? 'border-green-300 bg-green-50 text-green-800' : 
                          paymentData.status === PaymentStatus.EXEMPT ? 'border-slate-300 bg-slate-100 text-slate-800' :
                          'border-red-300 bg-red-50 text-red-800'
                      }`}
                  >
                      <option value={PaymentStatus.PAID}>Đã đóng (Paid)</option>
                      <option value={PaymentStatus.UNPAID}>Chưa đóng (Unpaid)</option>
                      <option value={PaymentStatus.EXEMPT}>Miễn học phí (Exempt)</option>
                  </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền (VNĐ)</label>
                      <div className="relative">
                          <input
                              type="number"
                              disabled={paymentData.status === PaymentStatus.EXEMPT}
                              value={paymentData.amount}
                              onChange={(e) => setPaymentData({...paymentData, amount: Number(e.target.value)})}
                              className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                          />
                          <span className="absolute right-3 top-2 text-slate-400 font-medium">đ</span>
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Ngày đóng</label>
                      <input
                          type="date"
                          disabled={paymentData.status !== PaymentStatus.PAID}
                          value={paymentData.datePaid}
                          onChange={(e) => setPaymentData({...paymentData, datePaid: e.target.value})}
                          className={`w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${paymentData.status !== PaymentStatus.PAID ? 'bg-slate-100 text-slate-400' : ''}`}
                      />
                  </div>
              </div>

              {paymentData.status === PaymentStatus.PAID && (
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Hình thức đóng</label>
                      <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg flex-1 hover:bg-slate-50 transition-colors">
                              <input 
                                type="radio" 
                                name="paymentMethod" 
                                checked={paymentData.method === PaymentMethod.TRANSFER} 
                                onChange={() => setPaymentData({...paymentData, method: PaymentMethod.TRANSFER})}
                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-sm font-medium">💳 Chuyển khoản</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg flex-1 hover:bg-slate-50 transition-colors">
                              <input 
                                type="radio" 
                                name="paymentMethod" 
                                checked={paymentData.method === PaymentMethod.CASH} 
                                onChange={() => setPaymentData({...paymentData, method: PaymentMethod.CASH})}
                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-sm font-medium">💵 Tiền mặt</span>
                          </label>
                      </div>
                  </div>
              )}
              
              {paymentData.status === PaymentStatus.UNPAID && (
                   <p className="text-xs text-amber-600 mt-[-10px] mb-2">⚠️ Nếu chuyển về "Chưa đóng", ngày đóng tiền sẽ bị xóa.</p>
              )}

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú (Tùy chọn)</label>
                  <textarea
                      rows={3}
                      value={paymentData.note}
                      onChange={(e) => setPaymentData({...paymentData, note: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      placeholder="Ví dụ: Miễn giảm 50% do hoàn cảnh, Nộp thiếu 50k..."
                  />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                  <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Hủy bỏ</Button>
                  <Button onClick={handleSubmitPayment} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      Lưu thông tin
                  </Button>
              </div>
          </div>
      </Modal>
    </div>
  );
};