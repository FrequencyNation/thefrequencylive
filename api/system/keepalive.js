import { supabase } from '../../src/lib/supabase.js';

export default async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        // Multiple queries to keep Supabase active
        await supabase.from('stats').select('id').limit(1);
        await supabase.from('keepalive_logs').insert({
            source: 'vercel_cron'
        });
        
        return res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Keep-alive successful'
        });
        
    } catch (error) {
        console.error('Keepalive error:', error);
        return res.status(500).json({ error: 'Keep-alive failed' });
    }
}
