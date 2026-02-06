import React, { useState, useEffect } from 'react';
import { Receipt, Search } from 'lucide-react';
import api from '../../services/api';

const AccountCodesTab = () => {
    const [accountCodes, setAccountCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadAccountCodes();
    }, []);

    const loadAccountCodes = async () => {
        try {
            const response = await api.get('/account-codes');
            setAccountCodes(response.data);
        } catch (error) {
            console.error('Error loading account codes:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter account codes
    const filteredCodes = accountCodes.filter(code => {
        return code.account_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            code.account_description?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="ค้นหารหัส หรือคำอธิบาย..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="text-sm text-gray-500">
                พบ {filteredCodes.length} รายการ
            </div>

            {/* Account Codes Table */}
            {filteredCodes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Receipt className="mx-auto mb-3 text-gray-300" size={48} />
                    <p>ไม่พบข้อมูลรหัสค่าใช้จ่าย</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">รหัส</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">คำอธิบาย</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredCodes.map((code) => (
                                <tr key={code.account_code} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-sm bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                            {code.account_code}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {code.account_description}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AccountCodesTab;
