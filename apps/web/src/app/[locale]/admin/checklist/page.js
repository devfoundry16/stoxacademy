'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Eye, TrendingUp, Users, Target, Award, Filter, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { getChecklistSubmissions, getChecklistSubmissionById, exportChecklistSubmissionsToExcel } from '@/lib/api/adminApi';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function ChecklistSubmissionsPage() {
    const t = useTranslations('admin.checklist');
    
    // Stage configuration with colors and labels
    const STAGE_CONFIG = {
        awareness: {
            label: t('awareness'),
            color: 'bg-blue-100 text-blue-800 border-blue-200',
            icon: '👁️',
        },
        builder: {
            label: t('builder'),
            color: 'bg-green-100 text-green-800 border-green-200',
            icon: '🏗️',
        },
        professional: {
            label: t('professional'),
            color: 'bg-purple-100 text-purple-800 border-purple-200',
            icon: '💼',
        },
        investor: {
            label: t('investor'),
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            icon: '📈',
        },
    };

    function getStageConfig(stage) {
        return STAGE_CONFIG[stage] || STAGE_CONFIG.awareness;
    }

    function ScoreBadge({ score }) {
        const getScoreColor = (score) => {
            if (score >= 9) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
            if (score >= 7) return 'bg-gradient-to-r from-purple-400 to-purple-600 text-white';
            if (score >= 4) return 'bg-gradient-to-r from-green-400 to-green-600 text-white';
            return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';
        };

        return (
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-sm ${getScoreColor(score)}`}>
                <TrendingUp size={14} />
                <span>{score.toFixed(1)}</span>
            </div>
        );
    }

    function StageBadge({ stage }) {
        const config = getStageConfig(stage);
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                <span>{config.icon}</span>
                <span>{config.label}</span>
            </span>
        );
    }
    const [submissions, setSubmissions] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [stageFilter, setStageFilter] = useState('');
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        byStage: { awareness: 0, builder: 0, professional: 0, investor: 0 },
        avgScore: 0,
    });

    useEffect(() => {
        fetchSubmissions();
    }, [pagination.page, stageFilter]);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
            };
            if (stageFilter) {
                params.stage = stageFilter;
            }
            const data = await getChecklistSubmissions(params);
            setSubmissions(data.submissions);
            setPagination(data.pagination);
            // Update stats from API response
            if (data.stats) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleViewDetails = async (submission) => {
        try {
            const data = await getChecklistSubmissionById(submission.id);
            setSelectedSubmission(data.submission);
            setIsDetailModalOpen(true);
        } catch (error) {
            console.error('Failed to fetch submission details:', error);
            toast.error(t('failedToLoadDetails'));
        }
    };

    const handleExportToExcel = async () => {
        try {
            setLoading(true);
            await exportChecklistSubmissionsToExcel({
                stage: stageFilter,
            });
            toast.success(t('excelDownloaded'));
        } catch (error) {
            console.error('Failed to export to Excel:', error);
            toast.error(t('failedToExport'));
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short',
        });
    };

    const columns = [
        {
            header: t('name'),
            accessor: 'full_name',
            render: (row) => (
                <div className="font-medium text-gray-900">{row.full_name}</div>
            ),
        },
        {
            header: t('email'),
            accessor: 'email',
            render: (row) => (
                <div className="text-gray-600 text-sm">{row.email}</div>
            ),
        },
        {
            header: t('score'),
            accessor: 'score',
            render: (row) => (
                <ScoreBadge score={parseFloat(row.score) || 0} />
            ),
        },
        {
            header: t('stage'),
            accessor: 'stage',
            render: (row) => (
                <StageBadge stage={row.stage} />
            ),
        },
        {
            header: t('country'),
            accessor: 'country',
            render: (row) => (
                <div className="text-gray-600 text-sm">{row.country || 'N/A'}</div>
            ),
        },
        {
            header: t('submitted'),
            accessor: 'created_at',
            render: (row) => (
                <div className="text-gray-500 text-sm">{formatDate(row.created_at)}</div>
            ),
        },
    ];

    if (loading && submissions.length === 0) {
        return (
            <LoadingSpinner fullScreen />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
                    <p className="text-gray-600 mt-1">{t('description')}</p>
                </div>
                <button
                    onClick={handleExportToExcel}
                    disabled={loading || pagination.total === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                >
                    <Download size={20} />
                    {t('exportToExcel')}
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t('totalSubmissions')}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                        </div>
                        <Users className="text-blue-500" size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t('averageScore')}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avgScore.toFixed(1)}</p>
                        </div>
                        <TrendingUp className="text-indigo-500" size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t('awareness')}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.byStage.awareness}</p>
                        </div>
                        <Target className="text-blue-500" size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t('builder')}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.byStage.builder}</p>
                        </div>
                        <Award className="text-green-500" size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t('professional')}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.byStage.professional}</p>
                        </div>
                        <TrendingUp className="text-purple-500" size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t('investor')}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.byStage.investor}</p>
                        </div>
                        <Award className="text-yellow-500" size={32} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Filter size={20} />
                        <span className="font-medium">{t('filterByStage')}</span>
                    </div>
                    <select
                        value={stageFilter}
                        onChange={(e) => {
                            setStageFilter(e.target.value);
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">{t('allStages')}</option>
                        <option value="awareness">{t('awareness')}</option>
                        <option value="builder">{t('builder')}</option>
                        <option value="professional">{t('professional')}</option>
                        <option value="investor">{t('investor')}</option>
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={submissions}
                onPageChange={handlePageChange}
                pagination={pagination}
                actions={(row) => (
                    <button
                        onClick={() => handleViewDetails(row)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <Eye size={16} />
                        {t('viewDetails')}
                    </button>
                )}
            />

            {/* Detail Modal */}
            {isDetailModalOpen && selectedSubmission && (
                <Modal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    title={t('submissionDetails')}
                >
                    <div className="space-y-6">
                        {/* Personal Information */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('personalInformation')}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">{t('fullName')}</p>
                                    <p className="font-medium">{selectedSubmission.full_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{t('email')}</p>
                                    <p className="font-medium">{selectedSubmission.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{t('phone')}</p>
                                    <p className="font-medium">{selectedSubmission.phone_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{t('age')}</p>
                                    <p className="font-medium">{selectedSubmission.age || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{t('country')}</p>
                                    <p className="font-medium">{selectedSubmission.country || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{t('submitted')}</p>
                                    <p className="font-medium">{formatDate(selectedSubmission.created_at)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Score and Stage */}
                        <div className="bg-linear-to-br from-blue-50 to-purple-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('assessmentResults')}</h3>
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">{t('score')}</p>
                                    <ScoreBadge score={parseFloat(selectedSubmission.score) || 0} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">{t('stage')}</p>
                                    <StageBadge stage={selectedSubmission.stage} />
                                </div>
                            </div>
                        </div>

                        {/* Answers */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('answers')}</h3>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {selectedSubmission.answers && Array.isArray(selectedSubmission.answers) ? (
                                    selectedSubmission.answers.map((answer, index) => (
                                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                                            <p className="font-medium text-gray-900 mb-2">{answer.question}</p>
                                            <p className="text-gray-600">{answer.answer}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500">{t('noAnswersAvailable')}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

