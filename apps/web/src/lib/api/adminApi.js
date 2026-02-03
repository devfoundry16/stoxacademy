import apiClient from '../api';

// ==================== Dashboard Stats ====================

export const getDashboardStats = async () => {
    const response = await apiClient.get(`/api/admin/stats`);
    return response.data;
};

export const getRecentActivity = async (limit = 10) => {
    const response = await apiClient.get(`/api/admin/recent-activity`, {
        params: { limit },
    });
    return response.data;
};

// ==================== User Management ====================

export const getAllUsers = async (params = {}) => {
    const response = await apiClient.get(`/api/admin/users`, {
        params,
    });
    return response.data;
};

export const getUserById = async (id) => {
    const response = await apiClient.get(`/api/admin/users/${id}`);
    return response.data;
};

export const updateUserRole = async (id, role) => {
    const response = await apiClient.put(
        `/api/admin/users/${id}/role`,
        { role },
    );
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await apiClient.delete(`/api/admin/users/${id}`);
    return response.data;
};

// ==================== Course Management ====================

export const createCourse = async (courseData) => {
    const response = await apiClient.post(`/api/admin/courses`, courseData);
    return response.data;
};

export const updateCourse = async (id, courseData) => {
    const response = await apiClient.put(`/api/admin/courses/${id}`, courseData);
    return response.data;
};

export const deleteCourse = async (id) => {
    const response = await apiClient.delete(`/api/admin/courses/${id}`);
    return response.data;
};

// ==================== Live Session Management ====================

export const getLiveSessions = async (params = {}) => {
    const response = await apiClient.get(`/api/admin/live-sessions`, { params });
    return response.data;
};

export const createLiveSession = async (sessionData) => {
    const response = await apiClient.post(`/api/admin/live-sessions`, sessionData);
    return response.data;
};

export const updateLiveSession = async (id, sessionData) => {
    const response = await apiClient.put(`/api/admin/live-sessions/${id}`, sessionData);
    return response.data;
};

export const deleteLiveSession = async (id) => {
    const response = await apiClient.delete(`/api/admin/live-sessions/${id}`);
    return response.data;
};

// ==================== Checklist Submissions Management ====================

export const getChecklistSubmissions = async (params = {}) => {
    const response = await apiClient.get(`/api/admin/checklist-submissions`, { params });
    return response.data;
};

export const getChecklistSubmissionById = async (id) => {
    const response = await apiClient.get(`/api/admin/checklist-submissions/${id}`);
    return response.data;
};

export const exportChecklistSubmissionsToExcel = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.stage) params.append('stage', filters.stage);

    const response = await apiClient.get(`/api/admin/checklist-submissions/export/excel?${params.toString()}`, { responseType: 'blob' });

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

// ==================== Coupon Management ====================

export const getAllCoupons = async (params = {}) => {
    const response = await apiClient.get(`/api/coupons`, { params });
    return response.data;
};

export const getCouponById = async (id) => {
    const response = await apiClient.get(`/api/coupons/${id}`);
    return response.data;
};

export const createCoupon = async (couponData) => {
    const response = await apiClient.post(`/api/coupons`, couponData);
    return response.data;
};

export const updateCoupon = async (id, couponData) => {
    const response = await apiClient.put(`/api/coupons/${id}`, couponData);
    return response.data;
};

export const deleteCoupon = async (id) => {
    const response = await apiClient.delete(`/api/coupons/${id}`);
    return response.data;
};

export const toggleCouponStatus = async (id) => {
    const response = await apiClient.patch(`/api/coupons/${id}/toggle`);
    return response.data;
};

