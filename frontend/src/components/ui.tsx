import React, { useState } from 'react';
import katex from 'katex';

export const Button = ({ children, onClick, variant = 'primary', className = '', ...props }: any) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants: any = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 focus:ring-indigo-500",
    secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-200",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 focus:ring-red-500",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-600"
  };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-6 ${className}`}>
    {children}
  </div>
);

export const Input = ({ label, error, ...props }: any) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input 
      className={`w-full px-4 py-2 rounded-lg border ${error ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors`}
      {...props} 
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

export const Select = ({ label, options, ...props }: any) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <div className="relative">
      <select 
        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-white"
        {...props}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
      </div>
    </div>
  </div>
);

export const Badge = ({ children, color = 'blue', className='' }: any) => {
  const colors: any = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-800',
    indigo: 'bg-indigo-100 text-indigo-800'
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color] || colors.gray} ${className}`}>
      {children}
    </span>
  );
};

export const Avatar = ({ src, alt, fallback, className = "w-10 h-10" }: any) => {
  const [error, setError] = useState(false);
  
  if (error || !src) {
    return (
      <div className={`${className} rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 flex-shrink-0`}>
        {fallback ? fallback.substring(0, 2).toUpperCase() : '?'}
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className={`${className} rounded-full object-cover border border-slate-200 flex-shrink-0`}
      onError={() => setError(true)}
    />
  );
};

export const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }: any) => {
    const [jumpPage, setJumpPage] = useState('');

    if (totalPages <= 1 && (!totalItems || totalItems === 0)) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const handleJump = (e: React.FormEvent) => {
        e.preventDefault();
        const page = parseInt(jumpPage);
        if (page >= 1 && page <= totalPages) {
            onPageChange(page);
            setJumpPage('');
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 4) {
                pages.push(1, 2, 3, 4, 5, '...', totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mt-6 px-2">
            <div className="text-sm text-slate-500 order-2 lg:order-1">
                Hiển thị <span className="font-bold text-slate-800">{startItem}-{endItem}</span> trong tổng số <span className="font-bold text-slate-800">{totalItems}</span> kết quả
            </div>

            <div className="flex items-center gap-2 order-1 lg:order-2">
                <button 
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                
                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, idx) => (
                        typeof page === 'number' ? (
                            <button
                                key={idx}
                                onClick={() => onPageChange(page)}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                                    currentPage === page 
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105' 
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {page}
                            </button>
                        ) : (
                            <span key={idx} className="w-9 h-9 flex items-center justify-center text-slate-400">...</span>
                        )
                    ))}
                </div>

                <button 
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>

            <form onSubmit={handleJump} className="flex items-center gap-2 order-3">
                <input 
                    type="number" 
                    min="1" 
                    max={totalPages}
                    value={jumpPage}
                    onChange={(e) => setJumpPage(e.target.value)}
                    className="w-16 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                    placeholder="Trang"
                />
                <button 
                    type="submit"
                    disabled={!jumpPage}
                    className="px-3 py-1.5 text-sm bg-white border border-slate-200 text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                >
                    Đi
                </button>
            </form>
        </div>
    )
}

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'sm:max-w-lg' }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Background Overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-900 opacity-60"></div>
        </div>

        {/* Center Trick */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal Panel */}
        <div 
          className={`inline-block align-bottom bg-white rounded-2xl text-left shadow-xl transform transition-all sm:my-8 sm:align-middle ${maxWidth} w-full relative`}
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="modal-headline"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-headline">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors focus:outline-none">
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Body */}
          <div className="bg-white px-6 py-4">
              {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Toast = ({ message, type, onClose }: {message: string, type: 'success' | 'error', onClose: () => void}) => {
    React.useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-5 right-5 z-[110] px-6 py-3 rounded-lg shadow-lg text-white font-medium flex items-center gap-2 animate-bounce-in ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            <span>{type === 'success' ? '✓' : '⚠'}</span>
            {message}
        </div>
    )
}

const Latex: React.FC<{ formula: string }> = ({ formula }) => {
    const html = katex.renderToString(formula, {
        throwOnError: false,
        displayMode: false
    });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

export const MathContent = ({ content }: { content: string }) => {
    if (!content) return null;
    const parts = content.split(/(\$[^$]+\$)/g);
    return (
        <span>
            {parts.map((part, index) => {
                if (part.startsWith('$') && part.endsWith('$')) {
                    return <Latex key={index} formula={part.slice(1, -1)} />;
                }
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
};