export const STATUS_DATA = [
    { value: 'ส่งเบิกแล้ว รอเอกสารตัวจริง', label: 'รอเอกสาร', color: 'yellow' },
    { value: 'บัญชีตรวจ และ ได้รับเอกสารตัวจริง', label: 'บัญชีตรวจแล้ว', color: 'blue' },
    { value: 'VP อนุมัติแล้ว ส่งเบิกได้', label: 'VP อนุมัติแล้ว', color: 'purple' },
    { value: 'ส่งเข้า PEAK', label: 'ส่งเข้า PEAK', color: 'indigo' },
    { value: 'โอนแล้ว รอส่งหลักฐาน', label: 'รอส่งหลักฐาน', color: 'cyan' },
    { value: 'ส่งหลักฐานแล้ว เอกสารต่างๆ', label: 'ส่งหลักฐานแล้ว', color: 'green' },
    { value: 'reject ยกเลิก / รอแก้ไข', label: 'ยกเลิก / รอแก้ไข', color: 'red' }
];

// Special Status Groups
export const REJECTED_STATUS = 'reject ยกเลิก / รอแก้ไข';

export const APPROVED_STATUSES = [
    'VP อนุมัติแล้ว ส่งเบิกได้',
    'โอนแล้ว รอส่งหลักฐาน',
    'ส่งหลักฐานแล้ว เอกสารต่างๆ',
    'จ่ายแล้ว', // Legacy
    'Paid'      // Legacy
];

export const getStatusColor = (statusValue) => {
    const status = STATUS_DATA.find(s => s.value === statusValue);
    return status ? status.color : 'gray';
};

export const getStatusLabel = (statusValue) => {
    const status = STATUS_DATA.find(s => s.value === statusValue);
    return status ? status.label : statusValue;
};
