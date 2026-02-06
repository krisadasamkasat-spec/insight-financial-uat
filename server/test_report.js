const reportService = require('./services/reportService');
const db = require('./db');

async function test() {
    try {
        console.log("Testing getAvailableYears...");
        const years = await reportService.getAvailableYears();
        console.log("Years:", years);
    } catch (e) {
        console.error("getAvailableYears Error:", e);
    }

    try {
        console.log("Testing getReportSummary(2026)...");
        const summary = await reportService.getReportSummary(2026);
        console.log("Summary:", summary);
    } catch (e) {
        console.error("getReportSummary Error:", e);
    }

    process.exit();
}

test();
