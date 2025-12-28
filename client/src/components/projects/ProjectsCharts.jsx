import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatNumber } from '../../utils/formatters';

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#3B82F6', '#6B7280'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                <p className="font-medium text-gray-900 mb-1">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }} className="text-sm">
                        {entry.name}: ฿{formatNumber(entry.value)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const ProjectsCharts = ({ projects, getIncomeByProject, getExpenseByProject }) => {
    // Prepare data for bar chart - by project type
    const typeData = React.useMemo(() => {
        const types = {};
        projects.forEach(p => {
            const type = p.projectType || 'Other';
            if (!types[type]) {
                types[type] = { name: type, income: 0, expense: 0, count: 0 };
            }
            types[type].income += getIncomeByProject(p.projectCode);
            types[type].expense += getExpenseByProject(p.projectCode);
            types[type].count += 1;
        });
        return Object.values(types);
    }, [projects, getIncomeByProject, getExpenseByProject]);

    // Prepare data for pie chart - by status
    const statusData = React.useMemo(() => {
        const statuses = {};
        projects.forEach(p => {
            const status = p.status || 'Unknown';
            if (!statuses[status]) {
                statuses[status] = { name: status, value: 0 };
            }
            statuses[status].value += 1;
        });
        return Object.values(statuses);
    }, [projects]);

    // Monthly data
    const monthlyData = React.useMemo(() => {
        const months = {};
        projects.forEach(p => {
            const month = p.startDate ? p.startDate.substring(0, 7) : 'Unknown';
            if (!months[month]) {
                months[month] = { name: month, income: 0, expense: 0 };
            }
            months[month].income += getIncomeByProject(p.projectCode);
            months[month].expense += getExpenseByProject(p.projectCode);
        });
        return Object.values(months).sort((a, b) => a.name.localeCompare(b.name)).slice(-6);
    }, [projects, getIncomeByProject, getExpenseByProject]);

    return (
        <div className="space-y-6">
            {/* Monthly Income/Expense Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">รายรับ/รายจ่าย รายเดือน</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="income" name="รายรับ" fill="#10B981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" name="รายจ่าย" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* By Project Type */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">ตามประเภทโปรเจค</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={typeData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="income" name="รายรับ" fill="#10B981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Pie Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">สถานะโปรเจค</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={70}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectsCharts;
