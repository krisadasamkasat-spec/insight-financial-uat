import React, { useState, useEffect } from 'react';
import { Package, Search, Tag } from 'lucide-react';
import api from '../../services/api';

const ProductsTab = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                api.get('/products'),
                api.get('/products/categories')
            ]);
            setProducts(productsRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesSearch =
            product.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.product_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' ||
            product.product_category_id?.toString() === selectedCategory;
        return matchesSearch && matchesCategory;
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
                        placeholder="ค้นหารหัส หรือชื่อหลักสูตร..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>

                {/* Category Filter */}
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                    <option value="all">ทุกหมวดหมู่</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Stats */}
            <div className="text-sm text-gray-500">
                พบ {filteredProducts.length} รายการ
            </div>

            {/* Products Table */}
            {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Package className="mx-auto mb-3 text-gray-300" size={48} />
                    <p>ไม่พบข้อมูลหลักสูตร</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">รหัส</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อหลักสูตร</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">หมวดหมู่</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredProducts.map((product) => (
                                <tr key={product.product_code} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                            {product.product_code}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {product.product_name}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                                            <Tag size={14} />
                                            {product.category_name || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${product.is_active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {product.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                                        </span>
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

export default ProductsTab;
