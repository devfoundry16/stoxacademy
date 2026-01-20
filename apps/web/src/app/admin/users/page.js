'use client';

import { useEffect, useState } from 'react';
import { Edit, Trash2, Shield } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getAllUsers, updateUserRole, deleteUser } from '@/lib/api/adminApi';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [newRole, setNewRole] = useState('');

    useEffect(() => {
        fetchUsers();
    }, [pagination.page, searchTerm]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers({
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm,
            });
            setUsers(data.users);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Failed to fetch users:', error);
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

    const handleEditRole = (user) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setIsRoleModalOpen(true);
    };

    const handleUpdateRole = async () => {
        try {
            await updateUserRole(selectedUser.id, newRole);
            setIsRoleModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('Failed to update role:', error);
            alert('Failed to update user role');
        }
    };

    const handleDeleteUser = async (user) => {
        if (confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) {
            try {
                await deleteUser(user.id);
                fetchUsers();
            } catch (error) {
                console.error('Failed to delete user:', error);
                alert('Failed to delete user');
            }
        }
    };

    const columns = [
        {
            header: 'Name',
            accessor: 'name',
            render: (row) => `${row.first_name} ${row.last_name}`,
        },
        {
            header: 'Email',
            accessor: 'email',
        },
        {
            header: 'Role',
            accessor: 'role',
            render: (row) => (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        row.role === 'instructor' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                    }`}>
                    {row.role}
                </span>
            ),
        },
        {
            header: 'Joined',
            accessor: 'created_at',
            render: (row) => new Date(row.created_at).toLocaleDateString(),
        },
    ];

    const actions = (row) => (
        <>
            <button
                onClick={() => handleEditRole(row)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Role"
            >
                <Shield size={18} />
            </button>
            <button
                onClick={() => handleDeleteUser(row)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete User"
            >
                <Trash2 size={18} />
            </button>
        </>
    );

    if (loading && users.length === 0) {
        return (
            <LoadingSpinner fullScreen />
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">User Management</h1>
                <p className="text-gray-600">Manage all users and their roles</p>
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={users}
                onSearch={handleSearch}
                onPageChange={handlePageChange}
                pagination={pagination}
                actions={actions}
            />

            {/* Role Edit Modal */}
            <Modal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                title="Edit User Role"
                size="sm"
            >
                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-2">User</p>
                        <p className="font-medium">
                            {selectedUser?.first_name} {selectedUser?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{selectedUser?.email}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Role
                        </label>
                        <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="student">Student</option>
                            <option value="instructor">Instructor</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            onClick={() => setIsRoleModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdateRole}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-shadow"
                        >
                            Update Role
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
