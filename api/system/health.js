import { supabase, checkSupabaseHealth } from '../../src/lib/supabase.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {}
    };
    
    try {
        const dbHealth = await checkSupabaseHealth();
        health.services.database = dbHealth;
        
        if (!dbHealth.healthy) {
            health.status = 'degraded';
        }
        
        return res.status(200).json(health);
        
    } catch (error) {
        health.status = 'error';
        health.error = error.message;
        return res.status(500).json(health);
    }
}