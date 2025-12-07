import React from 'react';
import { Card } from '../components/ui';

export const Dashboard = () => {
    const stats = [
        { label: 'Tổng số học sinh', val: '124', change: '+12%', color: 'indigo' },
        { label: 'Doanh thu (T10)', val: '45.2tr', change: '+5%', color: 'green' },
        { label: 'Khóa học đang hoạt động', val: '8', change: '0%', color: 'blue' },
        { label: 'Học phí chưa đóng', val: '12', change: '-2%', color: 'red' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Xin chào, Quản trị viên!</h2>
                <p className="text-slate-500">Dưới đây là tổng quan tình hình hoạt động của MathX hôm nay.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((s) => (
                    <Card key={s.label} className="p-6">
                        <p className="text-slate-500 text-sm font-medium">{s.label}</p>
                        <div className="flex items-end justify-between mt-2">
                            <h3 className={`text-3xl font-bold text-${s.color}-600`}>{s.val}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${s.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.change}</span>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="font-bold text-slate-800 mb-4">Học sinh mới nhập học</h3>
                    <div className="space-y-4">
                        {[1,2,3].map(i => (
                            <div key={i} className="flex items-center justify-between pb-3 border-b border-slate-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                                    <div>
                                        <p className="font-medium text-sm">Nguyễn Văn Học Sinh {i}</p>
                                        <p className="text-xs text-slate-400">Lớp 10</p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400">2 giờ trước</span>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card>
                    <h3 className="font-bold text-slate-800 mb-4">Lịch học sắp tới</h3>
                    <div className="space-y-4">
                        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-indigo-900 text-sm">Đại số nâng cao</p>
                                <p className="text-xs text-indigo-600">Phòng 101 • Thầy Tuấn</p>
                            </div>
                            <span className="text-sm font-bold text-indigo-600">18:00</span>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-bold text-slate-800 text-sm">Hình học cơ bản</p>
                                <p className="text-xs text-slate-500">Phòng 203 • Cô Lan</p>
                            </div>
                            <span className="text-sm font-bold text-slate-600">19:30</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};