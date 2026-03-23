import { supabase } from '../../src/lib/supabase.js';
import { validateAdminToken, setCorsHeaders } from '../../src/lib/auth.js';

export default async function handler(req, res) {
    if (setCorsHeaders(res, req)) return;
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    if (!validateAdminToken(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const { status = 'pending', page = 1, limit = 10 } = req.query;
        
        const pageSize = parseInt(limit);
        const start = (parseInt(page) - 1) * pageSize;
        const end = start + pageSize - 1;
        
        let query = supabase
            .from('testimonies')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(start, end);
            
        if (status !== 'all') {
            query = query.eq('status', status);
        }
        
        const { data, error, count } = await query;
        
        if (error) throw error;
        
        return res.status(200).json({
            testimonies: data,
            pagination: {
                page: parseInt(page),
                limit: pageSize,
                total: count,
                pages: Math.ceil(count / pageSize)
            }
        });
        
    } catch (error) {
        console.error('Testimonies list error:', error);
        return res.status(500).json({ error: 'Failed to load testimonies' });
    }
}