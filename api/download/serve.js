import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    const { file } = req.query;
    
    const allowedFiles = ['authority-prayer-manual.pdf', 'prayers-for-immigrants.pdf'];
    
    if (!file || !allowedFiles.includes(file)) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    const filePath = path.join(process.cwd(), 'public', 'downloads', file);
    
    try {
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        const stat = fs.statSync(filePath);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${file}"`);
        
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
        
    } catch (error) {
        console.error('Download error:', error);
        return res.status(500).json({ error: 'Failed to serve file' });
    }
}