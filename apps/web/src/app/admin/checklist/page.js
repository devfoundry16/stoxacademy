'use client';

import { useEffect, useState } from 'react';
import { Eye, TrendingUp, Users, Target, Award, Filter, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { getChecklistSubmissions, getChecklistSubmissionById, exportChecklistSubmissionsToExcel } from '@/lib/api/adminApi';
import { LoadingSpinner } from '@/components/LoadingSpinner';
// Stage configuration with colors and labels
const STAGE_CONFIG = {
    awareness: {
        label: 'Awareness',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '👁️',
    },
    builder: {
        label: 'Builder',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '🏗️',
    },
    professional: {
        label: 'Professional',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: '💼',
    },
    investor: {
        label: 'Investor',
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

export default function ChecklistSubmissionsPage() {
    const [submissions, setSubmissions] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
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
    }, [pagination.page, searchTerm, stageFilter]);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm,
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

    const handleSearch = (value) => {
        setSearchTerm(value);
        setPagination({ ...pagination, page: 1 });
    };

    const handlePageChange = (newPage) => {
        setPagination({ ...pagination, page: newPage });
    };

    const handleViewDetails = async (submission) => {
        try {
            const data = await getChecklistSubmissionById(submission.id);
            setSelectedSubmission(data.submission);
            setIsDetailModalOpen(true);
        } catch (error) {
            console.error('Failed to fetch submission details:', error);
            toast.error('Failed to load submission details');
        }
    };

    const handleExportToExcel = async () => {
        try {
            setLoading(true);
            await exportChecklistSubmissionsToExcel({
                search: searchTerm,
                stage: stageFilter,
            });
            toast.success('Excel file downloaded successfully!');
        } catch (error) {
            console.error('Failed to export to Excel:', error);
            toast.error('Failed to export data to Excel. Please try again.');
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
            header: 'Name',
            accessor: 'full_name',
            render: (row) => (
                <div className="font-medium text-gray-900">{row.full_name}</div>
            ),
        },
        {
            header: 'Email',
            accessor: 'email',
            render: (row) => (
                <div className="text-gray-600 text-sm">{row.email}</div>
            ),
        },
        {
            header: 'Score',
            accessor: 'score',
            render: (row) => (
                <ScoreBadge score={parseFloat(row.score) || 0} />
            ),
        },
        {
            header: 'Stage',
            accessor: 'stage',
            render: (row) => (
                <StageBadge stage={row.stage} />
            ),
        },
        {
            header: 'Country',
            accessor: 'country',
            render: (row) => (
                <div className="text-gray-600 text-sm">{row.country || 'N/A'}</div>
            ),
        },
        {
            header: 'Submitted',
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
                    <h1 className="text-3xl font-bold text-gray-900">Checklist Submissions</h1>
                    <p className="text-gray-600 mt-1">View and analyze customer financial readiness assessments</p>
                </div>
                <button
                    onClick={handleExportToExcel}
                    disabled={loading || pagination.total === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                >
                    <Download size={20} />
                    Export to Excel
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                        </div>
                        <Users className="text-blue-500" size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Average Score</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avgScore.toFixed(1)}</p>
                        </div>
                        <TrendingUp className="text-indigo-500" size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Awareness</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.byStage.awareness}</p>
                        </div>
                        <Target className="text-blue-500" size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Builder</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.byStage.builder}</p>
                        </div>
                        <Award className="text-green-500" size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Professional</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.byStage.professional}</p>
                        </div>
                        <TrendingUp className="text-purple-500" size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Investor</p>
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
                        <span className="font-medium">Filter by Stage:</span>
                    </div>
                    <select
                        value={stageFilter}
                        onChange={(e) => {
                            setStageFilter(e.target.value);
                            setPagination({ ...pagination, page: 1 });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Stages</option>
                        <option value="awareness">Awareness</option>
                        <option value="builder">Builder</option>
                        <option value="professional">Professional</option>
                        <option value="investor">Investor</option>
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={submissions}
                onSearch={handleSearch}
                onPageChange={handlePageChange}
                pagination={pagination}
                actions={(row) => (
                    <button
                        onClick={() => handleViewDetails(row)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <Eye size={16} />
                        View Details
                    </button>
                )}
            />

            {/* Detail Modal */}
            {isDetailModalOpen && selectedSubmission && (
                <Modal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    title="Submission Details"
                >
                    <div className="space-y-6">
                        {/* Personal Information */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Full Name</p>
                                    <p className="font-medium">{selectedSubmission.full_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Email</p>
                                    <p className="font-medium">{selectedSubmission.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Phone</p>
                                    <p className="font-medium">{selectedSubmission.phone_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Age</p>
                                    <p className="font-medium">{selectedSubmission.age || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Country</p>
                                    <p className="font-medium">{selectedSubmission.country || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Submitted</p>
                                    <p className="font-medium">{formatDate(selectedSubmission.created_at)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Score and Stage */}
                        <div className="bg-linear-to-br from-blue-50 to-purple-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Results</h3>
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Score</p>
                                    <ScoreBadge score={parseFloat(selectedSubmission.score) || 0} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Stage</p>
                                    <StageBadge stage={selectedSubmission.stage} />
                                </div>
                            </div>
                        </div>

                        {/* Answers */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Answers</h3>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {selectedSubmission.answers && Array.isArray(selectedSubmission.answers) ? (
                                    selectedSubmission.answers.map((answer, index) => (
                                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                                            <p className="font-medium text-gray-900 mb-2">{answer.question}</p>
                                            <p className="text-gray-600">{answer.answer}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500">No answers available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

