const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const REPO = process.env.GITHUB_REPO || 'x-LANsolo-x/CU-INTRANET-2026';
const BRANCH = process.env.GITHUB_BRANCH || 'main';

// 1. GET/POST /api/clubs
app.all('/api/clubs', async (req, res) => {
    if (req.method === 'GET') {
        try {
            const dataPath = path.join(__dirname, 'clubs.json');
            const data = fs.readFileSync(dataPath, 'utf8');
            return res.status(200).json(JSON.parse(data));
        } catch (err) {
            console.error("Failed to read clubs.json:", err);
            return res.status(500).json({ error: 'Failed to read clubs.json' });
        }
    }

    if (req.method === 'POST') {
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            return res.status(500).json({ error: 'GITHUB_TOKEN environment variable is missing.' });
        }

        try {
            const content = JSON.stringify(req.body, null, 2);
            const contentBase64 = Buffer.from(content).toString('base64');
            const filePath = 'intranet/clubs.json';

            // Get current file SHA to update it
            const getFileRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}?ref=${BRANCH}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            let sha = '';
            if (getFileRes.ok) {
                const fileData = await getFileRes.json();
                sha = fileData.sha;
            }

            // Commit new file
            const commitRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Update clubs.json via Admin Panel',
                    content: contentBase64,
                    branch: BRANCH,
                    ...(sha && { sha })
                })
            });

            if (!commitRes.ok) {
                const errData = await commitRes.json();
                console.error("GitHub API Error:", errData);
                return res.status(500).json({ error: 'Failed to commit to GitHub.', details: errData });
            }

            return res.status(200).json({ success: true, message: 'Clubs updated successfully on GitHub!' });

        } catch (err) {
            console.error("Server Error:", err);
            return res.status(500).json({ error: 'Internal Server Error.' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
});

// 2. POST /api/upload
app.post('/api/upload', async (req, res) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        return res.status(500).json({ error: 'GITHUB_TOKEN environment variable is missing.' });
    }

    try {
        const { type, clubId, filename, base64 } = req.body;
        if (!filename || !base64) {
            return res.status(400).json({ error: 'Filename and base64 data are required.' });
        }

        let filePath = '';
        const safeName = Date.now() + '_' + filename.replace(/[^a-zA-Z0-9.-]/g, '_');

        if (type === 'logo') {
            filePath = `intranet/logos/${safeName}`;
        } else if (type === 'media') {
            const cid = clubId || 'general';
            filePath = `intranet/media/${cid}/${safeName}`;
        } else {
            return res.status(400).json({ error: 'Invalid upload type.' });
        }

        // Upload to GitHub
        const commitRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Upload ${type} via Admin Panel`,
                content: base64,
                branch: BRANCH
            })
        });

        if (!commitRes.ok) {
            const errData = await commitRes.json();
            console.error("GitHub API Error:", errData);
            return res.status(500).json({ error: 'Failed to upload to GitHub.', details: errData });
        }

        const domainPath = type === 'logo' ? `logos/${safeName}` : `media/${clubId || 'general'}/${safeName}`;
        return res.status(200).json({ success: true, filePath: domainPath });

    } catch (err) {
        console.error("Server Error:", err);
        return res.status(500).json({ error: 'Internal Server Error.' });
    }
});

// Serve static files fallback
app.use(express.static(path.join(__dirname)));

// HTML routes fallbacks
app.get('/communities', (req, res) => res.sendFile(path.join(__dirname, 'communities.html')));
app.get('/departmental-societies', (req, res) => res.sendFile(path.join(__dirname, 'departmental-societies.html')));
app.get('/professional-societies', (req, res) => res.sendFile(path.join(__dirname, 'professional-societies.html')));
app.get('/clubs', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/clubv2', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
