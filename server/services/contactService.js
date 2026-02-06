const db = require('../db');

// Get all contacts with optional search
async function getAllContacts(search = '', entityType = '') {
    let query = `
        SELECT 
            c.*,
            (SELECT COUNT(*) FROM contact_documents cd WHERE cd.contact_id = c.id AND cd.is_active = TRUE) as document_count
        FROM contacts c
        WHERE c.is_active = TRUE
    `;
    const params = [];
    let paramIndex = 1;

    if (search) {
        query += ` AND (
            c.name_th ILIKE $${paramIndex} OR 
            c.tax_id ILIKE $${paramIndex} OR 
            c.phone ILIKE $${paramIndex} OR
            c.nick_name ILIKE $${paramIndex}
        )`;
        params.push(`%${search}%`);
        paramIndex++;
    }

    if (entityType && entityType !== 'all') {
        query += ` AND c.entity_type = $${paramIndex}`;
        params.push(entityType);
        paramIndex++;
    }

    query += ` ORDER BY c.name_th ASC`;

    const result = await db.query(query, params);
    return result.rows;
}

// Get single contact by ID with documents
async function getContactById(id) {
    const contactResult = await db.query(
        `SELECT * FROM contacts WHERE id = $1 AND is_active = TRUE`,
        [id]
    );

    if (contactResult.rows.length === 0) {
        return null;
    }

    const contact = contactResult.rows[0];

    // Get documents
    const docsResult = await db.query(
        `SELECT * FROM contact_documents 
         WHERE contact_id = $1 AND is_active = TRUE
         ORDER BY uploaded_at DESC`,
        [id]
    );

    contact.documents = docsResult.rows;
    return contact;
}

// Create new contact
async function createContact(data) {
    const {
        entity_type,
        tax_id,
        branch_code,
        name_th,
        name_en,
        nick_name,
        phone,
        mobile,
        email,
        address_registration,
        address_shipping,
        bank_name,
        bank_account_number,
        bank_account_name,
        role,
        note
    } = data;

    // Validate required fields
    if (!entity_type || !name_th || !phone) {
        throw new Error('entity_type, name_th, and phone are required');
    }

    // Validate entity_type
    if (!['individual', 'juristic'].includes(entity_type)) {
        throw new Error('entity_type must be "individual" or "juristic"');
    }

    // Validate tax_id format (13 digits) if provided
    if (tax_id && !/^\d{13}$/.test(tax_id)) {
        throw new Error('tax_id must be 13 digits');
    }

    // Check duplicate tax_id + branch_code
    if (tax_id) {
        const existing = await db.query(
            `SELECT id FROM contacts 
             WHERE tax_id = $1 AND branch_code = $2 AND is_active = TRUE`,
            [tax_id, branch_code || '00000']
        );
        if (existing.rows.length > 0) {
            throw new Error('Contact with this tax_id and branch_code already exists');
        }
    }

    const result = await db.query(
        `INSERT INTO contacts (
            entity_type, tax_id, branch_code, name_th, name_en, nick_name,
            phone, mobile, email, address_registration, address_shipping,
            bank_name, bank_account_number, bank_account_name, role, note
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
            entity_type,
            tax_id || null,
            branch_code || '00000',
            name_th,
            name_en || null,
            nick_name || null,
            phone,
            mobile || null,
            email || null,
            address_registration || null,
            address_shipping || null,
            bank_name || null,
            bank_account_number || null,
            bank_account_name || null,
            role || null,
            note || null
        ]
    );

    return result.rows[0];
}

// Update contact
async function updateContact(id, data) {
    const {
        entity_type,
        tax_id,
        branch_code,
        name_th,
        name_en,
        nick_name,
        phone,
        mobile,
        email,
        address_registration,
        address_shipping,
        bank_name,
        bank_account_number,
        bank_account_name,
        role,
        note
    } = data;

    // Check if contact exists
    const existing = await db.query(
        `SELECT * FROM contacts WHERE id = $1 AND is_active = TRUE`,
        [id]
    );
    if (existing.rows.length === 0) {
        throw new Error('Contact not found');
    }

    // Validate tax_id format if provided
    if (tax_id && !/^\d{13}$/.test(tax_id)) {
        throw new Error('tax_id must be 13 digits');
    }

    // Check duplicate tax_id + branch_code (excluding current)
    if (tax_id) {
        const duplicate = await db.query(
            `SELECT id FROM contacts 
             WHERE tax_id = $1 AND branch_code = $2 AND id != $3 AND is_active = TRUE`,
            [tax_id, branch_code || '00000', id]
        );
        if (duplicate.rows.length > 0) {
            throw new Error('Contact with this tax_id and branch_code already exists');
        }
    }

    const result = await db.query(
        `UPDATE contacts SET
            entity_type = COALESCE($1, entity_type),
            tax_id = $2,
            branch_code = COALESCE($3, branch_code),
            name_th = COALESCE($4, name_th),
            name_en = $5,
            nick_name = $6,
            phone = COALESCE($7, phone),
            mobile = $8,
            email = $9,
            address_registration = $10,
            address_shipping = $11,
            bank_name = $12,
            bank_account_number = $13,
            bank_account_name = $14,
            role = $15,
            note = $16,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $17 AND is_active = TRUE
        RETURNING *`,
        [
            entity_type,
            tax_id || null,
            branch_code,
            name_th,
            name_en || null,
            nick_name || null,
            phone,
            mobile || null,
            email || null,
            address_registration || null,
            address_shipping || null,
            bank_name || null,
            bank_account_number || null,
            bank_account_name || null,
            role || null,
            note || null,
            id
        ]
    );

    return result.rows[0];
}

// Soft delete contact
async function deleteContact(id) {
    const result = await db.query(
        `UPDATE contacts SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND is_active = TRUE
         RETURNING id`,
        [id]
    );

    if (result.rows.length === 0) {
        throw new Error('Contact not found');
    }

    return { success: true, id };
}

// Add document to contact
async function addDocument(contactId, documentData) {
    const { document_type, file_name, file_path, file_size, file_ext } = documentData;

    // Check if contact exists
    const contact = await db.query(
        `SELECT id FROM contacts WHERE id = $1 AND is_active = TRUE`,
        [contactId]
    );
    if (contact.rows.length === 0) {
        throw new Error('Contact not found');
    }

    const result = await db.query(
        `INSERT INTO contact_documents (contact_id, document_type, file_name, file_path, file_size, file_ext)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [contactId, document_type, file_name, file_path, file_size || null, file_ext || null]
    );

    return result.rows[0];
}

// Remove document
async function removeDocument(contactId, documentId) {
    const result = await db.query(
        `UPDATE contact_documents SET is_active = FALSE
         WHERE id = $1 AND contact_id = $2 AND is_active = TRUE
         RETURNING id`,
        [documentId, contactId]
    );

    if (result.rows.length === 0) {
        throw new Error('Document not found');
    }

    return { success: true, id: documentId };
}

// Get documents for a contact
async function getDocuments(contactId) {
    const result = await db.query(
        `SELECT * FROM contact_documents 
         WHERE contact_id = $1 AND is_active = TRUE
         ORDER BY uploaded_at DESC`,
        [contactId]
    );
    return result.rows;
}

module.exports = {
    getAllContacts,
    getContactById,
    createContact,
    updateContact,
    deleteContact,
    addDocument,
    removeDocument,
    getDocuments
};
