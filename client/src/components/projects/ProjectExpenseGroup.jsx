import React, { useState, useMemo } from 'react';
import { Info } from 'lucide-react';

import { useSettings } from '../../contexts/SettingsContext';
import ExpenseItem from '../finance/ExpenseItem';
import CalendarHub from '../finance/CalendarHub';
import ProjectInfo from './ProjectInfo';

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Helper to get hex color from Tailwind color name
const getColorHex = (colorName) => {
    const colorMap = {
        purple: '#a855f7',
        emerald: '#10b981',
        orange: '#f97316',
        pink: '#ec4899',
        blue: '#3b82f6',
        gray: '#6b7280'
    };
    return colorMap[colorName] || colorMap.gray;
};

const ProjectExpenseGroup = ({
    projectCode,
    expenses,
    project, // Received from parent
    selectedExpenses,
    onToggleExpense,
    onToggleProject,
    onPaymentCycleChange,
    isSelectionEnabled = true
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showProjectInfo, setShowProjectInfo] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const { getColorsByProjectCode } = useSettings();

    // Get colors based on project code
    const colors = useMemo(() => getColorsByProjectCode(projectCode), [projectCode, getColorsByProjectCode]);

    // Use project data passed from parent
    // const project = useMemo(() => getProjectByCode(projectCode), [projectCode]); // Removed mock

    // Get team members - assuming project.teamMembers is array of objects { member: { nickname }, role }
    // OR if API returns flat list, we adapt. For now, use empty if not present.
    const teamMembers = useMemo(() => {
        if (!project?.teamMembers) return [];
        return project.teamMembers.map(t => ({
            nickname: t.member_name || t.nickname || t.member_nickname || 'Unknown', // Adapt to API response
            role: t.role || 'Member'
        }));
    }, [project]);

    // Calculate totals
    const totalAmount = useMemo(() => {
        return expenses.reduce((sum, e) => sum + e.netAmount, 0);
    }, [expenses]);

    // Check if all expenses in this project are selected
    const allSelected = useMemo(() => {
        return expenses.every(e => selectedExpenses.has(e.id));
    }, [expenses, selectedExpenses]);

    const someSelected = useMemo(() => {
        return expenses.some(e => selectedExpenses.has(e.id)) && !allSelected;
    }, [expenses, selectedExpenses, allSelected]);

    const formatNumber = (num) => {
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDateKey = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const handleOpenPaymentModal = (e) => {
        e.stopPropagation();
        setShowPaymentModal(true);
        setSelectedDate(null);
    };

    const handleConfirmPaymentChange = () => {
        if (selectedDate && onPaymentCycleChange) {
            // Change payment date for all expenses in this project
            expenses.forEach((expense) => {
                onPaymentCycleChange(expense.id, formatDateKey(selectedDate));
            });
        }
        setShowPaymentModal(false);
        setSelectedDate(null);
    };

    // Get background style for selected state
    const getHeaderBgClass = () => {
        if (allSelected) {
            return colors.bgLight;
        } else if (someSelected) {
            return `${colors.bgLight}/50`;
        }
        return 'bg-gray-50/50';
    };

    return (
        <div
            className="bg-white rounded-lg overflow-hidden border-l-4 border border-gray-100"
            style={{ borderLeftColor: getColorHex(colors.color) }}
        >
            {/* Project Header */}
            <div className={`px-4 py-3 flex items-center justify-between transition-colors ${getHeaderBgClass()}`}>
                <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <div className={!isSelectionEnabled ? 'invisible w-0' : ''}>
                        {isSelectionEnabled && (
                            <input
                                type="checkbox"
                                checked={allSelected}
                                ref={el => {
                                    if (el) el.indeterminate = someSelected;
                                }}
                                onChange={() => onToggleProject(expenses)}
                                className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-blue-500"
                            />
                        )}
                    </div>

                    {/* Project Badge */}
                    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border ${colors.bgLight} ${colors.border}`}>
                        <div className={`w-2 h-2 rounded-full ${colors.dot}`}></div>
                        <span className={`font-mono text-xs font-semibold ${colors.text}`}>{projectCode}</span>
                    </div>

                    {/* Project Name */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowProjectInfo(true);
                        }}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors group"
                        title="ดูข้อมูลโปรเจค"
                    >
                        <span>{project?.projectName || 'Unknown Project'}</span>
                        <Info size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </button>

                    {/* Items Count */}
                    <span className="text-xs text-gray-400">
                        ({expenses.length} รายการ)
                    </span>
                </div>

                {/* Right Side: Total & Expand */}
                <div className="flex items-center gap-3">
                    <div className="text-sm">
                        <span className="text-gray-400 mr-2">รวม</span>
                        <span className="font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">
                            ฿{formatNumber(totalAmount)}
                        </span>
                    </div>
                    {/* Payment Cycle Change Button for Project */}
                    <button
                        onClick={handleOpenPaymentModal}
                        className="p-1.5 rounded-lg hover:bg-amber-100 text-gray-400 hover:text-amber-500 transition-colors"
                        title="เปลี่ยนแปลงรอบเบิกจ่ายทั้งโปรเจค"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </button>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        style={{
                            '--hover-bg': getColorHex(colors.color) + '20',
                            '--hover-text': getColorHex(colors.color)
                        }}
                    >
                        <svg
                            width="18"
                            height="18"
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

            {/* Expense Items */}
            {isExpanded && (
                <div className="divide-y divide-gray-100">
                    {expenses.map((expense) => (
                        <ExpenseItem
                            key={expense.id}
                            data={expense}
                            project={project} // Pass project down
                            isSelected={selectedExpenses.has(expense.id)}
                            onToggle={() => onToggleExpense(expense.id)}
                            onPaymentCycleChange={onPaymentCycleChange}
                            isSelectionEnabled={isSelectionEnabled}
                        />
                    ))}
                </div>
            )}

            {/* Payment Cycle Change Modal for Entire Project */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowPaymentModal(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-5 border-b border-amber-100/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">เปลี่ยนรอบเบิกจ่ายทั้งโปรเจค</h3>
                                        <p className="text-xs text-gray-500">เฉพาะรายจ่าย ไม่รวมเอกสาร</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="p-2 hover:bg-white/70 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-5 pt-4">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                                <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border ${colors.bgLight} ${colors.border}`}>
                                    <div className={`w-2 h-2 rounded-full ${colors.dot}`}></div>
                                    <span className={`font-mono text-xs font-semibold ${colors.text}`}>
                                        {projectCode}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-600">{project?.projectName}</span>
                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">({expenses.length} รายการ)</span>
                            </div>

                            <CalendarHub
                                selectedDate={selectedDate}
                                onDateSelect={setSelectedDate}
                                disablePast={true}
                                size="md"
                                colorTheme="amber"
                            />

                            {selectedDate && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/50 text-center">
                                    <span className="text-base font-bold text-amber-700">
                                        วันที่เลือก {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-5 pt-2">
                            <button
                                onClick={handleConfirmPaymentChange}
                                disabled={!selectedDate}
                                className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${selectedDate
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/30'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                ยืนยันเปลี่ยนทั้ง {expenses.length} รายการ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Project Info Modal */}
            <ProjectInfo
                isOpen={showProjectInfo}
                onClose={() => setShowProjectInfo(false)}
                projectData={{
                    projectCode: projectCode,
                    projectName: project?.projectName || 'Unknown Project',
                    projectType: project?.projectType || 'In-House',
                    startDate: project?.startDate,
                    endDate: project?.endDate,
                    location: project?.location,
                    teamMembers: teamMembers
                }}
            />
        </div>
    );
};

export default ProjectExpenseGroup;
