// server/api/notifications/email.post.ts - enhanced version
import { createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  templateData?: Record<string, any>;
}

// Rate limiting tracker
const rateLimits = new Map<string, {count: number, resetAt: number}>();
const RATE_LIMIT = 10; // Max emails per minute per user
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds

export default defineEventHandler(async (event) => {
  try {
    // Get the request body
    const payload = await readBody(event) as EmailPayload
    
    // Validate required fields
    if (!payload.to || !payload.subject || (!payload.body && !payload.templateId)) {
      return createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: to, subject, and either body or templateId'
      })
    }
    
    // Validate email with more thorough regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(payload.to)) {
      return createError({
        statusCode: 400,
        statusMessage: 'Invalid email address format'
      })
    }
    
    // Get Supabase client for authentication
    const client = await serverSupabaseClient(event)
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await client.auth.getUser()
    
    if (authError || !user) {
      return createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }
    
    // Apply rate limiting
    const userId = user.id;
    const now = Date.now();
    const userLimit = rateLimits.get(userId) || { count: 0, resetAt: now + RATE_WINDOW };
    
    // Reset counter if window expired
    if (userLimit.resetAt < now) {
      userLimit.count = 0;
      userLimit.resetAt = now + RATE_WINDOW;
    }
    
    // Check if rate limit exceeded
    if (userLimit.count >= RATE_LIMIT) {
      const resetInSeconds = Math.ceil((userLimit.resetAt - now) / 1000);
      return createError({
        statusCode: 429,
        statusMessage: `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`
      })
    }
    
    // Increment usage counter
    userLimit.count++;
    rateLimits.set(userId, userLimit);
    
    // For MVP: Log the email instead of sending it
    console.log('SENDING EMAIL NOTIFICATION:', {
      to: payload.to,
      subject: payload.subject,
      body: payload.body?.substring(0, 100) + (payload.body?.length > 100 ? '...' : ''),
      template: payload.templateId,
      templateData: payload.templateData
    })
    
    /* 
    // FUTURE IMPLEMENTATION:
    // For production, integrate with an email service like SendGrid or AWS SES
    // Example implementation commented out until ready to use
    
    const emailService = useEmailService(); // Future composable
    const result = await emailService.send({
      to: payload.to,
      subject: payload.subject,
      body: payload.body,
      templateId: payload.templateId,
      templateData: payload.templateData
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Email service failed to send message');
    }
    */
    
    return {
      success: true,
      messageId: `mock_msg_${Date.now()}`,
      message: 'Email notification logged (MVP implementation)'
    }
  } catch (err: any) {
    console.error('Error processing email notification:', err)
    
    return createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to process email notification',
      data: err
    })
  }
})