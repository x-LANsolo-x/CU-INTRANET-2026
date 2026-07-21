const fs = require('fs');
const path = require('path');

const REPO = 'x-LANsolo-x/cuchd.in-daa-page';
const BRANCH = 'main';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const data = require('../clubs.json');
            return res.status(200).json(data);
        } catch (err) {
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
            const filePath = 'clubs.json';

            // 1. Get the current file's SHA to update it
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

            // 2. Commit the new file
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
                    ...(sha && { sha }) // include sha if file exists
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
}
