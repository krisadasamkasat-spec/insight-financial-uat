import React, { useState, useMemo } from 'react';
import CalendarHub from './CalendarHub';
import ProjectDetails from '../projects/ProjectInfo';
import FileRepository from '../common/FileRepository';

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

import { useSettings } from '../../contexts/SettingsContext';

const ExpenseCard = ({ data, project, isSelected, onToggle, onPaymentCycleChange }) => {

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showProjectDetails, setShowProjectDetails] = useState(false);
    const [showDocuments, setShowDocuments] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    const { getStatusColorClasses } = useSettings();

    const {
        projectCode,
        expenseCode,
        projectType,
        title,
        description,
        status,
        recipient,
        issueDate,
        paymentDate,
        netAmount,
        priceAmount,
        vat,
        wht
    } = data;

    // Derived values
    const statusColors = getStatusColorClasses(status);
    const company = data.company || project?.company || "บริษัทคอมมอนกราวด์ ประเทศไทย จำกัด"; // Use project company if available

    // Use project data passed from parent
    // const project = useMemo(() => getProjectByCode(projectCode), [projectCode]); // Removed mock

    // Get team members - assuming project.teamMembers is available
    const teamMembers = useMemo(() => {
        if (!project?.teamMembers) return [];
        return project.teamMembers.map(t => ({
            nickname: t.member_name || t.nickname || 'Unknown',
            role: t.role || 'Member'
        }));
    }, [project]);

    const formatNumber = (num) => {
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\//g, '-');
    };

    const formatDateKey = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const handleOpenPaymentModal = () => {
        // setShowMenu(false); // Removed
        setShowPaymentModal(true);
        setSelectedDate(null);
    };

    const handleConfirmPaymentChange = () => {
        if (selectedDate && onPaymentCycleChange) {
            onPaymentCycleChange(data.id, formatDateKey(selectedDate));
        }
        setShowPaymentModal(false);
        setSelectedDate(null);
    };

    return (
        <>
            <div className={`flex justify-between bg-white p-5 font-sans transition-colors duration-200 hover:bg-gray-50 ${isSelected ? 'bg-blue-50/50' : ''}`}>
                <div className="flex gap-4 flex-1">
                    <div className="pt-0.5">
                        <input
                            type="checkbox"
                            checked={isSelected || false}
                            onChange={onToggle}
                            className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-blue-500"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        {/* Project Code & Title */}
                        <div className="flex items-center gap-2 text-sm">
                            <button
                                onClick={() => setShowProjectDetails(true)}
                                className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
                            >
                                {projectCode}
                            </button>
                            <span className="text-gray-300">|</span>
                            <span className="text-gray-700">{expenseCode} {projectType} {title}</span>
                        </div>

                        {/* Description */}
                        <div className="text-gray-400 text-xs">{description}</div>

                        {/* Tags Row */}
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                                {status}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                                    <line x1="12" y1="2" x2="12" y2="22"></line>
                                </svg>
                                {company}
                            </div>
                        </div>

                        {/* Recipient */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            {recipient}
                        </div>
                    </div>
                </div>

                {/* Right Side - Amounts & Menu */}
                <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1 min-w-[140px] text-right">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Net</span>
                            <span className="text-red-500 font-bold">{formatNumber(netAmount)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Price</span>
                            <span className="text-gray-600">{formatNumber(priceAmount)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">VAT</span>
                            <span className="text-gray-600">{vat}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">หัก ณ ที่จ่าย</span>
                            <span className="text-gray-600">{formatNumber(wht)}</span>
                        </div>
                        {/* Issue Date */}
                        <div className="text-[10px] text-gray-300 mt-1">Issue Date: {formatDate(issueDate)}</div>
                    </div>

                    {/* Action Icons */}
                    <div className="flex flex-col items-center gap-1">
                        {/* Documents Icon */}
                        <button
                            onClick={() => setShowDocuments(true)}
                            className={`p-1.5 rounded-full transition-colors ${data.attachments?.length > 0 ? 'hover:bg-blue-50 text-blue-500' : 'hover:bg-gray-100 text-gray-400'}`}
                            title="รายการเอกสารแนบ"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                        </button>

                        {/* Payment Cycle Change Icon */}
                        <button
                            onClick={handleOpenPaymentModal}
                            className="p-1.5 hover:bg-amber-50 rounded-full transition-colors text-gray-400 hover:text-amber-500 group relative"
                            title="เปลี่ยนแปลงรอบเบิกจ่าย"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Cycle Change Modal with Calendar */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowPaymentModal(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Header with Gradient */}
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
                                    <h3 className="text-lg font-bold text-gray-800">เปลี่ยนแปลงรอบเบิกจ่าย</h3>
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

                        {/* Body - Calendar */}
                        <div className="p-5 pt-4">
                            {/* Project Info as Label */}
                            <div className="text-sm font-semibold text-amber-600 mb-4 pb-3 border-b border-gray-100">
                                {projectCode} | {expenseCode} {projectType} {title}
                            </div>

                            {/* Use reusable Calendar component */}
                            <CalendarHub
                                selectedDate={selectedDate}
                                onDateSelect={setSelectedDate}
                                disablePast={true}
                                initialMonth={paymentDate ? new Date(paymentDate) : null}
                                size="md"
                                colorTheme="amber"
                            />

                            {/* Selected Date Display */}
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
                                ยืนยัน
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Project Details Modal */}
            <ProjectDetails
                isOpen={showProjectDetails}
                onClose={() => setShowProjectDetails(false)}
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

            {/* Attached Documents Modal */}
            <FileRepository
                isOpen={showDocuments}
                onClose={() => setShowDocuments(false)}
                documents={data.attachments || []}
                projectCode={data.projectCode}
            />
        </>
    );
};

export default ExpenseCard;
