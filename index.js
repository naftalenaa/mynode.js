const express = require('express');
const bodyParser = require('body-parser');
const koneksi = require('./config/database');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ============= CRUD Operations for Categories =============

// Create a new category
app.post('/categories', (req, res) => {
    const data = { ...req.body };
    const querySql = 'INSERT INTO categories SET ?';

    koneksi.query(querySql, data, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to create category', error: err });
        }
        res.status(201).json({ success: true, message: 'Category created successfully!' });
    });
});

// Read all categories
app.get('/categories', (req, res) => {
    const querySql = 'SELECT * FROM categories';
    koneksi.query(querySql, (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to fetch categories', error: err });
        }
        res.status(200).json({ success: true, data: rows });
    });
});

// Get food packages by category_id
app.get('/categories/:id/food_packages', (req, res) => {
    const querySql = `
        SELECT fp.* 
        FROM food_packages fp
        JOIN categories c ON fp.category_id = c.category_id
        WHERE c.category_id = ?
    `;
    koneksi.query(querySql, [req.params.id], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Ada kesalahan', error: err });
        }
        if (rows.length) {
            res.status(200).json({ success: true, data: rows });
        } else {
            res.status(404).json({ success: false, message: 'Tidak ada package untuk kategori ini!' });
        }
    });
});

// ============= CRUD Operations for Food Packages =============

// Create a new food package
app.post('/food_packages', (req, res) => {
    const data = { ...req.body };
    const querySql = 'INSERT INTO food_packages SET ?';

    koneksi.query(querySql, data, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to create food package', error: err });
        }
        res.status(201).json({ success: true, message: 'Food package created successfully!' });
    });
});

// Read all food packages
app.get('/food_packages', (req, res) => {
    const querySql = `
        SELECT fp.*, c.category_name 
        FROM food_packages fp 
        JOIN categories c ON fp.category_id = c.category_id
    `;
    koneksi.query(querySql, (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to fetch food packages', error: err });
        }
        res.status(200).json({ success: true, data: rows });
    });
});

// Get a single food package by ID
app.get('/food_packages/:id', (req, res) => {
    const querySql = `
        SELECT fp.*, c.category_name 
        FROM food_packages fp 
        JOIN categories c ON fp.category_id = c.category_id
        WHERE fp.package_id = ?
    `;
    koneksi.query(querySql, [req.params.id], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to fetch food package', error: err });
        }
        res.status(200).json({ success: true, data: rows });
    });
});

// Update a food package
app.put('/food_packages/:id', (req, res) => {
    const data = { ...req.body };
    const querySearch = 'SELECT * FROM food_packages WHERE package_id = ?';
    const queryUpdate = 'UPDATE food_packages SET ? WHERE package_id = ?';

    koneksi.query(querySearch, req.params.id, (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error finding food package', error: err });
        }
        if (rows.length) {
            koneksi.query(queryUpdate, [data, req.params.id], (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Failed to update food package', error: err });
                }
                res.status(200).json({ success: true, message: 'Food package updated successfully!' });
            });
        } else {
            res.status(404).json({ message: 'Food package not found', success: false });
        }
    });
});

// Delete a food package
app.delete('/food_packages/:id', (req, res) => {
    const querySearch = 'SELECT * FROM food_packages WHERE package_id = ?';
    const queryDelete = 'DELETE FROM food_packages WHERE package_id = ?';

    koneksi.query(querySearch, req.params.id, (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error finding food package', error: err });
        }
        if (rows.length) {
            koneksi.query(queryDelete, req.params.id, (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Failed to delete food package', error: err });
                }
                res.status(200).json({ success: true, message: 'Food package deleted successfully!' });
            });
        } else {
            res.status(404).json({ message: 'Food package not found', success: false });
        }
    });
});

// ============= Additional Features =============

// Search food packages
app.get('/api/food_packages/search', (req, res) => {
    const { keyword } = req.query;
    const querySql = `
        SELECT * FROM food_packages 
        WHERE package_name LIKE ?
    `;
    koneksi.query(querySql, [`%${keyword}%`], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to search food packages', error: err });
        }
        res.status(200).json({ success: true, data: rows });
    });
});

// Filter food packages
app.get('/api/food_packages/filter', (req, res) => {
    const { category_id, min_price, max_price } = req.query;
    let querySql = 'SELECT * FROM food_packages WHERE 1=1';
    const params = [];

    if (category_id) {
        querySql += ' AND category_id = ?';
        params.push(category_id);
    }
    if (min_price) {
        querySql += ' AND price >= ?';
        params.push(min_price);
    }
    if (max_price) {
        querySql += ' AND price <= ?';
        params.push(max_price);
    }

    koneksi.query(querySql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to filter food packages', error: err });
        }
        res.status(200).json({ success: true, data: rows });
    });
});

// Sort food packages
app.get('/api/food_packages/sorting', (req, res) => {
    const { sort_by = 'package_name', order = 'ASC' } = req.query;

    // Validate sort_by and order
    const validSortFields = ['package_name', 'price'];
    const validOrder = ['ASC', 'DESC'];

    if (!validSortFields.includes(sort_by)) {
        return res.status(400).json({ message: `Invalid sort_by field: ${sort_by}` });
    }

    if (!validOrder.includes(order.toUpperCase())) {
        return res.status(400).json({ message: `Invalid order: ${order}` });
    }

    // Construct the SQL query
    const querySql = `SELECT * FROM food_packages ORDER BY ${koneksi.escapeId(sort_by)} ${order.toUpperCase()}`;
    koneksi.query(querySql, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to sort food packages', error: err });
        }
        res.status(200).json({ success: true, data: rows });
    });
});


// User Preferences for Food Packages
app.post('/api/user/preferences', (req, res) => {
    const data = { ...req.body };
    const querySql = 'INSERT INTO user_preferences SET ?';

    koneksi.query(querySql, data, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to create preferences', error: err });
        }
        res.status(201).json({ success: true, message: 'Preferences created successfully!' });
    });
});

app.put('/api/user/preferences', (req, res) => {
    const data = { ...req.body };
    const queryUpdate = 'UPDATE user_preferences SET ? WHERE user_id = ?';

    koneksi.query(queryUpdate, [data, req.body.user_id], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to update preferences', error: err });
        }
        res.status(200).json({ success: true, message: 'Preferences updated successfully!' });
    });
});

app.get('/api/user/preferences', (req, res) => {
    const querySql = 'SELECT * FROM user_preferences WHERE user_id = ?';
    koneksi.query(querySql, [req.query.user_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to fetch preferences', error: err });
        }
        res.status(200).json({ success: true, data: rows });
    });
});

// ============= Start Server =============
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
