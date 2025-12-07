import React, { useState } from 'react';
import { MOCK_COURSES } from '../constants';
import { Card, Badge, Button, Pagination } from '../components/ui';

export const CoursesPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const totalPages = Math.ceil(MOCK_COURSES.length / ITEMS_PER_PAGE);
  const currentCourses = MOCK_COURSES.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Danh sách Khóa học</h2>
        <Button className="text-sm">+ Khóa học mới</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentCourses.map(course => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
                <div className="h-32 bg-gray-200 relative">
                    <img src={course.image} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2">
                        <Badge color="indigo">Lớp {course.grade}</Badge>
                    </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{course.title}</h3>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">{course.description}</p>
                    
                    <div className="mt-auto space-y-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span>👨‍🏫</span>
                            <span>{course.teacher}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span>🕒</span>
                            <span>{course.schedule}</span>
                        </div>
                        <Button variant="secondary" className="w-full mt-4 justify-center">Xem chi tiết</Button>
                    </div>
                </div>
            </div>
        ))}
      </div>
      
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
        totalItems={MOCK_COURSES.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  );
};