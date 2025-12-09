import React, { useState, useEffect, useRef } from 'react';
import { generateMathQuestions } from '../services/geminiService';
import { examService } from '../services/mockService';
import { Grade, Question, Exam } from '../types';
import { Button, Card, Input, Select, Badge, Toast, Modal, MathContent } from '../components/ui';

const QuestionCard: React.FC<{ q: Question, index: number }> = ({ q, index }) => (
    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
        <div className="flex justify-between mb-2">
            <span className="font-bold">Câu {index + 1}</span>
            <Badge>{q.type}</Badge>
        </div>
        <div className="mb-3 font-medium"><MathContent content={q.content} /></div>
        <div className="grid grid-cols-2 gap-2">
            {q.options?.map((opt, i) => (
                <div key={i} className="p-2 border rounded bg-white">
                    <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                    <MathContent content={opt} />
                </div>
            ))}
        </div>
    </div>
);

export const ExamsPage = () => {
    const [mode, setMode] = useState<'CREATE' | 'TAKE'>('CREATE');
    const [exams, setExams] = useState<Exam[]>([]);
    
    const [topic, setTopic] = useState('');
    const [grade, setGrade] = useState<Grade>(Grade.TEN);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<any>(null);

    const [questionCount, setQuestionCount] = useState(5);
    const [difficulty, setDifficulty] = useState('Medium');
    const [examTitle, setExamTitle] = useState('');
    const [duration, setDuration] = useState(45);

    useEffect(() => {
        loadExams();
    }, []);

    const loadExams = async () => {
        const data = await examService.getAll();
        setExams(data);
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const qs = await generateMathQuestions(grade, topic, questionCount, difficulty);
            setQuestions(qs);
            setExamTitle(`Đề thi ${topic}`);
            setToast({ msg: "Đã tạo câu hỏi thành công!", type: 'success' });
        } catch (e) {
            setToast({ msg: "Lỗi khi tạo câu hỏi", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveExam = async () => {
        const newExam: Exam = {
            id: `exam_${Date.now()}`,
            title: examTitle,
            grade: grade,
            durationMinutes: duration,
            questions: questions,
            createdBy: 'Teacher',
            createdAt: new Date().toISOString()
        };
        await examService.add(newExam);
        setToast({ msg: "Lưu đề thi thành công!", type: 'success' });
        setQuestions([]);
        loadExams();
    };

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Quản lý Đề thi</h2>
                <div className="flex gap-2">
                    <Button onClick={() => setMode('CREATE')} variant={mode === 'CREATE' ? 'primary' : 'secondary'}>Giáo viên</Button>
                    <Button onClick={() => setMode('TAKE')} variant={mode === 'TAKE' ? 'primary' : 'secondary'}>Học sinh</Button>
                </div>
            </div>

            {mode === 'CREATE' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-6">
                        <Card>
                            <h3 className="font-bold mb-4">AI Tạo câu hỏi</h3>
                            <Input label="Chủ đề" value={topic} onChange={(e: any) => setTopic(e.target.value)} />
                            <Select label="Trình độ" value={grade} onChange={(e: any) => setGrade(e.target.value)} options={Object.values(Grade).map(g => ({ label: `Lớp ${g}`, value: g }))} />
                            <div className="grid grid-cols-2 gap-4">
                                <Select label="Độ khó" value={difficulty} onChange={(e: any) => setDifficulty(e.target.value)} options={[{label:'Dễ',value:'Easy'},{label:'TB',value:'Medium'},{label:'Khó',value:'Hard'}]} />
                                <Input label="Số câu" type="number" value={questionCount} onChange={(e: any) => setQuestionCount(Number(e.target.value))} />
                            </div>
                            <Button onClick={handleGenerate} className="w-full" disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo câu hỏi'}</Button>
                        </Card>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        {questions.length > 0 && (
                            <div className="bg-white p-4 rounded-xl border border-slate-100 mb-4 sticky top-0 z-10">
                                <Input label="Tên đề thi" value={examTitle} onChange={(e: any) => setExamTitle(e.target.value)} />
                                <Input label="Thời gian (phút)" type="number" value={duration} onChange={(e: any) => setDuration(Number(e.target.value))} />
                                <Button onClick={handleSaveExam} className="w-full mt-2">Lưu đề thi</Button>
                            </div>
                        )}
                        {questions.map((q, i) => <QuestionCard key={q.id} q={q} index={i} />)}
                    </div>
                </div>
            )}

            {mode === 'TAKE' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.map(exam => (
                         <Card key={exam.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                            <Badge color="indigo">Lớp {exam.grade}</Badge>
                            <h3 className="text-lg font-bold mt-2">{exam.title}</h3>
                            <p className="text-sm text-slate-500 mb-4">{exam.questions.length} câu • {exam.durationMinutes} phút</p>
                            <Button className="w-full">Làm bài</Button>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};