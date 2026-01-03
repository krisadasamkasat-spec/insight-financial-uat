import React, { useState, useMemo } from 'react';
import CalendarHub from './CalendarHub';
import ProjectInfo from '../projects/ProjectInfo';
import FileRepository from '../common/FileRepository';
import AttachmentPreview from '../common/AttachmentPreview';
import { useSettings } from '../../contexts/SettingsContext';

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const PaymentCycleExpenseCard = ({
    data,
    project,
    isSelected,
    onToggle,
    onPaymentCycleChange,
    onReject,  // NEW: callback for rejection
    isSelectionEnabled = true
}) => {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showProjectDetails, setShowProjectDetails] = useState(false);
    const [showDocuments, setShowDocuments] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    const { getStatusColorClasses } = useSettings();

    const {
        id,
        projectCode,
        expenseCode,
        expenseCategory,
        title,
        description,
        status,
        recipient,
        issueDate,
        paymentDate,
        netAmount,
        priceAmount,
        vatAmount,
        whtAmount,
        createdAt,
        // New fields
        category_type,
        peak_status,
        vendor_name,
        payback_name
    } = data;

    // Derived values
    const statusColors = getStatusColorClasses(status);
    const company = project?.customerName || project?.customer_name || "บริษัทคอมมอนกราวด์ ประเทศไทย จำกัด";

    // Get team members from project
    const teamMembers = useMemo(() => {
        if (!project?.teamMembers) return [];
        return project.teamMembers.map(t => ({
            nickname: t.member_name || t.nickname || 'Unknown',
            role: t.role || 'Member'
        }));
    }, [project]);

    const formatNumber = (num) => {
        if (num === undefined || num === null || isNaN(num)) return '0.00';
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
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

    const handleOpenPaymentModal = (e) => {
        e.stopPropagation();
        setShowPaymentModal(true);
        setSelectedDate(null);
    };

    const handleConfirmPaymentChange = () => {
        if (selectedDate && onPaymentCycleChange) {
            onPaymentCycleChange(id, formatDateKey(selectedDate));
        }
        setShowPaymentModal(false);
        setSelectedDate(null);
    };

    return (
        <>
            <div className={`flex justify-between bg-white p-5 font-sans transition-colors duration-200 hover:bg-gray-50 border-b border-gray-100 ${isSelected ? 'bg-blue-50/50' : ''}`}>
                <div className="flex gap-4 flex-1">
                    {/* Checkbox */}
                    {isSelectionEnabled && (
                        <div className="pt-1">
                            <input
                                type="checkbox"
                                checked={isSelected || false}
                                onChange={onToggle}
                                className="w-5 h-5 rounded border-gray-300 cursor-pointer accent-blue-600 transition-all hover:scale-105"
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        {/* Row 1: Project Code | Expense Code | Account Title - BOLD 16px */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => setShowProjectDetails(true)}
                                className="font-bold text-[16px] text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer"
                            >
                                {projectCode}
                            </button>
                            <span className="text-gray-300 text-[16px]">|</span>
                            <span className="text-gray-600 font-mono text-[16px] font-semibold">
                                {expenseCode}
                            </span>
                            <span className="text-gray-300 text-[16px]">|</span>
                            <span className="text-gray-600 text-[16px] font-semibold truncate max-w-[250px]" title={data.account_title}>
                                {data.account_title || '-'}
                            </span>
                        </div>

                        {/* Row 2: Description - 12px */}
                        <div className="text-[12px] text-gray-500 line-clamp-1" title={description}>
                            {description || '-'}
                        </div>

                        {/* Row 3: Type Badge + Payback To/Store */}
                        <div className="flex items-center gap-2 mt-1">
                            {/* Logic: If expense_type is 'เบิกที่สำรองจ่าย', use Blue badge + User Icon + PaybackTo
                                      If expense_type is 'วางบิล', use Green badge + Store Icon + Contact */}
                            {category_type === 'เบิกที่สำรองจ่าย' ? (
                                <>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                        เบิกที่สำรองจ่าย
                                    </span>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        {/* Show payback_to (person who paid) */}
                                        {data.payback_to || payback_name || '-'}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                                        วางบิล
                                    </span>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
                                            <path d="M3 21h18" />
                                            <path d="M5 21V7l8-4 8 4v14" />
                                            <path d="M17 21v-8H7v8" />
                                        </svg>
                                        {/* Show contact (shop name) */}
                                        {vendor_name || data.contact || '-'}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Row 4: Bill Header / Recipient - 12px, format: contact (bold) + (bill_header) */}
                        <div className="flex items-center gap-1.5 text-[12px] text-gray-500 pl-0.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            <span className="truncate max-w-[300px]" title={`${data.contact || ''} (${data.bill_header || ''})`}>
                                <span className="font-semibold text-gray-700">{data.contact || '-'}</span>
                                {data.bill_header && <span className="font-normal text-gray-400"> ({data.bill_header})</span>}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Amounts & Menu */}
                <div className="flex items-stretch gap-4">
                    {/* Financials Column */}
                    <div className="flex flex-col items-end justify-start gap-1 min-w-[120px] pt-1">
                        {/* Net Amount - Red Bold */}
                        <div className="flex justify-between w-full items-baseline text-sm">
                            <span className="text-gray-400 text-xs">Net</span>
                            <span className="text-red-600 font-bold text-base">{formatNumber(netAmount)}</span>
                        </div>

                        {/* Price */}
                        <div className="flex justify-between w-full items-baseline text-xs">
                            <span className="text-gray-400">Price</span>
                            <span className="text-gray-600 font-medium">{formatNumber(priceAmount)}</span>
                        </div>

                        {/* VAT */}
                        <div className="flex justify-between w-full items-baseline text-xs">
                            <span className="text-gray-400">VAT</span>
                            <span className="text-gray-600">
                                {(vatAmount && vatAmount > 0) ? `7% (${formatNumber(vatAmount)})` : 'N/A'}
                            </span>
                        </div>

                        {/* WHT */}
                        <div className="flex justify-between w-full items-baseline text-xs">
                            <span className="text-gray-400">หัก ณ ที่จ่าย</span>
                            <span className="text-gray-600">
                                {(whtAmount && whtAmount > 0) ? formatNumber(whtAmount) : 'N/A'}
                            </span>
                        </div>

                        {/* Issue Date - Below WHT */}
                        <div className="text-[10px] text-gray-400 mt-1 text-right">
                            Issue Date: {formatDate(issueDate || createdAt)}
                        </div>
                    </div>

                    {/* Actions Column - Icons vertical (column) */}
                    <div className="flex flex-col items-center justify-start py-1 border-l border-gray-100 pl-3 gap-1">
                        {/* 1. Reject Icon (NEW) */}
                        {isSelectionEnabled && onReject && (
                            <button
                                onClick={() => onReject(data)}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                                title="ไม่อนุมัติรายการนี้"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                </svg>
                            </button>
                        )}

                        {/* 2. Calendar Icon */}
                        {isSelectionEnabled && (
                            <button
                                onClick={handleOpenPaymentModal}
                                className="p-1.5 hover:bg-amber-50 rounded-lg transition-colors text-gray-400 hover:text-amber-500"
                                title="เปลี่ยนแปลงรอบเบิกจ่าย"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                            </button>
                        )}

                        {/* 3. Documents Icon */}
                        <AttachmentPreview
                            attachments={data.attachments || []}
                            onOpenModal={() => setShowDocuments(true)}
                            size="sm"
                        />
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
                            {/* Expense Info as Label */}
                            <div className="text-sm font-semibold text-amber-600 mb-4 pb-3 border-b border-gray-100">
                                {projectCode} | {expenseCode} {title}
                            </div>

                            {/* Calendar component */}
                            <CalendarHub
                                selectedDate={selectedDate}
                                onDateSelect={setSelectedDate}
                                disablePast={true}
                                initialMonth={paymentDate ? new Date(paymentDate) : null}
                                size="md"
                                colorTheme="amber"
                                highlightDate={paymentDate ? new Date(paymentDate) : null}
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
            <ProjectInfo
                isOpen={showProjectDetails}
                onClose={() => setShowProjectDetails(false)}
                projectData={{
                    projectCode: projectCode,
                    projectName: project?.projectName || project?.project_name || 'Unknown Project',
                    projectType: project?.projectType || project?.project_type || 'In-House',
                    startDate: project?.startDate || project?.start_date,
                    endDate: project?.endDate || project?.end_date,
                    location: project?.location,
                    teamMembers: teamMembers
                }}
            />

            {/* Attached Documents Modal */}
            <FileRepository
                isOpen={showDocuments}
                onClose={() => setShowDocuments(false)}
                documents={data.attachments || []}
                projectCode={projectCode}
            />
        </>
    );
};

export default PaymentCycleExpenseCard;
