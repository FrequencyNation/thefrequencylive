import { supabase, checkRateLimitAtomic } from '../../src/lib/supabase.js';
import { 
    getClientIp, 
    sanitize, 
    validateEmail, 
    validatePhone,
    validateContactPreference,
    formatWhatsApp,
    checkHoneypot,
    setCorsHeaders 
} from '../../src/lib/auth.js';
import { isIpBlocked } from '../../src/lib/rateLimiter.js';

export default async function handler(req, res) {
    if (setCorsHeaders(res, req)) return;
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const body = req.body;
        
        // Honeypot check
        if (checkHoneypot(body)) {
            return res.status(200).json({ 
                success: true, 
                message: 'Prayer submitted successfully' 
            });
        }
        
        const {
            name,
            email,
            phone,
            contact_preference,
            location,
            category,
            prayer_text,
            is_public,
            is_urgent,
            consent
        } = body;
        
        // Validation
        if (!prayer_text || prayer_text.length < 10) {
            return res.status(400).json({ error: 'Prayer must be at least 10 characters' });
        }
        
        if (prayer_text.length > 2000) {
            return res.status(400).json({ error: 'Prayer is too long (max 2000 characters)' });
        }
        
        if (!consent) {
            return res.status(400).json({ error: 'You must consent to prayer' });
        }
        
        if (name && name.length > 100) {
            return res.status(400).json({ error: 'Name too long (max 100 characters)' });
        }
        
        if (location && location.length > 100) {
            return res.status(400).json({ error: 'Location too long (max 100 characters)' });
        }
        
        if (email && !validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }
        
        if (phone && !validatePhone(phone)) {
            return res.status(400).json({ error: 'Invalid phone number' });
        }
        
        if (contact_preference && !validateContactPreference(contact_preference)) {
            return res.status(400).json({ error: 'Invalid contact preference' });
        }
        
        const whatsappNumber = phone ? formatWhatsApp(phone) : null;
        const ip = getClientIp(req);
        
        // Rate limit check
        const allowed = await checkRateLimitAtomic(ip, 'prayer', 5, 1);
        if (!allowed) {
            return res.status(429).json({ error: 'Too many requests. Please try again later.' });
        }
        
        // IP block check
        const blocked = await isIpBlocked(ip);
        if (blocked) {
            return res.status(403).json({ error: 'Your IP has been blocked.' });
        }
        
        // Insert prayer
        const { data, error } = await supabase
            .from('prayers')
            .insert({
                name: sanitize(name, 100),
                email: sanitize(email, 255),
                phone: sanitize(phone, 50),
                whatsapp_number: whatsappNumber,
                contact_preference: contact_preference || 'none',
                location: sanitize(location, 100),
                category: category || 'General',
                prayer_text: sanitize(prayer_text, 2000),
                is_public: is_public || false,
                is_urgent: is_urgent || false,
                consent: true,
                status: 'pending',
                ip_address: ip,
                user_agent: sanitize(req.headers['user-agent'], 500)
            })
            .select()
            .single();
            
        if (error) throw error;
        
        return res.status(200).json({
            success: true,
            id: data.id,
            message: 'Prayer submitted successfully'
        });
        
    } catch (error) {
        console.error('Submit prayer error:', error);
        return res.status(500).json({ error: 'Failed to submit prayer' });
    }
}
