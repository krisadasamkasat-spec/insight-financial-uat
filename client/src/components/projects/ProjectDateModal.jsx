import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import DatePicker from '../common/DatePicker';
import Dropdown from '../common/Dropdown';
import { Save, Plus, Clock, Calendar } from 'lucide-react';

/**
 * Modal for Adding/Editing a Project Date Entry
 * Uses unified Dropdown component with compact variant for time selection
 */
const ProjectDateModal = ({
    isOpen,
    onClose,
    onSubmit,
    dateData = null,
    existingDates = []
}) => {
    const isEditMode = !!dateData;

    const initialFormState = {
        date_name: '',
        start_date: '',
        start_hour: '09',
        start_minute: '00',
        end_date: '',
        end_hour: '17',
        end_minute: '00',
        location: '',
        description: ''
    };

    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState({});

    // Thai months for display
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

    // Hour options (24-hour format)
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    // Minute options (00, 15, 30, 45)
    const minutes = ['00', '15', '30', '45'];

    useEffect(() => {
        if (isOpen) {
            if (dateData) {
                const parseDateTime = (isoStr) => {
                    if (!isoStr) return { date: '', hour: '09', minute: '00' };
                    const d = new Date(isoStr);
                    if (isNaN(d.getTime())) return { date: '', hour: '09', minute: '00' };

                    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    const hour = String(d.getHours()).padStart(2, '0');
                    const m = d.getMinutes();
                    const minute = m >= 45 ? '45' : m >= 30 ? '30' : m >= 15 ? '15' : '00';
                    return { date, hour, minute };
                };

                const start = parseDateTime(dateData.start_date);
                const end = parseDateTime(dateData.end_date);

                setFormData({
                    date_name: dateData.date_name || dateData.title || '',
                    start_date: start.date,
                    start_hour: start.hour,
                    start_minute: start.minute,
                    end_date: end.date,
                    end_hour: end.hour,
                    end_minute: end.minute,
                    location: dateData.location || '',
                    description: dateData.description || ''
                });
            } else {
                setFormData(initialFormState);
            }
            setErrors({});
        }
    }, [isOpen, dateData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleTimeChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const formatThaiDate = (dateStr) => {
        if (!dateStr) return 'เลือกวันที่';
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d.getTime())) return 'เลือกวันที่';
        const day = d.getDate();
        const month = thaiMonths[d.getMonth()];
        const year = d.getFullYear() + 543;
        return `${day} ${month} ${year}`;
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.date_name) newErrors.date_name = 'กรุณาระบุชื่อกำหนดการ';
        if (!formData.start_date) newErrors.start_date = 'กรุณาเลือกวันที่';

        if (formData.start_date) {
            const isDuplicate = existingDates.some(d => {
                if (isEditMode && d.id === dateData.id) return false;
                const dDay = (d.start_date || '').split('T')[0];
                return dDay === formData.start_date;
            });
            if (isDuplicate) {
                newErrors.start_date = 'มีกำหนดการในวันนี้แล้ว';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        const startDateTime = `${formData.start_date}T${formData.start_hour}:${formData.start_minute}:00`;
        const endDateTime = formData.end_date
            ? `${formData.end_date}T${formData.end_hour}:${formData.end_minute}:00`
            : startDateTime;

        onSubmit({
            date_name: formData.date_name,
            start_date: startDateTime,
            end_date: endDateTime,
            location: formData.location,
            description: formData.description
        });
        onClose();
    };

    const inputClass = (fieldName) => `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors[fieldName] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'แก้ไขกำหนดการ' : 'เพิ่มกำหนดการใหม่'}
            size="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-4 p-1">
                {/* Date Name (Title) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        ชื่อกำหนดการ <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="date_name"
                        value={formData.date_name}
                        onChange={handleChange}
                        placeholder="เช่น Workshop Day 1, เข้าบรรยายเช้า"
                        className={inputClass('date_name')}
                    />
                    {errors.date_name && <p className="text-red-500 text-xs mt-1">{errors.date_name}</p>}
                </div>

                {/* Start Date + Time */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        วันที่เริ่มต้น <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2 items-center">
                        <div className="flex-1">
                            <DatePicker
                                value={formData.start_date}
                                onChange={(v) => handleTimeChange('start_date', v)}
                                hasError={!!errors.start_date}
                                disablePast={false}
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <Dropdown
                                variant="compact"
                                value={formData.start_hour}
                                options={hours}
                                onChange={(v) => handleTimeChange('start_hour', v)}
                                usePortal={true}
                                minWidth="56px"
                                listWidth="56px"
                                listMinWidth="56px"
                                listMaxWidth="56px"
                            />
                            <span className="text-gray-400 font-medium">:</span>
                            <Dropdown
                                variant="compact"
                                value={formData.start_minute}
                                options={minutes}
                                onChange={(v) => handleTimeChange('start_minute', v)}
                                usePortal={true}
                                minWidth="56px"
                                listWidth="56px"
                                listMinWidth="56px"
                                listMaxWidth="56px"
                            />
                            <span className="text-xs text-gray-400 ml-0.5">น.</span>
                        </div>
                    </div>
                    {formData.start_date && (
                        <p className="text-xs text-blue-600 mt-1">{formatThaiDate(formData.start_date)}</p>
                    )}
                    {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>}
                </div>

                {/* End Date + Time */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        วันที่สิ้นสุด (ถ้ามี)
                    </label>
                    <div className="flex gap-2 items-center">
                        <div className="flex-1">
                            <DatePicker
                                value={formData.end_date}
                                onChange={(v) => handleTimeChange('end_date', v)}
                                disablePast={false}
                                minDate={formData.start_date}
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <Dropdown
                                variant="compact"
                                value={formData.end_hour}
                                options={hours}
                                onChange={(v) => handleTimeChange('end_hour', v)}
                                usePortal={true}
                                minWidth="56px"
                                listWidth="56px"
                                listMinWidth="56px"
                                listMaxWidth="56px"
                            />
                            <span className="text-gray-400 font-medium">:</span>
                            <Dropdown
                                variant="compact"
                                value={formData.end_minute}
                                options={minutes}
                                onChange={(v) => handleTimeChange('end_minute', v)}
                                usePortal={true}
                                minWidth="56px"
                                listWidth="56px"
                                listMinWidth="56px"
                                listMaxWidth="56px"
                            />
                            <span className="text-xs text-gray-400 ml-0.5">น.</span>
                        </div>
                    </div>
                    {formData.end_date && (
                        <p className="text-xs text-blue-600 mt-1">{formatThaiDate(formData.end_date)}</p>
                    )}
                </div>

                {/* Location */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">สถานที่</label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="ตึก / ห้องประชุม / โรงแรม"
                        className={inputClass('location')}
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด / หมายเหตุ</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="รายละเอียดเพิ่มเติมของวันนี้"
                        rows="2"
                        className={inputClass('description')}
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                        {isEditMode ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {isEditMode ? 'บันทึก' : 'เพิ่ม'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ProjectDateModal;
