import { Student, TuitionRecord, Course, DocumentFile, Exam } from '../types';
import { MOCK_COURSES, MOCK_STUDENTS, MOCK_TUITION, MOCK_DOCS } from '../constants';

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
        console.warn("Backend not available, returning mock data.");
        return MOCK_STUDENTS;
    }
  },
  add: async (student: Student) => {
    const { id, ...rest } = student;
    try {
        return await apiCall('/students', 'POST', rest);
    } catch (e) {
        console.warn("Backend not available, using mock implementation");
        return student;
    }
  },
  update: async (student: Student) => {
    const { id, ...rest } = student;
    try {
        return await apiCall(`/students/${id}`, 'PUT', rest);
    } catch (e) {
        return student;
    }
  },
  delete: async (id: string) => {
    try {
        return await apiCall(`/students/${id}`, 'DELETE');
    } catch (e) {
        return { success: true };
    }
  }
};

export const tuitionService = {
  getAll: async (): Promise<TuitionRecord[]> => {
    try {
        const data = await apiCall('/tuition');
        return mapId(data);
    } catch (e) {
        return MOCK_TUITION;
    }
  },
  update: async (record: TuitionRecord) => {
     const { id, ...rest } = record;
     try {
        return await apiCall('/tuition', 'POST', record);
     } catch (e) {
        return record;
     }
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
        try {
            return await apiCall('/exams', 'POST', rest);
        } catch (e) {
            return exam;
        }
    },
    update: async (exam: Exam) => {
        try {
            return await apiCall(`/exams/${exam.id}`, 'PUT', exam);
        } catch (e) {
            return exam;
        }
    },
    delete: async (id: string) => {
        try {
            return await apiCall(`/exams/${id}`, 'DELETE');
        } catch (e) {
            return { success: true };
        }
    }
};

export const documentService = {
    getAll: async (): Promise<DocumentFile[]> => {
        try {
            const data = await apiCall('/documents');
            return mapId(data);
        } catch (e) {
            return MOCK_DOCS;
        }
    },
    add: async (doc: DocumentFile) => {
        const { id, ...rest } = doc;
        try {
            return await apiCall('/documents', 'POST', rest);
        } catch (e) {
            return doc;
        }
    },
    update: async (doc: DocumentFile) => {
        try {
            return await apiCall(`/documents/${doc.id}`, 'PUT', doc);
        } catch (e) {
            return doc;
        }
    },
    delete: async (id: string) => {
        try {
            return await apiCall(`/documents/${id}`, 'DELETE');
        } catch (e) {
            return { success: true };
        }
    }
};

export const courseService = {
    getAll: async () => MOCK_COURSES
}