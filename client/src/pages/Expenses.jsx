import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ExpenseListContent from '../components/finance/ExpenseListContent';
import { projectAPI } from '../services/api';
import { CheckCircle } from 'lucide-react';

const Expenses = () => {
    const [rawExpenses, setRawExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch Expenses
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const res = await projectAPI.getAllExpenses();
                const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setRawExpenses(sorted);
            } catch (err) {
                console.error("Failed to load expenses", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleRefresh = async () => {
        const res = await projectAPI.getAllExpenses();
        const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRawExpenses(sorted);
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading expenses...</div>;
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto">
            {/* Page Header */}
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">รายการเบิกจ่ายทั้งหมด</h1>
                <Link
                    to="/approval"
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
                >
                    <CheckCircle className="w-4 h-4" />
                    ไปหน้าอนุมัติ
                </Link>
            </div>

            {/* Expense List Content */}
            <ExpenseListContent
                expenses={rawExpenses}
                onRefresh={handleRefresh}
                isLoading={isLoading}
            />
        </div>
    );
};

export default Expenses;
