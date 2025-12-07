import { MOCK_STUDENTS, MOCK_TUITION, MOCK_COURSES, MOCK_DOCS } from '../constants';
import { Student, TuitionRecord, Course, DocumentFile, Exam } from '../types';

// Helper to initialize storage
const initStorage = (key: string, data: any[]) => {
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

export const initializeData = () => {
  initStorage('mathx_students', MOCK_STUDENTS);
  initStorage('mathx_tuition', MOCK_TUITION);
  initStorage('mathx_courses', MOCK_COURSES);
  initStorage('mathx_docs', MOCK_DOCS);
  initStorage('mathx_exams', []);
};

// Generic delay to simulate network
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const studentService = {
  getAll: async (): Promise<Student[]> => {
    await delay(300);
    return JSON.parse(localStorage.getItem('mathx_students') || '[]');
  },
  add: async (student: Student) => {
    await delay(300);
    const list = JSON.parse(localStorage.getItem('mathx_students') || '[]');
    list.push(student);
    localStorage.setItem('mathx_students', JSON.stringify(list));
    return student;
  },
  update: async (student: Student) => {
    await delay(300);
    const list = JSON.parse(localStorage.getItem('mathx_students') || '[]');
    const index = list.findIndex((s: Student) => s.id === student.id);
    if (index !== -1) {
      list[index] = student;
      localStorage.setItem('mathx_students', JSON.stringify(list));
    }
    return student;
  },
  delete: async (id: string) => {
    await delay(300);
    let list = JSON.parse(localStorage.getItem('mathx_students') || '[]');
    list = list.filter((s: Student) => s.id !== id);
    localStorage.setItem('mathx_students', JSON.stringify(list));
  },
  import: async (students: Student[]) => {
    await delay(500);
    const list = JSON.parse(localStorage.getItem('mathx_students') || '[]');
    const newList = [...list, ...students];
    localStorage.setItem('mathx_students', JSON.stringify(newList));
    return newList;
  }
};

export const tuitionService = {
  getAll: async (): Promise<TuitionRecord[]> => {
    await delay(300);
    return JSON.parse(localStorage.getItem('mathx_tuition') || '[]');
  },
  update: async (record: TuitionRecord) => {
    await delay(200);
    const list = JSON.parse(localStorage.getItem('mathx_tuition') || '[]');
    const index = list.findIndex((r: TuitionRecord) => r.id === record.id);
    if (index !== -1) {
      list[index] = record;
      localStorage.setItem('mathx_tuition', JSON.stringify(list));
    }
  }
};

export const examService = {
    getAll: async (): Promise<Exam[]> => {
        await delay(300);
        return JSON.parse(localStorage.getItem('mathx_exams') || '[]');
    },
    add: async (exam: Exam) => {
        await delay(500);
        const list = JSON.parse(localStorage.getItem('mathx_exams') || '[]');
        list.push(exam);
        localStorage.setItem('mathx_exams', JSON.stringify(list));
        return exam;
    },
    update: async (exam: Exam) => {
        await delay(300);
        const list = JSON.parse(localStorage.getItem('mathx_exams') || '[]');
        const index = list.findIndex((e: Exam) => e.id === exam.id);
        if (index !== -1) {
            list[index] = exam;
            localStorage.setItem('mathx_exams', JSON.stringify(list));
        }
        return exam;
    },
    delete: async (id: string) => {
        await delay(300);
        let list = JSON.parse(localStorage.getItem('mathx_exams') || '[]');
        list = list.filter((e: Exam) => e.id !== id);
        localStorage.setItem('mathx_exams', JSON.stringify(list));
    }
}