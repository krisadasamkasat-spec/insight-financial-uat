import React from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, DollarSign, CreditCard, Clock, FolderOpen, BarChart3, Calendar, MapPin, Building } from 'lucide-react';
import { projectAPI } from '../services/api';
import { formatNumber } from '../utils/formatters';
import CashflowCalendar from '../components/dashboard/CashflowCalendar';


const Dashboard = () => {
    const [stats, setStats] = React.useState({
        projects: { total: 0, active: 0 },
        incomes: { totalAmount: 0 },
        expenses: { total: 0, totalAmount: 0, pending: 0 },
        recentProjects: []
    });

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await projectAPI.getDashboardStats();
                setStats(res.data);
            } catch (err) {
                console.error("Failed to load dashboard stats", err);
            }
        };
        fetchStats();
    }, []);

    const { projects: projectStats, incomes: incomeStats, expenses: expenseStats, recentProjects } = stats;

    return (
        <div className="p-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">ภาพรวมระบบอนุมัติรายจ่าย</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Projects */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">โปรเจคทั้งหมด</p>
                            <p className="text-3xl font-bold mt-2">{projectStats.total}</p>
                            <p className="text-blue-200 text-sm mt-1">{projectStats.active} Active</p>
                        </div>
                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                            <FolderKanban className="w-7 h-7" />
                        </div>
                    </div>
                </div>

                {/* Total Income */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg shadow-green-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">รายรับรวม</p>
                            <p className="text-3xl font-bold mt-2">฿{formatNumber(incomeStats.totalAmount / 1000)}K</p>
                            <p className="text-green-200 text-sm mt-1">รวมทุกโปรเจค</p>
                        </div>
                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-7 h-7" />
                        </div>
                    </div>
                </div>

                {/* Total Expenses */}
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg shadow-red-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm font-medium">รายจ่ายทั้งหมด</p>
                            <p className="text-3xl font-bold mt-2">{expenseStats.total}</p>
                            <p className="text-red-200 text-sm mt-1">฿{formatNumber(expenseStats.totalAmount)}</p>
                        </div>
                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                            <CreditCard className="w-7 h-7" />
                        </div>
                    </div>
                </div>

                {/* Pending Approvals */}
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg shadow-amber-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-amber-100 text-sm font-medium">รอดำเนินการ</p>
                            <p className="text-3xl font-bold mt-2">{expenseStats.pending}</p>
                            <p className="text-amber-200 text-sm mt-1">รายการสำรองจ่าย</p>
                        </div>
                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                            <Clock className="w-7 h-7" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Weekly Cashflow Dashboard */}
            <div className="mb-8">
                <CashflowCalendar />
            </div>

            {/* Quick Links & Recent Projects */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Links */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">เมนูลัด</h2>
                    <div className="space-y-3">
                        <Link
                            to="/projects"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                <FolderOpen className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">โปรเจคทั้งหมด</p>
                                <p className="text-sm text-gray-500">ดูรายการโปรเจคทั้งหมด</p>
                            </div>
                        </Link>
                        <Link
                            to="/expenses"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                                <CreditCard className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">อนุมัติรายจ่าย</p>
                                <p className="text-sm text-gray-500">จัดการรายการเบิกจ่าย</p>
                            </div>
                        </Link>
                        <Link
                            to="/reports"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                <BarChart3 className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">รายงาน</p>
                                <p className="text-sm text-gray-500">ดูรายงานสรุป</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Recent Projects */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">โปรเจคล่าสุด</h2>
                        <Link to="/projects" className="text-sm text-blue-500 hover:text-blue-600 font-medium">
                            ดูทั้งหมด →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentProjects.map((project) => (
                            <Link
                                key={project.project_code || project.id}
                                to={`/projects/${project.project_code}`}
                                className="group relative block bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden"
                            >
                                {/* Status Strip */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${project.status === 'Active' ? 'bg-green-500' :
                                    project.status === 'Pending' ? 'bg-amber-400' : 'bg-gray-300'
                                    }`} />

                                <div className="p-5 pl-7 flex flex-col md:flex-row md:items-center justify-between gap-4">

                                    {/* Left: Project Info */}
                                    {/* Left: Project Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-bold text-gray-900 truncate text-lg group-hover:text-blue-600 transition-colors">
                                                {project.project_name}
                                            </h3>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-600">
                                                    {project.project_code}
                                                </span>
                                            </div>
                                            <div className="hidden sm:flex items-center gap-1.5 min-w-0 truncate">
                                                <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span className="truncate">{project.customer_name || 'No Customer'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Status & Dates */}
                                    <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1.5 text-sm shrink-0">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${project.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' :
                                            project.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                'bg-gray-50 text-gray-600 border-gray-200'
                                            }`}>
                                            {project.status}
                                        </span>

                                        <div className="flex items-center gap-1.5 text-gray-500">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            <span>
                                                {project.start_date ? new Date(project.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-'}
                                                {' - '}
                                                {project.end_date ? new Date(project.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
