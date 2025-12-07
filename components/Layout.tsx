import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { APP_NAME } from '../constants';

const SidebarItem = ({ to, icon, label, active, onClick }: any) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors mb-1 ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
  >
    <span className="text-xl">{icon}</span>
    <span className="font-medium">{label}</span>
  </Link>
);

export const Layout = ({ children, user, onLogout }: any) => {
  const location = useLocation();
  const path = location.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">M</div>
            <h1 className="text-xl font-bold text-slate-800">{APP_NAME}</h1>
        </div>
        <button onClick={toggleMobileMenu} className="p-2 text-slate-600 rounded-lg hover:bg-slate-100 focus:outline-none">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-50 z-30 md:hidden"
            onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out
        md:translate-x-0 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center gap-3 hidden md:flex">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">M</div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">{APP_NAME}</h1>
        </div>

        {/* Mobile menu header inside drawer */}
        <div className="p-4 flex items-center justify-between md:hidden border-b border-slate-100 mb-2">
           <span className="font-bold text-slate-700">Menu</span>
           <button onClick={closeMobileMenu} className="text-slate-400 hover:text-slate-600">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <SidebarItem to="/" icon="📊" label="Tổng quan" active={path === '/'} onClick={closeMobileMenu} />
          <SidebarItem to="/students" icon="👨‍🎓" label="Quản lý Học sinh" active={path === '/students'} onClick={closeMobileMenu} />
          <SidebarItem to="/tuition" icon="💰" label="Quản lý Học phí" active={path === '/tuition'} onClick={closeMobileMenu} />
          <SidebarItem to="/courses" icon="📚" label="Khóa học" active={path === '/courses'} onClick={closeMobileMenu} />
          <SidebarItem to="/exams" icon="📝" label="Đề thi & AI" active={path === '/exams'} onClick={closeMobileMenu} />
          <SidebarItem to="/documents" icon="📁" label="Tài liệu" active={path === '/documents'} onClick={closeMobileMenu} />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                {user?.name?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role === 'ADMIN' ? 'Quản trị viên' : 'Giáo viên'}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors">
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </main>
        
        <footer className="bg-white border-t border-slate-200 py-6 px-4 md:px-8 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Trung tâm {APP_NAME}. Bảo lưu mọi quyền. <br/>
          <span className="text-xs text-slate-400">Hệ thống quản lý giáo dục hiện đại.</span>
        </footer>
      </div>
    </div>
  );
};