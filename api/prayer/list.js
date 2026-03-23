import { supabase } from '../../src/lib/supabase.js';
import { setCorsHeaders } from '../../src/lib/auth.js';

export default async function handler(req, res) {
    if (setCorsHeaders(res, req)) return;
    
    try {
        const { limit = 10, page = 1, category, urgent } = req.query;
        
        const pageSize = parseInt(limit);
        const start = (parseInt(page) - 1) * pageSize;
        const end = start + pageSize - 1;
        
        let query = supabase
            .from('prayers')
            .select('name, prayer_text, created_at, category, is_urgent', { count: 'exact' })
            .eq('status', 'approved')
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .range(start, end);
        
        if (category && category !== 'all') {
            query = query.eq('category', category);
        }
        
        if (urgent === 'true') {
            query = query.eq('is_urgent', true);
        }
        
        const { data, error, count } = await query;
        
        if (error) throw error;
        
        return res.status(200).json({ 
            prayers: data,
            pagination: {
                page: parseInt(page),
                limit: pageSize,
                total: count,
                pages: Math.ceil(count / pageSize)
            }
        });
        
    } catch (error) {
        console.error('Get prayers error:', error);
        return res.status(500).json({ error: 'Failed to load prayers' });
    }
}
