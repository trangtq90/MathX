import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { initializeData } from './services/mockService';
import { Dashboard } from './pages/Dashboard';
import { StudentsPage } from './pages/Students';
import { TuitionPage } from './pages/Tuition';
import { CoursesPage } from './pages/Courses';
import { DocumentsPage } from './pages/Documents';
import { ExamsPage } from './pages/Exams';
import { User } from './types';

// Mock Auth Component
const LoginScreen = ({ onLogin }: any) => {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-3xl font-bold mx-auto mb-6">M</div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">MathX Admin</h1>
                <p className="text-slate-500 mb-8">Đăng nhập để quản lý trung tâm</p>
                <button 
                    onClick={() => onLogin({ id: '1', name: 'Quản Trị Viên', role: 'ADMIN', username: 'admin' })}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                >
                    Đăng nhập Quản trị viên (Demo)
                </button>
            </div>
        </div>
    )
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize mock DB connection info
    try {
        initializeData();
    } catch (e) {
        console.error("Failed to initialize app data:", e);
    }

    // Check session
    const saved = localStorage.getItem('mathx_user');
    if(saved) {
        try {
            setUser(JSON.parse(saved));
        } catch (e) {
            localStorage.removeItem('mathx_user');
        }
    }
  }, []);

  const handleLogin = (u: User) => {
      setUser(u);
      localStorage.setItem('mathx_user', JSON.stringify(u));
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('mathx_user');
  };

  if (!user) {
      return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/tuition" element={<TuitionPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/exams" element={<ExamsPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;