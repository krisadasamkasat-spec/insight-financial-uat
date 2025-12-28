import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, Settings } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();

    // Get page title based on current path
    const getPageTitle = () => {
        const path = location.pathname;

        if (path === '/' || path === '/dashboard') return 'Dashboard';
        if (path === '/expenses') return 'อนุมัติรายจ่าย';
        if (path === '/projects') return 'โปรเจคทั้งหมด';
        if (path.startsWith('/projects/')) return 'รายละเอียดโปรเจค';
        if (path === '/reports') return 'รายงาน';
        if (path === '/settings') return 'ตั้งค่า';

        return 'Insight Financial';
    };

    return (
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-gray-800">{getPageTitle()}</h1>
            </div>
            <div className="flex items-center gap-2">
                {/* Search Button */}
                <button className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                    <Search className="w-[18px] h-[18px]" />
                </button>
                {/* Notification */}
                <button className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors relative">
                    <Bell className="w-[18px] h-[18px]" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                {/* Settings */}
                <button className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                    <Settings className="w-[18px] h-[18px]" />
                </button>
            </div>
        </header>
    );
};

export default Navbar;
