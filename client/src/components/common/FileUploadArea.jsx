import React from 'react';
import { Upload } from 'lucide-react';

const FileUploadArea = ({ onFilesSelected, acceptedTypes = "*", multiple = true, className = "" }) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const fileInputRef = React.useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (onFilesSelected) {
            onFilesSelected(files);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (onFilesSelected) {
            onFilesSelected(files);
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    };

    return (
        <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                transition-all duration-200
                ${isDragging
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }
                ${className}
            `}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept={acceptedTypes}
                multiple={multiple}
                onChange={handleFileChange}
                className="hidden"
            />

            <div className="flex flex-col items-center gap-3">
                {/* Upload Icon */}
                <div className={`
                    w-14 h-14 rounded-full flex items-center justify-center
                    ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}
                `}>
                    <Upload
                        className={`w-7 h-7 ${isDragging ? 'text-blue-500' : 'text-gray-500'}`}
                    />
                </div>

                {/* Text */}
                <div>
                    <p className={`text-sm font-medium ${isDragging ? 'text-blue-600' : 'text-gray-700'}`}>
                        {isDragging ? 'วางไฟล์ที่นี่' : 'ลากไฟล์มาวางที่นี่'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        หรือ <span className="text-blue-500 hover:underline">คลิกเพื่อเลือกไฟล์</span>
                    </p>
                </div>

                {/* Accepted types hint */}
                <p className="text-xs text-gray-400">
                    รองรับไฟล์ PDF, Word, Excel, รูปภาพ
                </p>
            </div>
        </div>
    );
};

export default FileUploadArea;
