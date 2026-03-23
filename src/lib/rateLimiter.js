import { supabase, checkRateLimitAtomic } from './supabase.js';

// Rate limit by action type
export async function rateLimitByAction(ip, actionType, limit = 5, windowHours = 1) {
    return await checkRateLimitAtomic(ip, actionType, limit, windowHours);
}

// Check if IP is blocked
export async function isIpBlocked(ip) {
    const { data, error } = await supabase
        .from('blocked_ips')
        .select('id')
        .eq('ip_address', ip)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('Block check error:', error);
        return false;
    }
    
    return !!data;
}

// Log admin action
export async function logAdminAction(action, targetType, targetId, details = {}, ip = null) {
    try {
        await supabase.from('admin_logs').insert({
            admin_action: action,
            target_type: targetType,
            target_id: targetId,
            details,
            ip_address: ip
        });
    } catch (error) {
        console.error('Admin log error:', error);
    }
}