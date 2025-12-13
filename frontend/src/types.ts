export enum Grade {
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  ELEVEN = '11',
  TWELVE = '12'
}

export enum StudentStatus {
  ACTIVE = 'Active',
  DROPPED = 'Dropped',
  GRADUATED = 'Graduated'
}

export interface Student {
  id: string;
  fullName: string;
  avatar: string;
  grade: Grade;
  startDate: string;
  endDate?: string; // Ngày kết thúc/nghỉ học
  status: StudentStatus;
  parentName?: string;
  phone?: string;
}

export enum PaymentMethod {
  CASH = 'Cash',
  TRANSFER = 'Transfer'
}

export enum PaymentStatus {
  PAID = 'Paid',
  UNPAID = 'Unpaid',
  PENDING = 'Pending',
  EXEMPT = 'Exempt' // Thêm trạng thái Miễn học phí
}

export interface TuitionRecord {
  id: string;
  studentId: string;
  month: string; // YYYY-MM
  amount: number;
  datePaid?: string;
  method?: PaymentMethod;
  status: PaymentStatus;
  note?: string; // Ghi chú (ví dụ: miễn giảm, nộp thiếu...)
}

export enum DocumentCategory {
  LEARNING_MATERIAL = 'Tài liệu học tập',
  SYLLABUS = 'Đề cương',
  EXAM = 'Đề thi',
  GIFTED_EXAM = 'Đề thi HSG',
  OTHER = 'Khác'
}

export interface DocumentFile {
  id: string;
  title: string;
  type: 'PDF' | 'DOCX' | 'XLSX' | 'IMG';
  category?: DocumentCategory | string; // Thêm trường phân loại
  uploadDate: string;
  url: string;
  size: string;
  grade?: string;
  content?: string; // Base64 data string for real storage simulation
}

export interface Course {
  id: string;
  title: string;
  description: string;
  grade: Grade;
  teacher: string;
  schedule: string;
  image: string;
}

export interface Question {
  id: string;
  content: string; // Can handle LaTeX string
  options?: string[]; // Multiple choice
  correctAnswer: string;
  type: 'MCQ' | 'ESSAY';
}

export interface Exam {
  id: string;
  title: string;
  grade: Grade;
  durationMinutes: number;
  questions: Question[];
  createdBy: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  name: string;
}