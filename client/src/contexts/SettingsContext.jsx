import React, { createContext, useContext, useState, useEffect } from 'react';


// Default Expense Status Colors
const defaultExpenseStatusColors = [
    { key: 'วางบิล', label: 'วางบิล', color: 'green' },
    { key: 'สำรองจ่าย', label: 'สำรองจ่าย', color: 'blue' },
    { key: 'จ่ายแล้ว', label: 'จ่ายแล้ว', color: 'emerald' },
    { key: 'รอรับ', label: 'รอรับ (รายรับ)', color: 'yellow' },
    { key: 'ได้รับแล้ว (รายรับ)', label: 'ได้รับแล้ว', color: 'emerald' }
];

// Default Project Status Colors
const defaultProjectStatusColors = [
    { key: 'Active', label: 'Active', color: 'green' },
    { key: 'Completed', label: 'Completed', color: 'gray' }
];

// Utility to get Tailwind classes from color name
const getTailwindColorClasses = (colorName) => {
    const map = {
        green: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', border: 'border-green-200' },
        emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
        blue: { bg: 'bg-blue-100', text: 'text-blue-600', dot: 'bg-blue-500', border: 'border-blue-200' },
        yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', border: 'border-yellow-200' },
        red: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200' },
        gray: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500', border: 'border-gray-200' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500', border: 'border-purple-200' },
        pink: { bg: 'bg-pink-100', text: 'text-pink-700', dot: 'bg-pink-500', border: 'border-pink-200' },
        orange: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', border: 'border-orange-200' },
        indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500', border: 'border-indigo-200' },
        teal: { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500', border: 'border-teal-200' },
        cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-500', border: 'border-cyan-200' },
        slate: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500', border: 'border-slate-200' },
        zinc: { bg: 'bg-zinc-100', text: 'text-zinc-700', dot: 'bg-zinc-500', border: 'border-zinc-200' },
        neutral: { bg: 'bg-neutral-100', text: 'text-neutral-700', dot: 'bg-neutral-500', border: 'border-neutral-200' },
        stone: { bg: 'bg-stone-100', text: 'text-stone-700', dot: 'bg-stone-500', border: 'border-stone-200' },
        rose: { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500', border: 'border-rose-200' },
        lime: { bg: 'bg-lime-100', text: 'text-lime-700', dot: 'bg-lime-500', border: 'border-lime-200' },
        sky: { bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-500', border: 'border-sky-200' },
        violet: { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500', border: 'border-violet-200' },
        fuchsia: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', dot: 'bg-fuchsia-500', border: 'border-fuchsia-200' },
    };

    return map[colorName] || map.gray;
};

// Initial project types derived from default code colors
const initialProjectTypes = [
    { key: 'INHOUSE', label: 'In-House', color: 'purple' },
    { key: 'PUBLIC', label: 'Public', color: 'emerald' },
    { key: 'EVENT', label: 'Event', color: 'orange' },
    { key: 'GIFT', label: 'Gift', color: 'pink' },
    { key: 'CONSULT', label: 'Consult', color: 'blue' },
    { key: 'OTHER', label: 'Other', color: 'gray' },
];

const SettingsContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    // State for Expense Status Colors
    const [expenseStatusColors, setExpenseStatusColors] = useState(() => {
        const saved = localStorage.getItem('expenseStatusColors');
        return saved ? JSON.parse(saved) : defaultExpenseStatusColors;
    });

    // State for Project Types
    const [projectTypes, setProjectTypes] = useState(() => {
        const saved = localStorage.getItem('projectTypes');
        return saved ? JSON.parse(saved) : initialProjectTypes;
    });

    // State for Project Status Colors
    const [projectStatusColors, setProjectStatusColors] = useState(() => {
        const saved = localStorage.getItem('projectStatusColors');
        return saved ? JSON.parse(saved) : defaultProjectStatusColors;
    });

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('expenseStatusColors', JSON.stringify(expenseStatusColors));
    }, [expenseStatusColors]);

    useEffect(() => {
        localStorage.setItem('projectTypes', JSON.stringify(projectTypes));
    }, [projectTypes]);

    useEffect(() => {
        localStorage.setItem('projectStatusColors', JSON.stringify(projectStatusColors));
    }, [projectStatusColors]);

    // --- Expense Status Helpers ---
    const getStatusColorCode = (status) => {
        const found = expenseStatusColors.find(s => s.key === status);
        return found ? found.color : 'gray';
    };

    const getStatusColorClasses = (status) => {
        const colorCode = getStatusColorCode(status);
        return getTailwindColorClasses(colorCode);
    };

    const updateExpenseStatusColor = (key, newColor, label) => {
        setExpenseStatusColors(prev => {
            const exists = prev.find(s => s.key === key);
            if (exists) {
                return prev.map(s => s.key === key ? { ...s, color: newColor, label: label || s.label } : s);
            } else {
                return [...prev, { key, color: newColor, label: label || key }];
            }
        });
    };

    // --- Project Type Helpers ---

    // Get full config including Tailwind classes for a Project Type Key (e.g. INHOUSE)
    const getProjectTypeConfig = (typeKey) => {
        const type = projectTypes.find(t => t.key === typeKey) ||
            projectTypes.find(t => t.key === 'OTHER') ||
            { color: 'gray' };

        const classes = getTailwindColorClasses(type.color);
        return {
            ...type,
            ...classes
        };
    };

    // Dynamic replacement for getColorsByProjectCode
    const getColorsByProjectCode = (projectCode) => {
        if (!projectCode) return getProjectTypeConfig('OTHER');

        // Find which project type key (prefix) the code starts with
        // Sort by length desc to match longest prefix first (e.g. if we had TYPE and TYPE2)
        const match = projectTypes
            .filter(t => t.key !== 'OTHER') // Handle OTHER specifically as fallback
            .sort((a, b) => b.key.length - a.key.length)
            .find(t => projectCode.startsWith(t.key));

        if (match) {
            return getProjectTypeConfig(match.key);
        }
        return getProjectTypeConfig('OTHER');
    };

    // Dynamic replacement for getColorsByProjectType
    const getColorsByProjectType = (typeName) => {
        // Try to find by label (e.g. "In-House") or key (e.g. "INHOUSE")
        const match = projectTypes.find(t => t.label === typeName || t.key === typeName);
        if (match) {
            return getProjectTypeConfig(match.key);
        }
        return getProjectTypeConfig('OTHER');
    };

    // --- Project Status Helpers ---
    const getProjectStatusColor = (status) => {
        const found = projectStatusColors.find(s => s.key === status);
        return found ? found.color : 'gray';
    };

    const getProjectStatusOptions = () => {
        return projectStatusColors
            .filter(s => s.key !== 'Pending')
            .map(s => ({
                value: s.key,
                label: s.label,
                color: s.color
            }));
    };

    const value = {
        expenseStatusColors,
        setExpenseStatusColors,
        getStatusColorCode,
        getStatusColorClasses,
        getTailwindColorClasses,
        updateExpenseStatusColor,
        // New exports
        projectTypes,
        setProjectTypes,
        getProjectTypeConfig,
        getColorsByProjectCode,
        getColorsByProjectType,
        // Project Status exports
        projectStatusColors,
        setProjectStatusColors,
        getProjectStatusColor,
        getProjectStatusOptions
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
