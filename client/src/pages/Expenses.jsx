import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PaymentCycleExpenseCard from '../components/finance/PaymentCycleExpenseCard';
import Summary from '../components/finance/Summary';
import ApproveConfirmModal from '../components/finance/ApproveConfirmModal';
import RejectExpenseModal from '../components/modals/RejectExpenseModal';
import ExpenseListContent from '../components/finance/ExpenseListContent';
import { projectAPI } from '../services/api';
import { formatNumber } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { List, CheckCircle } from 'lucide-react';

const MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const Expenses = () => {
    const toast = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    // Main view tab: 'list' | 'approval'
    const activeView = searchParams.get('view') || 'list';
    const setActiveView = (view) => setSearchParams({ view });

    // Raw expenses from API (for List view)
    const [rawExpenses, setRawExpenses] = useState([]);
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

                await fetchBalance(); // Fetch balance

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

                // Map Expenses with enhanced data for new card layout
                const mapped = expRes.data.map(e => {
                    const priceAmt = parseFloat(e.price) || 0;
                    const whtAmt = parseFloat(e.wht_amount) || 0;
                    const vatAmt = parseFloat(e.vat_amount) || 0;
                    return {
                        id: e.id,
                        projectCode: e.project_code,
                        expenseCode: e.account_code,  // DB column is account_code
                        account_title: e.account_title, // From JOIN with account_codes
                        expenseCategory: e.expense_category,
                        title: e.title || e.description,
                        description: e.description,
                        recipient: e.recipient,
                        status: e.status,
                        paymentDate: e.payment_date || e.due_date, // Try due_date if no payment_date
                        issueDate: e.issue_date,
                        netAmount: parseFloat(e.net_amount) || 0,
                        priceAmount: priceAmt,
                        vatAmount: vatAmt,
                        whtAmount: whtAmt,
                        attachments: e.attachments || [],
                        createdAt: e.created_at,
                        // New fields for card layout
                        category_type: e.expense_type,
                        expense_type: e.expense_type,
                        contact: e.contact,
                        bill_header: e.bill_header,
                        payback_to: e.payback_to,
                    };
                });
                setExpenses(mapped);
                setRawExpenses(expRes.data); // Store raw data for List view

                // Map Incomes for Calendar
                const mappedIncomes = incRes.data.map(i => ({
                    id: i.id,
                    projectCode: i.project_code,
                    title: i.title,
                    amount: parseFloat(i.amount),
                    date: i.date ? (() => {
                        const d = new Date(i.date);
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    })() : '', // Format YYYY-MM-DD using local time
                    type: 'Event', // Default or fetch type if available. 
                    // Does income API return type? 
                    // Backend incomes table has no specific 'type' column other than linking to project?
                    // mockIncomes had `type`. 
                    // We might need to derive type from project? 
                    // `FinancialCalendar` filters by type.
                    // For now, let's try to derive from projectMap[i.project_code].projectType
                }));
                // We need projectMap to be available. But we set it in same render. 
                // Better to map inside render or use effect? 
                // Map simply here. Type logic:
                const enhancedIncomes = mappedIncomes.map(inc => {
                    const p = pMap[inc.projectCode];
                    return { ...inc, type: p ? p.projectType : 'Other' }; // Use project type as income type
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

    // Format payment date to readable string
    const formatPaymentDate = (dateString) => {
        if (!dateString || dateString === 'No Date') return "No Payment Cycle";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";

        const day = date.getDate();
        const month = MONTHS[date.getMonth()];
        const year = date.getFullYear(); // User requested 2025/2026 format which is CE. If BE is needed, +543. 
        // User example: "5 พฤศจิกายน 2025". This is CE year.
        return `รอบจ่าย ${day} ${month} ${year}`;
    };

    // Filter expenses based on active tab
    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => {
            const isPaid = e.status === 'จ่ายแล้ว' || e.status === 'Paid';
            const isRejected = e.status === 'ไม่อนุมัติ' || e.status === 'Rejected';

            if (activeTab === 'paid') return isPaid;
            if (activeTab === 'rejected') return isRejected;
            // pending tab: anything NOT paid and NOT rejected
            return !isPaid && !isRejected;
        });
    }, [expenses, activeTab]);

    // Grouping Logic (Re-implemented from helper)
    const groupedExpenses = useMemo(() => {
        if (!filteredExpenses.length) return [];

        // 1. Group by Payment Date
        const byDate = filteredExpenses.reduce((acc, expense) => {
            let dateKey = 'No Date';
            if (expense.paymentDate) {
                const date = new Date(expense.paymentDate);
                // Extract YYYY-MM-DD in local time
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                dateKey = `${year}-${month}-${day}`;
            }

            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(expense);
            return acc;
        }, {});

        // 2. Sort dates ascending (nearest date first - เรียงจากวันใกล้สุดไปไกลสุด)
        const sortedDates = Object.keys(byDate).sort((a, b) => {
            // Handle 'No Date' specially - put at the end
            if (a === 'No Date') return 1;
            if (b === 'No Date') return -1;
            return new Date(a) - new Date(b);
        });

        // 3. Structure for display - Direct expenses (no project grouping)
        return sortedDates.map(date => {
            const dateExpenses = byDate[date];

            // Sort by project code for visual consistency
            const sortedExpenses = [...dateExpenses].sort((a, b) =>
                (a.projectCode || '').localeCompare(b.projectCode || '')
            );

            // Calculate total for this cycle
            const cycleTotal = sortedExpenses.reduce((sum, e) => sum + e.netAmount, 0);

            return {
                paymentDate: date,
                expenses: sortedExpenses,
                total: cycleTotal
            };
        });
    }, [filteredExpenses]);

    // Initialize all payment cycles as expanded when data loads
    useEffect(() => {
        if (groupedExpenses.length > 0) {
            const allCycles = new Set(groupedExpenses.map((_, index) => index));
            setExpandedPaymentCycles(allCycles);
        }
    }, [groupedExpenses.length]); // Dependency on length ensures run once after grouping

    const handleToggleExpense = (id) => {
        const newSelected = new Set(selectedExpenses);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedExpenses(newSelected);
    };

    // Handle payment cycle change for individual expense
    const handlePaymentCycleChange = async (expenseId, newDateKey) => {
        try {
            await projectAPI.updateExpenseStatus(expenseId, { payment_date: newDateKey });
            // Refresh expenses
            const res = await projectAPI.getAllExpenses();
            const mapped = res.data.map(e => {
                const priceAmt = parseFloat(e.price) || 0;
                const whtAmt = parseFloat(e.wht_amount) || 0;
                const vatAmt = parseFloat(e.vat_amount) || 0;
                return {
                    id: e.id,
                    projectCode: e.project_code,
                    expenseCode: e.account_code,
                    expenseCategory: e.expense_category,
                    title: e.title || e.description,
                    description: e.description,
                    recipient: e.recipient,
                    status: e.status,
                    paymentDate: e.payment_date,
                    issueDate: e.issue_date,
                    netAmount: parseFloat(e.net_amount) || 0,
                    priceAmount: priceAmt,
                    vatAmount: vatAmt,
                    whtAmount: whtAmt,
                    attachments: e.attachments || []
                };
            });
            setExpenses(mapped);
        } catch (err) {
            console.error('Failed to update payment cycle', err);
        }
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

    const handleToggleExpand = (index) => {
        const newExpanded = new Set(expandedPaymentCycles);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedPaymentCycles(newExpanded);
    };

    const totalSelectedAmount = useMemo(() => {
        return filteredExpenses
            .filter(expense => selectedExpenses.has(expense.id))
            .reduce((sum, expense) => sum + expense.netAmount, 0);
    }, [selectedExpenses, filteredExpenses]);

    // Get selected expense objects for the modal
    const selectedExpensesList = useMemo(() => {
        return filteredExpenses.filter(expense => selectedExpenses.has(expense.id));
    }, [selectedExpenses, filteredExpenses]);

    // Modal state
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

    // Account balance
    const [accountBalance, setAccountBalance] = useState(0);
    const remainingBalance = accountBalance - totalSelectedAmount;

    // Handle approve button click - opens modal
    const handleApprove = () => {
        if (selectedExpenses.size === 0) return;
        setIsApproveModalOpen(true);
    };

    // Handle confirm approval from modal
    const handleConfirmApprove = async () => {
        try {
            // Call API to update status for all selected expenses
            // Parallel requests
            await Promise.all(
                Array.from(selectedExpenses).map(id =>
                    projectAPI.updateExpenseStatus(id, { status: 'จ่ายแล้ว' }) // Or 'อนุมัติจ่าย' based on workflow
                )
            );

            // Refresh data
            const res = await projectAPI.getAllExpenses();
            const mapped = res.data.map(e => ({
                id: e.id,
                projectCode: e.project_code,
                title: e.title || e.description,
                description: e.description,
                recipient: e.recipient,
                status: e.status,
                paymentDate: e.payment_date,
                netAmount: parseFloat(e.net_amount) || 0,
                vatAmount: parseFloat(e.vat_amount) || 0,
                whtAmount: parseFloat(e.wht_amount) || 0,
                priceAmount: parseFloat(e.price) || 0,
                attachments: e.attachments || []
            }));
            setExpenses(mapped); // Quick refresh locally

            // Refresh balance
            await fetchBalance();

            setIsApproveModalOpen(false);
            setSelectedExpenses(new Set());
            toast.success("อนุมัติเบิกจ่ายสำเร็จ!");
        } catch (err) {
            console.error("Failed to approve", err);
            toast.error("ไม่สามารถอนุมัติรายการได้");
        }
    };

    // Handle opening reject modal
    const handleOpenRejectModal = (expense) => {
        setExpenseToReject(expense);
        setIsRejectModalOpen(true);
    };

    // Handle confirm rejection with reason
    const handleConfirmReject = async (expenseId, reason) => {
        setIsRejecting(true);
        try {
            await projectAPI.updateExpenseStatus(expenseId, {
                status: 'ไม่อนุมัติ',
                reject_reason: reason
            });

            // Refresh expenses
            const res = await projectAPI.getAllExpenses();
            const mapped = res.data.map(e => {
                const priceAmt = parseFloat(e.price) || 0;
                const whtAmt = parseFloat(e.wht_amount) || 0;
                return {
                    id: e.id,
                    projectCode: e.project_code,
                    expenseCode: e.account_code,
                    account_title: e.account_title,
                    title: e.title || e.description,
                    description: e.description,
                    recipient: e.recipient,
                    status: e.status,
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

            setIsRejectModalOpen(false);
            setExpenseToReject(null);
            toast.success("ไม่อนุมัติรายการเรียบร้อยแล้ว");
        } catch (err) {
            console.error("Failed to reject", err);
            toast.error("ไม่สามารถดำเนินการได้");
        } finally {
            setIsRejecting(false);
        }
    };

    const renderExpenses = () => {
        if (filteredExpenses.length === 0) {
            return (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <p className="text-gray-500">ไม่มีรายการ{activeTab === 'pending' ? 'รออนุมัติ' : 'อนุมัติแล้ว'}ในระบบ</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-4">
                {groupedExpenses.map((paymentCycle, index) => {
                    const allExpenses = paymentCycle.expenses;
                    const isAllSelected = allExpenses.every(e => selectedExpenses.has(e.id));
                    const isSomeSelected = allExpenses.some(e => selectedExpenses.has(e.id)) && !isAllSelected;
                    const isExpanded = expandedPaymentCycles.has(index);

                    return (
                        <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                            {/* Payment Cycle Header */}
                            <div
                                className="p-4 px-5 bg-gray-50 border-b border-gray-200 flex justify-between items-center"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center">
                                        {!isPaidTab && (
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
                                    <div className="text-sm text-gray-600">
                                        Total <span className="font-bold text-red-600 bg-white border border-gray-200 px-2 py-1 rounded-md ml-1">฿{formatNumber(paymentCycle.total)}</span>
                                    </div>
                                    <button
                                        onClick={() => handleToggleExpand(index)}
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

                            {/* Expense Cards within Payment Cycle */}
                            {isExpanded && (
                                <div className="divide-y divide-gray-100">
                                    {allExpenses.map((expense) => (
                                        <PaymentCycleExpenseCard
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

    const isPaidTab = activeTab === 'paid';

    if (isLoading) {
        return <div className="p-8 text-center">Loading expenses...</div>;
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">ค่าใช้จ่าย</h1>
                <p className="text-sm text-gray-500 mt-1">จัดการและอนุมัติรายการค่าใช้จ่ายทั้งหมด</p>
            </div>

            {/* Main View Tab Navigation */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveView('list')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeView === 'list'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    <List className="w-4 h-4" />
                    รายการค่าใช้จ่าย
                </button>
                <button
                    onClick={() => setActiveView('approval')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeView === 'approval'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    <CheckCircle className="w-4 h-4" />
                    อนุมัติเบิกจ่าย
                </button>
            </div>

            {/* View Content */}
            {activeView === 'list' ? (
                <ExpenseListContent
                    expenses={rawExpenses}
                    onRefresh={async () => {
                        const res = await projectAPI.getAllExpenses();
                        const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                        setRawExpenses(sorted);
                    }}
                    isLoading={isLoading}
                />
            ) : (
                /* Approval View */
                <>

                    {/* Tab Navigation */}
                    <div className="flex gap-2 mb-6 bg-gray-100/50 p-1 rounded-xl w-fit">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'pending'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            รออนุมัติ ({expenses.filter(e => e.status !== 'จ่ายแล้ว' && e.status !== 'Paid' && e.status !== 'ไม่อนุมัติ' && e.status !== 'Rejected').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('paid')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'paid'
                                ? 'bg-white text-emerald-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            อนุมัติแล้ว ({expenses.filter(e => e.status === 'จ่ายแล้ว' || e.status === 'Paid').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('rejected')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'rejected'
                                ? 'bg-white text-red-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            ไม่อนุมัติ ({expenses.filter(e => e.status === 'ไม่อนุมัติ' || e.status === 'Rejected').length})
                        </button>
                    </div>

                    {activeTab === 'pending' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
                            <div>
                                {renderExpenses()}
                            </div>

                            {/* Summary Section */}
                            <div className="lg:col-span-1 lg:sticky lg:top-8 h-fit space-y-6">
                                <Summary
                                    totalSelectedAmount={totalSelectedAmount}
                                    selectedCount={selectedExpenses.size}
                                    onApprove={handleApprove}
                                    incomes={incomes} // Pass incomes
                                    accountBalance={accountBalance} // Pass balance
                                    isPaidTab={isPaidTab} // Pass tab state
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="w-full">
                            {renderExpenses()}
                        </div>
                    )}


                    {/* Approve Confirmation Modal */}
                    <ApproveConfirmModal
                        isOpen={isApproveModalOpen}
                        onClose={() => setIsApproveModalOpen(false)}
                        onConfirm={handleConfirmApprove}
                        expenses={selectedExpensesList}
                        totalAmount={totalSelectedAmount}
                        remainingBalance={remainingBalance}
                    />

                    {/* Reject Expense Modal */}
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
                </>
            )}
        </div>
    );
};

export default Expenses;
