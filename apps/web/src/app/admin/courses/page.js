'use client';

import { useEffect, useState } from 'react';
import { Edit, Trash2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { createCourse, updateCourse, deleteCourse } from '@/lib/api/adminApi';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { courseService } from '@/lib/courseService';

export default function CoursesPage() {
    const [courses, setcourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'General',
        level: 'Beginner',
        thumbnail: '',
        is_published: false,
        lessons: [],
    });

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await courseService.getAllCourses();
            setcourses(response.courses);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setSelectedCourse(null);
        setFormData({
            title: '',
            description: '',
            price: '',
            level: 'Beginner',
            thumbnail: '',
            is_published: false,
            duration: '',
            instructor: '',
            instructor_avatar: '',
            features: '', // Textarea string
            requirements: '', // Textarea string
            what_you_learn: '', // Textarea string
            lessons: [],
        });
        setIsModalOpen(true);
    };

    const handleEdit = async (course) => {
        setSelectedCourse(course);

        // Fetch lessons for this course
        let courseLessons = [];
        try {
            const response = await courseService.getCourseLessons(course.id);
            courseLessons = response.lessons || [];
        } catch (error) {
            console.error('Failed to fetch lessons:', error);
        }

        setFormData({
            title: course.title,
            description: course.description,
            price: course.price,
            level: course.level || 'Beginner',
            thumbnail: course.thumbnail || '',
            is_published: course.is_published || false,
            duration: course.duration || '',
            instructor: course.instructor || '',
            instructor_avatar: course.instructor_avatar || '',
            features: Array.isArray(course.features) ? course.features.join('\n') : '',
            requirements: Array.isArray(course.requirements) ? course.requirements.join('\n') : '',
            what_you_learn: Array.isArray(course.what_you_learn) ? course.what_you_learn.join('\n') : '',
            lessons: courseLessons,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Helper to split text area by newline and remove empty lines
            const toList = (str) => str.split('\n').map(item => item.trim()).filter(item => item !== '');

            const payload = {
                title: formData.title,
                description: formData.description,
                price: formData.price,
                level: formData.level, // Map level to difficulty for backend
                thumbnail: formData.thumbnail, // Map thumbnail to thumbnail_url for backend
                duration: formData.duration,
                instructor: formData.instructor,
                instructor_avatar: formData.instructor_avatar,
                features: toList(formData.features),
                requirements: toList(formData.requirements),
                what_you_learn: toList(formData.what_you_learn),
                is_published: formData.is_published,
                lessons: formData.lessons,
            };

            if (selectedCourse) {
                await updateCourse(selectedCourse.id, payload);
                toast.success('Course updated successfully!');
            } else {
                await createCourse(payload);
                toast.success('Course created successfully!');
            }
            setIsModalOpen(false);
            fetchCourses();
        } catch (error) {
            console.error('Failed to save course:', error);
            toast.error('Failed to save course');
        }
    };

    const handleDelete = (course) => {
        setCourseToDelete(course);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setCourseToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!courseToDelete) return;
        try {
            await deleteCourse(courseToDelete.id);
            toast.success('Course deleted successfully!');
            fetchCourses();
            handleCloseDeleteModal();
        } catch (error) {
            console.error('Failed to delete course:', error);
            toast.error('Failed to delete course');
        }
    };

    // Lesson management functions
    const addLesson = () => {
        setFormData({
            ...formData,
            lessons: [
                ...formData.lessons,
                {
                    title: '',
                    duration: '',
                    video_url: '',
                    is_preview: false,
                }
            ]
        });
    };

    const updateLesson = (index, field, value) => {
        const updatedLessons = [...formData.lessons];
        updatedLessons[index] = {
            ...updatedLessons[index],
            [field]: value
        };
        setFormData({ ...formData, lessons: updatedLessons });
    };

    const removeLesson = (index) => {
        const updatedLessons = formData.lessons.filter((_, i) => i !== index);
        setFormData({ ...formData, lessons: updatedLessons });
    };

    const columns = [
        {
            header: 'Title',
            accessor: 'title',
        },
        {
            header: 'Instructor',
            accessor: 'instructor',
        },
        {
            header: 'Level',
            accessor: 'level', // using level from DB schema
            render: (row) => (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${(row.level || row.level) === 'Beginner' || (row.level || row.level) === 'Beginner' ? 'bg-green-100 text-green-800' :
                    (row.level || row.level) === 'Intermediate' || (row.level || row.level) === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {row.level || row.level}
                </span>
            ),
        },
        {
            header: 'Price',
            accessor: 'price',
            render: (row) => `$${row.price}`,
        },
        {
            header: 'Lessons',
            accessor: 'lessons_count',
            render: (row) => row.lessons_count || 0,
        },
        {
            header: 'Status',
            accessor: 'is_published',
            render: (row) => (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {row.is_published ? 'Published' : 'Draft'}
                </span>
            ),
        },
    ];

    const actions = (row) => (
        <>
            <button
                onClick={() => handleEdit(row)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Course"
            >
                <Edit size={18} />
            </button>
            <button
                onClick={() => handleDelete(row)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Course"
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
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Course Management</h1>
                    <p className="text-gray-600">Create and manage all courses</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-shadow"
                >
                    <Plus size={20} />
                    Create Course
                </button>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={courses}
                actions={actions}
            />

            {/* Course Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedCourse ? 'Edit Course' : 'Create New Course'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Course Title *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter course title"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter course description"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Price ($) *
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Level
                            </label>
                            <select
                                value={formData.level}
                                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Duration *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. 2h 30m"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Thumbnail URL
                        </label>
                        <input
                            type="url"
                            value={formData.thumbnail}
                            onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Instructor Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.instructor}
                                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Instructor Avatar URL
                            </label>
                            <input
                                type="url"
                                value={formData.instructor_avatar}
                                onChange={(e) => setFormData({ ...formData, instructor_avatar: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    {/* Lessons Section */}
                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Course Lessons ({formData.lessons.length})
                            </label>
                            <button
                                type="button"
                                onClick={addLesson}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                <Plus size={16} />
                                Add Lesson
                            </button>
                        </div>

                        {formData.lessons.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                <p className="text-gray-500 text-sm">No lessons added yet. Click &quot;Add Lesson&quot; to get started.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {formData.lessons.map((lesson, index) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-medium text-gray-900">Lesson {index + 1}</h4>
                                            <button
                                                type="button"
                                                onClick={() => removeLesson(index)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Remove lesson"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Lesson Title *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={lesson.title}
                                                    onChange={(e) => updateLesson(index, 'title', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Introduction to the course"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        Duration *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={lesson.duration || ''}
                                                        onChange={(e) => updateLesson(index, 'duration', e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="10:30"
                                                        required
                                                    />
                                                </div>

                                                <div className="flex items-end">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={lesson.is_preview}
                                                            onChange={(e) => updateLesson(index, 'is_preview', e.target.checked)}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                        />
                                                        <span className="text-xs font-medium text-gray-600">Preview Lesson</span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Video URL *
                                                </label>
                                                <input
                                                    type="url"
                                                    value={lesson.video_url || ''}
                                                    onChange={(e) => updateLesson(index, 'video_url', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="https://..."
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Lists Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            What You Will Learn (One per line)
                        </label>
                        <textarea
                            value={formData.what_you_learn}
                            onChange={(e) => setFormData({ ...formData, what_you_learn: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="- Fundamental concepts...&#10;- Advanced techniques..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Course Features (One per line)
                            </label>
                            <textarea
                                value={formData.features}
                                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="- Certificate of completion&#10;- 24/7 Support"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Requirements (One per line)
                            </label>
                            <textarea
                                value={formData.requirements}
                                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="- Basic computer skills&#10;- Internet connection"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_published"
                            checked={formData.is_published}
                            onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
                            Publish course immediately
                        </label>
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
                            {selectedCourse ? 'Update Course' : 'Create Course'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                title="Delete Course"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Are you sure you want to delete{' '}
                        <span className="font-semibold">
                            &quot;{courseToDelete?.title}&quot;
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
                            Delete Course
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );

}
