import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
            <div className="bg-blue-50 text-blue-500 font-bold text-9xl rounded-3xl p-8 mb-8 select-none">
                404
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">ไม่พบหน้าที่ค้นหา</h1>
            <p className="text-gray-600 mb-8 max-w-md">
                เราไม่พบหน้าที่คุณกำลังค้นหา อาจเป็นเพราะลิงก์ผิดพลาด ล้าสมัย หรือถูกลบออกไปแล้ว
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <div onClick={() => window.history.back()} className="cursor-pointer flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm">
                    <ArrowLeft size={20} />
                    <span>ย้อนกลับ</span>
                </div>

                <Link to="/" className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-shadow shadow-md hover:shadow-lg">
                    <Home size={20} />
                    <span>กลับหน้าหลัก</span>
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
