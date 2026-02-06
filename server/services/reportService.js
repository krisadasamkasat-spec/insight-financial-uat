const db = require('../db');

// Reset to minimal functions to allow app to start
// These will be re-implemented based on new requirements

const getAvailableYears = async () => {
    return [];
};

const getReportSummary = async (year) => {
    return {};
};

const getCostAnalysis = async (year) => {
    return [];
};

const getTaxSummary = async (year) => {
    return [];
};

module.exports = {
    getAvailableYears,
    getReportSummary,
    getCostAnalysis,
    getTaxSummary
};
