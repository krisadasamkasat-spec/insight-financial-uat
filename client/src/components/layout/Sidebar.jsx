import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CreditCard, BarChart3, Settings, Wallet, CalendarDays, CheckCircle, Database } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/projects', icon: FolderKanban, label: 'Projects' },
        { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
        { to: '/expenses', icon: CreditCard, label: 'Expenses' },

        { to: '/approval', icon: CheckCircle, label: 'Approval' },
        { to: '/reports', icon: BarChart3, label: 'Reports' },
        { to: '/management', icon: Database, label: 'Management' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <aside className="w-52 h-screen bg-gray-800 text-gray-100 flex flex-col fixed left-0 top-0 z-50">
            <div className="p-5 border-b border-gray-700">
                <h2 className="m-0 text-lg font-bold text-white">Insight Financial</h2>
            </div>
            <nav className="flex-1 p-3">
                <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <li key={to}>
                            <NavLink
                                to={to}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${isActive
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                    }`
                                }
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-sm font-medium tracking-wide">{label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-6 border-t border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center font-semibold text-white">AD</div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">Admin User</span>
                        <span className="text-xs text-gray-400">Manager</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
