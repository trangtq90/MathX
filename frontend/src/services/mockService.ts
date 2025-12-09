import { Student, TuitionRecord, Course, DocumentFile, Exam } from '../types';
import { MOCK_COURSES } from '../constants';

// Cập nhật port thành 5001 theo backend
const API_URL = 'http://localhost:5001/api';

// Helper for API calls with Error Handling
const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
    try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        const config: RequestInit = { method, headers };
        
        if (body) {
            config.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${API_URL}${endpoint}`, config);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API Error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error calling ${endpoint}:`, error);
        throw error;
    }
};

// Helper để chuẩn hóa ID (MongoDB dùng _id, Frontend dùng id)
const mapId = (item: any) => {
    if (!item) return item;
    if (Array.isArray(item)) return item.map(mapId);
    if (item._id) {
        item.id = item._id;
        delete item._id;
    }
    return item;
}

export const initializeData = () => {
  console.log("App initialized. Connecting to Backend at", API_URL);
};

export const studentService = {
  getAll: async (): Promise<Student[]> => {
    try {
        const data = await apiCall('/students');
        return mapId(data);
    } catch (e) {
        console.warn("Backend not available, returning empty list.");
        return [];
    }
  },
  add: async (student: Student) => {
    const { id, ...rest } = student;
    return await apiCall('/students', 'POST', rest);
  },
  update: async (student: Student) => {
    const { id, ...rest } = student;
    return await apiCall(`/students/${id}`, 'PUT', rest);
  },
  delete: async (id: string) => {
    return await apiCall(`/students/${id}`, 'DELETE');
  }
};

export const tuitionService = {
  getAll: async (): Promise<TuitionRecord[]> => {
    try {
        const data = await apiCall('/tuition');
        return mapId(data);
    } catch (e) {
        return [];
    }
  },
  update: async (record: TuitionRecord) => {
     const { id, ...rest } = record;
     return await apiCall('/tuition', 'POST', record);
  }
};

export const examService = {
    getAll: async (): Promise<Exam[]> => {
        try {
             const data = await apiCall('/exams');
             return mapId(data);
        } catch (e) {
            return [];
        }
    },
    add: async (exam: Exam) => {
        const { id, ...rest } = exam;
        return await apiCall('/exams', 'POST', rest);
    },
    update: async (exam: Exam) => {
        return await apiCall(`/exams/${exam.id}`, 'PUT', exam);
    },
    delete: async (id: string) => {
        return await apiCall(`/exams/${id}`, 'DELETE');
    }
};

export const documentService = {
    getAll: async (): Promise<DocumentFile[]> => {
        try {
            const data = await apiCall('/documents');
            return mapId(data);
        } catch (e) {
            return [];
        }
    },
    add: async (doc: DocumentFile) => {
        const { id, ...rest } = doc;
        return await apiCall('/documents', 'POST', rest);
    },
    update: async (doc: DocumentFile) => {
        return await apiCall(`/documents/${doc.id}`, 'PUT', doc);
    },
    delete: async (id: string) => {
        return await apiCall(`/documents/${id}`, 'DELETE');
    }
};

export const courseService = {
    getAll: async () => MOCK_COURSES
}