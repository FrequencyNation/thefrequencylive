import { supabase } from '../../src/lib/supabase.js';
import { setCorsHeaders } from '../../src/lib/auth.js';

export default async function handler(req, res) {
    if (setCorsHeaders(res, req)) return;
    
    try {
        const { limit = 10, page = 1, featured } = req.query;
        
        const pageSize = parseInt(limit);
        const start = (parseInt(page) - 1) * pageSize;
        const end = start + pageSize - 1;
        
        let query = supabase
            .from('testimonies')
            .select('submitter_name, testimony_text, location, category, created_at', { count: 'exact' })
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .range(start, end);
        
        if (featured === 'true') {
            query = query.eq('featured', true);
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
        console.error('Get testimonies error:', error);
        return res.status(500).json({ error: 'Failed to load testimonies' });
    }
}