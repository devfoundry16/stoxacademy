import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Helper to get auth token from localStorage
const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
            return token;
        }
    }
    return null;
};

// Helper to create headers with auth token
const getAuthHeaders = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// ==================== Dashboard Stats ====================

export const getDashboardStats = async () => {
    const response = await axios.get(`${API_URL}/api/admin/stats`, {
        headers: getAuthHeaders(),
    });
    return response.data;
};

export const getRecentActivity = async (limit = 10) => {
    const response = await axios.get(`${API_URL}/api/admin/recent-activity`, {
        headers: getAuthHeaders(),
        params: { limit },
    });
    return response.data;
};

// ==================== User Management ====================

export const getAllUsers = async (params = {}) => {
    const response = await axios.get(`${API_URL}/api/admin/users`, {
        headers: getAuthHeaders(),
        params,
    });
    return response.data;
};

export const getUserById = async (id) => {
    const response = await axios.get(`${API_URL}/api/admin/users/${id}`, {
        headers: getAuthHeaders(),
    });
    return response.data;
};

export const updateUserRole = async (id, role) => {
    const response = await axios.put(
        `${API_URL}/api/admin/users/${id}/role`,
        { role },
        { headers: getAuthHeaders() }
    );
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await axios.delete(`${API_URL}/api/admin/users/${id}`, {
        headers: getAuthHeaders(),
    });
    return response.data;
};

// ==================== Course Management ====================

export const createCourse = async (courseData) => {
    const response = await axios.post(`${API_URL}/api/admin/courses`, courseData, {
        headers: getAuthHeaders(),
    });
    return response.data;
};

export const updateCourse = async (id, courseData) => {
    const response = await axios.put(`${API_URL}/api/admin/courses/${id}`, courseData, {
        headers: getAuthHeaders(),
    });
    return response.data;
};

export const deleteCourse = async (id) => {
    const response = await axios.delete(`${API_URL}/api/admin/courses/${id}`, {
        headers: getAuthHeaders(),
    });
    return response.data;
};

// ==================== Live Session Management ====================

export const getLiveSessions = async (params = {}) => {
    const response = await axios.get(`${API_URL}/api/admin/live-sessions`, {
        headers: getAuthHeaders(),
        params,
    });
    return response.data;
};

export const createLiveSession = async (sessionData) => {
    const response = await axios.post(`${API_URL}/api/admin/live-sessions`, sessionData, {
        headers: getAuthHeaders(),
    });
    return response.data;
};

export const updateLiveSession = async (id, sessionData) => {
    const response = await axios.put(`${API_URL}/api/admin/live-sessions/${id}`, sessionData, {
        headers: getAuthHeaders(),
    });
    return response.data;
};

export const deleteLiveSession = async (id) => {
    const response = await axios.delete(`${API_URL}/api/admin/live-sessions/${id}`, {
        headers: getAuthHeaders(),
    });
    return response.data;
};

// ==================== Checklist Submissions Management ====================

export const getChecklistSubmissions = async (params = {}) => {
    const response = await axios.get(`${API_URL}/api/admin/checklist-submissions`, {
        headers: getAuthHeaders(),
        params,
    });
    return response.data;
};

export const getChecklistSubmissionById = async (id) => {
    const response = await axios.get(`${API_URL}/api/admin/checklist-submissions/${id}`, {
        headers: getAuthHeaders(),
    });
    return response.data;
};

export const exportChecklistSubmissionsToExcel = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.stage) params.append('stage', filters.stage);

    const response = await axios.get(`${API_URL}/api/admin/checklist-submissions/export/excel?${params.toString()}`, {
        headers: getAuthHeaders(),
        responseType: 'blob', // Important for file download
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'checklist_submissions.xlsx';
    if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
            filename = filenameMatch[1];
        }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return response.data;
};
