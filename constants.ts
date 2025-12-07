import { Grade, StudentStatus, Student, TuitionRecord, PaymentStatus, Course, DocumentFile, Exam } from './types';

export const MOCK_STUDENTS: Student[] = [
  { id: '1', fullName: 'Nguyen Van A', avatar: 'https://picsum.photos/id/101/200', grade: Grade.SIX, startDate: '2023-09-01', status: StudentStatus.ACTIVE, phone: '0901234567' },
  { id: '2', fullName: 'Tran Thi B', avatar: 'https://picsum.photos/id/202/200', grade: Grade.NINE, startDate: '2022-08-15', status: StudentStatus.ACTIVE, phone: '0912345678' },
  { id: '3', fullName: 'Le Van C', avatar: 'https://picsum.photos/id/303/200', grade: Grade.TWELVE, startDate: '2021-01-10', status: StudentStatus.DROPPED, phone: '0987654321' },
  { id: '4', fullName: 'Pham Minh D', avatar: 'https://picsum.photos/id/404/200', grade: Grade.TEN, startDate: '2023-05-20', status: StudentStatus.ACTIVE, phone: '0999888777' },
  { id: '5', fullName: 'Hoang Thu E', avatar: 'https://picsum.photos/id/505/200', grade: Grade.SEVEN, startDate: '2023-09-05', status: StudentStatus.ACTIVE, phone: '0955555555' },
];

export const MOCK_TUITION: TuitionRecord[] = [
  { id: 't1', studentId: '1', month: '2023-10', amount: 1500000, status: PaymentStatus.PAID, datePaid: '2023-10-05', method: 'Transfer' as any },
  { id: 't2', studentId: '2', month: '2023-10', amount: 2000000, status: PaymentStatus.UNPAID },
  { id: 't3', studentId: '1', month: '2023-09', amount: 1500000, status: PaymentStatus.PAID, datePaid: '2023-09-05', method: 'Cash' as any },
];

export const MOCK_COURSES: Course[] = [
  { id: 'c1', title: 'Basic Algebra Grade 6', description: 'Foundation of Algebra for beginners', grade: Grade.SIX, teacher: 'Mr. Tuan', schedule: 'Mon-Wed 18:00', image: 'https://picsum.photos/seed/math1/400/200' },
  { id: 'c2', title: 'Advanced Geometry Grade 9', description: 'Circle theorems and 3D geometry', grade: Grade.NINE, teacher: 'Ms. Lan', schedule: 'Tue-Thu 19:30', image: 'https://picsum.photos/seed/math2/400/200' },
  { id: 'c3', title: 'Calculus Prep Grade 12', description: 'Limits, Derivatives, and Integrals', grade: Grade.TWELVE, teacher: 'Dr. Minh', schedule: 'Sat-Sun 09:00', image: 'https://picsum.photos/seed/math3/400/200' },
];

export const MOCK_DOCS: DocumentFile[] = [
  { id: 'd1', title: 'Algebra Mid-term Review', type: 'PDF', uploadDate: '2023-10-15', url: '#', size: '2.4 MB' },
  { id: 'd2', title: 'Geometry Formulas Sheet', type: 'IMG', uploadDate: '2023-09-01', url: '#', size: '1.1 MB' },
];

export const APP_NAME = "MathX";
