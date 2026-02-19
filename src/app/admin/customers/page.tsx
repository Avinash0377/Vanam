'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UsersIcon, CartIcon, StarIcon, PlusIcon, SearchIcon } from '@/components/Icons';
import styles from './page.module.css';

interface User {
    id: string;
    name: string;
    mobile: string;
    email: string | null;
    role: string;
    createdAt: string;
    lastLoginAt: string | null;
    orderCount: number;
    totalSpent: number;
    lastOrderDate: string | null;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function CustomersPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounce search input: wait 300ms after user stops typing
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [search]);

    useEffect(() => {
        fetchUsers();
    }, [token, page, debouncedSearch]);

    const fetchUsers = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(debouncedSearch && { search: debouncedSearch }),
            });
            const res = await fetch(`/api/admin/users?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setUsers(data.users || []);
            setPagination(data.pagination || null);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: '2-digit'
        });
    };

    const handleUserClick = (userId: string) => {
        router.push(`/admin/customers/${userId}`);
    };

    // Compute summary stats
    const totalCustomers = pagination?.total || 0;
    const customersWithOrders = users.filter(u => u.orderCount > 0).length;
    const totalRevenue = users.reduce((sum, u) => sum + u.totalSpent, 0);

    if (loading && users.length === 0) {
        return (
            <div className={styles.loading}>
                <div className="spinner"></div>
                <p>Loading customers...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Customers</h1>
                    <p className={styles.subtitle}>Manage and view customer details</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon} style={{ background: '#dbeafe' }}>
                        <UsersIcon size={24} color="#2563eb" />
                    </div>
                    <div className={styles.summaryInfo}>
                        <span className={styles.summaryLabel}>Total Customers</span>
                        <span className={styles.summaryValue}>{totalCustomers}</span>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon} style={{ background: '#dcfce7' }}>
                        <CartIcon size={24} color="#16a34a" />
                    </div>
                    <div className={styles.summaryInfo}>
                        <span className={styles.summaryLabel}>Active Buyers</span>
                        <span className={styles.summaryValue}>{customersWithOrders}</span>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon} style={{ background: '#fef3c7' }}>
                        <StarIcon size={24} color="#d97706" />
                    </div>
                    <div className={styles.summaryInfo}>
                        <span className={styles.summaryLabel}>Total Revenue</span>
                        <span className={styles.summaryValue}>{formatCurrency(totalRevenue)}</span>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon} style={{ background: '#fce7f3' }}>
                        <PlusIcon size={24} color="#db2777" />
                    </div>
                    <div className={styles.summaryInfo}>
                        <span className={styles.summaryLabel}>Showing</span>
                        <span className={styles.summaryValue}>{users.length}</span>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className={styles.searchSection}>
                <div className={styles.searchWrapper}>
                    <SearchIcon size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, mobile, or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className={styles.section}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Mobile</th>
                                <th>Orders</th>
                                <th>Total Spent</th>
                                <th>Joined</th>
                                <th>Last Login</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr
                                    key={user.id}
                                    onClick={() => handleUserClick(user.id)}
                                    className={styles.clickableRow}
                                >
                                    <td>
                                        <div className={styles.customerCell}>
                                            <span className={styles.customerName}>{user.name}</span>
                                            <span className={styles.customerEmail}>{user.email || '-'}</span>
                                        </div>
                                    </td>
                                    <td>{user.mobile}</td>
                                    <td>
                                        <span className={styles.orderBadge}>
                                            {user.orderCount}
                                        </span>
                                    </td>
                                    <td className={styles.amountCell}>
                                        {formatCurrency(user.totalSpent)}
                                    </td>
                                    <td>{formatDate(user.createdAt)}</td>
                                    <td>{formatDate(user.lastLoginAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {users.length === 0 && !loading && (
                    <p className={styles.empty}>No customers found</p>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className={styles.pagination}>
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className={styles.pageBtn}
                        >
                            Previous
                        </button>
                        <span className={styles.pageInfo}>
                            Page {page} of {pagination.totalPages}
                        </span>
                        <button
                            disabled={page === pagination.totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className={styles.pageBtn}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
