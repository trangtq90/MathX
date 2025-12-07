import React, { useState, useEffect, useRef } from 'react';
import { generateMathQuestions } from '../services/geminiService';
import { examService } from '../services/mockService';
import { Grade, Question, Exam } from '../types';
import { Button, Card, Input, Select, Badge, Toast, Modal, MathContent } from '../components/ui';

const QuestionCard: React.FC<{ q: Question, index: number }> = ({ q, index }) => (
    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
        <div className="flex flex-col sm:flex-row justify-between mb-2 gap-2">
            <span className="font-bold text-slate-700">Câu hỏi {index + 1}</span>
            <Badge color="blue" className="w-fit">{q.type === 'MCQ' ? 'Trắc nghiệm' : 'Tự luận'}</Badge>
        </div>
        <div className="mb-3 font-medium text-lg text-slate-800 break-words">
            <MathContent content={q.content} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.options?.map((opt, i) => (
                <div key={i} className={`p-2 rounded border text-sm ${opt === q.correctAnswer ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-white border-slate-200'} break-words`}>
                    <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                    <MathContent content={opt} />
                </div>
            ))}
        </div>
    </div>
);

export const ExamsPage = () => {
    const [mode, setMode] = useState<'CREATE' | 'TAKE'>('CREATE');
    
    // Teacher Mode Sub-state
    const [isCreating, setIsCreating] = useState(false);
    const [viewExam, setViewExam] = useState<Exam | null>(null);
    const [editingExamId, setEditingExamId] = useState<string | null>(null);

    // Data States
    const [exams, setExams] = useState<Exam[]>([]);
    
    // Creation States
    const [topic, setTopic] = useState('');
    const [grade, setGrade] = useState<Grade>(Grade.TEN);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<any>(null);

    // New AI Config States
    const [questionCount, setQuestionCount] = useState(5);
    const [difficulty, setDifficulty] = useState('Medium');

    // Save Exam States
    const [examTitle, setExamTitle] = useState('');
    const [duration, setDuration] = useState(45);

    // Student Taking Exam States
    const [activeExam, setActiveExam] = useState<Exam | null>(null);
    const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
    const [examResult, setExamResult] = useState<{score: number, total: number} | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef<any>(null);

    useEffect(() => {
        loadExams();
    }, []);

    useEffect(() => {
        if (activeExam && timeLeft > 0 && !examResult) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && activeExam && !examResult) {
             // Auto submit when time runs out
             handleSubmitExam();
        }
        return () => {
            if(timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeExam, timeLeft, examResult]);

    const loadExams = async () => {
        const data = await examService.getAll();
        setExams(data);
    };

    const handleGenerate = async () => {
        if (!topic) {
            setToast({ msg: "Vui lòng nhập chủ đề", type: 'error' });
            return;
        }
        setLoading(true);
        try {
            const qs = await generateMathQuestions(grade, topic, questionCount, difficulty);
            setQuestions(qs);
            setExamTitle(`Đề thi ${topic} - ${difficulty}`); // Auto-suggest title
            setToast({ msg: "Đã tạo câu hỏi thành công!", type: 'success' });
        } catch (e) {
            setToast({ msg: "Lỗi khi tạo câu hỏi", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveExam = async () => {
        if (!examTitle || questions.length === 0) {
            setToast({ msg: "Vui lòng nhập tên đề thi và tạo câu hỏi trước khi lưu.", type: 'error' });
            return;
        }

        const newExam: Exam = {
            id: editingExamId || `exam_${Date.now()}`,
            title: examTitle,
            grade: grade,
            durationMinutes: duration,
            questions: questions,
            createdBy: 'Teacher',
            createdAt: new Date().toISOString()
        };

        try {
            if (editingExamId) {
                await examService.update(newExam);
                setToast({ msg: "Cập nhật đề thi thành công!", type: 'success' });
            } else {
                await examService.add(newExam);
                setToast({ msg: "Lưu đề thi thành công!", type: 'success' });
            }
            
            // Reset state
            setQuestions([]);
            setTopic('');
            setExamTitle('');
            setEditingExamId(null);
            // Reload list and switch view
            await loadExams();
            setIsCreating(false);
        } catch (error) {
            setToast({ msg: "Lỗi khi lưu đề thi", type: 'error' });
        }
    };

    const handleEditExam = (exam: Exam) => {
        setEditingExamId(exam.id);
        setExamTitle(exam.title);
        setGrade(exam.grade);
        setDuration(exam.durationMinutes);
        setQuestions(exam.questions);
        setTopic(''); // Reset topic as we are editing existing
        setIsCreating(true);
    };

    const handleDeleteExam = async (id: string) => {
        if(window.confirm("Bạn có chắc chắn muốn xóa đề thi này không?")) {
            await examService.delete(id);
            setToast({ msg: "Đã xóa đề thi", type: 'success' });
            loadExams();
        }
    };

    // Student Actions
    const handleStartExam = (exam: Exam) => {
        setActiveExam(exam);
        setStudentAnswers({});
        setExamResult(null);
        setTimeLeft(exam.durationMinutes * 60);
    };

    const handleAnswerSelect = (questionId: string, answer: string) => {
        setStudentAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleSubmitExam = () => {
        if(!activeExam) return;
        
        let correctCount = 0;
        activeExam.questions.forEach(q => {
            if (studentAnswers[q.id] === q.correctAnswer) {
                correctCount++;
            }
        });

        setExamResult({
            score: correctCount,
            total: activeExam.questions.length
        });

        if(timerRef.current) clearInterval(timerRef.current);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Render Student Exam Taking View
    if (activeExam) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                 {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
                
                {/* Header */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 sticky top-4 z-20 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{activeExam.title}</h2>
                        <span className="text-sm text-slate-500">Lớp {activeExam.grade} • {activeExam.questions.length} Câu hỏi</span>
                    </div>
                    <div className={`text-2xl font-mono font-bold px-4 py-2 rounded-lg ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
                        {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Questions List */}
                <div className="space-y-6 pb-24">
                    {activeExam.questions.map((q, index) => {
                        const isCorrect = examResult && studentAnswers[q.id] === q.correctAnswer;
                        const isWrong = examResult && studentAnswers[q.id] !== q.correctAnswer && studentAnswers[q.id];
                        
                        return (
                            <Card key={q.id} className={`transition-colors ${isCorrect ? 'border-green-400 bg-green-50' : isWrong ? 'border-red-400 bg-red-50' : ''}`}>
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm">
                                        {index + 1}
                                    </span>
                                    <div className="flex-1">
                                        <div className="text-lg font-medium text-slate-800 mb-4">
                                            <MathContent content={q.content} />
                                        </div>
                                        <div className="space-y-2">
                                            {q.options?.map((opt, i) => {
                                                const isSelected = studentAnswers[q.id] === opt;
                                                // If result shown, highlight correct answer even if not selected
                                                const isThisCorrect = examResult && opt === q.correctAnswer;
                                                
                                                let optionClass = "border-slate-200 hover:bg-slate-50";
                                                if (examResult) {
                                                    if (isThisCorrect) optionClass = "border-green-500 bg-green-100 text-green-800 font-bold";
                                                    else if (isSelected && !isThisCorrect) optionClass = "border-red-500 bg-red-100 text-red-800";
                                                    else optionClass = "border-slate-200 opacity-60";
                                                } else {
                                                    if (isSelected) optionClass = "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500";
                                                }

                                                return (
                                                    <div 
                                                        key={i}
                                                        onClick={() => !examResult && handleAnswerSelect(q.id, opt)}
                                                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${optionClass}`}
                                                    >
                                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-indigo-600' : 'border-slate-300'}`}>
                                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                                                        </div>
                                                        <MathContent content={opt} />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>

                {/* Footer / Result Modal */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-30 md:pl-64">
                    <div className="max-w-4xl mx-auto flex justify-between items-center">
                        <Button variant="secondary" onClick={() => setActiveExam(null)}>
                            {examResult ? 'Thoát' : 'Hủy bài thi'}
                        </Button>
                        
                        {!examResult ? (
                            <div className="flex gap-4 items-center">
                                <span className="text-sm text-slate-500 hidden sm:inline">Đã làm: <span className="font-bold text-slate-900">{Object.keys(studentAnswers).length}/{activeExam.questions.length}</span></span>
                                <Button onClick={handleSubmitExam}>Nộp bài</Button>
                            </div>
                        ) : (
                            <div className="flex gap-4 items-center animate-bounce-in">
                                <div className="text-right">
                                    <span className="block text-xs text-slate-500">Kết quả</span>
                                    <span className="font-bold text-xl text-indigo-600">{examResult.score}/{examResult.total} câu đúng</span>
                                </div>
                                <Button onClick={() => setActiveExam(null)}>Hoàn thành</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Quản lý Đề thi</h2>
                <div className="bg-white p-1 rounded-lg border border-slate-200 flex w-full sm:w-auto">
                    <button onClick={() => setMode('CREATE')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'CREATE' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'}`}>Giáo viên</button>
                    <button onClick={() => setMode('TAKE')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'TAKE' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'}`}>Học sinh (Thi thử)</button>
                </div>
            </div>

            {mode === 'CREATE' ? (
                <>
                    {!isCreating ? (
                        <Card>
                             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                <h3 className="font-bold text-lg text-slate-800">Danh sách đề thi đã tạo</h3>
                                <Button onClick={() => { setIsCreating(true); setEditingExamId(null); setQuestions([]); setExamTitle(''); setTopic(''); }} className="w-full sm:w-auto">+ Tạo đề thi mới</Button>
                             </div>
                             
                             {exams.length === 0 ? (
                                 <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                                     <span className="text-4xl mb-3 block">📭</span>
                                     <p>Chưa có đề thi nào trong hệ thống.</p>
                                     <p className="text-sm">Hãy nhấn "Tạo đề thi mới" để bắt đầu.</p>
                                 </div>
                             ) : (
                                 <div className="overflow-x-auto -mx-4 sm:mx-0">
                                     <div className="inline-block min-w-full align-middle">
                                         <table className="min-w-full text-left">
                                             <thead>
                                                 <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase">
                                                     <th className="py-3 px-4 whitespace-nowrap">Tên đề thi</th>
                                                     <th className="py-3 px-4 whitespace-nowrap">Lớp</th>
                                                     <th className="py-3 px-4 whitespace-nowrap">Số câu</th>
                                                     <th className="py-3 px-4 whitespace-nowrap">Thời gian</th>
                                                     <th className="py-3 px-4 whitespace-nowrap text-slate-500">Ngày tạo</th>
                                                     <th className="py-3 px-4 text-right whitespace-nowrap">Thao tác</th>
                                                 </tr>
                                             </thead>
                                             <tbody className="text-sm">
                                                 {exams.map(exam => (
                                                     <tr key={exam.id} className="border-b border-slate-50 hover:bg-slate-50">
                                                         <td className="py-3 px-4 font-medium text-indigo-600 whitespace-nowrap">{exam.title}</td>
                                                         <td className="py-3 px-4 whitespace-nowrap"><Badge color="indigo">Lớp {exam.grade}</Badge></td>
                                                         <td className="py-3 px-4 whitespace-nowrap">{exam.questions.length} câu</td>
                                                         <td className="py-3 px-4 whitespace-nowrap">{exam.durationMinutes} phút</td>
                                                         <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{new Date(exam.createdAt).toLocaleDateString()}</td>
                                                         <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                                                             <button 
                                                                onClick={() => setViewExam(exam)}
                                                                className="text-slate-500 hover:text-indigo-600 font-medium text-xs"
                                                             >
                                                                Xem
                                                             </button>
                                                             <button 
                                                                onClick={() => handleEditExam(exam)}
                                                                className="text-slate-500 hover:text-blue-600 font-medium text-xs"
                                                             >
                                                                Sửa
                                                             </button>
                                                             <button 
                                                                onClick={() => handleDeleteExam(exam.id)}
                                                                className="text-slate-500 hover:text-red-600 font-medium text-xs"
                                                             >
                                                                Xóa
                                                             </button>
                                                         </td>
                                                     </tr>
                                                 ))}
                                             </tbody>
                                         </table>
                                     </div>
                                 </div>
                             )}
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="space-y-6 order-2 lg:order-1">
                                <Card>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-semibold text-indigo-600 flex items-center gap-2">
                                            <span>✨</span> AI Tạo câu hỏi
                                        </h3>
                                        <button onClick={() => setIsCreating(false)} className="text-xs text-slate-400 hover:text-slate-600 underline">Quay lại</button>
                                    </div>
                                    <Input label="Chủ đề (ví dụ: Lượng giác, Hàm số)" value={topic} onChange={(e: any) => setTopic(e.target.value)} placeholder="Nhập chủ đề toán học..." />
                                    
                                    <Select 
                                        label="Trình độ"
                                        value={grade}
                                        onChange={(e: any) => setGrade(e.target.value)}
                                        options={Object.values(Grade).map(g => ({ label: `Lớp ${g}`, value: g }))}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Select 
                                            label="Độ khó"
                                            value={difficulty}
                                            onChange={(e: any) => setDifficulty(e.target.value)}
                                            options={[
                                                { label: 'Dễ', value: 'Easy' },
                                                { label: 'Trung bình', value: 'Medium' },
                                                { label: 'Khó', value: 'Hard' }
                                            ]}
                                        />
                                        <Input 
                                            label="Số câu" 
                                            type="number" 
                                            min="1" 
                                            max="20" 
                                            value={questionCount} 
                                            onChange={(e: any) => setQuestionCount(Number(e.target.value))} 
                                        />
                                    </div>

                                    <Button onClick={handleGenerate} className="w-full" disabled={loading}>
                                        {loading ? 'Đang tạo câu hỏi với Gemini...' : 'Tạo câu hỏi ngay'}
                                    </Button>
                                </Card>
                                
                                <Card>
                                    <h3 className="font-semibold mb-4">Soạn thủ công (Hỗ trợ LaTeX)</h3>
                                    <p className="text-xs text-slate-500 mb-3">{'Nhập mã LaTeX (ví dụ $x^2$) để hiển thị công thức toán học.'}</p>
                                    <textarea className="w-full border rounded-lg p-3 text-sm h-32 mb-2 font-mono" placeholder="Nhập nội dung câu hỏi..." />
                                    <Button variant="secondary" className="w-full">Thêm câu hỏi</Button>
                                </Card>
                            </div>

                            <div className="lg:col-span-2 space-y-4 order-1 lg:order-2">
                                {questions.length === 0 ? (
                                    <div className="h-full min-h-[300px] lg:min-h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                                        <span className="text-4xl mb-2">📝</span>
                                        <p>Khu vực xem trước đề thi.</p>
                                        <p className="text-xs">Tạo câu hỏi để xem nội dung tại đây.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4 sticky top-0 z-10">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                                                <h3 className="font-bold text-lg text-slate-800">{editingExamId ? 'Chỉnh sửa Đề Thi' : 'Lưu Đề Thi Mới'}</h3>
                                                <Button variant="ghost" onClick={() => {setQuestions([]); setIsCreating(false); setEditingExamId(null);}} className="text-red-500 hover:bg-red-50 w-full sm:w-auto">Hủy</Button>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                <Input 
                                                    label="Tên đề thi" 
                                                    placeholder="VD: Kiểm tra 15 phút..." 
                                                    value={examTitle}
                                                    onChange={(e: any) => setExamTitle(e.target.value)}
                                                />
                                                <Input 
                                                    label="Thời gian (phút)" 
                                                    type="number"
                                                    value={duration}
                                                    onChange={(e: any) => setDuration(Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="flex justify-end">
                                                <Button variant="primary" onClick={handleSaveExam} className="w-full sm:w-auto">
                                                    {editingExamId ? '💾 Cập nhật đề thi' : '💾 Lưu vào kho đề thi'}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {questions.map((q, i) => <QuestionCard key={q.id} q={q} index={i} />)}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.length > 0 ? exams.map(exam => (
                         <Card key={exam.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-xl font-bold">
                                    ?
                                </div>
                                <Badge color="indigo">Lớp {exam.grade}</Badge>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2 break-words">{exam.title}</h3>
                            <div className="text-sm text-slate-500 space-y-2 mb-6 flex-1">
                                <p>⏱️ Thời gian: {exam.durationMinutes} phút</p>
                                <p>📝 Số lượng: {exam.questions.length} câu hỏi</p>
                                <p>📅 Ngày tạo: {new Date(exam.createdAt).toLocaleDateString()}</p>
                            </div>
                            <Button className="w-full justify-center" onClick={() => handleStartExam(exam)}>Bắt đầu làm bài</Button>
                        </Card>
                    )) : (
                         <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                            <span className="text-4xl mb-2 block">😴</span>
                            <p>Hiện chưa có đề thi nào để làm.</p>
                        </div>
                    )}
                </div>
            )}

            {/* View Exam Modal (Teacher Mode) */}
            <Modal isOpen={!!viewExam} onClose={() => setViewExam(null)} title={viewExam?.title || 'Chi tiết đề thi'} maxWidth="sm:max-w-4xl">
                {viewExam && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div>
                                <span className="block text-slate-500 text-xs">Lớp</span>
                                <span className="font-semibold text-slate-800">Lớp {viewExam.grade}</span>
                            </div>
                            <div>
                                <span className="block text-slate-500 text-xs">Thời gian</span>
                                <span className="font-semibold text-slate-800">{viewExam.durationMinutes} phút</span>
                            </div>
                            <div>
                                <span className="block text-slate-500 text-xs">Số câu hỏi</span>
                                <span className="font-semibold text-slate-800">{viewExam.questions.length} câu</span>
                            </div>
                             <div>
                                <span className="block text-slate-500 text-xs">Ngày tạo</span>
                                <span className="font-semibold text-slate-800">{new Date(viewExam.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        
                        <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
                            {viewExam.questions.map((q, i) => (
                                <QuestionCard key={q.id} q={q} index={i} />
                            ))}
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-100">
                            <Button variant="secondary" onClick={() => setViewExam(null)}>Đóng</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};