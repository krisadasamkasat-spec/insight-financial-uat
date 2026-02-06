import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderKanban, CheckCircle, Banknote, Eye, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

import Dropdown from '../components/common/Dropdown';
import ProjectModal from '../components/projects/ProjectModal';
import ProjectStatusConfirmModal from '../components/projects/ProjectStatusConfirmModal';
import StatusBadge from '../components/common/StatusBadge';
import ExportButton from '../components/common/ExportButton';

import { formatNumber } from '../utils/formatters';
import { projectAPI } from '../services/api';
import { useToast } from '../components/common/ToastProvider';
import { useSettings } from '../contexts/SettingsContext';

// Sort icon component
const SortIcon = ({ field, sortBy, sortOrder }) => {
    if (sortBy !== field) {
        return <ChevronDown className="w-3 h-3 text-gray-300" />;
    }
    return sortOrder === 'asc'
        ? <ChevronUp className="w-3 h-3 text-blue-500" />
        : <ChevronDown className="w-3 h-3 text-blue-500" />;
};

const Projects = () => {
    const toast = useToast();
    const { getColorsByProjectCode, getColorsByProjectType, getProjectStatusOptions } = useSettings();
    // const stats = getProjectStats(); // Removed mock call
    // const incomeStats = getIncomeStats(); // Removed mock call
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('active');
    const [typeFilter, setTypeFilter] = useState('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [projects, setProjects] = useState([]);
    const [statusConfirmModal, setStatusConfirmModal] = useState({
        isOpen: false,
        projectCode: null,
        projectName: null,
        currentStatus: null,
        newStatus: null
    });


    // Fetch Projects
    React.useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await projectAPI.getAllProjects();
                const fetchedProjects = res.data.map(p => ({
                    projectCode: p.project_code,
                    projectName: p.display_name || p.project_name || p.product_name, // Use display_name from service
                    projectType: p.project_type_name || p.project_type_label || 'Other', // Use joined fields
                    status: p.status,
                    company: p.customer_name || p.client_name,
                    startDate: p.start_date,
                    endDate: p.end_date,
                    totalIncome: parseFloat(p.total_income || 0),
                    totalExpense: parseFloat(p.total_expense || 0),
                    budget: parseFloat(p.budget || 0),
                    description: p.description,
                    location: p.location,
                    participantCount: p.participant_count,
                    teamMembers: p.team_members
                }));
                setProjects(fetchedProjects);

            } catch (err) {
                console.error("Failed to fetch projects", err);
                toast.error("Failed to load projects");
            }
        };
        fetchProjects();
    }, []);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Sorting state
    const [sortBy, setSortBy] = useState(null); // 'income', 'expense', 'profit', 'startDate'
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

    const projectTypes = ['In-House', 'Public', 'Event', 'Gift', 'R&D', 'Consult', 'Other']; // Hardcoded for now

    // Filter projects based on search and filters
    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const matchesSearch = searchQuery === '' ||
                project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                project.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                project.projectCode.toLowerCase().includes(searchQuery.toLowerCase());

            const isCompletedOrCancelled = ['Completed', 'Cancelled'].includes(project.status);
            const matchesTab = activeTab === 'active' ? !isCompletedOrCancelled : isCompletedOrCancelled;
            const matchesType = typeFilter === 'all' || project.projectType === typeFilter;

            return matchesSearch && matchesTab && matchesType;
        });
    }, [searchQuery, activeTab, typeFilter, projects]);

    // Sort projects
    const sortedProjects = useMemo(() => {
        if (!sortBy) return filteredProjects;

        return [...filteredProjects].sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'income':
                    aValue = getIncomeByProject(a.projectCode);
                    bValue = getIncomeByProject(b.projectCode);
                    break;
                case 'expense':
                    aValue = getExpenseByProject(a.projectCode);
                    bValue = getExpenseByProject(b.projectCode);
                    break;
                case 'profit':
                    aValue = getIncomeByProject(a.projectCode) - getExpenseByProject(a.projectCode);
                    bValue = getIncomeByProject(b.projectCode) - getExpenseByProject(b.projectCode);
                    break;
                case 'startDate':
                    aValue = new Date(a.startDate).getTime();
                    bValue = new Date(b.startDate).getTime();
                    break;
                default:
                    return 0;
            }

            if (sortOrder === 'asc') {
                return aValue - bValue;
            }
            return bValue - aValue;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredProjects, sortBy, sortOrder]);

    // Pagination logic
    const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProjects = sortedProjects.slice(startIndex, startIndex + itemsPerPage);

    // Reset to page 1 when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeTab, typeFilter, itemsPerPage]);

    // Handle sorting
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    // Sort icon component


    // Helper functions for Charts and Table
    const getIncomeByProject = (code) => {
        const p = projects.find(proj => proj.projectCode === code);
        return p ? (p.totalIncome || 0) : 0;
    };

    const getExpenseByProject = (code) => {
        const p = projects.find(proj => proj.projectCode === code);
        return p ? (p.totalExpense || 0) : 0;
    };

    // Handle refreshing project list after add/edit
    const handleProjectChange = () => {
        // Simple re-fetch projects
        projectAPI.getAllProjects()
            .then(res => {
                const fetchedProjects = res.data.map(p => ({
                    projectCode: p.project_code,
                    projectName: p.display_name || p.project_name || p.product_name,
                    projectType: p.project_type_name || p.project_type_label || 'Other',
                    status: p.status,
                    company: p.customer_name || p.client_name,
                    startDate: p.start_date,
                    endDate: p.end_date,
                    totalIncome: parseFloat(p.total_income || 0),
                    totalExpense: parseFloat(p.total_expense || 0),
                    budget: parseFloat(p.budget || 0),
                    description: p.description,
                    location: p.location,
                    participantCount: p.participant_count,
                    teamMembers: p.team_members
                }));
                setProjects(fetchedProjects);
            })
            .catch(err => {
                console.error("Failed to refresh projects", err);
            });
    };

    // Open confirmation modal before changing status
    const handleStatusChangeRequest = (project, newStatus) => {
        // If status is the same, do nothing
        if (project.status === newStatus) return;

        setStatusConfirmModal({
            isOpen: true,
            projectCode: project.projectCode,
            projectName: project.projectName,
            currentStatus: project.status,
            newStatus: newStatus
        });
    };

    // Perform actual update after confirmation
    const handleConfirmStatusChange = async () => {
        const { projectCode, newStatus } = statusConfirmModal;
        try {
            await projectAPI.updateProject(projectCode, { status: newStatus });

            // Optimistic update
            setProjects(prev => prev.map(p => {
                if (p.projectCode === projectCode) {
                    return { ...p, status: newStatus };
                }
                return p;
            }));
            toast.success(`เปลี่ยนสถานะเป็น ${newStatus}`);
        } catch (err) {
            console.error("Failed to update status", err);
            toast.error("Failed to update status");
        } finally {
            setStatusConfirmModal({ isOpen: false, projectCode: null, projectName: null, currentStatus: null, newStatus: null });
        }
    };

    // Get project code badge style based on prefix
    const getProjectCodeStyle = (projectCode) => {
        const colors = getColorsByProjectCode(projectCode);
        return {
            bg: `${colors.bgLight} ${colors.border}`,
            dot: colors.dot,
            text: colors.text
        };
    };

    // Get project type badge style
    const getProjectTypeStyle = (projectType) => {
        const colors = getColorsByProjectType(projectType);
        return `${colors.bg} ${colors.text}`;
    };

    return (
        <div className="p-8 max-w-[1400px] mx-auto">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">โปรเจคทั้งหมด</h1>
                </div>
                <div className="flex items-center gap-3">
                    <ExportButton
                        data={sortedProjects}
                        filename="projects"
                        title="รายการโปรเจค"
                        columns={[
                            { header: 'รหัส', accessor: (p) => p.projectCode },
                            { header: 'ชื่อโปรเจค', accessor: (p) => p.projectName },
                            { header: 'ประเภท', accessor: (p) => p.projectType },
                            { header: 'บริษัท', accessor: (p) => p.company },
                            { header: 'สถานะ', accessor: (p) => p.status },
                            { header: 'รายรับ', accessor: (p) => getIncomeByProject(p.projectCode) },
                            { header: 'รายจ่าย', accessor: (p) => getExpenseByProject(p.projectCode) },
                        ]}
                    />
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        เพิ่ม Project
                    </button>
                </div>
            </div>

            {/* Project Modal */}
            <ProjectModal
                mode="add"
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleProjectChange}
            />

            {/* Project Status Confirm Modal */}
            <ProjectStatusConfirmModal
                isOpen={statusConfirmModal.isOpen}
                onClose={() => setStatusConfirmModal({ isOpen: false, projectCode: null, projectName: null, currentStatus: null, newStatus: null })}
                onConfirm={handleConfirmStatusChange}
                projectName={statusConfirmModal.projectName}
                currentStatus={statusConfirmModal.currentStatus}
                newStatus={statusConfirmModal.newStatus}
            />

            <div className="flex flex-col gap-6 mb-8">
                {/* Tabs and Revenue Row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    {/* Tabs */}
                    <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'active'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Active Projects
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'completed'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Completed
                        </button>
                    </div>

                    {/* Revenue Summary */}
                    <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Banknote className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-emerald-700 font-medium">รายรับรวม</p>
                            <p className="text-lg font-bold text-emerald-700">
                                ฿{formatNumber(projects.reduce((sum, p) => sum + (p.totalIncome || 0), 0))}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center">
                        {/* Search Box */}
                        <div className="w-[320px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-[18px] h-[18px]" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาโปรเจค..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-4">
                            {/* Type Filter */}
                            <Dropdown
                                inline
                                showAllOption
                                label="หมวดหมู่"
                                value={typeFilter}
                                options={projectTypes}
                                onChange={setTypeFilter}
                                minWidth="100px"
                                listMinWidth="150px"
                            />

                            {/* Clear Filters */}
                            {(searchQuery || typeFilter !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setTypeFilter('all');
                                    }}
                                    className="px-3 py-2 text-sm text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors border border-yellow-200"
                                >
                                    ล้างตัวกรอง
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Projects Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">รายการโปรเจค</h2>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">แสดง {paginatedProjects.length} จาก {sortedProjects.length} รายการ</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={10}>10 / หน้า</option>
                            <option value={25}>25 / หน้า</option>
                            <option value={50}>50 / หน้า</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">รหัสโปรเจค</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">ชื่อโปรเจค</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">หมวดหมู่</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">บริษัท</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">สถานะ</th>
                                <th
                                    className="text-right px-4 py-3 text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                                    onClick={() => handleSort('income')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        รายรับ <SortIcon field="income" sortBy={sortBy} sortOrder={sortOrder} />
                                    </div>
                                </th>
                                <th
                                    className="text-right px-4 py-3 text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                                    onClick={() => handleSort('expense')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        รายจ่าย <SortIcon field="expense" sortBy={sortBy} sortOrder={sortOrder} />
                                    </div>
                                </th>
                                <th
                                    className="text-right px-4 py-3 text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                                    onClick={() => handleSort('profit')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        กำไร/ขาดทุน <SortIcon field="profit" sortBy={sortBy} sortOrder={sortOrder} />
                                    </div>
                                </th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedProjects.length > 0 ? paginatedProjects.map((project) => {
                                const codeStyle = getProjectCodeStyle(project.projectCode);
                                const income = project.totalIncome; // Use pre-calculated
                                const expense = project.totalExpense;
                                const profit = income - expense;
                                return (
                                    <tr key={project.projectCode} className="hover:bg-blue-50/60 transition-all duration-150">
                                        <td className="px-4 py-3">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border ${codeStyle.bg}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${codeStyle.dot}`}></div>
                                                <span className={`font-mono text-xs font-semibold ${codeStyle.text}`}>{project.projectCode}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-sm text-gray-900">{project.projectName}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getProjectTypeStyle(project.projectType)}`}>
                                                {project.projectType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{project.company}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge
                                                status={project.status}
                                                options={getProjectStatusOptions()}
                                                onChange={(newStatus) => handleStatusChangeRequest(project, newStatus)}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-sm font-medium text-green-600">฿{formatNumber(income)}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-sm font-medium text-red-500">฿{formatNumber(expense)}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`text-sm font-medium ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {profit >= 0 ? '+' : ''}฿{formatNumber(profit)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Link
                                                to={`/projects/${project.projectCode}`}
                                                className="inline-flex items-center justify-center w-9 h-9 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-150 group"
                                                title="ดูรายละเอียด"
                                            >
                                                <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            }) : (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                <Search className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 font-medium">ไม่พบโปรเจคที่ตรงกับเงื่อนไข</p>
                                            <p className="text-gray-400 text-sm mt-1">ลองปรับเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            หน้า {currentPage} จาก {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage === pageNum
                                            ? 'bg-blue-500 text-white'
                                            : 'border border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Projects;
