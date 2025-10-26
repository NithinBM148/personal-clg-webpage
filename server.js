const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Set admin credentials - change these!
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123'; 

// Create data file if it doesn't exist
const CONTACTS_FILE = path.join(__dirname, 'contacts.json');
if (!fs.existsSync(CONTACTS_FILE)) {
    fs.writeFileSync(CONTACTS_FILE, '[]');
}

app.use(express.json());
app.use(express.static(__dirname));

// Basic auth middleware
const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic');
        return res.status(401).send('Authentication required');
    }

    const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
    const [username, password] = credentials.split(':');

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic');
        return res.status(401).send('Invalid credentials');
    }
};

// Save contact details
app.post('/api/contacts', (req, res) => {
    try {
        const contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE));
        contacts.push({
            ...req.body,
            timestamp: new Date().toISOString()
        });
        fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get contacts (protected by auth)
app.get('/api/contacts', auth, (req, res) => {
    try {
        const contacts = JSON.parse(fs.readFileSync(CONTACTS_FILE));
        res.json(contacts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve admin page (protected by auth)
app.get('/admin', auth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin dashboard at http://localhost:${PORT}/admin`);
});