const REPO = 'x-LANsolo-x/cuchd.in-daa-page';
const BRANCH = 'main';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        return res.status(500).json({ error: 'GITHUB_TOKEN environment variable is missing.' });
    }

    try {
        const { type, clubId, filename, base64 } = req.body;
        if (!filename || !base64) {
            return res.status(400).json({ error: 'Filename and base64 data are required.' });
        }

        // Determine file path
        let filePath = '';
        const safeName = Date.now() + '_' + filename.replace(/[^a-zA-Z0-9.-]/g, '_');

        if (type === 'logo') {
            filePath = `logos/${safeName}`;
        } else if (type === 'media') {
            const cid = clubId || 'general';
            filePath = `media/${cid}/${safeName}`;
        } else {
            return res.status(400).json({ error: 'Invalid upload type.' });
        }

        // Upload directly to GitHub
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

        return res.status(200).json({ success: true, filePath });

    } catch (err) {
        console.error("Server Error:", err);
        return res.status(500).json({ error: 'Internal Server Error.' });
    }
}
