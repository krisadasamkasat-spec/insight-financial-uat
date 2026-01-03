const db = require('../db');

// Roles
const getAllRoles = async () => {
    const result = await db.query('SELECT * FROM roles ORDER BY id');
    return result.rows;
};

// Project Types
const getAllProjectTypes = async () => {
    const result = await db.query('SELECT * FROM project_types ORDER BY id');
    return result.rows;
};

// Financial Statuses - Hardcoded since table was removed
const getFinancialStatuses = async (category) => {
    // Return hardcoded statuses based on category
    if (category === 'income') {
        return [
            { id: 1, value: 'pending', label: 'รอดำเนินการ', category: 'income' },
            { id: 2, value: 'invoiced', label: 'ออกใบแจ้งหนี้แล้ว', category: 'income' },
            { id: 3, value: 'received', label: 'รับเงินแล้ว', category: 'income' }
        ];
    } else if (category === 'expense') {
        return [
            { id: 1, value: 'ส่งเบิกแล้ว รอเอกสารตัวจริง', label: 'ส่งเบิกแล้ว รอเอกสารตัวจริง', category: 'expense' },
            { id: 2, value: 'บัญชีตรวจ และ ได้รับเอกสารตัวจริง', label: 'บัญชีตรวจ และ ได้รับเอกสารตัวจริง', category: 'expense' },
            { id: 3, value: 'VP อนุมัติแล้ว ส่งเบิกได้', label: 'VP อนุมัติแล้ว ส่งเบิกได้', category: 'expense' },
            { id: 4, value: 'ส่งเข้า PEAK', label: 'ส่งเข้า PEAK', category: 'expense' },
            { id: 5, value: 'โอนแล้ว รอส่งหลักฐาน', label: 'โอนแล้ว รอส่งหลักฐาน', category: 'expense' },
            { id: 6, value: 'ส่งหลักฐานแล้ว เอกสารครบ', label: 'ส่งหลักฐานแล้ว เอกสารครบ', category: 'expense' },
            { id: 7, value: 'reject ยกเลิก / รอแก้ไข', label: 'reject ยกเลิก / รอแก้ไข', category: 'expense' }
        ];
    }
    return [];
};

module.exports = {
    getAllRoles,
    getAllProjectTypes,
    getFinancialStatuses
};
