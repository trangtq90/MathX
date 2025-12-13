import React, { useEffect, useState } from 'react';
import { Card, Badge, Button } from '../components/ui';
import { studentService, tuitionService, courseService } from '../services/mockService';
import { Student, TuitionRecord, Course, StudentStatus, PaymentStatus } from '../types';

export const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeStudents: 0,
        inactiveStudents: 0,
        revenueMonth: 0,
        revenueYear: 0,
        activeCourses: 0,
        unpaidCount: 0,
        unpaidAmount: 0 
    });
    const [recentStudents, setRecentStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentsData, tuitionData, coursesData] = await Promise.all([
                    studentService.getAll(),
                    tuitionService.getAll(),
                    courseService.getAll()
                ]);

                calculateStats(studentsData, tuitionData, coursesData);
                
                // Get 3 most recent students
                const sortedStudents = [...studentsData].sort((a, b) => 
                    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
                );
                setRecentStudents(sortedStudents.slice(0, 3));
                setCourses(coursesData.slice(0, 3)); // Show top 3 courses

                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const calculateStats = (students: Student[], tuition: TuitionRecord[], courses: Course[]) => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11
        const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

        // 1. Students Stats
        const totalStudents = students.length;
        const activeStudents = students.filter(s => s.status === StudentStatus.ACTIVE).length;
        const inactiveStudents = totalStudents - activeStudents;

        // 2. Revenue Stats (Giữ nguyên logic bạn thấy ổn)
        let revenueMonth = 0;
        let revenueYear = 0;

        // Dedup tuition records by ID just in case API returns duplicates
        const uniqueTuition = Array.from(new Map(tuition.map(item => [item.id, item])).values());

        uniqueTuition.forEach(t => {
            // Chỉ tính các khoản ĐÃ ĐÓNG (PAID)
            if (t.status === PaymentStatus.PAID) {
                const amount = Number(t.amount) || 0; 
                
                // A. Tính doanh thu tháng: Dựa trên Billing Month (Tháng thu)
                if (t.month === currentMonthStr) {
                    revenueMonth += amount;
                }

                // B. Tính doanh thu năm: Dựa trên Cash Basis (Ngày thực thu)
                let pYear = -1;

                if (t.datePaid) {
                    const parts = t.datePaid.split('-');
                    if (parts.length === 3) {
                        pYear = parseInt(parts[0]);
                    }
                } 
                
                // Fallback: Nếu không có ngày thực thu, dùng năm của kỳ thu
                if (pYear === -1 && t.month) {
                    const parts = t.month.split('-');
                    if (parts.length >= 1) {
                        pYear = parseInt(parts[0]);
                    }
                }

                if (pYear === currentYear) {
                    revenueYear += amount;
                }
            }
        });

        // 3. Unpaid Tuition (IMPLICIT DEBT - Logic cũ: Tất cả Active chưa đóng)
        // Đếm tất cả học sinh Active chưa hoàn thành học phí tháng này (kể cả chưa tạo phiếu)
        let unpaidCount = 0;
        let unpaidAmount = 0;
        const DEFAULT_FEE = 400000; // Giả định mức học phí cơ bản nếu chưa có phiếu

        const activeStudentsList = students.filter(s => s.status === StudentStatus.ACTIVE);
        
        activeStudentsList.forEach(student => {
            // Tìm phiếu thu của học sinh trong tháng này
            const record = uniqueTuition.find(t => t.studentId === student.id && t.month === currentMonthStr);
            
            // Được coi là "Xong" nếu đã Trả (PAID) hoặc được Miễn (EXEMPT)
            const isSettled = record && (record.status === PaymentStatus.PAID || record.status === PaymentStatus.EXEMPT);
            
            if (!isSettled) {
                unpaidCount++;
                // Nếu đã có phiếu (trạng thái UNPAID) -> lấy số tiền trên phiếu
                // Nếu chưa có phiếu -> lấy số tiền mặc định (dự tính)
                unpaidAmount += record ? (Number(record.amount) || 0) : DEFAULT_FEE;
            }
        });

        // 4. Courses
        const activeCourses = courses.length;

        setStats({
            totalStudents,
            activeStudents,
            inactiveStudents,
            revenueMonth,
            revenueYear,
            activeCourses,
            unpaidCount,
            unpaidAmount
        });
    };

    const formatCurrency = (val: number) => {
        if (val >= 1000000000) return (val / 1000000000).toFixed(2) + 'tỷ';
        if (val >= 1000000) return (val / 1000000).toFixed(2) + 'tr';
        if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
        return val;
    };

    const formatFullCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    const currentMonthLabel = `T${new Date().getMonth() + 1}`;

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu tổng quan...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Xin chào, Quản trị viên!</h2>
                <p className="text-slate-500">Dưới đây là tổng quan tình hình hoạt động của MathX hôm nay.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Students */}
                <Card className="p-6 border-l-4 border-l-indigo-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Tổng số học sinh</p>
                            <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.totalStudents}</h3>
                        </div>
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            👨‍🎓
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3 text-xs">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md font-medium">
                            {stats.activeStudents} Đang học
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md font-medium">
                            {stats.inactiveStudents} Đã nghỉ
                        </span>
                    </div>
                </Card>

                {/* Revenue */}
                <Card className="p-6 border-l-4 border-l-green-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Doanh thu ({currentMonthLabel})</p>
                            <h3 className="text-3xl font-bold text-slate-800 mt-2" title={formatFullCurrency(stats.revenueMonth)}>
                                {formatCurrency(stats.revenueMonth)}
                            </h3>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            💰
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-500 font-medium">
                        Tổng năm nay: <span className="text-green-700 font-bold">{formatCurrency(stats.revenueYear)}</span>
                    </div>
                </Card>

                {/* Courses */}
                <Card className="p-6 border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Khóa học hoạt động</p>
                            <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.activeCourses}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            📚
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-400">
                        Đang giảng dạy
                    </div>
                </Card>

                {/* Unpaid Tuition */}
                <Card className="p-6 border-l-4 border-l-red-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Học phí chưa đóng</p>
                            <h3 className="text-3xl font-bold text-red-600 mt-2">{stats.unpaidCount}</h3>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                            ⚠️
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-red-500 font-medium truncate" title={formatFullCurrency(stats.unpaidAmount)}>
                        Dự tính thu: {formatCurrency(stats.unpaidAmount)}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Students List */}
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800">Học sinh mới nhập học</h3>
                        <Button variant="ghost" className="text-xs">Xem tất cả</Button>
                    </div>
                    <div className="space-y-4">
                        {recentStudents.length > 0 ? recentStudents.map((s) => (
                            <div key={s.id} className="flex items-center justify-between pb-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 p-2 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <img src={s.avatar} alt={s.fullName} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                                    <div>
                                        <p className="font-medium text-sm text-slate-900">{s.fullName}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Lớp {s.grade}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500">Ngày nhập học</p>
                                    <p className="text-xs font-medium text-slate-700">{s.startDate}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-slate-400 py-4">Chưa có dữ liệu học sinh</p>
                        )}
                    </div>
                </Card>

                {/* Active Courses List */}
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800">Lịch học & Khóa học</h3>
                        <Button variant="ghost" className="text-xs">Chi tiết</Button>
                    </div>
                    <div className="space-y-3">
                        {courses.length > 0 ? courses.map((c) => (
                            <div key={c.id} className="p-3 bg-white border border-slate-100 rounded-lg flex justify-between items-center hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-lg">
                                        📖
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm line-clamp-1">{c.title}</p>
                                        <p className="text-xs text-slate-500">{c.schedule} • {c.teacher}</p>
                                    </div>
                                </div>
                                <Badge color="indigo">Lớp {c.grade}</Badge>
                            </div>
                        )) : (
                            <p className="text-center text-slate-400 py-4">Chưa có khóa học nào</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};