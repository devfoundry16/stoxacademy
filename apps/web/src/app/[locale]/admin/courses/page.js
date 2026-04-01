'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Edit, Trash2, Plus, X, FileText, Upload, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { createCourse, updateCourse, deleteCourse, uploadNotes, uploadThumbnail } from '@/lib/api/adminApi';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { courseService } from '@/lib/courseService';

export default function CoursesPage() {
    const t = useTranslations('admin.courses');
    const tCourses = useTranslations('courses.page');
    const [courses, setcourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState(null);
    // Track which lessons/sub-lessons are expanded in the form
    const [expandedLessons, setExpandedLessons] = useState(new Set());
    const [expandedSubLessons, setExpandedSubLessons] = useState({});
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
            setFilteredCourses(response.courses);
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
        setExpandedLessons(new Set());
        setExpandedSubLessons({});
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

        // Normalize lessons from nested API response (each lesson already has sub_lessons array)
        const normalizedLessons = courseLessons.map(lesson => ({
            ...lesson,
            sub_lessons: lesson.sub_lessons || [],
        }));

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
            lessons: normalizedLessons,
        });
        setExpandedLessons(new Set());
        setExpandedSubLessons({});
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
                toast.success(t('courseUpdated'));
            } else {
                await createCourse(payload);
                toast.success(t('courseCreated'));
            }
            setIsModalOpen(false);
            fetchCourses();
        } catch (error) {
            console.error('Failed to save course:', error);
            toast.error(t('failedToSaveCourse'));
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
            toast.success(t('courseDeleted'));
            await fetchCourses();
            handleCloseDeleteModal();
        } catch (error) {
            console.error('Failed to delete course:', error);
            toast.error(t('failedToDeleteCourse'));
        }
    };

    // Client-side search across key fields
    const handleSearch = (value) => {
        const term = value.toLowerCase();
        if (!term.trim()) {
            setFilteredCourses(courses);
            return;
        }

        const filtered = courses.filter((course) => {
            const titleMatch = course.title?.toLowerCase().includes(term);
            const instructorMatch = course.instructor?.toLowerCase().includes(term);
            const levelMatch = course.level?.toLowerCase().includes(term);
            const priceMatch = String(course.price ?? '').toLowerCase().includes(term);
            return titleMatch || instructorMatch || levelMatch || priceMatch;
        });

        setFilteredCourses(filtered);
    };

    const toggleLesson = (index) => {
        setExpandedLessons((prev) => {
            const next = new Set(prev);
            next.has(index) ? next.delete(index) : next.add(index);
            return next;
        });
    };

    const toggleSubLesson = (lessonIndex, subIndex) => {
        setExpandedSubLessons((prev) => {
            const lessonSet = new Set(prev[lessonIndex] || []);
            lessonSet.has(subIndex) ? lessonSet.delete(subIndex) : lessonSet.add(subIndex);
            return { ...prev, [lessonIndex]: lessonSet };
        });
    };

    // Lesson management functions
    const addLesson = () => {
        const newIndex = formData.lessons.length;
        setFormData({
            ...formData,
            lessons: [
                ...formData.lessons,
                {
                    title: '',
                    duration: '',
                    video_url: '',
                    is_preview: false,
                    sub_lessons: [],
                }
            ]
        });
        // Auto-expand the new lesson
        setExpandedLessons((prev) => new Set([...prev, newIndex]));
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
        setExpandedLessons((prev) => {
            const next = new Set([...prev].filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)));
            return next;
        });
        setExpandedSubLessons((prev) => {
            const next = {};
            Object.entries(prev).forEach(([k, v]) => {
                const ki = Number(k);
                if (ki !== index) next[ki > index ? ki - 1 : ki] = v;
            });
            return next;
        });
    };

    // Sub-lesson management
    const addSubLesson = (lessonIndex) => {
        const updatedLessons = [...formData.lessons];
        const newSubIndex = (updatedLessons[lessonIndex].sub_lessons || []).length;
        updatedLessons[lessonIndex] = {
            ...updatedLessons[lessonIndex],
            sub_lessons: [
                ...(updatedLessons[lessonIndex].sub_lessons || []),
                { title: '', duration: '', video_url: '', notes_url: '' }
            ]
        };
        setFormData({ ...formData, lessons: updatedLessons });
        // Auto-expand the new sub-lesson
        setExpandedSubLessons((prev) => {
            const lessonSet = new Set(prev[lessonIndex] || []);
            lessonSet.add(newSubIndex);
            return { ...prev, [lessonIndex]: lessonSet };
        });
    };

    const updateSubLesson = (lessonIndex, subIndex, field, value) => {
        const updatedLessons = [...formData.lessons];
        const updatedSubs = [...(updatedLessons[lessonIndex].sub_lessons || [])];
        updatedSubs[subIndex] = { ...updatedSubs[subIndex], [field]: value };
        updatedLessons[lessonIndex] = { ...updatedLessons[lessonIndex], sub_lessons: updatedSubs };
        setFormData({ ...formData, lessons: updatedLessons });
    };

    const removeSubLesson = (lessonIndex, subIndex) => {
        const updatedLessons = [...formData.lessons];
        updatedLessons[lessonIndex] = {
            ...updatedLessons[lessonIndex],
            sub_lessons: (updatedLessons[lessonIndex].sub_lessons || []).filter((_, i) => i !== subIndex)
        };
        setFormData({ ...formData, lessons: updatedLessons });
        setExpandedSubLessons((prev) => {
            const lessonSet = new Set([...(prev[lessonIndex] || [])].filter((i) => i !== subIndex).map((i) => (i > subIndex ? i - 1 : i)));
            return { ...prev, [lessonIndex]: lessonSet };
        });
    };

    const handleNotesUpload = async (lessonIndex, subIndex, file) => {
        if (!file) return;
        try {
            toast.loading('Uploading notes...', { id: `upload-${lessonIndex}-${subIndex}` });
            const result = await uploadNotes(file);
            updateSubLesson(lessonIndex, subIndex, 'notes_url', result.url);
            toast.success('Notes uploaded', { id: `upload-${lessonIndex}-${subIndex}` });
        } catch (err) {
            toast.error('Failed to upload notes', { id: `upload-${lessonIndex}-${subIndex}` });
        }
    };

    const handleThumbnailUpload = async (file) => {
        if (!file) return;
        try {
            toast.loading('Uploading thumbnail...', { id: 'thumbnail-upload' });
            const result = await uploadThumbnail(file);
            setFormData((prev) => ({ ...prev, thumbnail: result.url }));
            toast.success('Thumbnail uploaded', { id: 'thumbnail-upload' });
        } catch (err) {
            toast.error('Failed to upload thumbnail', { id: 'thumbnail-upload' });
        }
    };

    // Helper function to translate level values for display
    const translateLevel = (level) => {
        if (!level) return '';
        const levelLower = level.toLowerCase();
        switch (levelLower) {
            case 'beginner':
                return tCourses('beginner');
            case 'intermediate':
                return tCourses('intermediate');
            case 'advanced':
                return tCourses('advanced');
            default:
                return level;
        }
    };

    const columns = [
        {
            header: t('titleColumn'),
            accessor: 'title',
        },
        {
            header: t('instructorColumn'),
            accessor: 'instructor',
        },
        {
            header: t('levelColumn'),
            accessor: 'level', // using level from DB schema (English values)
            render: (row) => {
                const level = row.level || '';
                const levelLower = level.toLowerCase();
                const translatedLevel = translateLevel(level);
                return (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        levelLower === 'beginner' ? 'bg-green-100 text-green-800' :
                        levelLower === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {translatedLevel}
                    </span>
                );
            },
        },
        {
            header: t('priceColumn'),
            accessor: 'price',
            render: (row) => `$${row.price}`,
        },
        {
            header: t('lessonsColumn'),
            accessor: 'lessons_count',
            render: (row) => row.lessons_count || 0,
        },
        {
            header: t('statusColumn'),
            accessor: 'is_published',
            render: (row) => (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {row.is_published ? t('published') : t('draft')}
                </span>
            ),
        },
    ];

    const actions = (row) => (
        <>
            <button
                onClick={() => handleEdit(row)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title={t('editCourse')}
            >
                <Edit size={18} />
            </button>
            <button
                onClick={() => handleDelete(row)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title={t('deleteCourse')}
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
                    {t('createCourse')}
                </button>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={filteredCourses}
                onSearch={handleSearch}
                actions={actions}
            />

            {/* Course Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedCourse ? t('editCourse') : t('createNewCourse')}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('courseTitle')} *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={t('courseTitle')}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('description')} *
                        </label>
                        <textarea
                            required
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
                                {t('price')} *
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
                                {t('level')}
                            </label>
                            <select
                                value={formData.level}
                                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Beginner">{tCourses('beginner')}</option>
                                <option value="Intermediate">{tCourses('intermediate')}</option>
                                <option value="Advanced">{tCourses('advanced')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('duration')} *
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
                            {t('thumbnailUrl')}
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer w-fit px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                            <Upload size={15} />
                            {formData.thumbnail ? 'Replace Thumbnail' : 'Upload Thumbnail'}
                            <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                className="hidden"
                                onChange={(e) => handleThumbnailUpload(e.target.files?.[0])}
                            />
                        </label>
                        {formData.thumbnail && (
                            <div className="mt-2 relative w-40 h-24 rounded-lg overflow-hidden border border-gray-200">
                                <img
                                    src={formData.thumbnail}
                                    alt="Thumbnail preview"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, thumbnail: '' }))}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('instructorName')} *
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
                                {t('instructorAvatarUrl')}
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
                                {t('courseLessons', { count: formData.lessons.length })}
                            </label>
                            <button
                                type="button"
                                onClick={addLesson}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                <Plus size={16} />
                                {t('addLesson')}
                            </button>
                        </div>

                        {formData.lessons.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                <p className="text-gray-500 text-sm">{t('noLessonsAdded')}</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                {formData.lessons.map((lesson, index) => {
                                    const isLessonOpen = expandedLessons.has(index);
                                    return (
                                        <div key={index} className="rounded-lg border border-gray-200 overflow-hidden">
                                            {/* Lesson collapsible header */}
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => toggleLesson(index)}
                                                onKeyDown={(e) => e.key === 'Enter' && toggleLesson(index)}
                                                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer select-none"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {isLessonOpen ? <ChevronDown size={16} className="text-gray-500 shrink-0" /> : <ChevronRight size={16} className="text-gray-500 shrink-0" />}
                                                    <span className="font-medium text-gray-900 text-sm">
                                                        {t('lesson', { number: index + 1 })}
                                                        {lesson.title && <span className="ml-1 text-gray-500 font-normal">— {lesson.title}</span>}
                                                    </span>
                                                    {(lesson.sub_lessons || []).length > 0 && (
                                                        <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                                                            {(lesson.sub_lessons || []).length} sub
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); removeLesson(index); }}
                                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    title={t('removeLesson')}
                                                >
                                                    <X size={15} />
                                                </button>
                                            </div>

                                            {/* Lesson body */}
                                            {isLessonOpen && (
                                                <div className="p-4 bg-white space-y-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                            {t('lessonTitle')} *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={lesson.title}
                                                            onChange={(e) => updateLesson(index, 'title', e.target.value)}
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder={t('lessonTitle')}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                {t('lessonDuration')}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={lesson.duration || ''}
                                                                onChange={(e) => updateLesson(index, 'duration', e.target.value)}
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                placeholder="10:30"
                                                            />
                                                        </div>
                                                        <div className="flex items-end">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={lesson.is_preview || false}
                                                                    onChange={(e) => updateLesson(index, 'is_preview', e.target.checked)}
                                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                />
                                                                <span className="text-xs font-medium text-gray-600">{t('previewLesson')}</span>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                            {t('videoUrl')} <span className="text-gray-400">(optional if sub-lessons exist)</span>
                                                        </label>
                                                        <input
                                                            type="url"
                                                            value={lesson.video_url || ''}
                                                            onChange={(e) => updateLesson(index, 'video_url', e.target.value)}
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="https://..."
                                                        />
                                                    </div>

                                                    {/* Sub-lessons section */}
                                                    <div className="border-t pt-3 mt-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                                                Sub-lessons ({(lesson.sub_lessons || []).length})
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => addSubLesson(index)}
                                                                className="flex items-center gap-1 px-2 py-1 bg-indigo-500 text-white text-xs rounded hover:bg-indigo-600 transition-colors"
                                                            >
                                                                <Plus size={12} />
                                                                Add Sub-lesson
                                                            </button>
                                                        </div>

                                                        {(lesson.sub_lessons || []).length > 0 && (
                                                            <div className="space-y-2 pl-3 border-l-2 border-indigo-200">
                                                                {(lesson.sub_lessons || []).map((sub, subIndex) => {
                                                                    const isSubOpen = (expandedSubLessons[index] || new Set()).has(subIndex);
                                                                    return (
                                                                        <div key={subIndex} className="rounded-lg border border-indigo-100 overflow-hidden">
                                                                            {/* Sub-lesson collapsible header */}
                                                                            <div
                                                                                role="button"
                                                                                tabIndex={0}
                                                                                onClick={() => toggleSubLesson(index, subIndex)}
                                                                                onKeyDown={(e) => e.key === 'Enter' && toggleSubLesson(index, subIndex)}
                                                                                className="w-full flex items-center justify-between px-3 py-2 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer select-none"
                                                                            >
                                                                                <div className="flex items-center gap-1.5">
                                                                                    {isSubOpen ? <ChevronDown size={13} className="text-indigo-400 shrink-0" /> : <ChevronRight size={13} className="text-indigo-400 shrink-0" />}
                                                                                    <span className="text-xs font-medium text-indigo-700">
                                                                                        Sub-lesson {subIndex + 1}
                                                                                        {sub.title && <span className="ml-1 text-indigo-400 font-normal">— {sub.title}</span>}
                                                                                    </span>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => { e.stopPropagation(); removeSubLesson(index, subIndex); }}
                                                                                    className="p-0.5 text-red-500 hover:bg-red-50 rounded"
                                                                                >
                                                                                    <X size={13} />
                                                                                </button>
                                                                            </div>

                                                                            {/* Sub-lesson body */}
                                                                            {isSubOpen && (
                                                                                <div className="p-3 bg-white space-y-2">
                                                                                    <input
                                                                                        type="text"
                                                                                        required
                                                                                        value={sub.title || ''}
                                                                                        onChange={(e) => updateSubLesson(index, subIndex, 'title', e.target.value)}
                                                                                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                                        placeholder="Sub-lesson title *"
                                                                                    />
                                                                                    <input
                                                                                        type="text"
                                                                                        value={sub.duration || ''}
                                                                                        onChange={(e) => updateSubLesson(index, subIndex, 'duration', e.target.value)}
                                                                                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                                        placeholder="Duration (e.g. 10:30)"
                                                                                    />
                                                                                    <input
                                                                                        type="url"
                                                                                        value={sub.video_url || ''}
                                                                                        onChange={(e) => updateSubLesson(index, subIndex, 'video_url', e.target.value)}
                                                                                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                                        placeholder="Video URL (optional)"
                                                                                    />
                                                                                    {/* Notes upload */}
                                                                                    <div className="flex items-center gap-2">
                                                                                        <label className="flex items-center gap-1.5 cursor-pointer px-2 py-1.5 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                                                                                            <Upload size={12} />
                                                                                            {sub.notes_url ? 'Replace Notes' : 'Upload Notes (.docx/.pdf)'}
                                                                                            <input
                                                                                                type="file"
                                                                                                accept=".docx,.doc,.pdf"
                                                                                                className="hidden"
                                                                                                onChange={(e) => handleNotesUpload(index, subIndex, e.target.files?.[0])}
                                                                                            />
                                                                                        </label>
                                                                                        {sub.notes_url && (
                                                                                            <a
                                                                                                href={sub.notes_url}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="flex items-center gap-1 text-xs text-green-600 hover:underline"
                                                                                            >
                                                                                                <FileText size={12} />
                                                                                                View Notes
                                                                                            </a>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Lists Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('whatYouWillLearn')}
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
                                {t('courseFeatures')}
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
                                {t('requirements')}
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
                            {t('publishCourseImmediately')}
                        </label>
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
                            {selectedCourse ? t('updateCourse') : t('createCourse')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                title={t('deleteCourse')}
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-700">
                        {t('deleteCourseConfirm', { title: courseToDelete?.title })}
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
                            {t('deleteCourseButton')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );

}
