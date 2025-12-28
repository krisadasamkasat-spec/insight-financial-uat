import React, { useState, useEffect, useMemo } from 'react';
import {
    Wallet, TrendingUp, TrendingDown, Clock, Building,
    ArrowUpRight, ArrowDownLeft, MoreHorizontal, FileText,
    CreditCard, Activity, DollarSign, Calendar
} from 'lucide-react';
import { projectAPI as api } from '../services/api';
import { formatNumber } from '../utils/formatters';

const Accounts = () => {
    const [account, setAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterType, setFilterType] = useState('all'); // 'all' | 'income' | 'expense'

    useEffect(() => {
        fetchAccountData();
    }, []);

    const fetchAccountData = async () => {
        try {
            setLoading(true);
            const accountsRes = await api.getAllAccounts();
            const primary = accountsRes.data.find(acc => acc.is_primary) || accountsRes.data[0];

            if (!primary) {
                setError('No accounts found. Please seed the database.');
                return;
            }

            setAccount(primary);
            const txRes = await api.getAccountTransactions(primary.id);
            setTransactions(txRes.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching account data:', err);
            setError('Failed to load account details');
        } finally {
            setLoading(false);
        }
    };

    // --- Stats Calculation ---
    const stats = useMemo(() => {
        return transactions.reduce((acc, tx) => {
            const amount = parseFloat(tx.amount || 0);
            if (tx.type === 'income') {
                acc.income += amount;
            } else {
                acc.expense += amount;
            }
            return acc;
        }, { income: 0, expense: 0 });
    }, [transactions]);

    const netFlow = stats.income - stats.expense;

    // --- Filtering & Grouping ---
    const filteredTransactions = useMemo(() => {
        if (filterType === 'all') return transactions;
        return transactions.filter(tx => tx.type === filterType);
    }, [transactions, filterType]);

    const groupedTransactions = useMemo(() => {
        const groups = {};
        filteredTransactions.forEach(tx => {
            const date = new Date(tx.date);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`; // ISO Key for sorting

            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(tx);
        });

        // Sort keys descending
        return Object.keys(groups).sort((a, b) => new Date(b) - new Date(a)).map(dateKey => ({
            date: dateKey,
            items: groups[dateKey]
        }));
    }, [filteredTransactions]);


    const formatDateHeader = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

        return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    };

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center text-red-500">{error}</div>
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8 font-sans text-gray-800">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Financial Overview</h1>
                    <p className="text-gray-500 mt-1">Real-time insights into your company's liquidity.</p>
                </div>
                <div className="text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    Live Data
                </div>
            </div>

            {/* Dashboard Grid - Full Width */}
            <div className="space-y-6">

                {/* Main Card */}
                <div className="space-y-6">
                    {/* Premium Bank Card */}
                    {account && (
                        <div className="relative overflow-hidden rounded-3xl bg-[#0f172a] text-white shadow-2xl transition-transform hover:scale-[1.005] duration-300">
                            {/* Abstract Shapes */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-purple-600/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>

                            {/* Card Content */}
                            <div className="relative z-10 p-8 md:p-10 flex flex-col justify-between h-full min-h-[220px]">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/5">
                                            <Building className="w-6 h-6 text-white/90" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold tracking-wide">{account.name}</h2>
                                            <p className="text-white/50 text-sm font-mono tracking-wider">{account.bank_code}</p>
                                        </div>
                                    </div>
                                    {account.is_primary && (
                                        <div className="px-3 py-1 rounded-full bg-white/10 border border-white/5 backdrop-blur-md text-xs font-medium text-white/80">
                                            Primary Account
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 flex flex-col md:flex-row justify-between items-end gap-6">
                                    <div>
                                        <p className="text-white/40 text-xs font-medium uppercase tracking-widest mb-2">Total Balance</p>
                                        <div className="text-5xl font-bold tracking-tight text-white flex items-baseline gap-2">
                                            <span className="text-2xl text-white/40">฿</span>
                                            {formatNumber(account.balance)}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white/40 text-xs mb-1">Account Number</p>
                                        <p className="font-mono text-lg tracking-widest text-white/80">{account.account_number}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase">Total Income</p>
                                <p className="text-lg font-bold text-gray-900">+฿{formatNumber(stats.income)}</p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                                <TrendingDown className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase">Total Expenses</p>
                                <p className="text-lg font-bold text-gray-900">-฿{formatNumber(stats.expense)}</p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${netFlow >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase">Net Flow</p>
                                <p className={`text-lg font-bold ${netFlow >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                                    {netFlow >= 0 ? '+' : ''}฿{formatNumber(netFlow)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Recent Transactions</h3>
                    <div className="flex bg-gray-100/80 p-1 rounded-xl">
                        {['all', 'income', 'expense'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === type
                                    ? 'bg-white shadow-sm text-gray-900'
                                    : 'text-gray-500 hover:text-gray-700'
                                    } capitalize`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    {groupedTransactions.length > 0 ? (
                        groupedTransactions.map((group) => (
                            <div key={group.date}>
                                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3 ml-1">
                                    {formatDateHeader(group.date)}
                                </h4>
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                                    {group.items.map((tx) => (
                                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors group cursor-default">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-100/50 text-emerald-600' : 'bg-rose-100/50 text-rose-600'
                                                    } transition-colors group-hover:scale-110 duration-200`}>
                                                    {tx.type === 'income' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{tx.description || 'No Description'}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{tx.expense_category || 'General Transaction'}</p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className={`font-bold text-base ${tx.type === 'income' ? 'text-emerald-600' : 'text-gray-900'
                                                    }`}>
                                                    {tx.type === 'income' ? '+' : '-'}฿{formatNumber(tx.amount)}
                                                </p>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium mt-1 ${tx.status === 'Paid' || tx.status === 'จ่ายแล้ว' ? 'bg-gray-100 text-gray-500' : 'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <MoreHorizontal className="w-8 h-8" />
                            </div>
                            <p className="text-gray-500 font-medium">No transactions found</p>
                            <p className="text-sm text-gray-400 mt-1">Try changing filters or adding new transactions</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default Accounts;
