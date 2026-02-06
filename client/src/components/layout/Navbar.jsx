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
            {/* Icons removed as per user request */}
            <div className="flex items-center gap-2">
            </div>
        </header>
    );
};

export default Navbar;
