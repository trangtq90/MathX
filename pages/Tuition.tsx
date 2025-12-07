import React, { useState, useEffect } from 'react';
import { studentService, tuitionService } from '../services/mockService';
import { Student, TuitionRecord, PaymentStatus, PaymentMethod } from '../types';
import { Button, Input, Select, Card, Badge, Toast, Pagination } from '../components/ui';

export const TuitionPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [tuitionRecords, setTuitionRecords] = useState<TuitionRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('2023-10');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchHistory, setSearchHistory] = useState('');
  const [toast, setToast] = useState<any>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const fetchData = async () => {
        const [s, t] = await Promise.all([studentService.getAll(), tuitionService.getAll()]);
        setStudents(s);
        setTuitionRecords(t);
    };
    fetchData();
  }, []);

  // Reset pagination when month or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, filterStatus]);

  const getStatus = (studentId: string, month: string) => {
    const record = tuitionRecords.find(t => t.studentId === studentId && t.month === month);
    return record || { status: PaymentStatus.UNPAID };
  };

  const handlePay = async (studentId: string, month: string) => {
      // Simulate payment
      const existing = tuitionRecords.find(t => t.studentId === studentId && t.month === month);
      const newRecord: TuitionRecord = {
          id: existing ? existing.id : `new_${Date.now()}`,
          studentId,
          month,
          amount: 1500000,
          status: PaymentStatus.PAID,
          datePaid: new Date().toISOString().split('T')[0],
          method: PaymentMethod.CASH
      };

      await tuitionService.update(newRecord);
      
      // Update local state
      const updated = tuitionRecords.filter(t => !(t.studentId === studentId && t.month === month));
      setTuitionRecords([...updated, newRecord]);
      setToast({msg: "Đã ghi nhận thanh toán!", type: 'success'});
  };

  // 1. Filter Logic
  const filteredStudents = students.filter(s => {
      if(filterStatus === 'All') return true;
      const st = getStatus(s.id, selectedMonth);
      return st.status === filterStatus;
  });

  // 2. Pagination Logic
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const currentStudents = filteredStudents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // History Logic: Generate list of last 6 months
  const getLast6Months = () => {
      const months = [];
      const date = new Date();
      for (let i = 0; i < 6; i++) {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          months.push(`${y}-${m}`);
          date.setMonth(date.getMonth() - 1);
      }
      return months;
  };

  const historyView = searchHistory ? students.filter(s => s.fullName.toLowerCase().includes(searchHistory.toLowerCase())) : [];
  const checkMonths = getLast6Months();

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Quản lý Học phí</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h3 className="font-semibold text-lg">Danh sách học phí tháng {selectedMonth}</h3>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                         <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-full sm:w-auto" />
                         <select className="border rounded-lg px-3 py-2 text-sm w-full sm:w-auto" onChange={(e) => setFilterStatus(e.target.value)}>
                             <option value="All">Tất cả</option>
                             <option value={PaymentStatus.PAID}>Đã đóng</option>
                             <option value={PaymentStatus.UNPAID}>Chưa đóng</option>
                         </select>
                    </div>
                </div>

                <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase">
                                    <th className="py-3 px-2 whitespace-nowrap">Học sinh</th>
                                    <th className="py-3 px-2 whitespace-nowrap">Lớp</th>
                                    <th className="py-3 px-2 whitespace-nowrap">Trạng thái</th>
                                    <th className="py-3 px-2 whitespace-nowrap">Ngày đóng</th>
                                    <th className="py-3 px-2 text-right whitespace-nowrap">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {currentStudents.map(s => {
                                    const info = getStatus(s.id, selectedMonth) as any;
                                    return (
                                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                                        <td className="py-3 px-2 font-medium whitespace-nowrap">{s.fullName}</td>
                                        <td className="py-3 px-2 whitespace-nowrap">Lớp {s.grade}</td>
                                        <td className="py-3 px-2 whitespace-nowrap">
                                            <Badge color={info.status === PaymentStatus.PAID ? 'green' : 'red'}>
                                                {info.status === PaymentStatus.PAID ? 'Đã đóng' : 'Chưa đóng'}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-2 text-slate-500 whitespace-nowrap">{info.datePaid || '-'}</td>
                                        <td className="py-3 px-2 text-right whitespace-nowrap">
                                            {info.status !== PaymentStatus.PAID && (
                                                <button onClick={() => handlePay(s.id, selectedMonth)} className="text-indigo-600 font-semibold text-xs hover:underline">Xác nhận</button>
                                            )}
                                        </td>
                                    </tr>
                                )})}
                                {currentStudents.length === 0 && (
                                    <tr><td colSpan={5} className="py-8 text-center text-slate-400">Không tìm thấy dữ liệu.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <Pagination 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  onPageChange={setCurrentPage} 
                  totalItems={filteredStudents.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
            </Card>
        </div>

        <div className="space-y-6">
            <Card className="bg-slate-800 text-white min-h-[500px]">
                <h3 className="font-semibold mb-4 text-indigo-200">Tra cứu lịch sử đóng học phí</h3>
                <Input 
                    placeholder="Tìm tên học sinh..." 
                    value={searchHistory} 
                    onChange={(e: any) => setSearchHistory(e.target.value)} 
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-indigo-400"
                />
                <div className="space-y-3 mt-4 max-h-[500px] overflow-y-auto pr-2">
                    {searchHistory && historyView.length === 0 && <p className="text-slate-400 text-sm">Không tìm thấy học sinh.</p>}
                    {!searchHistory && <p className="text-slate-400 text-sm">Nhập tên để xem lịch sử đóng học phí của các tháng trước.</p>}
                    {historyView.map(s => (
                        <div key={s.id} className="bg-slate-700 p-3 rounded-lg border border-slate-600">
                            <div className="flex items-center gap-3 mb-3 pb-2 border-b border-slate-600">
                                <img src={s.avatar} className="w-8 h-8 rounded-full" alt=""/>
                                <span className="font-medium text-indigo-100 text-sm">{s.fullName} - Lớp {s.grade}</span>
                            </div>
                            <div className="space-y-1">
                                {checkMonths.map(m => {
                                    const st = getStatus(s.id, m) as any;
                                    const isPaid = st.status === PaymentStatus.PAID;
                                    return (
                                        <div key={m} className="flex justify-between text-xs text-slate-300 py-1 hover:bg-slate-600 px-1 rounded">
                                            <span>Tháng {m}</span>
                                            <span className={`font-medium ${isPaid ? 'text-green-400' : 'text-red-400'}`}>
                                                {isPaid ? '✓ Đã đóng' : '✗ Chưa đóng'}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
};