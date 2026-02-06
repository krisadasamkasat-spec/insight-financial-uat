import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ExpenseCard from '../components/finance/ExpenseCard';
import Summary from '../components/finance/Summary';
import ApproveConfirmModal from '../components/finance/ApproveConfirmModal';
import RejectExpenseModal from '../components/modals/RejectExpenseModal';
import { projectAPI } from '../services/api';
import { formatNumber } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { List } from 'lucide-react';
import { APPROVED_STATUSES, REJECTED_STATUS } from '../constants/expenseStatus';

const MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const Approval = () => {
    const toast = useToast();

    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [projectMap, setProjectMap] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [selectedExpenses, setSelectedExpenses] = useState(new Set());
    const [expandedPaymentCycles, setExpandedPaymentCycles] = useState(new Set());
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'paid' | 'rejected'

    // Rejection modal state
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [expenseToReject, setExpenseToReject] = useState(null);
    const [isRejecting, setIsRejecting] = useState(false);

    // Account balance
    const [accountBalance, setAccountBalance] = useState(0);

    // Fetch Balance Helper
    const fetchBalance = async () => {
        try {
            const accRes = await projectAPI.getAllAccounts();
            const primaryAccount = accRes.data.find(a => a.is_primary) || accRes.data[0];
            if (primaryAccount) {
                setAccountBalance(parseFloat(primaryAccount.balance));
            }
        } catch (err) {
            console.error("Failed to fetch balance", err);
        }
    };

    // Fetch Expenses & Projects
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [expRes, projRes, incRes] = await Promise.all([
                    projectAPI.getAllExpenses(),
                    projectAPI.getAllProjects(),
                    projectAPI.getAllIncomes()
                ]);

                await fetchBalance();

                // Create Project Map
                const pMap = {};
                projRes.data.forEach(p => {
                    pMap[p.project_code] = {
                        projectCode: p.project_code,
                        projectName: p.project_name || p.title,
                        projectType: p.project_type,
                        customerName: p.customer_name,
                        startDate: p.start_date,
                        endDate: p.end_date,
                        location: p.location,
                        teamMembers: p.team_members || []
                    };
                });
                setProjectMap(pMap);

                // Map Expenses
                const mapped = expRes.data.map(e => {
                    const priceAmt = parseFloat(e.price) || 0;
                    const whtAmt = parseFloat(e.wht_amount) || 0;
                    const vatAmt = parseFloat(e.vat_amount) || 0;
                    return {
                        id: e.id,
                        projectCode: e.project_code,
                        expenseCode: e.account_code,
                        account_title: e.account_title,
                        expenseCategory: e.expense_category,
                        title: e.title || e.description,
                        description: e.description,
                        recipient: e.recipient,
                        internal_status: e.internal_status,
                        paymentDate: e.payment_date || e.due_date,
                        issueDate: e.issue_date,
                        netAmount: parseFloat(e.net_amount) || 0,
                        priceAmount: priceAmt,
                        vatAmount: parseFloat(e.vat_amount) || 0,
                        whtAmount: whtAmt,
                        attachments: e.attachments || [],
                        createdAt: e.created_at,
                        category_type: e.expense_type,
                        expense_type: e.expense_type,
                        contact: e.contact,
                        bill_header: e.bill_header,
                        payback_to: e.payback_to,
                        reject_reason: e.reject_reason
                    };
                });
                setExpenses(mapped);

                // Map Incomes
                const mappedIncomes = incRes.data.map(inc => ({
                    id: inc.id,
                    projectCode: inc.project_code,
                    amount: parseFloat(inc.amount) || 0,
                    due_date: inc.due_date,
                    date: inc.date || inc.received_date,
                    status: inc.status
                }));
                const enhancedIncomes = mappedIncomes.map(inc => {
                    const p = pMap[inc.projectCode];
                    return { ...inc, type: p ? p.projectType : 'Other' };
                });
                setIncomes(enhancedIncomes);

            } catch (err) {
                console.error("Failed to load data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Format payment date
    const formatPaymentDate = (dateString) => {
        if (!dateString || dateString === 'No Date') return "No Payment Cycle";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";

        const day = date.getDate();
        const month = MONTHS[date.getMonth()];
        const year = date.getFullYear();
        return `รอบจ่าย ${day} ${month} ${year}`;
    };

    // Status filters
    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => {
            const isApproved = APPROVED_STATUSES.includes(e.internal_status);
            const isRejected = e.internal_status === REJECTED_STATUS;

            if (activeTab === 'pending') {
                return e.internal_status === 'บัญชีตรวจ และ ได้รับเอกสารตัวจริง';
            }
            if (activeTab === 'paid') return isApproved;
            if (activeTab === 'rejected') return isRejected;
            return true;
        });
    }, [expenses, activeTab]);

    // Group expenses by payment date
    const groupedExpenses = useMemo(() => {
        const byDate = filteredExpenses.reduce((acc, expense) => {
            let dateKey = 'No Date';
            if (expense.paymentDate) {
                const date = new Date(expense.paymentDate);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                dateKey = `${year}-${month}-${day}`;
            }

            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(expense);
            return acc;
        }, {});

        const sortedDates = Object.keys(byDate).sort((a, b) => {
            if (a === 'No Date') return 1;
            if (b === 'No Date') return -1;
            return new Date(a) - new Date(b);
        });

        return sortedDates.map(date => {
            const dateExpenses = byDate[date];
            const sortedExpenses = [...dateExpenses].sort((a, b) =>
                (a.projectCode || '').localeCompare(b.projectCode || '')
            );
            const cycleTotal = sortedExpenses.reduce((sum, e) => sum + e.netAmount, 0);

            return {
                paymentDate: date,
                expenses: sortedExpenses,
                total: cycleTotal
            };
        });
    }, [filteredExpenses]);

    // Initialize expanded cycles
    useEffect(() => {
        if (groupedExpenses.length > 0) {
            const allCycleKeys = new Set(groupedExpenses.map(g => g.paymentDate));
            setExpandedPaymentCycles(allCycleKeys);
        }
    }, [groupedExpenses.length]);

    const handleToggleExpense = (id) => {
        const newSelected = new Set(selectedExpenses);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedExpenses(newSelected);
    };

    const handleTogglePaymentCycle = (expensesList) => {
        const newSelected = new Set(selectedExpenses);
        const allSelected = expensesList.every(e => newSelected.has(e.id));

        expensesList.forEach(expense => {
            if (allSelected) {
                newSelected.delete(expense.id);
            } else {
                newSelected.add(expense.id);
            }
        });
        setSelectedExpenses(newSelected);
    };

    const handleToggleExpand = (key) => {
        const newExpanded = new Set(expandedPaymentCycles);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedPaymentCycles(newExpanded);
    };

    const totalSelectedAmount = useMemo(() => {
        return filteredExpenses
            .filter(expense => selectedExpenses.has(expense.id))
            .reduce((sum, expense) => sum + expense.netAmount, 0);
    }, [selectedExpenses, filteredExpenses]);

    const selectedExpensesList = useMemo(() => {
        return filteredExpenses.filter(expense => selectedExpenses.has(expense.id));
    }, [selectedExpenses, filteredExpenses]);

    // Modal state
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const remainingBalance = accountBalance - totalSelectedAmount;

    const handleApprove = () => {
        if (selectedExpenses.size === 0) return;
        setIsApproveModalOpen(true);
    };

    const handleConfirmApprove = async () => {
        try {
            await Promise.all(
                Array.from(selectedExpenses).map(id =>
                    projectAPI.updateExpenseStatus(id, { internal_status: 'VP อนุมัติแล้ว ส่งเบิกได้' })
                )
            );

            const res = await projectAPI.getAllExpenses();
            const mapped = res.data.map(e => ({
                id: e.id,
                projectCode: e.project_code,
                expenseCode: e.account_code,
                account_title: e.account_title,
                title: e.title || e.description,
                description: e.description,
                recipient: e.recipient,
                internal_status: e.internal_status,
                paymentDate: e.payment_date || e.due_date,
                issueDate: e.issue_date,
                netAmount: parseFloat(e.net_amount) || 0,
                priceAmount: parseFloat(e.price) || 0,
                vatAmount: parseFloat(e.vat_amount) || 0,
                whtAmount: parseFloat(e.wht_amount) || 0,
                attachments: e.attachments || [],
                createdAt: e.created_at,
                category_type: e.expense_type,
                expense_type: e.expense_type,
                contact: e.contact,
                bill_header: e.bill_header,
                payback_to: e.payback_to,
                reject_reason: e.reject_reason
            }));
            setExpenses(mapped);
            setSelectedExpenses(new Set());
            setIsApproveModalOpen(false);
            toast.success(`อนุมัติ ${selectedExpenses.size} รายการเรียบร้อย`);
        } catch (err) {
            console.error("Failed to approve", err);
            toast.error("ไม่สามารถอนุมัติรายการได้");
        }
    };

    const handlePaymentCycleChange = async (expenseId, newPaymentDate) => {
        try {
            await projectAPI.updateExpense(expenseId, { payment_date: newPaymentDate });
            const res = await projectAPI.getAllExpenses();
            const mapped = res.data.map(e => ({
                id: e.id,
                projectCode: e.project_code,
                expenseCode: e.account_code,
                account_title: e.account_title,
                title: e.title || e.description,
                description: e.description,
                recipient: e.recipient,
                internal_status: e.internal_status,
                paymentDate: e.payment_date || e.due_date,
                issueDate: e.issue_date,
                netAmount: parseFloat(e.net_amount) || 0,
                priceAmount: parseFloat(e.price) || 0,
                vatAmount: parseFloat(e.vat_amount) || 0,
                whtAmount: parseFloat(e.wht_amount) || 0,
                attachments: e.attachments || [],
                createdAt: e.created_at,
                category_type: e.expense_type,
                expense_type: e.expense_type,
                contact: e.contact,
                bill_header: e.bill_header,
                payback_to: e.payback_to,
                reject_reason: e.reject_reason
            }));
            setExpenses(mapped);
            toast.success('อัปเดตรอบจ่ายเรียบร้อย');
        } catch (err) {
            console.error("Failed to update payment cycle", err);
            toast.error("ไม่สามารถอัปเดตรอบจ่ายได้");
        }
    };

    const handleOpenRejectModal = (expense) => {
        setExpenseToReject(expense);
        setIsRejectModalOpen(true);
    };

    const handleConfirmReject = async (expenseId, reason) => {
        setIsRejecting(true);
        try {
            await projectAPI.updateExpenseStatus(expenseId, {
                internal_status: 'reject ยกเลิก / รอแก้ไข',
                reject_reason: reason,
                rejected_at: new Date().toISOString()
            });

            const res = await projectAPI.getAllExpenses();
            const mapped = res.data.map(e => ({
                id: e.id,
                projectCode: e.project_code,
                expenseCode: e.account_code,
                account_title: e.account_title,
                title: e.title || e.description,
                description: e.description,
                recipient: e.recipient,
                internal_status: e.internal_status,
                paymentDate: e.payment_date || e.due_date,
                issueDate: e.issue_date,
                netAmount: parseFloat(e.net_amount) || 0,
                priceAmount: parseFloat(e.price) || 0,
                vatAmount: parseFloat(e.vat_amount) || 0,
                whtAmount: parseFloat(e.wht_amount) || 0,
                attachments: e.attachments || [],
                createdAt: e.created_at,
                category_type: e.expense_type,
                expense_type: e.expense_type,
                contact: e.contact,
                bill_header: e.bill_header,
                payback_to: e.payback_to,
                reject_reason: e.reject_reason
            }));
            setExpenses(mapped);
            setIsRejectModalOpen(false);
            setExpenseToReject(null);
            toast.success('ปฏิเสธรายการเรียบร้อย');
        } catch (err) {
            console.error("Failed to reject", err);
            toast.error("ไม่สามารถปฏิเสธรายการได้");
        } finally {
            setIsRejecting(false);
        }
    };

    const isPaidTab = activeTab === 'paid';

    const renderExpenses = () => {
        if (filteredExpenses.length === 0) {
            return (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <p className="text-gray-500">ไม่มีรายการ{activeTab === 'pending' ? 'รออนุมัติ' : activeTab === 'paid' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ'}ในระบบ</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-4">
                {groupedExpenses.map((paymentCycle, index) => {
                    const allExpenses = paymentCycle.expenses;
                    const isAllSelected = allExpenses.every(e => selectedExpenses.has(e.id));
                    const isSomeSelected = allExpenses.some(e => selectedExpenses.has(e.id)) && !isAllSelected;
                    const cycleKey = paymentCycle.paymentDate;
                    const isExpanded = expandedPaymentCycles.has(cycleKey);

                    return (
                        <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                            {/* Payment Cycle Header */}
                            <div className="p-4 px-5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center">
                                        {!isPaidTab && activeTab !== 'rejected' && (
                                            <input
                                                type="checkbox"
                                                checked={!!isAllSelected}
                                                ref={el => {
                                                    if (el) el.indeterminate = isSomeSelected;
                                                }}
                                                onChange={() => handleTogglePaymentCycle(allExpenses)}
                                                className="w-4 h-4 cursor-pointer accent-blue-600"
                                            />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                        <span className="text-sm font-bold text-gray-900">
                                            {formatPaymentDate(paymentCycle.paymentDate)}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        ({allExpenses.length} รายการ)
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 text-[16px] text-gray-600">
                                        Total <span className="font-bold text-red-600">฿{formatNumber(paymentCycle.total)}</span>
                                    </div>
                                    <button
                                        onClick={() => handleToggleExpand(cycleKey)}
                                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                        >
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Expense Cards */}
                            {isExpanded && (
                                <div className="divide-y divide-gray-100">
                                    {allExpenses.map((expense) => (
                                        <ExpenseCard
                                            key={expense.id}
                                            data={expense}
                                            project={projectMap[expense.projectCode]}
                                            isSelected={selectedExpenses.has(expense.id)}
                                            onToggle={() => handleToggleExpense(expense.id)}
                                            onPaymentCycleChange={handlePaymentCycleChange}
                                            onReject={!isPaidTab && activeTab !== 'rejected' ? handleOpenRejectModal : null}
                                            isSelectionEnabled={!isPaidTab && activeTab !== 'rejected'}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto">
            {/* Page Header */}
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">อนุมัติเบิกจ่าย</h1>
                <Link
                    to="/expenses"
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
                >
                    <List className="w-4 h-4" />
                    กลับรายการค่าใช้จ่าย
                </Link>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 bg-gray-100/50 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'pending'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    รออนุมัติ ({expenses.filter(e => e.internal_status === 'บัญชีตรวจ และ ได้รับเอกสารตัวจริง').length})
                </button>
                <button
                    onClick={() => setActiveTab('paid')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'paid'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    อนุมัติแล้ว ({expenses.filter(e => APPROVED_STATUSES.includes(e.internal_status)).length})
                </button>
                <button
                    onClick={() => setActiveTab('rejected')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'rejected'
                        ? 'bg-white text-red-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    ไม่อนุมัติ ({expenses.filter(e => e.internal_status === REJECTED_STATUS).length})
                </button>
            </div>

            {/* Content */}
            {activeTab === 'pending' ? (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
                    <div>
                        {renderExpenses()}
                    </div>
                    <div className="lg:col-span-1 lg:sticky lg:top-8 h-fit space-y-6">
                        <Summary
                            totalSelectedAmount={totalSelectedAmount}
                            selectedCount={selectedExpenses.size}
                            onApprove={handleApprove}
                            incomes={incomes}
                            accountBalance={accountBalance}
                            isPaidTab={isPaidTab}
                        />
                    </div>
                </div>
            ) : (
                <div className="w-full">
                    {renderExpenses()}
                </div>
            )}

            {/* Modals */}
            <ApproveConfirmModal
                isOpen={isApproveModalOpen}
                onClose={() => setIsApproveModalOpen(false)}
                onConfirm={handleConfirmApprove}
                expenses={selectedExpensesList}
                totalAmount={totalSelectedAmount}
                remainingBalance={remainingBalance}
            />

            <RejectExpenseModal
                isOpen={isRejectModalOpen}
                onClose={() => {
                    setIsRejectModalOpen(false);
                    setExpenseToReject(null);
                }}
                onConfirm={handleConfirmReject}
                expense={expenseToReject}
                isLoading={isRejecting}
            />
        </div>
    );
};

export default Approval;
