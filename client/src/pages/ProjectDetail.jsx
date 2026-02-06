import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, Info, TrendingUp, TrendingDown, Calendar, MapPin, Building2, Briefcase, Users, Link2, ExternalLink } from 'lucide-react';
import { STATUS_DATA } from '../constants/expenseStatus';
import { projectAPI } from '../services/api';
import { formatNumber, formatDate, formatDateCE } from '../utils/formatters';
import IncomeModal from '../components/finance/IncomeModal';
import ExpenseModal from '../components/finance/ExpenseModal';
import ProjectModal from '../components/projects/ProjectModal';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import FileRepository from '../components/common/FileRepository';
import AttachmentPreview from '../components/common/AttachmentPreview';
import { useSettings } from '../contexts/SettingsContext';
import StatusBadge from '../components/common/StatusBadge';
import Dropdown from '../components/common/Dropdown';
import { useToast } from '../components/common/ToastProvider';
import ExpenseListContent from '../components/finance/ExpenseListContent';
import TransactionStatusModal from '../components/projects/TransactionStatusModal';
import ProjectsCharts from '../components/projects/ProjectsCharts';
import ProjectDateModal from '../components/projects/ProjectDateModal';
import { Clock, CheckCircle2, MoreVertical } from 'lucide-react';

const ProjectDetail = () => {
    const toast = useToast();
    const { getColorsByProjectType, getProjectStatusOptions } = useSettings();
    const { projectCode } = useParams();
    const navigate = useNavigate();

    // Data States
    const [project, setProject] = useState(null);
    const [projectIncomes, setProjectIncomes] = useState([]);
    const [projectExpenses, setProjectExpenses] = useState([]);
    const [primaryAccount, setPrimaryAccount] = useState(null);
    const [products, setProducts] = useState([]); // [NEW] Store products for name lookup
    const [isLoading, setIsLoading] = useState(true);

    // UI States
    const [activeTab, setActiveTab] = useState('overview');
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, data: null });
    const [isEditIncomeModalOpen, setIsEditIncomeModalOpen] = useState(false);
    const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);
    const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
    const [selectedIncome, setSelectedIncome] = useState(null);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [selectedAttachments, setSelectedAttachments] = useState([]);
    // [NEW] Status Change Confirmation State
    const [pendingStatusChange, setPendingStatusChange] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Project Date Modal State
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    // Filters for Income/Expense tabs
    const [incomeSearch, setIncomeSearch] = useState('');
    const [incomeStatusFilter, setIncomeStatusFilter] = useState('all');
    const [expenseSearch, setExpenseSearch] = useState('');
    const [expenseStatusFilter, setExpenseStatusFilter] = useState('all');


    const fetchProjectData = async () => {
        setIsLoading(true);
        try {
            // Parallel fetch
            const [projectRes, incomesRes, expensesRes, accountsRes, productsRes] = await Promise.all([
                projectAPI.getProject(projectCode),
                projectAPI.getIncomesByProject(projectCode),
                projectAPI.getExpensesByProject(projectCode),
                projectAPI.getAllAccounts(),
                projectAPI.getAllProducts()
            ]);

            // Map DB keys to Frontend keys if necessary
            const p = projectRes.data;
            const mappedProject = {
                projectCode: p.project_code,
                projectName: p.project_name,
                projectType: p.project_type,
                productCode: p.product_code,
                company: p.customer_name,
                status: p.status,
                startDate: p.start_date,
                endDate: p.end_date,
                location: p.location,
                description: p.description,
                budget: p.budget ? parseFloat(p.budget) : null,
                participantCount: p.participant_count,
                teamMembers: (p.team_members || []).map(tm => ({
                    id: tm.member_id, // Use member_id as unique key for list
                    member_id: tm.member_id,
                    member: {
                        id: tm.member_id,
                        name: tm.name,
                        nickname: tm.nickname
                    },
                    role: tm.role,
                    rate: tm.rate,
                    status: tm.status
                })),
                externalLinks: p.external_links ? JSON.parse(p.external_links) : [],
                dates: p.dates || []
            };

            setProject(mappedProject);
            setProducts(productsRes.data || []);

            // The API returns snake_case for DB columns. 
            // Let's create a quick mapper or adjust the UI to use snake_case.
            // For safety/speed, I'll map to camelCase to match existing UI code.
            setProjectExpenses(expensesRes.data);

            const mappedIncomes = incomesRes.data.map(i => ({
                id: i.id,
                projectCode: i.project_code,
                description: i.description,
                invoiceNo: i.invoice_no,
                due_date: i.due_date,
                amount: parseFloat(i.amount),
                status: i.status,
                financial_account_id: i.financial_account_id,
                attachments: i.attachments || []
            }));
            setProjectIncomes(mappedIncomes);

            // [NEW] Set Primary Account
            const primary = accountsRes.data.find(acc => acc.is_primary) || accountsRes.data[0];
            setPrimaryAccount(primary);

        } catch (error) {
            console.error("Failed to fetch project data", error);
            // toast.error("Could not load project data");
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        if (projectCode) {
            fetchProjectData();
        }
    }, [projectCode, refreshKey]);

    const totalExpenseAmount = React.useMemo(() => projectExpenses.reduce((sum, e) => sum + (parseFloat(e.net_amount) || 0), 0), [projectExpenses]);
    const totalIncomeAmount = React.useMemo(() => projectIncomes.reduce((sum, i) => sum + (i.amount || 0), 0), [projectIncomes]);

    const projectTeam = project ? project.teamMembers : [];
    // const activities = useMemo(() => getActivitiesByProject(projectCode), [projectCode]);
    const activities = [];

    // Helper to get product name
    const getProductName = (code) => {
        const product = products.find(p => p.code === code);
        return product ? product.name : code;
    };

    // Filtered incomes
    const filteredIncomes = React.useMemo(() => {
        return projectIncomes.filter(income => {
            const matchesSearch = incomeSearch === '' ||
                (income.description || '').toLowerCase().includes(incomeSearch.toLowerCase());
            const matchesStatus = incomeStatusFilter === 'all' || income.status === incomeStatusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [projectIncomes, incomeSearch, incomeStatusFilter]);

    // Filtered expenses
    const filteredExpenses = React.useMemo(() => {
        return projectExpenses.filter(expense => {
            const matchesSearch = expenseSearch === '' ||
                (expense.account_title || '').toLowerCase().includes(expenseSearch.toLowerCase()) ||
                (expense.description || '').toLowerCase().includes(expenseSearch.toLowerCase()) ||
                (expense.contact || '').toLowerCase().includes(expenseSearch.toLowerCase()) ||
                (expense.account_code || '').toLowerCase().includes(expenseSearch.toLowerCase());
            const matchesStatus = expenseStatusFilter === 'all' || expense.internal_status === expenseStatusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [projectExpenses, expenseSearch, expenseStatusFilter]);

    // Collect all attachments from expenses and incomes
    const allAttachments = useMemo(() => {
        const docs = [];
        projectExpenses.forEach(e => {
            if (e.attachments?.length) {
                e.attachments.forEach(a => docs.push({ ...a, source: 'expense', sourceTitle: e.title }));
            }
        });
        projectIncomes.forEach(i => {
            if (i.attachments?.length) {
                i.attachments.forEach(a => docs.push({ ...a, source: 'income', sourceTitle: i.description }));
            }
        });
        return docs;
    }, [projectExpenses, projectIncomes]);

    const handleAddIncome = async (newIncome) => {
        try {
            await projectAPI.createIncome({
                project_code: projectCode,
                description: newIncome.description,
                due_date: newIncome.due_date,
                amount: newIncome.amount,
                status: newIncome.status || 'pending',
                financial_account_id: newIncome.financial_account_id
            });
            setRefreshKey(p => p + 1);
            setIsIncomeModalOpen(false);
            toast.success('เพิ่มรายรับสำเร็จ');
        } catch (err) {
            console.error(err);
            toast.error('Failed to create income');
        }
    };

    const handleAddExpense = async (newExpense, attachments = []) => {
        try {
            const res = await projectAPI.createExpense({
                ...newExpense,
                created_by: 1
            });

            console.log('✅ Expense Created:', res);
            const expenseId = res.data?.id;

            if (!expenseId) {
                console.error('❌ Error: Expense ID missing in response', res.data);
                toast.error('Internal Error: Could not upload attachments (Missing ID)');
            } else {
                // Handle Attachments
                console.log('📦 handleAddExpense Attachments:', attachments);
                if (attachments && attachments.length > 0) {
                    const uploadPromises = attachments.map((file, i) => {
                        if (!file) console.error(`❌ Attachment [${i}] is null/undefined!`);
                        console.log(`📄 Processing Attachment [${i}]:`, file);
                        const formData = new FormData();
                        formData.append('files', file);
                        return projectAPI.uploadExpenseAttachment(expenseId, formData);
                    });

                    await Promise.all(uploadPromises);
                }
            }

            setRefreshKey(p => p + 1);
            toast.success('เพิ่มรายจ่ายสำเร็จ');
        } catch (err) {
            console.error(err);
            toast.error('Failed to create expense');
        }
    };

    const handleEditIncome = (income) => { setSelectedIncome(income); setIsEditIncomeModalOpen(true); };
    const handleEditExpense = (expense) => { setSelectedExpense(expense); setIsEditExpenseModalOpen(true); };

    const handleUpdateIncome = async (updated) => {
        if (!selectedIncome) return;
        try {
            await projectAPI.updateIncome(selectedIncome.id, {
                description: updated.description,
                due_date: updated.due_date,
                amount: updated.amount,
                status: updated.status,
                financial_account_id: updated.financial_account_id
            });
            setRefreshKey(p => p + 1);
            setIsEditIncomeModalOpen(false);
            toast.success('อัปเดตรายรับสำเร็จ');
        } catch (err) {
            console.error(err);
            toast.error('Failed to update income');
        }
    };
    const executeDeleteIncome = async (id) => {
        try {
            await projectAPI.deleteIncome(id);
            setRefreshKey(p => p + 1);
            toast.success('ลบรายรับสำเร็จ');
            setDeleteModal({ isOpen: false, type: null, data: null });
        } catch (err) {
            toast.error('Failed to delete income');
        }
    };

    const requestDeleteIncome = (income) => {
        setDeleteModal({
            isOpen: true,
            type: 'income',
            data: income
        });
    };

    const handleDeleteIncomeLegacy = (id) => executeDeleteIncome(id);
    const handleUpdateExpense = async (updated) => {
        if (!selectedExpense) return;
        try {
            await projectAPI.updateExpense(selectedExpense.id, updated);
            setRefreshKey(p => p + 1);
            setIsEditExpenseModalOpen(false);
            setSelectedExpense(null);
            toast.success('อัปเดตรายจ่ายสำเร็จ');
        } catch (err) {
            console.error(err);
            toast.error('Failed to update expense');
        }
    };
    const executeDeleteExpense = async (id) => {
        try {
            await projectAPI.deleteExpense(id);
            setRefreshKey(p => p + 1);
            toast.success('ลบรายจ่ายสำเร็จ');
            setDeleteModal({ isOpen: false, type: null, data: null });
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete expense');
        }
    };

    const requestDeleteExpense = (expense) => {
        setDeleteModal({
            isOpen: true,
            type: 'expense',
            data: expense
        });
    };

    // Forward compatibility for EditModal which expects direct delete
    // But ideally EditModal has its own confirmation too.
    const handleDeleteExpenseLegacy = (id) => executeDeleteExpense(id);

    // [MODIFIED] Intercept Status Change for Income
    const handleUpdateIncomeStatus = async (incomeId, newStatus) => {
        const income = projectIncomes.find(i => i.id === incomeId);
        if (!income) return;

        // Open Confirmation Modal
        setPendingStatusChange({
            type: 'income',
            id: incomeId,
            oldStatus: income.status,
            newStatus: newStatus,
            amount: income.amount,
            itemTitle: income.description,
            data: income // keep full data for update
        });
    };

    // [MODIFIED] Intercept Status Change for Expense
    const handleUpdateExpenseStatus = async (expenseId, newStatus) => {
        const expense = projectExpenses.find(e => e.id === expenseId);
        if (!expense) return;

        // Open Confirmation Modal
        setPendingStatusChange({
            type: 'expense',
            id: expenseId,
            oldStatus: expense.internal_status,
            newStatus: newStatus,
            amount: expense.net_amount,
            itemTitle: expense.account_title || expense.description
        });
    };

    // [NEW] Actual Execution of Status Change
    const confirmStatusChange = async () => {
        if (!pendingStatusChange) return;

        try {
            if (pendingStatusChange.type === 'income') {
                const income = pendingStatusChange.data;
                await projectAPI.updateIncome(pendingStatusChange.id, {
                    ...income,
                    description: income.description,
                    invoice_no: income.invoiceNo,
                    date: income.date,
                    amount: income.amount,
                    status: pendingStatusChange.newStatus
                });
            } else if (pendingStatusChange.type === 'expense') {
                await projectAPI.updateExpenseStatus(pendingStatusChange.id, {
                    internal_status: pendingStatusChange.newStatus
                });
            }

            setRefreshKey(p => p + 1);
            toast.success(`เปลี่ยนสถานะเรียบร้อย`);
            setPendingStatusChange(null); // Close
        } catch {
            console.error("Failed to update status");
            toast.error("Failed to update status");
        }
    };

    const handleViewAttachments = (attachments) => {
        setSelectedAttachments(attachments);
        setIsAttachmentsModalOpen(true);
    };

    const expenseStatusOptions = STATUS_DATA;


    const handleUpdateProjectStatus = async (newStatus) => {
        try {
            await projectAPI.updateProject(projectCode, { status: newStatus });
            setRefreshKey(p => p + 1);
            toast.success(`เปลี่ยนสถานะโปรเจคเป็น ${newStatus}`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update project status');
        }
    };

    const handleEditProject = async (updated) => {
        try {
            await projectAPI.updateProject(projectCode, updated);
            setRefreshKey(p => p + 1);
            toast.success('อัปเดตโปรเจคสำเร็จ');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update project');
        }
    };

    const handleDeleteProject = async () => {
        try {
            await projectAPI.deleteProject(projectCode);
            toast.success('ลบโปรเจคสำเร็จ');
            navigate('/projects');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete project');
        }
    };

    const incomeStatusOptions = [
        { value: 'pending', label: 'รอรับ', color: 'yellow' },
        { value: 'received', label: 'ได้รับแล้ว', color: 'emerald' }
    ];



    if (isLoading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    if (!project) {
        return (
            <div className="p-8 max-w-[1400px] mx-auto">
                <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
                    <p className="text-gray-500">ไม่พบโปรเจคที่ต้องการ</p>
                    <Link to="/projects" className="text-blue-500 hover:underline mt-2 inline-block">กลับไปหน้ารายการโปรเจค</Link>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'projectInfo', label: 'ข้อมูลโปรเจค', icon: <Info className="w-4 h-4" /> },
        { id: 'income', label: 'รายรับ', icon: <TrendingUp className="w-4 h-4" /> },
        { id: 'expense', label: 'รายจ่าย', icon: <TrendingDown className="w-4 h-4" /> }
    ];

    const grossProfit = totalIncomeAmount - totalExpenseAmount;
    const profitMargin = totalIncomeAmount > 0 ? ((grossProfit / totalIncomeAmount) * 100).toFixed(1) : 0;
    const formatBudget = (budget) => budget === null || budget === undefined ? 'N/A' : `฿${formatNumber(budget)}`;
    const budgetUsagePercent = project.budget ? ((totalExpenseAmount / project.budget) * 100).toFixed(1) : null;

    // ===== TAB COMPONENTS =====



    // ===== PROJECT INFO TAB (ตารางงาน) =====
    const ProjectInfoTab = () => {
        // Handlers for Dates
        const handleSaveDate = async (dateData) => {
            try {
                const currentDates = project.dates || [];
                let newDates;

                if (selectedDate) {
                    newDates = currentDates.map(d => d.id === selectedDate.id ? { ...d, ...dateData } : d);
                } else {
                    newDates = [...currentDates, dateData];
                }

                await projectAPI.updateProject(projectCode, { dates: newDates });
                setRefreshKey(prev => prev + 1);
                toast.success(selectedDate ? 'แก้ไขกำหนดการสำเร็จ' : 'เพิ่มกำหนดการสำเร็จ');
                setIsDateModalOpen(false);
                setSelectedDate(null);
            } catch (error) {
                console.error("Failed to save date:", error);
                toast.error("บันทึกกำหนดการล้มเหลว");
            }
        };

        const handleDeleteDate = async (dateId) => {
            if (!window.confirm("ยืนยันการลบกำหนดการนี้?")) return;
            try {
                await projectAPI.deleteProjectDate(dateId);
                setRefreshKey(prev => prev + 1);
                toast.success("ลบกำหนดการสำเร็จ");
            } catch (error) {
                console.error("Failed to delete date:", error);
                toast.error("ลบกำหนดการล้มเหลว");
            }
        };

        const openAddDate = () => {
            setSelectedDate(null);
            setIsDateModalOpen(true);
        };

        const openEditDate = (date) => {
            setSelectedDate(date);
            setIsDateModalOpen(true);
        };

        const sortedDates = [...(project.dates || [])].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Schedule (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header / Toolbar */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            ตารางงาน / กำหนดการ
                        </h2>
                        <button
                            onClick={openAddDate}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            เพิ่มกำหนดการ
                        </button>
                    </div>

                    {/* Date List */}
                    <div className="space-y-4">
                        {sortedDates.length > 0 ? (
                            sortedDates.map((date, index) => {
                                const startDate = new Date(date.start_date);
                                const endDate = date.end_date ? new Date(date.end_date) : startDate;
                                const isSameDay = startDate.toDateString() === endDate.toDateString();

                                return (
                                    <div key={date.id || index} className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all relative">
                                        <div className="flex flex-col md:flex-row gap-6">
                                            {/* Date Box */}
                                            <div className="flex-shrink-0 w-full md:w-48 bg-blue-50/50 rounded-lg p-3 text-center border border-blue-100/50 flex flex-col justify-center">
                                                <span className="text-sm text-blue-600 font-medium mb-1">
                                                    {startDate.toLocaleDateString('th-TH', { weekday: 'long' })}
                                                </span>
                                                <div className="text-3xl font-bold text-gray-800 mb-1">
                                                    {startDate.getDate()}
                                                </div>
                                                <span className="text-sm text-gray-500">
                                                    {startDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                                                </span>
                                                {!isSameDay && (
                                                    <div className="mt-2 pt-2 border-t border-blue-200/50 text-xs text-blue-500">
                                                        ถึง {endDate.getDate()} {endDate.toLocaleDateString('th-TH', { month: 'short' })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-900 mb-2">{date.date_name || date.title || "ไม่มีชื่อกำหนดการ"}</h3>

                                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                                                            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full">
                                                                <Clock className="w-4 h-4 text-gray-400" />
                                                                {startDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                                {date.end_date && ` - ${endDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`}
                                                            </div>
                                                            {date.location && (
                                                                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full">
                                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                                    {date.location}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {date.description && (
                                                            <p className="text-gray-600 text-sm leading-relaxed bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                                                {date.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => openEditDate(date)}
                                                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="แก้ไข"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteDate(date.id)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="ลบ"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <Calendar className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">ยังไม่มีกำหนดการ</h3>
                                <p className="text-gray-500 mb-6">สร้างกำหนดการทำงานสำหรับโปรเจคนี้</p>
                                <button
                                    onClick={openAddDate}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    เพิ่มกำหนดการแรก
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Links & Info (1/3) */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Additional Info Section */}
                    {project.description && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <Info className="w-4 h-4 text-gray-400" />
                                รายละเอียดเพิ่มเติม
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 leading-relaxed border border-gray-200">
                                {project.description}
                            </div>
                        </div>
                    )}

                    {/* External Links */}
                    <div className="sticky top-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-gray-400" />
                            ลิงก์ภายนอก / ไฟล์งาน
                        </h4>
                        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 shadow-sm">
                            <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-md shadow-sm">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Google Drive</p>
                                        <p className="text-xs text-gray-500">เก็บไฟล์และเอกสารของโปรเจค</p>
                                    </div>
                                </div>
                                <button className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-md border border-blue-200 shadow-sm hover:shadow transition-all">
                                    เชื่อมต่อ
                                </button>
                            </div>

                            {project.externalLinks && project.externalLinks.map((link, idx) => (
                                <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100 group">
                                    <div className="p-2 bg-gray-100 text-gray-500 rounded-md group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-sm transition-all">
                                        <Link2 className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{link.title || link.url}</p>
                                        <p className="text-xs text-gray-500 truncate">{link.url}</p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                                </a>
                            ))}
                            {(!project.externalLinks || project.externalLinks.length === 0) && (
                                <button className="w-full py-2 text-xs text-center text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded border border-dashed border-gray-200 transition-colors">
                                    + เพิ่มลิงก์
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Date Modal */}
                <ProjectDateModal
                    isOpen={isDateModalOpen}
                    onClose={() => setIsDateModalOpen(false)}
                    onSubmit={handleSaveDate}
                    dateData={selectedDate}
                    existingDates={project.dates || []}
                />
            </div>
        );
    };

    const IncomeTab = () => (
        <>
            {/* Filter Bar - Matching ExpenseListContent */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {/* Search */}
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ค้นหารายรับ..."
                                value={incomeSearch}
                                onChange={(e) => setIncomeSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center">
                            <Dropdown
                                inline
                                showAllOption
                                label="สถานะ"
                                value={incomeStatusFilter}
                                options={['รอรับ', 'ได้รับแล้ว']}
                                onChange={(v) => setIncomeStatusFilter(v === 'รอรับ' ? 'pending' : v === 'ได้รับแล้ว' ? 'received' : 'all')}
                                allLabel="ทั้งหมด"
                                minWidth="100px"
                                listMinWidth="120px"
                            />
                        </div>

                        {/* Count */}
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                            {filteredIncomes.length} / {projectIncomes.length} รายการ
                        </span>
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={() => setIsIncomeModalOpen(true)}
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        เพิ่มรายรับ
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">รายละเอียด</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">วันคาดการณ์</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">จำนวนเงิน</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ไฟล์แนบ</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะ</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredIncomes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-400">
                                        ไม่พบรายการ
                                    </td>
                                </tr>
                            ) : (
                                filteredIncomes.map((income, idx) => (
                                    <tr
                                        key={income.id || idx}
                                        className={`hover:bg-blue-50/30 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-sm text-gray-900">{income.description || 'รายรับจากโปรเจค'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {formatDateCE(income.due_date) || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-sm font-semibold text-green-600">
                                                ฿{formatNumber(income.amount)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <AttachmentPreview
                                                attachments={income.attachments || []}
                                                onOpenModal={() => handleViewAttachments(income.attachments)}
                                                size="sm"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge
                                                status={income.status}
                                                options={incomeStatusOptions}
                                                onChange={(s) => handleUpdateIncomeStatus(income.id, s)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleEditIncome(income)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                                    title="แก้ไข"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => requestDeleteIncome(income)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    title="ลบ"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>

                        {/* Total Footer */}
                        {filteredIncomes.length > 0 && (
                            <tfoot>
                                <tr className="bg-gray-50/80 border-t border-gray-200">
                                    <td colSpan={2} className="px-4 py-3 text-right">
                                        <span className="text-sm font-medium text-gray-600">รวมทั้งสิ้น</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="text-base font-bold text-green-600">
                                            ฿{formatNumber(totalIncomeAmount)}
                                        </span>
                                    </td>
                                    <td colSpan={3}></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </>
    );

    const ExpenseTab = () => (
        <ExpenseListContent
            expenses={projectExpenses}
            onRefresh={fetchProjectData}
            isLoading={isLoading}
            projectCode={projectCode}
        />
    );


    const renderTabContent = () => {
        switch (activeTab) {
            case 'projectInfo': return <ProjectInfoTab />;
            case 'income': return <IncomeTab />;
            case 'expense': return <ExpenseTab />;
            default: return <ProjectInfoTab />;
        }
    };

    return (
        <div className="p-8 max-w-[1400px] mx-auto">
            <nav className="flex items-center gap-2 text-sm mb-6">
                <Link to="/projects" className="text-gray-500 hover:text-blue-500 transition-colors">projects</Link>
                <span className="text-gray-400">›</span>
                <span className="text-blue-600 font-medium">{project.projectCode}</span>
            </nav>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-blue-600 font-mono font-medium mb-1">{project.projectCode}</p>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.projectName}</h1>
                        <p className="text-gray-500">{project.company}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <StatusBadge status={project.status} options={getProjectStatusOptions()} onChange={handleUpdateProjectStatus} />
                        <div className="relative">
                            <button onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)} className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                            </button>
                            {isActionsMenuOpen && (
                                <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[140px]">
                                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={() => { setIsActionsMenuOpen(false); setIsEditModalOpen(true); }}>
                                        <Pencil className="w-4 h-4" /> แก้ไข
                                    </button>
                                    <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2" onClick={() => { setIsActionsMenuOpen(false); setDeleteModal({ isOpen: true, type: 'project', data: project }); }}>
                                        <Trash2 className="w-4 h-4" /> ลบ
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1 mt-6 border-t border-gray-100 pt-4">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
                            <span>{tab.icon}</span>{tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">{renderTabContent()}</div>

            <IncomeModal
                mode="add"
                isOpen={isIncomeModalOpen}
                onClose={() => setIsIncomeModalOpen(false)}
                onSubmit={handleAddIncome}
                projectCode={projectCode}
            />

            <ExpenseModal
                mode="add"
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSubmit={handleAddExpense}
                projectCode={projectCode}
            />

            <IncomeModal
                mode="edit"
                isOpen={isEditIncomeModalOpen}
                onClose={() => setIsEditIncomeModalOpen(false)}
                onSubmit={handleUpdateIncome}
                onDelete={handleDeleteIncomeLegacy}
                income={selectedIncome}
                projectCode={projectCode}
            />

            <ExpenseModal
                mode="edit"
                isOpen={isEditExpenseModalOpen}
                onClose={() => setIsEditExpenseModalOpen(false)}
                onSubmit={handleUpdateExpense}
                onDelete={handleDeleteExpenseLegacy}
                expense={selectedExpense}
                projectCode={projectCode}
            />

            <ProjectModal mode="edit" isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSubmit={handleEditProject} project={project} />
            <ConfirmDeleteModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={() => {
                    if (deleteModal.type === 'project') handleDeleteProject();
                    else if (deleteModal.type === 'expense') executeDeleteExpense(deleteModal.data.id);
                    else if (deleteModal.type === 'income') executeDeleteIncome(deleteModal.data.id);
                }}
                title={deleteModal.type === 'project' ? "ยืนยันการลบโปรเจค" : deleteModal.type === 'income' ? "ยืนยันการลบรายรับ" : "ยืนยันการลบรายจ่าย"}
                itemName={deleteModal.data?.projectName || deleteModal.data?.bill_header || deleteModal.data?.description}
                itemCode={deleteModal.data?.projectCode || deleteModal.data?.account_code || (deleteModal.type === 'income' ? 'INC-' + deleteModal.data?.id : '')}
                warningMessage={deleteModal.type === 'project' ? "ข้อมูลรายรับและรายจ่ายทั้งหมดจะถูกลบ" : "การดำเนินการนี้ไม่สามารถย้อนกลับได้"}
            />
            {/* Attached Documents Modal */}
            <FileRepository
                isOpen={isAttachmentsModalOpen}
                onClose={() => setIsAttachmentsModalOpen(false)}
                documents={selectedAttachments}
            />
            {/* Transaction Status Confirm Modal */}
            <TransactionStatusModal
                isOpen={!!pendingStatusChange}
                onClose={() => setPendingStatusChange(null)}
                onConfirm={confirmStatusChange}
                data={pendingStatusChange}
                currentBalance={primaryAccount?.balance || 0}
            />
        </div>
    );
};

export default ProjectDetail;
