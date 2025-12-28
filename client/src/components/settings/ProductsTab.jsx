import React, { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { projectAPI } from '../../services/api';
import Modal from '../common/Modal';
import MinimalDropdown from '../common/MinimalDropdown';
import FormDropdown from '../common/FormDropdown';
import { useToast } from '../../components/common/ToastProvider';

// Color swatches for category colors - Full Tailwind palette
const COLOR_SWATCHES = [
    // Grays
    { value: 'slate', label: 'Slate', bg: 'bg-slate-500', ring: 'ring-slate-400' },
    { value: 'gray', label: 'Gray', bg: 'bg-gray-500', ring: 'ring-gray-400' },
    { value: 'zinc', label: 'Zinc', bg: 'bg-zinc-500', ring: 'ring-zinc-400' },
    { value: 'neutral', label: 'Neutral', bg: 'bg-neutral-500', ring: 'ring-neutral-400' },
    { value: 'stone', label: 'Stone', bg: 'bg-stone-500', ring: 'ring-stone-400' },
    // Reds
    { value: 'red', label: 'Red', bg: 'bg-red-500', ring: 'ring-red-400' },
    { value: 'rose', label: 'Rose', bg: 'bg-rose-500', ring: 'ring-rose-400' },
    { value: 'pink', label: 'Pink', bg: 'bg-pink-500', ring: 'ring-pink-400' },
    // Oranges
    { value: 'orange', label: 'Orange', bg: 'bg-orange-500', ring: 'ring-orange-400' },
    { value: 'amber', label: 'Amber', bg: 'bg-amber-500', ring: 'ring-amber-400' },
    { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-500', ring: 'ring-yellow-400' },
    // Greens
    { value: 'lime', label: 'Lime', bg: 'bg-lime-500', ring: 'ring-lime-400' },
    { value: 'green', label: 'Green', bg: 'bg-green-500', ring: 'ring-green-400' },
    { value: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-400' },
    { value: 'teal', label: 'Teal', bg: 'bg-teal-500', ring: 'ring-teal-400' },
    // Blues
    { value: 'cyan', label: 'Cyan', bg: 'bg-cyan-500', ring: 'ring-cyan-400' },
    { value: 'sky', label: 'Sky', bg: 'bg-sky-500', ring: 'ring-sky-400' },
    { value: 'blue', label: 'Blue', bg: 'bg-blue-500', ring: 'ring-blue-400' },
    { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', ring: 'ring-indigo-400' },
    // Purples
    { value: 'violet', label: 'Violet', bg: 'bg-violet-500', ring: 'ring-violet-400' },
    { value: 'purple', label: 'Purple', bg: 'bg-purple-500', ring: 'ring-purple-400' },
    { value: 'fuchsia', label: 'Fuchsia', bg: 'bg-fuchsia-500', ring: 'ring-fuchsia-400' },
];

const ProductsTab = () => {
    const toast = useToast();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showCategories, setShowCategories] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const categoryColors = {
        // Grays
        slate: 'bg-slate-100 text-slate-700',
        gray: 'bg-gray-100 text-gray-700',
        zinc: 'bg-zinc-100 text-zinc-700',
        neutral: 'bg-neutral-100 text-neutral-700',
        stone: 'bg-stone-100 text-stone-700',
        // Reds
        red: 'bg-red-100 text-red-700',
        rose: 'bg-rose-100 text-rose-700',
        pink: 'bg-pink-100 text-pink-700',
        // Oranges
        orange: 'bg-orange-100 text-orange-700',
        amber: 'bg-amber-100 text-amber-700',
        yellow: 'bg-yellow-100 text-yellow-700',
        // Greens
        lime: 'bg-lime-100 text-lime-700',
        green: 'bg-green-100 text-green-700',
        emerald: 'bg-emerald-100 text-emerald-700',
        teal: 'bg-teal-100 text-teal-700',
        // Blues
        cyan: 'bg-cyan-100 text-cyan-700',
        sky: 'bg-sky-100 text-sky-700',
        blue: 'bg-blue-100 text-blue-700',
        indigo: 'bg-indigo-100 text-indigo-700',
        // Purples
        violet: 'bg-violet-100 text-violet-700',
        purple: 'bg-purple-100 text-purple-700',
        fuchsia: 'bg-fuchsia-100 text-fuchsia-700',
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                projectAPI.getAllProducts(),
                projectAPI.getAllCategories()
            ]);
            setProducts(productsRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('โหลดข้อมูลไม่สำเร็จ');
        } finally {
            setIsLoading(false);
        }
    };

    // Build category options for dropdown
    const categoryOptions = categories.map(c => c.label);

    // Build category options for FormDropdown in modal
    const categoryFormOptions = categories.map(c => ({ value: c.code, label: c.label }));

    // Map label to code
    const labelToCode = {};
    categories.forEach(c => { labelToCode[c.label] = c.code; });

    // Handle filter change
    const handleCategoryFilterChange = (value) => {
        if (value === 'all') {
            setCategoryFilter('all');
        } else {
            setCategoryFilter(labelToCode[value] || 'all');
        }
    };

    // Get display value for filter
    const getFilterDisplayValue = () => {
        if (categoryFilter === 'all') return 'all';
        const cat = categories.find(c => c.code === categoryFilter);
        return cat ? cat.label : 'all';
    };

    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const getCategoryLabel = (code) => {
        const cat = categories.find(c => c.code === code);
        return cat ? cat.label : code;
    };

    const getCategoryColor = (code) => {
        const cat = categories.find(c => c.code === code);
        return cat ? categoryColors[cat.color] || categoryColors.gray : categoryColors.gray;
    };

    const handleAddProduct = () => {
        setEditingProduct({ code: '', name: '', category: categories[0]?.code || '', isNew: true });
        setIsModalOpen(true);
    };

    const handleEditProduct = (product) => {
        setEditingProduct({ ...product, isNew: false });
        setIsModalOpen(true);
    };

    const handleSaveProduct = async () => {
        try {
            if (editingProduct.isNew) {
                await projectAPI.createProduct(editingProduct);
                toast.success('เพิ่มหลักสูตรสำเร็จ');
            } else {
                await projectAPI.updateProduct(editingProduct.code, editingProduct);
                toast.success('อัปเดตหลักสูตรสำเร็จ');
            }
            fetchData();
            setIsModalOpen(false);
            setEditingProduct(null);
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('บันทึกข้อมูลไม่สำเร็จ');
        }
    };

    const handleDeleteProduct = async (code) => {
        try {
            await projectAPI.deleteProduct(code);
            toast.success('ลบหลักสูตรสำเร็จ');
            fetchData();
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('ลบข้อมูลไม่สำเร็จ');
        }
    };

    const handleAddCategory = () => {
        setEditingCategory({ code: '', label: '', color: 'gray', isNew: true });
        setIsCategoryModalOpen(true);
    };

    const handleEditCategory = (category) => {
        setEditingCategory({ ...category, isNew: false });
        setIsCategoryModalOpen(true);
    };

    const handleSaveCategory = async () => {
        try {
            if (editingCategory.isNew) {
                await projectAPI.createCategory(editingCategory);
                toast.success('เพิ่มหมวดหมู่สำเร็จ');
            } else {
                await projectAPI.updateCategory(editingCategory.code, editingCategory);
                toast.success('อัปเดตหมวดหมู่สำเร็จ');
            }
            fetchData();
            setIsCategoryModalOpen(false);
            setEditingCategory(null);
        } catch (error) {
            console.error('Error saving category:', error);
            toast.error('บันทึกข้อมูลไม่สำเร็จ');
        }
    };

    const handleDeleteCategory = async (code) => {
        try {
            await projectAPI.deleteCategory(code);
            toast.success('ลบหมวดหมู่สำเร็จ');
            fetchData();
            setDeleteCategoryConfirm(null);
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('ลบข้อมูลไม่สำเร็จ');
        }
    };

    return (
        <div className="space-y-6">
            {/* Categories Section (Collapsible) */}
            <div className="bg-gray-50 rounded-xl overflow-hidden">
                <button
                    onClick={() => setShowCategories(!showCategories)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                    <span>หมวดหมู่หลักสูตร ({categories.length} หมวด)</span>
                    {showCategories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showCategories && (
                    <div className="p-4 border-t border-gray-200">
                        {isLoading ? (
                            <p className="text-center text-gray-500 py-4">กำลังโหลด...</p>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-500">
                                                <th className="pb-2 font-medium">รหัส</th>
                                                <th className="pb-2 font-medium">ชื่อหมวดหมู่</th>
                                                <th className="pb-2 font-medium">สี</th>
                                                <th className="pb-2 font-medium text-center w-24">จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {categories.map((cat) => (
                                                <tr key={cat.code}>
                                                    <td className="py-2 font-mono text-gray-700">{cat.code}</td>
                                                    <td className="py-2">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${categoryColors[cat.color]}`}>
                                                            {cat.label}
                                                        </span>
                                                    </td>
                                                    <td className="py-2">
                                                        <div className={`w-5 h-5 rounded-full ${COLOR_SWATCHES.find(s => s.value === cat.color)?.bg || 'bg-gray-500'}`} />
                                                    </td>
                                                    <td className="py-2">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => handleEditCategory(cat)}
                                                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                title="แก้ไข"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteCategoryConfirm(cat.code)}
                                                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                title="ลบ"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button
                                    onClick={handleAddCategory}
                                    className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    + เพิ่มหมวดหมู่
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Products Search and Filter */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-3 items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาหลักสูตร..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                        />
                    </div>
                    <MinimalDropdown
                        label="หมวด"
                        value={getFilterDisplayValue()}
                        options={categoryOptions}
                        onChange={handleCategoryFilterChange}
                        allLabel="ทุกหมวด"
                    />
                </div>
                <button
                    onClick={handleAddProduct}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    เพิ่มหลักสูตร
                </button>
            </div>

            {/* Products Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">รหัส</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ชื่อหลักสูตร</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">หมวดหมู่</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                    กำลังโหลดข้อมูล...
                                </td>
                            </tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                    ไม่พบข้อมูล
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((item) => (
                                <tr key={item.code} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-mono text-gray-800">{item.code}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{item.name}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(item.category)}`}>
                                            {getCategoryLabel(item.category)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleEditProduct(item)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="แก้ไข"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(item.code)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="ลบ"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-gray-500">
                แสดง {filteredProducts.length} จาก {products.length} รายการ
            </p>

            {/* Edit Product Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProduct?.isNew ? 'เพิ่มหลักสูตร' : 'แก้ไขหลักสูตร'}
            >
                {editingProduct && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">รหัส</label>
                            <input
                                type="text"
                                value={editingProduct.code}
                                onChange={(e) => setEditingProduct(prev => ({ ...prev, code: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="เช่น GENAI-NEW"
                                disabled={!editingProduct.isNew}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหลักสูตร</label>
                            <input
                                type="text"
                                value={editingProduct.name}
                                onChange={(e) => setEditingProduct(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="ชื่อหลักสูตร"
                            />
                        </div>
                        <FormDropdown
                            label="หมวดหมู่"
                            value={editingProduct.category}
                            options={categoryFormOptions}
                            onChange={(value) => setEditingProduct(prev => ({ ...prev, category: value }))}
                        />
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSaveProduct}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                disabled={!editingProduct.code || !editingProduct.name}
                            >
                                บันทึก
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Category Modal */}
            <Modal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                title={editingCategory?.isNew ? 'เพิ่มหมวดหมู่' : 'แก้ไขหมวดหมู่'}
            >
                {editingCategory && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">รหัส</label>
                            <input
                                type="text"
                                value={editingCategory.code}
                                onChange={(e) => setEditingCategory(prev => ({ ...prev, code: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="เช่น GENAI"
                                disabled={!editingCategory.isNew}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหมวดหมู่</label>
                            <input
                                type="text"
                                value={editingCategory.label}
                                onChange={(e) => setEditingCategory(prev => ({ ...prev, label: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="ชื่อหมวดหมู่"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">สี</label>
                            <div className="flex flex-wrap gap-2">
                                {COLOR_SWATCHES.map(swatch => (
                                    <button
                                        key={swatch.value}
                                        type="button"
                                        onClick={() => setEditingCategory(prev => ({ ...prev, color: swatch.value }))}
                                        className={`w-8 h-8 rounded-lg ${swatch.bg} transition-all hover:scale-110 flex items-center justify-center ${editingCategory.color === swatch.value ? 'ring-2 ring-offset-2 ' + swatch.ring : ''
                                            }`}
                                        title={swatch.label}
                                    >
                                        {editingCategory.color === swatch.value && (
                                            <Check className="w-4 h-4 text-white" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSaveCategory}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                disabled={!editingCategory.code || !editingCategory.label}
                            >
                                บันทึก
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Product Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="ยืนยันการลบ"
            >
                <p className="text-gray-600 mb-6">คุณต้องการลบหลักสูตร "{deleteConfirm}" หรือไม่?</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={async () => await handleDeleteProduct(deleteConfirm)}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                        ลบ
                    </button>
                </div>
            </Modal>

            {/* Delete Category Confirmation Modal */}
            <Modal
                isOpen={!!deleteCategoryConfirm}
                onClose={() => setDeleteCategoryConfirm(null)}
                title="ยืนยันการลบหมวดหมู่"
            >
                <p className="text-gray-600 mb-6">คุณต้องการลบหมวดหมู่ "{deleteCategoryConfirm}" หรือไม่?</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setDeleteCategoryConfirm(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={async () => await handleDeleteCategory(deleteCategoryConfirm)}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                        ลบ
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default ProductsTab;
