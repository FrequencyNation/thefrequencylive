import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    },
    db: {
        schema: 'public'
    }
});

// Atomic rate limit using database function
export async function checkRateLimitAtomic(ip, actionType, limit = 5, windowHours = 1) {
    try {
        const { data, error } = await supabase.rpc('increment_rate_limit', {
            p_ip: ip,
            p_action: actionType,
            p_limit: limit,
            p_window_hours: windowHours
        });
        
        if (error) {
            console.error('Rate limit RPC error:', error);
            return false;
        }
        
        return data === true;
    } catch (error) {
        console.error('Rate limit error:', error);
        return false;
    }
}

// Health check
export async function checkSupabaseHealth() {
    try {
        const { data, error } = await supabase
            .from('stats')
            .select('id')
            .limit(1);
        
        if (error) throw error;
        return { healthy: true };
    } catch (error) {
        console.error('Supabase health check failed:', error);
        return { healthy: false, error: error.message };
    }
}