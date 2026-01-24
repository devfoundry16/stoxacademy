'use client';

import { useEffect, useState } from 'react';
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
    const [sessions, setSessions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
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
        meeting_url: '',
        max_participants: '',
        price: 0,
    });

    useEffect(() => {
        fetchSessions();
        fetchCourses();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const data = await getLiveSessions();
            setSessions(data.sessions);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoading(false);
        }
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
            meeting_url: '',
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
            meeting_url: session.meeting_url || '',
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
                toast.success('Live session updated successfully!');
            } else {
                await createLiveSession(submitData);
                toast.success('Live session created successfully!');
            }
            setIsModalOpen(false);
            fetchSessions();
        } catch (error) {
            console.error('Failed to save session:', error);
            toast.error('Failed to save live session');
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
            toast.success('Live session deleted successfully!');
            fetchSessions();
            handleCloseDeleteModal();
        } catch (error) {
            console.error('Failed to delete session:', error);
            toast.error('Failed to delete session');
        }
    };

    const columns = [
        {
            header: 'Title',
            accessor: 'title',
        },
        {
            header: 'Course',
            accessor: 'course',
            render: (row) => row.courses?.title || 'N/A',
        },
        {
            header: 'Scheduled',
            accessor: 'scheduled_at',
            render: (row) => new Date(row.scheduled_at).toLocaleString('en-US', {
                timeZoneName: 'short',
            }),
        },
        {
            header: 'Duration',
            accessor: 'duration',
            render: (row) => `${row.duration} min`,
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    row.status === 'live' ? 'bg-green-100 text-green-800' :
                        row.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                    }`}>
                    {row.status}
                </span>
            ),
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
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Live Sessions</h1>
                    <p className="text-gray-600">Schedule and manage live course sessions</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-shadow"
                >
                    <Plus size={20} />
                    Schedule Session
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
                            <p className="text-sm text-gray-600">Scheduled</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {sessions.filter(s => s.status === 'scheduled').length}
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
                            <p className="text-sm text-gray-600">Live Now</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {sessions.filter(s => s.status === 'live').length}
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
                            <p className="text-sm text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {sessions.filter(s => s.status === 'completed').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={sessions}
                actions={actions}
            />

            {/* Session Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedSession ? 'Edit Live Session' : 'Schedule New Live Session'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Course *
                        </label>
                        <select
                            required
                            value={formData.course_id}
                            onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select a course</option>
                            {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Session Title *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter session title"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter session description"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Scheduled Date & Time * <span className="text-xs text-gray-500 font-normal">({Intl.DateTimeFormat().resolvedOptions().timeZone})</span>
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.scheduled_at}
                                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">Times are in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Duration (minutes) *
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
                                Meeting URL *
                            </label>
                            <input
                                type="url"
                                value={formData.meeting_url}
                                onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://zoom.us/..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Participants
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
                                Price *
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
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-linear-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-shadow"
                        >
                            {selectedSession ? 'Update Session' : 'Schedule Session'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                title="Delete Live Session"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Are you sure you want to delete{' '}
                        <span className="font-semibold">
                            &quot;{sessionToDelete?.title}&quot;
                        </span>
                        ? This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            onClick={handleCloseDeleteModal}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Delete Session
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
