import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { projectAPI } from '../services/api';
import { formatNumber, formatDate } from '../utils/formatters';
import AddIncomeModal from '../components/finance/AddIncomeModal';
import AddExpenseModal from '../components/finance/AddExpenseModal';
import EditIncomeModal from '../components/finance/EditIncomeModal';
import EditExpenseModal from '../components/finance/EditExpenseModal';
import ProjectModal from '../components/projects/ProjectModal';
import EditTeamMemberModal from '../components/team/EditTeamMemberModal';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import AddTeamMemberModal from '../components/team/AddTeamMemberModal';
import ViewAttachmentsModal from '../components/common/ViewAttachmentsModal';
import AttachmentPreview from '../components/common/AttachmentPreview';
import { useSettings } from '../contexts/SettingsContext';
import StatusBadge from '../components/common/StatusBadge';
import MinimalDropdown from '../components/common/MinimalDropdown';
import { useToast } from '../components/common/ToastProvider';
import StatusChangeConfirmModal from '../components/projects/StatusChangeConfirmModal';

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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditIncomeModalOpen, setIsEditIncomeModalOpen] = useState(false);
    const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);
    const [isTeamMemberModalOpen, setIsTeamMemberModalOpen] = useState(false);
    const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
    const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
    const [selectedIncome, setSelectedIncome] = useState(null);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [selectedTeamMember, setSelectedTeamMember] = useState(null);
    const [selectedAttachments, setSelectedAttachments] = useState([]);
    // [NEW] Status Change Confirmation State
    const [pendingStatusChange, setPendingStatusChange] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Filters for Income/Expense tabs
    const [incomeSearch, setIncomeSearch] = useState('');
    const [incomeStatusFilter, setIncomeStatusFilter] = useState('all');
    const [expenseSearch, setExpenseSearch] = useState('');
    const [expenseStatusFilter, setExpenseStatusFilter] = useState('all');

    // Fetch Data
    React.useEffect(() => {
        const fetchData = async () => {
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
                    }))
                };

                setProject(mappedProject);
                setProjectIncomes(incomesRes.data);
                setProducts(productsRes.data);

                // Expenses (DB fields need minimal mapping usually, keeping raw response mainly)
                // However, our frontend might expect camelCase. Let's map if needed.
                // The API returns snake_case for DB columns. 
                // Let's create a quick mapper or adjust the UI to use snake_case.
                // For safety/speed, I'll map to camelCase to match existing UI code.
                const mappedExpenses = expensesRes.data.map(e => ({
                    id: e.id,
                    projectCode: e.project_code,
                    expenseCode: e.expense_code,
                    expenseCategory: e.expense_category || e.expense_code, // from join
                    title: e.title || e.description, // some fields might be mixed
                    description: e.description,
                    recipient: e.recipient,
                    status: e.status,
                    issueDate: e.issue_date,
                    paymentDate: e.payment_date,
                    netAmount: parseFloat(e.net_amount),
                    vatRate: parseFloat(e.vat_rate),
                    whtRate: parseFloat(e.wht_rate),
                    baseAmount: parseFloat(e.base_amount),
                    attachments: e.attachments || []
                }));
                setProjectExpenses(mappedExpenses);

                const mappedIncomes = incomesRes.data.map(i => ({
                    id: i.id,
                    projectCode: i.project_code,
                    description: i.description,
                    invoiceNo: i.invoice_no,
                    date: i.date,
                    amount: parseFloat(i.amount),
                    status: i.status,
                    attachments: i.attachments || []
                }));
                setProjectIncomes(mappedIncomes);

                // [NEW] Set Primary Account
                const primary = accountsRes.data.find(acc => acc.is_primary) || accountsRes.data[0];
                setPrimaryAccount(primary);

            } catch {
                console.error("Failed to fetch project data");
                // toast.error("Could not load project data");
            } finally {
                setIsLoading(false);
            }
        };
        if (projectCode) {
            fetchData();
        }
    }, [projectCode, refreshKey]);

    const totalExpenseAmount = React.useMemo(() => projectExpenses.reduce((sum, e) => sum + (e.netAmount || 0), 0), [projectExpenses]);
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
                (expense.title || '').toLowerCase().includes(expenseSearch.toLowerCase()) ||
                (expense.recipient || '').toLowerCase().includes(expenseSearch.toLowerCase());
            const matchesStatus = expenseStatusFilter === 'all' || expense.status === expenseStatusFilter;
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
                invoice_no: newIncome.invoiceNo,
                date: newIncome.date,
                amount: newIncome.amount,
                status: newIncome.status || 'pending',
                created_by: 1 // Default Admin
            });
            setRefreshKey(p => p + 1);
            toast.success('เพิ่มรายรับสำเร็จ');
        } catch (err) {
            console.error(err);
            toast.error('Failed to create income');
        }
    };

    const handleAddExpense = async (newExpense) => {
        try {
            await projectAPI.createExpense({
                project_code: projectCode,
                expense_code: newExpense.expenseCode,
                description: newExpense.description,
                title: newExpense.title,
                status: newExpense.status, // e.g. 'วางบิล'
                recipient: newExpense.recipient,
                issue_date: newExpense.issueDate,
                payment_date: newExpense.paymentDate,
                base_amount: newExpense.taxBase,
                vat_rate: newExpense.vat,
                wht_rate: newExpense.whtRate,
                net_amount: newExpense.netAmount,
                created_by: 1
            });
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
                invoice_no: updated.invoiceNo,
                date: updated.date,
                amount: updated.amount,
                status: updated.status
            });
            setRefreshKey(p => p + 1);
            toast.success('อัปเดตรายรับสำเร็จ');
        } catch (err) {
            console.error(err);
            toast.error('Failed to update income');
        }
    };
    const handleDeleteIncome = async (id) => {
        try {
            await projectAPI.deleteIncome(id);
            setRefreshKey(p => p + 1);
            toast.success('ลบรายรับสำเร็จ');
        } catch (err) {
            toast.error('Failed to delete income');
        }
    };
    const handleUpdateExpense = async (updated) => {
        if (!selectedExpense) return;
        try {
            await projectAPI.updateExpense(selectedExpense.id, {
                expense_code: updated.expenseCode,
                description: updated.description,
                title: updated.title,
                status: updated.status,
                recipient: updated.recipient,
                issue_date: updated.issueDate,
                payment_date: updated.paymentDate,
                base_amount: updated.priceAmount || updated.taxBase,  // Modal sends priceAmount and taxBase
                vat_rate: updated.vat,  // Modal sends "vat" (7 or 0)
                wht_rate: updated.whtRate,
                net_amount: updated.netAmount
            });
            setRefreshKey(p => p + 1);
            setIsEditExpenseModalOpen(false);
            setSelectedExpense(null);
            toast.success('อัปเดตรายจ่ายสำเร็จ');
        } catch (err) {
            console.error(err);
            toast.error('Failed to update expense');
        }
    };
    const handleDeleteExpense = async (id) => {
        try {
            await projectAPI.deleteExpense(id);
            setRefreshKey(p => p + 1);
            toast.success('ลบรายจ่ายสำเร็จ');
        } catch (error) { // eslint-disable-line no-unused-vars
            console.error(error); // wait, previously it was err, console not logged?
            toast.error('Failed to delete expense');
        }
    };

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
            oldStatus: expense.status,
            newStatus: newStatus,
            amount: expense.netAmount,
            itemTitle: expense.title
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
                    status: pendingStatusChange.newStatus
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

    // Team Management
    const handleAddTeamMember = async (newMember) => {
        try {
            await projectAPI.addTeamMember(projectCode, {
                member_id: newMember.memberId || newMember.member_id,
                role: newMember.role,
                rate: newMember.rate,
                status: newMember.status
            });
            setRefreshKey(p => p + 1);
            toast.success('เพิ่มสมาชิกทีมสำเร็จ');
        } catch (error) {
            console.error(error);
            toast.error('Failed to add team member');
        }
    };

    const handleEditTeamMember = (assignment) => {
        // assignment is the object from projectTeam array: { member_id, role, rate, status, ... }
        // We need to map it to what EditTeamMemberModal expects
        setSelectedTeamMember(assignment);
        setIsEditTeamModalOpen(true);
    };

    const handleUpdateTeamMember = async (updated) => {
        try {
            await projectAPI.updateTeamMember(projectCode, updated.member_id, {
                role: updated.role,
                rate: updated.rate,
                status: updated.status
            });
            setRefreshKey(p => p + 1);
            toast.success('อัปเดตข้อมูลทีมสำเร็จ');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update team member');
        }
    };

    const handleRemoveTeamMember = async (memberId) => {
        if (!window.confirm('คุณต้องการลบสมาชิกคนนี้ใช่หรือไม่?')) return;
        try {
            await projectAPI.removeTeamMember(projectCode, memberId);
            setRefreshKey(p => p + 1);
            toast.success('ลบสมาชิกทีมสำเร็จ');
        } catch (error) {
            console.error(error);
            toast.error('Failed to remove team member');
        }
    };

    const handleViewAttachments = (attachments) => {
        setSelectedAttachments(attachments);
        setIsAttachmentsModalOpen(true);
    };

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
        { value: 'Received', label: 'ได้รับแล้ว', color: 'emerald' }
    ];
    const expenseStatusOptions = [
        { value: 'สำรองจ่าย', label: 'สำรองจ่าย', color: 'blue' },
        { value: 'วางบิล', label: 'วางบิล', color: 'green' },
        { value: 'จ่ายแล้ว', label: 'จ่ายแล้ว', color: 'emerald' }
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
        { id: 'overview', label: 'ภาพรวมการเงิน', icon: '📊' },
        { id: 'projectInfo', label: 'ข้อมูลโปรเจค', icon: '📋' },
        { id: 'income', label: 'รายรับ', icon: '💰' },
        { id: 'expense', label: 'รายจ่าย', icon: '💸' },
        { id: 'documents', label: 'เอกสาร', icon: '📁' },
        { id: 'activities', label: 'กิจกรรม', icon: '📋' }
    ];

    const grossProfit = totalIncomeAmount - totalExpenseAmount;
    const profitMargin = totalIncomeAmount > 0 ? ((grossProfit / totalIncomeAmount) * 100).toFixed(1) : 0;
    const formatBudget = (budget) => budget === null || budget === undefined ? 'N/A' : `฿${formatNumber(budget)}`;
    const budgetUsagePercent = project.budget ? ((totalExpenseAmount / project.budget) * 100).toFixed(1) : null;

    // ===== TAB COMPONENTS =====

    const OverviewTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center"><span className="text-white text-lg">💼</span></div>
                        <span className="text-sm font-medium text-blue-700">งบประมาณ</span>
                    </div>
                    <p className={`text-2xl font-bold ${project.budget ? 'text-blue-900' : 'text-gray-400'}`}>{formatBudget(project.budget)}</p>
                    {budgetUsagePercent !== null && <p className={`text-xs mt-1 ${parseFloat(budgetUsagePercent) > 100 ? 'text-red-600' : 'text-blue-600'}`}>ใช้ไป: {budgetUsagePercent}%</p>}
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center"><span className="text-white text-lg">📈</span></div>
                        <span className="text-sm font-medium text-green-700">รายรับ</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">฿{formatNumber(totalIncomeAmount)}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border border-red-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center"><span className="text-white text-lg">📉</span></div>
                        <span className="text-sm font-medium text-red-700">รายจ่าย</span>
                    </div>
                    <p className="text-2xl font-bold text-red-900">฿{formatNumber(totalExpenseAmount)}</p>
                    <p className="text-xs text-red-600 mt-1">{projectExpenses.length} รายการ</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center"><span className="text-white text-lg">✨</span></div>
                        <span className="text-sm font-medium text-purple-700">กำไรขั้นต้น</span>
                    </div>
                    <p className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-purple-900' : 'text-red-600'}`}>฿{formatNumber(grossProfit)}</p>
                    <p className="text-xs text-purple-600 mt-1">Margin: {profitMargin}%</p>
                </div>
            </div>
        </div>
    );

    // ===== PROJECT INFO TAB (ใหม่) =====
    const ProjectInfoTab = () => (
        <div className="space-y-6">
            {/* ข้อมูลทั่วไป - Redesigned */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header with Project Type Badge */}
                <div className={`px-5 py-4 border-b ${getColorsByProjectType(project.projectType).bgLight} ${getColorsByProjectType(project.projectType).border}`}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${getColorsByProjectType(project.projectType).bg} ${getColorsByProjectType(project.projectType).text}`}>
                                    {project.projectType}
                                </span>
                                {project.participantCount && (
                                    <span className="text-xs text-gray-500 bg-white/80 px-2 py-0.5 rounded-full">
                                        👥 {project.participantCount} คน
                                    </span>
                                )}
                            </div>
                            {project.productCode && (
                                <h4 className="text-lg font-semibold text-gray-900 leading-snug">
                                    {getProductName(project.productCode)}
                                </h4>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Date Range Card */}
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1.5">
                                <span>📅</span> ระยะเวลา
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                                {formatDate(project.startDate)} - {formatDate(project.endDate)}
                            </p>
                        </div>

                        {/* Location Card */}
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1.5">
                                <span>📍</span> สถานที่
                            </div>
                            <p className="text-sm font-medium text-gray-900">{project.location || '-'}</p>
                        </div>

                        {/* Company Card */}
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1.5">
                                <span>🏢</span> ลูกค้า
                            </div>
                            <p className="text-sm font-medium text-gray-900 truncate" title={project.company}>{project.company || '-'}</p>
                        </div>
                    </div>

                    {/* Description */}
                    {project.description && (
                        <div className="pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">📝 คำอธิบาย</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{project.description}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ทีมงาน + ลิงก์ภายนอก (Flex Layout - Team 60%, Link 40%) */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* ทีมงาน (60%) */}
                <div className="w-full lg:w-[60%] bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <span>👥</span> ทีมงาน
                            <span className="text-sm font-normal text-gray-500">({projectTeam.length} คน)</span>
                        </h3>
                        <button onClick={() => setIsTeamMemberModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors">
                            <Plus className="w-3.5 h-3.5" /> เพิ่ม
                        </button>
                    </div>
                    {projectTeam.length > 0 ? (
                        <div className="space-y-2">
                            {projectTeam.map(t => (
                                <div key={t.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                                    <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm">
                                        {t.member?.nickname?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{t.member?.nickname || '-'}</p>
                                        <p className="text-xs text-gray-500 truncate">{t.member?.name || '-'}</p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditTeamMember(t)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-100 rounded transition-colors" title="แก้ไข">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => handleRemoveTeamMember(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded transition-colors" title="ลบ">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <span className="text-xl">👥</span>
                            </div>
                            <p className="text-gray-400 text-sm">ยังไม่มีทีมงาน</p>
                        </div>
                    )}
                </div>

                {/* ลิงก์ภายนอก (40%) */}
                <div className="w-full lg:w-[40%] bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><span>🔗</span> ลิงก์ภายนอก</h3>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">+ เพิ่มลิงก์</button>
                    </div>
                    {(project.externalLinks && project.externalLinks.length > 0) ? (
                        <div className="space-y-2">
                            {project.externalLinks.map((link, idx) => (
                                <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                                    <span className="text-xl">{link.icon || '🔗'}</span>
                                    <span className="flex-1 text-sm text-blue-600 group-hover:underline truncate">{link.label}</span>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <span className="text-2xl">📁</span>
                            </div>
                            <p className="text-gray-400 text-sm mb-2">ยังไม่มีลิงก์ภายนอก</p>
                            <p className="text-xs text-gray-300">Google Drive จะถูกเชื่อมต่ออัตโนมัติ</p>
                        </div>
                    )}

                    {/* Future: Google Drive Integration Placeholder */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <svg className="w-5 h-5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                                    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
                                    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
                                    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
                                    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
                                    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
                                    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-medium text-gray-700">Google Drive</p>
                                <p className="text-xs text-gray-400">เชื่อมต่อโฟลเดอร์โปรเจค</p>
                            </div>
                            <button className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
                                เชื่อมต่อ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const IncomeTab = () => (
        <div>
            <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหารายรับ..."
                            value={incomeSearch}
                            onChange={(e) => setIncomeSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-56"
                        />
                    </div>
                    <MinimalDropdown
                        label="สถานะ"
                        value={incomeStatusFilter}
                        options={['รอรับ', 'ได้รับแล้ว']}
                        onChange={(v) => setIncomeStatusFilter(v === 'รอรับ' ? 'pending' : v === 'ได้รับแล้ว' ? 'Received' : 'all')}
                        allLabel="ทั้งหมด"
                    />
                    <span className="text-sm text-gray-500">{filteredIncomes.length} / {projectIncomes.length} รายการ</span>
                </div>
                <button onClick={() => setIsIncomeModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors">
                    <Plus className="w-4 h-4" /> เพิ่มรายรับ
                </button>
            </div>
            {filteredIncomes.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">รายละเอียด</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">วันที่รับ</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">สถานะ</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">เอกสาร</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">จำนวนเงิน</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredIncomes.map(income => (
                                <tr key={income.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3"><div className="text-sm text-gray-900">{income.description || 'รายรับจากโปรเจค'}</div></td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(income.date)}</td>
                                    <td className="px-4 py-3"><StatusBadge status={income.status} options={incomeStatusOptions} onChange={(s) => handleUpdateIncomeStatus(income.id, s)} /></td>
                                    <td className="px-4 py-3 text-center">
                                        <AttachmentPreview attachments={income.attachments || []} onOpenModal={() => handleViewAttachments(income.attachments)} size="sm" />
                                    </td>
                                    <td className="px-4 py-3 text-right"><span className="text-sm font-semibold text-green-600">฿{formatNumber(income.amount)}</span></td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => handleEditIncome(income)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t border-gray-200">
                            <tr><td colSpan="4" className="px-4 py-3 text-right text-sm font-semibold text-gray-600">รวมทั้งสิ้น</td><td className="px-4 py-3 text-right"><span className="text-base font-bold text-green-500">฿{formatNumber(totalIncomeAmount)}</span></td><td></td></tr>
                        </tfoot>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl">💰</span></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่มีรายรับ</h3>
                    <p className="text-gray-500 mb-4">ยังไม่มีรายรับสำหรับโปรเจคนี้</p>
                </div>
            )}
        </div>
    );

    const ExpenseTab = () => (
        <div>
            <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหารายจ่าย..."
                            value={expenseSearch}
                            onChange={(e) => setExpenseSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-56"
                        />
                    </div>
                    <MinimalDropdown
                        label="สถานะ"
                        value={expenseStatusFilter}
                        options={['สำรองจ่าย', 'วางบิล', 'จ่ายแล้ว']}
                        onChange={(v) => setExpenseStatusFilter(v === 'all' ? 'all' : v)}
                        allLabel="ทั้งหมด"
                    />
                    <span className="text-sm text-gray-500">{filteredExpenses.length} / {projectExpenses.length} รายการ</span>
                </div>
                <button onClick={() => setIsExpenseModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors">
                    <Plus className="w-4 h-4" /> เพิ่มรายจ่าย
                </button>
            </div>
            {filteredExpenses.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">รหัส</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">รายละเอียด</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ผู้รับเงิน</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">สถานะ</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">วันที่จ่าย</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">เอกสาร</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">จำนวนเงิน</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredExpenses.map(expense => (
                                <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-mono rounded">{expense.expenseCode}</span></td>
                                    <td className="px-4 py-3"><div className="text-sm text-gray-900">{expense.title}</div></td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{expense.recipient}</td>
                                    <td className="px-4 py-3"><StatusBadge status={expense.status} options={expenseStatusOptions} onChange={(s) => handleUpdateExpenseStatus(expense.id, s)} /></td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(expense.paymentDate)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <AttachmentPreview attachments={expense.attachments || []} onOpenModal={() => handleViewAttachments(expense.attachments)} size="sm" />
                                    </td>
                                    <td className="px-4 py-3 text-right"><span className="text-sm font-semibold text-gray-900">฿{formatNumber(expense.netAmount)}</span></td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => handleEditExpense(expense)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t border-gray-200">
                            <tr><td colSpan="6" className="px-4 py-3 text-right text-sm font-semibold text-gray-600">รวมทั้งสิ้น</td><td className="px-4 py-3 text-right"><span className="text-base font-bold text-red-500">฿{formatNumber(totalExpenseAmount)}</span></td><td></td></tr>
                        </tfoot>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl">💸</span></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่มีรายจ่าย</h3>
                    <p className="text-gray-500 mb-4">ยังไม่มีรายจ่ายสำหรับโปรเจคนี้</p>
                </div>
            )}
        </div>
    );

    const DocumentsTab = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <p className="text-gray-600">เอกสารแนบจากรายรับและรายจ่าย <span className="font-bold text-gray-900">{allAttachments.length}</span> ไฟล์</p>
            </div>
            {allAttachments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allAttachments.map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><span className="text-lg">📄</span></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{typeof doc === 'string' ? doc : doc.name}</p>
                                <p className="text-xs text-gray-500">จาก: {doc.sourceTitle || '-'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl">📁</span></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีเอกสาร</h3>
                    <p className="text-gray-500">เอกสารจะแสดงเมื่อมีการแนบไฟล์ในรายรับหรือรายจ่าย</p>
                </div>
            )}
        </div>
    );

    const ActivitiesTab = () => (
        <div>
            <p className="text-gray-600 mb-4">กิจกรรมล่าสุด <span className="font-bold text-gray-900">{activities.length}</span> รายการ</p>
            {activities.length > 0 ? (
                <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    <div className="space-y-4">
                        {activities.map(a => (
                            <div key={a.id} className="relative flex gap-4 pl-12">
                                <div className="absolute left-3 w-5 h-5 bg-white rounded-full border-2 border-blue-400 flex items-center justify-center text-xs">{a.icon}</div>
                                <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium text-gray-900">{a.title}</span>
                                        <span className="text-xs text-gray-400">{formatDate(a.timestamp)}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">{a.description}</p>
                                    <p className="text-xs text-gray-400 mt-1">โดย {a.user}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl">📋</span></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่มีกิจกรรม</h3>
                    <p className="text-gray-500">ยังไม่มีกิจกรรมสำหรับโปรเจคนี้</p>
                </div>
            )}
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab />;
            case 'projectInfo': return <ProjectInfoTab />;
            case 'income': return <IncomeTab />;
            case 'expense': return <ExpenseTab />;
            case 'documents': return <DocumentsTab />;
            case 'activities': return <ActivitiesTab />;
            default: return <OverviewTab />;
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
                                    <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2" onClick={() => { setIsActionsMenuOpen(false); setIsDeleteModalOpen(true); }}>
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

            <AddIncomeModal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} onSubmit={handleAddIncome} projectCode={projectCode} />
            <AddExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} onSubmit={handleAddExpense} projectCode={projectCode} />
            <EditIncomeModal isOpen={isEditIncomeModalOpen} onClose={() => setIsEditIncomeModalOpen(false)} onSubmit={handleUpdateIncome} onDelete={handleDeleteIncome} income={selectedIncome} />
            <EditExpenseModal isOpen={isEditExpenseModalOpen} onClose={() => setIsEditExpenseModalOpen(false)} onSubmit={handleUpdateExpense} onDelete={handleDeleteExpense} expense={selectedExpense} />
            <ProjectModal mode="edit" isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSubmit={handleEditProject} project={project} />
            <EditTeamMemberModal isOpen={isEditTeamModalOpen} onClose={() => setIsEditTeamModalOpen(false)} onSubmit={handleUpdateTeamMember} assignment={selectedTeamMember} />
            <ConfirmDeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteProject} title="ยืนยันการลบโปรเจค" itemName={project.projectName} itemCode={project.projectCode} warningMessage="ข้อมูลรายรับและรายจ่ายทั้งหมดจะถูกลบ" />
            <AddTeamMemberModal isOpen={isTeamMemberModalOpen} onClose={() => setIsTeamMemberModalOpen(false)} onSubmit={handleAddTeamMember} projectCode={projectCode} existingMemberIds={projectTeam.map(t => t.memberId)} />
            <ViewAttachmentsModal isOpen={isAttachmentsModalOpen} onClose={() => setIsAttachmentsModalOpen(false)} attachments={selectedAttachments} />
            <StatusChangeConfirmModal
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
