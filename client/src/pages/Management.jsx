import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, GraduationCap, Receipt } from 'lucide-react';
import ContactsTab from '../components/management/ContactsTab';
import ProductsTab from '../components/management/ProductsTab';
import AccountCodesTab from '../components/management/AccountCodesTab';

const Management = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'contacts';

    const tabs = [
        { id: 'contacts', label: 'คู่ค้า/ทีมงาน', icon: Users },
        { id: 'products', label: 'หลักสูตร', icon: GraduationCap },
        { id: 'accounts', label: 'รหัสค่าใช้จ่าย', icon: Receipt },
    ];

    const setActiveTab = (tabId) => {
        setSearchParams({ tab: tabId });
    };

    const renderTab = () => {
        switch (activeTab) {
            case 'contacts':
                return <ContactsTab />;
            case 'products':
                return <ProductsTab />;
            case 'accounts':
                return <AccountCodesTab />;
            default:
                return <ContactsTab />;
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">ข้อมูลหลัก</h1>
                <p className="text-gray-500 text-sm mt-1">จัดการข้อมูลคู่ค้า หลักสูตร และรหัสค่าใช้จ่าย</p>
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

export default Management;
