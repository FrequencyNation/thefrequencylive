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
        // Get counts in parallel
        const [
            { count: totalPrayers },
            { count: pendingPrayers },
            { count: totalTestimonies },
            { count: pendingTestimonies }
        ] = await Promise.all([
            supabase.from('prayers').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
            supabase.from('prayers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('testimonies').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
            supabase.from('testimonies').select('*', { count: 'exact', head: true }).eq('status', 'pending')
        ]);
        
        return res.status(200).json({
            total_prayers: totalPrayers || 0,
            pending_prayers: pendingPrayers || 0,
            total_testimonies: totalTestimonies || 0,
            pending_testimonies: pendingTestimonies || 0,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Stats error:', error);
        return res.status(500).json({ error: 'Failed to load stats' });
    }
}