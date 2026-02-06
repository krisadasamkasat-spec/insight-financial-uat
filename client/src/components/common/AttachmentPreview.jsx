import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Image, File, FileCheck, FileX } from 'lucide-react';
import { API_BASE } from '../../services/api';

/**
 * AttachmentPreview Component
 * Shows attachment icon with badge count
 * Hover: Dropdown showing file list (uses Portal to escape overflow-hidden)
 * Click: Opens modal via onOpenModal callback
 */
const DropdownPortal = ({ showDropdown, dropdownPosition, handleDropdownMouseEnter, handleDropdownMouseLeave, hasAttachments, attachments, maxPreview, getFileIcon, getFileName, imgError, onImgError }) => {
    if (!showDropdown) return null;

    return createPortal(
        <div
            className="fixed z-[9999]"
            style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                transform: 'translateX(-50%)'
            }}
            onMouseEnter={handleDropdownMouseEnter}
            onMouseLeave={handleDropdownMouseLeave}
        >
            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-2">
                <div className="border-8 border-transparent border-b-gray-800"></div>
            </div>

            {/* Content */}
            <div className="bg-white text-gray-900 rounded-lg shadow-xl overflow-hidden min-w-[220px] border border-gray-200">
                {/* Header */}
                <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <FileCheck className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-sm text-gray-700">
                        {hasAttachments
                            ? `${attachments.length} ไฟล์แนบ`
                            : 'ไม่มีเอกสารแนบ'
                        }
                    </span>
                </div>

                {/* File List */}
                {hasAttachments ? (
                    <div className="p-2 max-h-[200px] overflow-y-auto">
                        <div className="space-y-1">
                            {attachments.slice(0, maxPreview).map((file, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                                >
                                    {['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(getFileName(file)?.split('.').pop()?.toLowerCase()) && file.file_path && !imgError[idx] ? (
                                        <img
                                            src={`${API_BASE}/${file.file_path.replace(/^\//, '')}`}
                                            alt={getFileName(file)}
                                            className="w-8 h-8 object-cover rounded border border-gray-200"
                                            onError={() => onImgError(idx)}
                                        />
                                    ) : (
                                        <div className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded border border-gray-100">
                                            {getFileIcon(file)}
                                        </div>
                                    )}
                                    <span className="text-xs text-gray-600 truncate flex-1 block max-w-[180px]">
                                        {getFileName(file)}
                                    </span>
                                </div>
                            ))}
                            {attachments.length > maxPreview && (
                                <div className="text-xs text-gray-400 text-center py-1 italic">
                                    ...และอีก {attachments.length - maxPreview} ไฟล์
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-4 text-center">
                        <FileX className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">ยังไม่มีไฟล์แนบ</p>
                    </div>
                )}

                {/* Footer - Click hint */}
                {hasAttachments && (
                    <div className="px-3 py-1.5 border-t border-gray-100 text-center bg-gray-50/30">
                        <span className="text-[10px] text-blue-500 font-medium">
                            คลิกเพื่อดูรายละเอียด
                        </span>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

const AttachmentPreview = ({
    attachments = [],
    maxPreview = 5,
    onOpenModal = () => { },
    size = 'sm' // 'sm' | 'md'
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const timeoutRef = useRef(null);
    const buttonRef = useRef(null);

    const hasAttachments = attachments.length > 0;
    const [imgError, setImgError] = useState({});

    useEffect(() => {
        if (!showDropdown) {
            setImgError({});
        }
    }, [showDropdown]);

    // Calculate dropdown position based on button position
    const updateDropdownPosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 8, // 8px gap below button
                left: rect.left + rect.width / 2 // Center aligned
            });
        }
    };

    // Handle hover with delay
    const handleMouseEnter = () => {
        if (!hasAttachments) return; // Disable hover if no attachments
        setIsHovered(true);
        updateDropdownPosition();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            updateDropdownPosition();
            setShowDropdown(true);
        }, 200);
    };

    const handleMouseLeave = () => {
        if (!hasAttachments) return;
        setIsHovered(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setShowDropdown(false);
        }, 150);
    };

    // Handle dropdown mouse events to keep it open when hovering over dropdown
    const handleDropdownMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsHovered(true);
    };

    const handleDropdownMouseLeave = () => {
        setIsHovered(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setShowDropdown(false);
        }, 150);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    // Update position on scroll/resize
    useEffect(() => {
        if (showDropdown) {
            const handleUpdate = () => updateDropdownPosition();
            window.addEventListener('scroll', handleUpdate, true);
            window.addEventListener('resize', handleUpdate);
            return () => {
                window.removeEventListener('scroll', handleUpdate, true);
                window.removeEventListener('resize', handleUpdate);
            };
        }
    }, [showDropdown]);

    // Get file icon based on type
    const getFileIcon = (file) => {
        const name = typeof file === 'string' ? file : file.name || file.file_name || '';
        const ext = name.split('.').pop()?.toLowerCase() || '';

        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            return <Image className="w-3 h-3 text-pink-500" />;
        }
        if (ext === 'pdf') {
            return <FileText className="w-3 h-3 text-red-500" />;
        }
        if (['doc', 'docx'].includes(ext)) {
            return <FileText className="w-3 h-3 text-blue-500" />;
        }
        if (['xls', 'xlsx'].includes(ext)) {
            return <FileText className="w-3 h-3 text-green-500" />;
        }
        return <File className="w-3 h-3 text-gray-500" />;
    };

    // Get file name
    const getFileName = (file) => {
        return typeof file === 'string' ? file : file.name || file.file_name || 'Unknown file';
    };

    const handleClick = (e) => {
        if (!hasAttachments) return;
        e.stopPropagation();
        setShowDropdown(false);
        onOpenModal();
    };

    // Size variants
    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs gap-1',
        md: 'px-2.5 py-1 text-sm gap-1.5'
    };

    const iconSize = 16;

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                disabled={!hasAttachments}
                className={`
                    inline-flex items-center rounded font-medium transition-all duration-200
                    ${sizeClasses[size]}
                    ${hasAttachments
                        ? 'text-blue-600 hover:text-blue-800 cursor-pointer'
                        : 'text-gray-400 cursor-not-allowed opacity-70'
                    }
                    ${isHovered ? '' : ''}
                `}
            >
                {hasAttachments ? (
                    <FileCheck style={{ width: iconSize, height: iconSize }} />
                ) : (
                    <FileX style={{ width: iconSize, height: iconSize }} />
                )}
                <span>{hasAttachments ? attachments.length : '-'}</span>
            </button>

            <DropdownPortal
                showDropdown={showDropdown}
                dropdownPosition={dropdownPosition}
                handleDropdownMouseEnter={handleDropdownMouseEnter}
                handleDropdownMouseLeave={handleDropdownMouseLeave}
                hasAttachments={hasAttachments}
                attachments={attachments}
                maxPreview={maxPreview}
                getFileIcon={getFileIcon}
                getFileName={getFileName}
                imgError={imgError}
                onImgError={(idx) => setImgError(prev => ({ ...prev, [idx]: true }))}
            />
        </>
    );
};

export default AttachmentPreview;
