'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Edit, Trash2, Plus, Power, PowerOff } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon, toggleCouponStatus } from '@/lib/api/adminApi';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function CouponsPage() {
    const t = useTranslations('admin.coupons');
    const [coupons, setCoupons] = useState([]);
    const [filteredCoupons, setFilteredCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [couponToDelete, setCouponToDelete] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        percentage: '',
        usage_limit: '',
        is_active: true,
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const response = await getAllCoupons();
            setCoupons(response.coupons);
            setFilteredCoupons(response.coupons);
        } catch (error) {
            console.error('Failed to fetch coupons:', error);
            toast.error('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setSelectedCoupon(null);
        setFormData({
            code: '',
            percentage: '',
            usage_limit: '',
            is_active: true,
        });
        setIsModalOpen(true);
    };

    const handleEdit = (coupon) => {
        setSelectedCoupon(coupon);
        setFormData({
            code: coupon.code,
            percentage: coupon.percentage,
            usage_limit: coupon.usage_limit || '',
            is_active: coupon.is_active,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                code: formData.code.toUpperCase().trim(),
                percentage: Number(formData.percentage),
                usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
                is_active: formData.is_active,
            };

            if (selectedCoupon) {
                await updateCoupon(selectedCoupon.id, payload);
                toast.success('Coupon updated successfully');
            } else {
                await createCoupon(payload);
                toast.success('Coupon created successfully');
            }
            setIsModalOpen(false);
            fetchCoupons();
        } catch (error) {
            console.error('Failed to save coupon:', error);
            toast.error(error.response?.data?.error || 'Failed to save coupon');
        }
    };

    const handleDelete = (coupon) => {
        setCouponToDelete(coupon);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setCouponToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!couponToDelete) return;
        try {
            await deleteCoupon(couponToDelete.id);
            toast.success('Coupon deleted successfully');
            await fetchCoupons();
            handleCloseDeleteModal();
        } catch (error) {
            console.error('Failed to delete coupon:', error);
            toast.error('Failed to delete coupon');
        }
    };

    const handleToggleStatus = async (coupon) => {
        try {
            await toggleCouponStatus(coupon.id);
            toast.success(`Coupon ${coupon.is_active ? 'deactivated' : 'activated'} successfully`);
            fetchCoupons();
        } catch (error) {
            console.error('Failed to toggle coupon status:', error);
            toast.error('Failed to update coupon status');
        }
    };

    const handleSearch = (value) => {
        const term = value.toLowerCase();
        if (!term.trim()) {
            setFilteredCoupons(coupons);
            return;
        }

        const filtered = coupons.filter((coupon) => {
            return coupon.code?.toLowerCase().includes(term);
        });

        setFilteredCoupons(filtered);
    };

    const columns = [
        {
            header: 'Code',
            accessor: 'code',
            render: (row) => (
                <span className="font-mono font-semibold text-blue-600">{row.code}</span>
            ),
        },
        {
            header: 'Discount',
            accessor: 'percentage',
            render: (row) => (
                <span className="font-semibold text-green-600">{row.percentage}%</span>
            ),
        },
        {
            header: 'Status',
            accessor: 'is_active',
            render: (row) => (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                    {row.is_active ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            header: 'Usage',
            accessor: 'usage_count',
            render: (row) => {
                const hasLimit = row.usage_limit !== null;
                const percentage = hasLimit ? (row.usage_count / row.usage_limit) * 100 : 0;

                return (
                    <div className="space-y-1">
                        <div className="text-sm font-medium">
                            {row.usage_count} {hasLimit ? `/ ${row.usage_limit}` : ''}
                        </div>
                        {hasLimit && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${percentage >= 100 ? 'bg-red-500' :
                                            percentage >= 75 ? 'bg-yellow-500' :
                                                'bg-blue-500'
                                        }`}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Created',
            accessor: 'created_at',
            render: (row) => new Date(row.created_at).toLocaleDateString(),
        },
    ];

    const actions = (row) => (
        <>
            <button
                onClick={() => handleToggleStatus(row)}
                className={`p-2 rounded-lg transition-colors ${row.is_active
                        ? 'text-orange-600 hover:bg-orange-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                title={row.is_active ? 'Deactivate' : 'Activate'}
            >
                {row.is_active ? <PowerOff size={18} /> : <Power size={18} />}
            </button>
            <button
                onClick={() => handleEdit(row)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Coupon"
            >
                <Edit size={18} />
            </button>
            <button
                onClick={() => handleDelete(row)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Coupon"
            >
                <Trash2 size={18} />
            </button>
        </>
    );

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Coupons</h1>
                    <p className="text-gray-600">Manage discount coupons for courses and live sessions</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-shadow"
                >
                    <Plus size={20} />
                    Create Coupon
                </button>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={filteredCoupons}
                onSearch={handleSearch}
                actions={actions}
            />

            {/* Coupon Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Coupon Code *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            placeholder="SAVE20"
                            maxLength={20}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Use uppercase letters and numbers only
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Discount Percentage *
                        </label>
                        <input
                            type="number"
                            required
                            min="1"
                            max="100"
                            value={formData.percentage}
                            onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="20"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Enter a value between 1 and 100
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Usage Limit (Optional)
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={formData.usage_limit}
                            onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Leave empty for unlimited"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Maximum number of times this coupon can be used
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                            Active (users can use this coupon)
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
                            {selectedCoupon ? 'Update Coupon' : 'Create Coupon'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                title="Delete Coupon"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Are you sure you want to delete the coupon <strong>{couponToDelete?.code}</strong>? This action cannot be undone.
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
                            Delete Coupon
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
