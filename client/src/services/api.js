import axios from 'axios';

// API_BASE = base server URL (for static files like /uploads)
// API_BASE_URL = API endpoint base (includes /api prefix)
// Use environment variable for flexibility, fallback to production Railway URL
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_BASE = isLocalDev
    ? 'http://localhost:3000'
    : 'https://insight-financial-production.up.railway.app';
const API_BASE_URL = `${API_BASE}/api`;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor for logging
api.interceptors.request.use(request => {
    console.log('🚀 [API Request]:', request.method.toUpperCase(), request.url, request.data);
    return request;
});

// Add response interceptor for logging
api.interceptors.response.use(
    response => {
        console.log('✅ [API Response]:', response.status, response.data);
        return response;
    },
    error => {
        console.error('❌ [API Error]:', error.response?.status, error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export const projectAPI = {
    getAllProducts: () => api.get('/products'),
    createProduct: (data) => api.post('/products', data),
    updateProduct: (code, data) => api.put(`/products/${code}`, data),
    deleteProduct: (code) => api.delete(`/products/${code}`),

    // Product Categories
    getAllCategories: () => api.get('/products/categories'),
    createCategory: (data) => api.post('/products/categories', data),
    updateCategory: (code, data) => api.put(`/products/categories/${code}`, data),
    deleteCategory: (code) => api.delete(`/products/categories/${code}`),

    // Projects
    getAllProjects: () => api.get('/projects'),
    getProject: (projectCode) => api.get(`/projects/${projectCode}`),
    createProject: (projectData) => api.post('/projects', projectData),
    updateProject: (projectCode, data) => api.put(`/projects/${projectCode}`, data),
    deleteProject: (projectCode) => api.delete(`/projects/${projectCode}`),

    // Project Dates
    deleteProjectDate: (dateId) => api.delete(`/projects/dates/${dateId}`),

    // Incomes
    getAllIncomes: () => api.get('/incomes'),
    getIncomesByProject: (projectCode) => api.get(`/incomes/project/${projectCode}`),
    createIncome: (data) => api.post('/incomes', data),
    updateIncome: (id, data) => api.put(`/incomes/${id}`, data),
    deleteIncome: (id) => api.delete(`/incomes/${id}`),

    // Expenses
    getExpenseCodes: () => api.get('/expenses/codes'),      // backward compat
    getAccountCodes: () => api.get('/expenses/account-codes'), // new naming
    getAllExpenses: () => api.get('/expenses'),
    getExpensesByProject: (projectCode) => api.get(`/expenses/project/${projectCode}`),
    createExpense: (data) => api.post('/expenses', data),
    updateExpense: (id, data) => api.put(`/expenses/${id}`, data),
    updateExpenseStatus: (id, data) => api.put(`/expenses/${id}/status`, data),
    deleteExpense: (id) => api.delete(`/expenses/${id}`),

    // Dashboard
    getDashboardStats: () => api.get('/dashboard/stats'),
    getYearlyCashflow: (year) => api.get(`/dashboard/cashflow-yearly?year=${year || ''}`),


    // Accounts
    getAllAccounts: () => api.get('/accounts'),
    getAccount: (id) => api.get(`/accounts/${id}`),
    createAccount: (data) => api.post('/accounts', data),
    updateAccount: (id, data) => api.put(`/accounts/${id}`, data),
    deleteAccount: (id) => api.delete(`/accounts/${id}`),
    getAccountTransactions: (id) => api.get(`/accounts/${id}/transactions`),

    // Common / Reference Data
    getRoles: () => api.get('/common/roles'),
    getProjectTypes: () => api.get('/common/project-types'),
    getFinancialStatuses: (category) => api.get(`/common/financial-statuses?category=${category}`),

    // Expense Attachments
    getExpenseAttachments: (expenseId) => api.get(`/uploads/expenses/${expenseId}/attachments`),
    uploadExpenseAttachment: (expenseId, formData) => api.post(`/expenses/${expenseId}/attachments`, formData, {
        headers: { 'Content-Type': undefined }
    }),
    linkMemberDocToExpense: (expenseId, memberDocId) => api.post(`/uploads/expenses/${expenseId}/link-member-doc`, { member_doc_id: memberDocId }),
    deleteExpenseAttachment: (attachmentId) => api.delete(`/expenses/attachments/${attachmentId}`),

    // Calendar
    getCalendarEvents: (month) => api.get(month ? `/calendar/events?month=${month}` : '/calendar/events'),
};

export default api;
