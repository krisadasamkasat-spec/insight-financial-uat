import React from 'react';
import { Link } from 'react-router-dom';
import { X, FolderOpen, Calendar, MapPin, Users, ExternalLink } from 'lucide-react';

/**
 * ProjectInfo Modal Component
 * Quick view for executives to see project overview and team members
 */
const ProjectInfo = ({ isOpen, onClose, projectData }) => {
    if (!isOpen || !projectData) return null;

    const {
        projectCode = '',
        projectName = '',
        projectType = 'In-House',
        startDate = '',
        endDate = '',
        location = '-',
        teamMembers = [] // Array of { nickname, role }
    } = projectData;

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getTypeStyle = () => {
        return projectType === 'In-House' || projectCode.startsWith('INHOUSE')
            ? 'bg-purple-100 text-purple-700 border-purple-200'
            : 'bg-emerald-100 text-emerald-700 border-emerald-200';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 border-b border-blue-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                <FolderOpen size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">{projectCode}</h3>
                                <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border ${getTypeStyle()}`}>
                                    {projectCode.startsWith('INHOUSE') ? 'In-House' : 'Public'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/70 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-5 py-4 space-y-4">
                    {/* Project Name */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">{projectName || 'ไม่ระบุชื่อ'}</h4>
                    </div>

                    {/* Date & Location */}
                    <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Calendar size={14} className="text-gray-400" />
                            <span>{formatDate(startDate)} - {formatDate(endDate)}</span>
                        </div>
                        {location && location !== '-' && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <MapPin size={14} className="text-gray-400" />
                                <span>{location}</span>
                            </div>
                        )}
                    </div>

                    {/* Team Members */}
                    {teamMembers.length > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                                <Users size={14} />
                                <span>ทีมงาน</span>
                            </div>
                            <div className="space-y-2">
                                {teamMembers.map((member, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg"
                                    >
                                        <span className="text-sm text-gray-800">{member.nickname}</span>
                                        <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                                            {member.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {teamMembers.length === 0 && (
                        <div className="pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Users size={14} />
                                <span>ทีมงาน</span>
                            </div>
                            <p className="text-sm text-gray-400 italic">ยังไม่มีทีมงาน</p>
                        </div>
                    )}
                </div>

                {/* Footer - Link to Project Detail */}
                <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                    <Link
                        to={`/projects/${projectCode}`}
                        onClick={onClose}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium text-sm hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                    >
                        <ExternalLink size={16} />
                        ดูรายละเอียดโปรเจค
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProjectInfo;
