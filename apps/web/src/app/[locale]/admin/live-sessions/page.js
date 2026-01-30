'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Edit, Trash2, Plus, Calendar, Clock, Users as UsersIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {courseService} from '@/lib/courseService';
import {
    getLiveSessions,
    createLiveSession,
    updateLiveSession,
    deleteLiveSession,
} from '@/lib/api/adminApi';

export default function LiveSessionsPage() {
    const t = useTranslations('admin.liveSessions');
    const tStatus = useTranslations('liveSessions.status');
    const [sessions, setSessions] = useState([]);
    const [filteredSessions, setFilteredSessions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [formData, setFormData] = useState({
        course_id: '',
        title: '',
        description: '',
        scheduled_at: '',
        duration: 60,
        max_participants: '',
        price: 0,
    });

    useEffect(() => {
        fetchSessions();
        fetchCourses();
    }, []);

    // Update filtered sessions when sessions change
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredSessions(sessions);
        } else {
            const searchLower = searchTerm.toLowerCase();
            const filtered = sessions.filter(session => {
                const titleMatch = session.title?.toLowerCase().includes(searchLower);
                const courseMatch = session.courses?.title?.toLowerCase().includes(searchLower);
                const statusMatch = session.status?.toLowerCase().includes(searchLower);
                return titleMatch || courseMatch || statusMatch;
            });
            setFilteredSessions(filtered);
        }
    }, [sessions, searchTerm]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const data = await getLiveSessions();
            setSessions(data.sessions);
            setFilteredSessions(data.sessions);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter sessions based on search term
    const handleSearch = (value) => {
        setSearchTerm(value);
        if (!value.trim()) {
            setFilteredSessions(sessions);
            return;
        }
        
        const searchLower = value.toLowerCase();
        const filtered = sessions.filter(session => {
            const titleMatch = session.title?.toLowerCase().includes(searchLower);
            const courseMatch = session.courses?.title?.toLowerCase().includes(searchLower);
            const statusMatch = session.status?.toLowerCase().includes(searchLower);
            return titleMatch || courseMatch || statusMatch;
        });
        setFilteredSessions(filtered);
    };

    const fetchCourses = async () => {
        try {
            const response = await courseService.getAllCourses();
            setCourses(response.courses);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        }
    };

    // Convert UTC date string to local datetime-local format (YYYY-MM-DDTHH:mm)
    const toLocalDateTimeString = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const handleCreateNew = () => {
        setSelectedSession(null);
        setFormData({
            course_id: '',
            title: '',
            description: '',
            scheduled_at: '',
            duration: 60,
            max_participants: '',
            price: 0,
        });
        setIsModalOpen(true);
    };

    const handleEdit = (session) => {
        setSelectedSession(session);
        setFormData({
            course_id: session.course_id,
            title: session.title,
            description: session.description || '',
            scheduled_at: toLocalDateTimeString(session.scheduled_at),
            duration: session.duration,
            max_participants: session.max_participants || '',
            price: session.price || 0,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = {
                ...formData,
                scheduled_at: new Date(formData.scheduled_at).toISOString(),
                max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
            };

            if (selectedSession) {
                await updateLiveSession(selectedSession.id, submitData);
                toast.success(t('sessionUpdated'));
            } else {
                await createLiveSession(submitData);
                toast.success(t('sessionCreated'));
            }
            setIsModalOpen(false);
            await fetchSessions();
        } catch (error) {
            console.error('Failed to save session:', error);
            toast.error(t('failedToSaveSession'));
        }
    };

    const handleDelete = (session) => {
        setSessionToDelete(session);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSessionToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!sessionToDelete) return;
        try {
            await deleteLiveSession(sessionToDelete.id);
            toast.success(t('sessionDeleted'));
            fetchSessions();
            handleCloseDeleteModal();
        } catch (error) {
            console.error('Failed to delete session:', error);
            toast.error(t('failedToDeleteSession'));
        }
    };

    // Helper function to translate status values for display
    const translateStatus = (status) => {
        if (!status) return '';
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case 'scheduled':
                return tStatus('scheduled');
            case 'live':
                return tStatus('liveNow');
            case 'completed':
                return tStatus('completed');
            case 'cancelled':
                return tStatus('cancelled');
            default:
                return tStatus('unknown');
        }
    };

    const columns = [
        {
            header: t('titleColumn'),
            accessor: 'title',
        },
        {
            header: t('courseColumn'),
            accessor: 'course',
            render: (row) => row.courses?.title || t('notAvailable'),
        },
        {
            header: t('scheduledColumn'),
            accessor: 'scheduled_at',
            render: (row) => new Date(row.scheduled_at).toLocaleString('en-US', {
                timeZoneName: 'short',
            }),
        },
        {
            header: t('durationColumn'),
            accessor: 'duration',
            render: (row) => t('durationUnitMinutes', { minutes: row.duration }),
        },
        {
            header: t('statusColumn'),
            accessor: 'status', // Backend stores English values
            render: (row) => {
                const status = row.status || '';
                const statusLower = status.toLowerCase();
                const translatedStatus = translateStatus(status);
                return (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusLower === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        statusLower === 'live' ? 'bg-green-100 text-green-800' :
                        statusLower === 'completed' ? 'bg-gray-100 text-gray-800' :
                        statusLower === 'cancelled' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {translatedStatus}
                    </span>
                );
            },
        },
    ];

    const actions = (row) => (
        <>
            <button
                onClick={() => handleEdit(row)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Session"
            >
                <Edit size={18} />
            </button>
            <button
                onClick={() => handleDelete(row)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Session"
            >
                <Trash2 size={18} />
            </button>
        </>
    );

    if (loading) {
        return (
            <LoadingSpinner fullScreen />
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('title')}</h1>
                    <p className="text-gray-600">{t('pageDescription')}</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-shadow"
                >
                    <Plus size={20} />
                    {t('scheduleSession')}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Calendar className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">{t('scheduledCount')}</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {filteredSessions.filter(s => s.status === 'scheduled').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Clock className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">{t('liveNow')}</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {filteredSessions.filter(s => s.status === 'live').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <UsersIcon className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">{t('completedCount')}</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {filteredSessions.filter(s => s.status === 'completed').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={filteredSessions}
                onSearch={handleSearch}
                actions={actions}
            />

            {/* Session Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedSession ? t('editLiveSession') : t('scheduleNewLiveSession')}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('course')} *
                        </label>
                        <select
                            required
                            value={formData.course_id}
                            onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">{t('selectCourse')}</option>
                            {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('sessionTitle')} *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={t('sessionTitle')}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('description')}
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={t('description')}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('scheduledDate')} * <span className="text-xs text-gray-500 font-normal">({Intl.DateTimeFormat().resolvedOptions().timeZone})</span>
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.scheduled_at}
                                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">{t('timesInLocalTimezone', { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('duration')} *
                            </label>
                            <input
                                type="number"
                                required
                                min="15"
                                step="15"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="60"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('maxParticipants')}
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={formData.max_participants}
                                onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Unlimited"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('price')} *
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-linear-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-shadow"
                        >
                            {selectedSession ? t('updateSession') : t('scheduleSession')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                title={t('deleteLiveSession')}
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-700">
                        {t('deleteSessionConfirm', { title: sessionToDelete?.title })}
                    </p>
                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            onClick={handleCloseDeleteModal}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            {t('deleteSessionButton')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
