import { supabase } from '../../src/lib/supabase.js';
import { validateAdminToken, getClientIp, setCorsHeaders } from '../../src/lib/auth.js';
import { logAdminAction } from '../../src/lib/rateLimiter.js';

export default async function handler(req, res) {
    if (setCorsHeaders(res, req)) return;
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    if (!validateAdminToken(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const { type, id, action, follow_up_notes } = req.body;
        
        if (!type || !id || !action) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action' });
        }
        
        const table = type === 'prayer' ? 'prayers' : 'testimonies';
        const status = action === 'approve' ? 'approved' : 'rejected';
        
        const updateData = {
            status,
            approved_by: 'admin',
            approved_at: new Date().toISOString()
        };
        
        if (type === 'prayer' && follow_up_notes) {
            updateData.follow_up_notes = follow_up_notes;
            updateData.followed_up = true;
            updateData.followed_up_at = new Date().toISOString();
        }
        
        const { data, error } = await supabase
            .from(table)
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        
        // Log the action
        const ip = getClientIp(req);
        await logAdminAction(action, type, id, { notes: follow_up_notes }, ip);
        
        return res.status(200).json({
            success: true,
            message: `${type} ${status} successfully`,
            data
        });
        
    } catch (error) {
        console.error('Moderation error:', error);
        return res.status(500).json({ error: 'Failed to moderate item' });
    }
}