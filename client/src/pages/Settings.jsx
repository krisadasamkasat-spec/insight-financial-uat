import React, { useState } from 'react';
import { FolderKanban, Palette, Receipt, GraduationCap, Users } from 'lucide-react';
import ProjectTypesTab from '../components/settings/ProjectTypesTab';
import StatusSettingsTab from '../components/settings/ColorSettingsTab';
import ExpenseCodesTab from '../components/settings/ExpenseCodesTab';
import ProductsTab from '../components/settings/ProductsTab';
import TeamMembersTab from '../components/settings/TeamMembersTab';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('projectTypes');

    const tabs = [
        { id: 'projectTypes', label: 'ประเภทโปรเจค', icon: FolderKanban },
        { id: 'statuses', label: 'สถานะ', icon: Palette },
        { id: 'expenses', label: 'รหัสค่าใช้จ่าย', icon: Receipt },
        { id: 'products', label: 'หลักสูตร', icon: GraduationCap },
        { id: 'team', label: 'ทีมงาน', icon: Users },
    ];

    const renderTab = () => {
        switch (activeTab) {
            case 'projectTypes':
                return <ProjectTypesTab />;
            case 'statuses':
                return <StatusSettingsTab />;
            case 'expenses':
                return <ExpenseCodesTab />;
            case 'products':
                return <ProductsTab />;
            case 'team':
                return <TeamMembersTab />;
            default:
                return <ProjectTypesTab />;
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">ตั้งค่าระบบ</h1>
                <p className="text-gray-500 text-sm mt-1">จัดการข้อมูลหลักและการตั้งค่าต่างๆ ของระบบ</p>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${isActive
                                        ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {renderTab()}
                </div>
            </div>
        </div>
    );
};

export default Settings;
