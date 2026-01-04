import React, { useState, useMemo } from 'react';
import { HandCoins, FileUser } from 'lucide-react';
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
        // Initialize with current payment date or default to null
        if (paymentDate) {
            setSelectedDate(new Date(paymentDate));
        } else {
            setSelectedDate(null);
        }
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
                <div className="flex gap-4 w-[65%]">
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

                    {/* Left Content Column */}
                    <div className="flex flex-col gap-[16px] flex-1 min-w-0">
                        {/* BLACK BOX GROUP: Top Row + Description (Gap 4px) */}
                        <div className="flex flex-col gap-[4px]">
                            {/* Row 1: Project Code | Expense Code | Account Title */}
                            {/* Header: font-size 16px, color #202224. Project Code (Bold), Expense Code (Normal), Account Title (Normal) */}
                            <div className="flex items-center gap-2 flex-wrap text-[16px] text-[#202224]">
                                <button
                                    onClick={() => setShowProjectDetails(true)}
                                    className="font-bold underline hover:text-gray-700 transition-colors cursor-pointer"
                                >
                                    {projectCode}
                                </button>
                                <span className="text-[#202224]">|</span>
                                <span className="font-normal">
                                    {expenseCode}
                                </span>
                                <span className="text-[#202224]">|</span>
                                <span className="font-normal truncate max-w-[250px]" title={data.account_title}>
                                    {data.account_title || '-'}
                                </span>
                            </div>

                            {/* Row 2: Description */}
                            {/* Description: font-size 12px, normal, color #A0AEC0 */}
                            <div className="text-[12px] font-normal text-[#A0AEC0] line-clamp-1" title={description}>
                                {description || '-'}
                                {project?.projectName && (
                                    <>
                                        <span className="ml-1">{project.projectName}</span>
                                        {project.startDate && (
                                            <span className="ml-1">
                                                {new Date(project.startDate).toISOString().split('T')[0]}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* RED BOX GROUP: Status Row + Contact Row (Gap 8px) */}
                        <div className="flex flex-col gap-[8px]">
                            {/* Row 3: Type Badge + Payback To/Store */}
                            {/* Badge Row: font-size 12px, color #202224, normal */}
                            <div className="flex items-center gap-[8px]">
                                {category_type === 'เบิกที่สำรองจ่าย' ? (
                                    <>
                                        <span className="px-3 py-0.5 rounded-full text-[12px] font-medium bg-[#4285F4] text-white">
                                            สำรองจ่าย
                                        </span>
                                        <div className="flex items-center gap-[8px] text-[12px] text-[#202224] font-normal">
                                            <HandCoins className="w-6 h-6 text-[#202224]" strokeWidth={1.5} />
                                            {data.payback_to || payback_name || '-'}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span className="px-3 py-0.5 rounded-full text-[12px] font-medium bg-[#00C4B4] text-white">
                                            วางบิล
                                        </span>
                                        <div className="flex items-center gap-[8px] text-[12px] text-[#202224] font-normal">
                                            <HandCoins className="w-6 h-6 text-[#202224]" strokeWidth={1.5} />
                                            {vendor_name || data.contact || '-'}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Row 4: Bill Header / Recipient */}
                            {/* User Icon Row: font-size 12px, color #202224. Contact (Bold), Bill Header (Normal) */}
                            <div className="flex items-center gap-[8px] text-[12px] text-[#202224] pl-0.5">
                                <FileUser className="w-6 h-6 text-[#202224]" strokeWidth={1.5} />
                                <span className="truncate max-w-[300px]" title={`${data.contact || ''} (${data.bill_header || ''})`}>
                                    <span className="font-bold">{data.contact || '-'}</span>
                                    {data.bill_header && <span className="font-normal"> ({data.bill_header})</span>}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Amounts & Menu */}
                <div className="flex items-stretch gap-4 w-[35%] justify-end">
                    {/* Financials Column - Using flex, all right-aligned */}
                    <div className="flex flex-col gap-[8px]">
                        {/* Net Amount */}
                        <div className="flex justify-end gap-4">
                            <span className="text-[16px] text-[#202224] text-right whitespace-nowrap">Net</span>
                            <span className="text-[16px] text-[#FF5757] font-bold text-right w-[120px] whitespace-nowrap">{formatNumber(netAmount)}</span>
                        </div>

                        {/* Price */}
                        <div className="flex justify-end gap-4">
                            <span className="text-[16px] text-[#202224] text-right whitespace-nowrap">Price</span>
                            <span className="text-[16px] text-[#202224] font-medium text-right w-[120px] whitespace-nowrap">{formatNumber(priceAmount)}</span>
                        </div>

                        {/* VAT */}
                        <div className="flex justify-end gap-4">
                            <span className="text-[16px] text-[#202224] text-right whitespace-nowrap">VAT</span>
                            <span className="text-[16px] text-[#202224] text-right w-[120px] whitespace-nowrap">
                                {(vatAmount && vatAmount > 0) ? `7% (${formatNumber(vatAmount)})` : 'N/A'}
                            </span>
                        </div>

                        {/* WHT */}
                        <div className="flex justify-end gap-4">
                            <span className="text-[16px] text-[#202224] text-right whitespace-nowrap">หัก ณ ที่จ่าย</span>
                            <span className="text-[16px] text-[#202224] text-right w-[120px] whitespace-nowrap">
                                {(whtAmount && whtAmount > 0) ? formatNumber(whtAmount) : 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* Actions Column - Icons vertical (column) */}
                    <div className="flex flex-col items-center justify-start border-l border-gray-100 pl-1 gap-0.5">
                        {/* 1. Reject Icon (NEW) */}
                        {isSelectionEnabled && onReject && (
                            <button
                                onClick={() => onReject(data)}
                                className="p-1 hover:bg-red-50 rounded transition-colors text-gray-400 hover:text-red-500"
                                title="ไม่อนุมัติรายการนี้"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                                className="p-1 hover:bg-amber-50 rounded transition-colors text-gray-400 hover:text-amber-500"
                                title="เปลี่ยนแปลงรอบเบิกจ่าย"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                            </button>
                        )}

                        {/* 3. Documents Icon */}
                        <div className="p-1">
                            <AttachmentPreview
                                attachments={data.attachments || []}
                                onOpenModal={() => setShowDocuments(true)}
                                size="sm"
                            />
                        </div>
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
                                disablePast={false}
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
