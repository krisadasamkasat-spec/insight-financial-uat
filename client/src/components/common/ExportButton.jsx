import React from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

const ExportButton = ({ data, filename = 'export', columns, title = 'Export' }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(data.map(item => {
            const row = {};
            columns.forEach(col => {
                row[col.header] = col.accessor(item);
            });
            return row;
        }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        XLSX.writeFile(wb, `${filename}.xlsx`);
        setIsOpen(false);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(16);
        doc.text(title, 14, 20);

        // Table headers
        doc.setFontSize(10);
        let y = 35;
        const startX = 14;
        const colWidth = (doc.internal.pageSize.width - 28) / columns.length;

        // Header
        doc.setFillColor(240, 240, 240);
        doc.rect(startX, y - 5, doc.internal.pageSize.width - 28, 8, 'F');
        columns.forEach((col, i) => {
            doc.text(col.header, startX + (i * colWidth), y);
        });

        y += 10;

        // Data rows
        data.forEach(item => {
            if (y > doc.internal.pageSize.height - 20) {
                doc.addPage();
                y = 20;
            }

            columns.forEach((col, i) => {
                const value = String(col.accessor(item) ?? '');
                doc.text(value.substring(0, 25), startX + (i * colWidth), y);
            });
            y += 7;
        });

        doc.save(`${filename}.pdf`);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
                <Download className="w-4 h-4" />
                Export
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                        <button
                            onClick={exportToExcel}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-green-600" />
                            Export Excel
                        </button>
                        <button
                            onClick={exportToPDF}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <FileText className="w-4 h-4 text-red-600" />
                            Export PDF
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ExportButton;
