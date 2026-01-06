const multer = require('multer');
const path = require('path');
const db = require('../db');
const cloudinary = require('../config/cloudinaryConfig');

// Use memory storage for multer (files will be uploaded to Cloudinary)
const memoryStorage = multer.memoryStorage();

// File filter - allow common document types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Allowed: images, PDF, Word, Excel'), false);
    }
};

// Multer instances for processing file uploads
const uploadMemberDoc = multer({
    storage: memoryStorage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const uploadExpenseAttachment = multer({
    storage: memoryStorage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ========================
// CLOUDINARY UPLOAD HELPERS
// ========================

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {string} folder - Cloudinary folder path
 * @param {string} publicId - Optional public ID for the file
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadToCloudinary = (fileBuffer, folder, publicId = null) => {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            folder: folder,
            resource_type: 'auto', // Automatically detect file type
        };

        if (publicId) {
            uploadOptions.public_id = publicId;
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        // Write buffer to stream
        uploadStream.end(fileBuffer);
    });
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - The public ID of the file to delete
 * @returns {Promise<object>} Cloudinary deletion result
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        // Try as image first, then as raw (for PDFs, docs, etc.)
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === 'not found') {
            // Try with raw resource type
            return await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        }
        return result;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw error;
    }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - The Cloudinary URL
 * @returns {string} The public ID
 */
const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    // Example URL: https://res.cloudinary.com/dsxavre81/image/upload/v1234567890/folder/filename.jpg
    try {
        const urlParts = url.split('/upload/');
        if (urlParts.length < 2) return null;

        const pathPart = urlParts[1];
        // Remove version number if present (v1234567890/)
        const withoutVersion = pathPart.replace(/^v\d+\//, '');
        // Remove file extension
        const publicId = withoutVersion.replace(/\.[^/.]+$/, '');
        return publicId;
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
};

// ========================
// MEMBER DOCUMENTS
// ========================

const getMemberDocuments = async (memberId) => {
    const result = await db.query(
        'SELECT * FROM member_documents WHERE member_id = $1 AND is_active = TRUE ORDER BY uploaded_at DESC',
        [memberId]
    );
    return result.rows;
};

const createMemberDocument = async (memberId, docType, fileName, filePath) => {
    const result = await db.query(
        `INSERT INTO member_documents (member_id, doc_type, file_name, file_path)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [memberId, docType, fileName, filePath]
    );
    return result.rows[0];
};

/**
 * Upload a member document to Cloudinary and save to database
 * @param {number} memberId - The member ID
 * @param {object} file - The multer file object
 * @param {string} docType - Document type
 * @returns {Promise<object>} The created document record
 */
const uploadMemberDocToCloudinary = async (memberId, file, docType) => {
    const folder = `insight-financial/members/${memberId}`;
    const publicId = `${docType}_${Date.now()}`;

    const result = await uploadToCloudinary(file.buffer, folder, publicId);

    // Save to database with Cloudinary URL
    return await createMemberDocument(
        memberId,
        docType,
        file.originalname,
        result.secure_url
    );
};

const deleteMemberDocument = async (docId) => {
    // Get the document to find its Cloudinary URL
    const docResult = await db.query('SELECT * FROM member_documents WHERE id = $1', [docId]);
    if (docResult.rows.length > 0) {
        const doc = docResult.rows[0];
        const publicId = getPublicIdFromUrl(doc.file_path);
        if (publicId) {
            await deleteFromCloudinary(publicId);
        }
    }

    // Soft delete in database
    const result = await db.query(
        'UPDATE member_documents SET is_active = FALSE WHERE id = $1 RETURNING *',
        [docId]
    );
    return result.rows[0];
};

// ========================
// EXPENSE ATTACHMENTS
// ========================

const getExpenseAttachments = async (expenseId) => {
    const result = await db.query(
        `SELECT ea.*, md.doc_type AS member_doc_type
         FROM expense_attachments ea
         LEFT JOIN member_documents md ON ea.member_doc_id = md.id
         WHERE ea.expense_id = $1
         ORDER BY ea.uploaded_at DESC`,
        [expenseId]
    );
    return result.rows;
};

const createExpenseAttachment = async (expenseId, fileName, filePath, source = 'upload', memberDocId = null) => {
    const result = await db.query(
        `INSERT INTO expense_attachments (expense_id, file_name, file_path, source, member_doc_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [expenseId, fileName, filePath, source, memberDocId]
    );
    return result.rows[0];
};

/**
 * Upload an expense attachment to Cloudinary and save to database
 * @param {number} expenseId - The expense ID
 * @param {object} file - The multer file object
 * @returns {Promise<object>} The created attachment record
 */
const uploadExpenseAttachmentToCloudinary = async (expenseId, file) => {
    const folder = `insight-financial/expenses/${expenseId}`;
    const publicId = `attachment_${Date.now()}`;

    const result = await uploadToCloudinary(file.buffer, folder, publicId);

    // Save to database with Cloudinary URL
    return await createExpenseAttachment(
        expenseId,
        file.originalname,
        result.secure_url,
        'upload'
    );
};

const linkMemberDocToExpense = async (expenseId, memberDocId) => {
    // Get the member document info
    const docResult = await db.query('SELECT * FROM member_documents WHERE id = $1', [memberDocId]);
    if (docResult.rows.length === 0) throw new Error('Member document not found');

    const doc = docResult.rows[0];
    return createExpenseAttachment(expenseId, doc.file_name, doc.file_path, 'member', memberDocId);
};

const deleteExpenseAttachment = async (attachmentId) => {
    // Get the attachment to find its Cloudinary URL
    const attachResult = await db.query('SELECT * FROM expense_attachments WHERE id = $1', [attachmentId]);
    if (attachResult.rows.length > 0) {
        const attachment = attachResult.rows[0];
        // Only delete from Cloudinary if it's an uploaded file (not linked from member docs)
        if (attachment.source === 'upload') {
            const publicId = getPublicIdFromUrl(attachment.file_path);
            if (publicId) {
                await deleteFromCloudinary(publicId);
            }
        }
    }

    // Delete from database
    const result = await db.query(
        'DELETE FROM expense_attachments WHERE id = $1 RETURNING *',
        [attachmentId]
    );
    return result.rows[0];
};

module.exports = {
    // Multer middleware
    uploadMemberDoc,
    uploadExpenseAttachment,

    // Cloudinary upload functions
    uploadToCloudinary,
    deleteFromCloudinary,
    getPublicIdFromUrl,
    uploadMemberDocToCloudinary,
    uploadExpenseAttachmentToCloudinary,

    // Database functions
    getMemberDocuments,
    createMemberDocument,
    deleteMemberDocument,
    getExpenseAttachments,
    createExpenseAttachment,
    linkMemberDocToExpense,
    deleteExpenseAttachment
};
