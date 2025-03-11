// server/api/reports/[id]/share.post.ts

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { shares } = body

  if (!shares || !Array.isArray(shares)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request. Expected shares array.'
    })
  }

  const reportId = event.context.params?.id

  if (!reportId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Report ID is required'
    })
  }

  try {
    const client = await serverSupabaseClient(event)
    
    // Get user making the request
    const { data: userData, error: userError } = await client.auth.getUser()
    
    if (userError || !userData.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && dateString === date.toISOString();
}
    
    // Define types from database schema
    interface Report {
      id: string;
      created_by: string;
      company_id: string;
    }

    interface Profile {
      id: string;
      role?: string;
      company_id: string;
    }

    interface UserProfile {
      id: string;
      email: string;
      full_name: string | null;
    }

interface NotificationData {
  recipientEmail: string;
  recipientName?: string;
  reportTitle: string;
  senderName: string;
  accessLevel: string;
  expiresAt?: string;
}

async function sendEmailNotification(client: any, notificationData: NotificationData) {
  try {
    // Log notification for now (future: replace with actual email sending)
    console.log('NOTIFICATION: Report shared', {
      to: notificationData.recipientEmail,
      subject: `Report "${notificationData.reportTitle}" has been shared with you`,
      accessLevel: notificationData.accessLevel,
      sharedBy: notificationData.senderName
    });
    
    // Future implementation: Call email service
    // Example: await emailService.sendEmail({...})
    
    // For now, store the notification in a table if it exists
    try {
      await client
        .from('notifications')
        .insert({
          recipient_id: notificationData.recipientEmail,
          type: 'report_shared',
          content: {
            reportTitle: notificationData.reportTitle,
            accessLevel: notificationData.accessLevel,
            senderName: notificationData.senderName
          },
          read: false,
          created_at: new Date().toISOString()
        });
    } catch (e) {
      // Table may not exist yet, just log for now
      console.log('Would store notification in database');
    }
    
    return true;
  } catch (err) {
    console.error('Failed to send notification:', err);
    return false;
  }
}

interface ShareRequest {
      userId: string;
      accessLevel: 'viewer' | 'editor' | 'admin';
      expiresAt?: string | null;
    }

    // Verify the user has access to this report
    const { data: reportData, error: reportError } = await client
      .from('reports')
      .select('id, created_by, company_id')
      .eq('id', reportId)
      .single()
      
    if (reportError || !reportData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Report not found'
      })
    }
    
    // Cast to type for type safety
    const report = reportData as Report
    
    // Only the creator or company admin can share the report
    const isCreator = report.created_by === userData.user.id
    
    if (!isCreator) {
      // Check if user is admin within company
      const { data: profileData, error: profileError } = await client
        .from('profiles')
        .select('role, company_id')
        .eq('id', userData.user.id)
        .single()
        
      if (profileError || !profileData) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Not authorized to share this report'
        })
      }
      
      const profile = profileData as Profile
      
      if (profile.company_id !== report.company_id || profile.role !== 'admin') {
        throw createError({
          statusCode: 403,
          statusMessage: 'Not authorized to share this report'
        })
      }
    }
    
    // Define share type
    interface ReportShare {
      id?: string;
      report_id: string;
      shared_by: string;
      shared_with: string;
      access_level: string;
      created_at?: string;
      updated_at?: string;
      expires_at?: string | null;
    }
    
    interface ShareUpdate {
      access_level: string;
      expires_at?: string | null;
      updated_at: string;
    }

    
    
    // Process shares
    const sharePromises = shares.map(async (share: ShareRequest) => {
      const { userId, accessLevel, expiresAt } = share;

      // Validate required fields
      if (!userId || !accessLevel) {
        throw createError({
          statusCode: 400,
          statusMessage: 'User ID and access level are required for each share'
        });
      }

      // Validate access level
      const validAccessLevels = ['viewer', 'editor', 'admin'];
      if (!validAccessLevels.includes(accessLevel)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Invalid access level. Must be one of: ${validAccessLevels.join(', ')}`
        });
      }

      // Validate expiration date if provided
      if (expiresAt && !isValidISODate(expiresAt)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid expiration date format. Must be ISO 8601 format'
        });
      }
      
      // Build share data
      const shareData: ReportShare = {
        report_id: reportId as string,
        shared_by: userData.user!.id,
        shared_with: userId,
        access_level: accessLevel || 'viewer',
        created_at: new Date().toISOString(),
        expires_at: expiresAt || null
      }
      
      // Check if share already exists
      const { data: existingShareData } = await client
        .from('report_shares')
        .select('id')
        .eq('report_id', reportId)
        .eq('shared_with', userId)
        .single()
        
      // Type assertion for existing share data
      interface ExistingShareData {
        id: string;
      }
      
      const existingShare = existingShareData as unknown as ExistingShareData;
        
      if (existingShare) {
        // Update existing share
        const updateData: ShareUpdate = {
          access_level: shareData.access_level,
          expires_at: shareData.expires_at,
          updated_at: new Date().toISOString()
        }

        
        
        // Use Supabase client with type assertion to bypass TypeScript limitations
        return (client as any)
          .from('report_shares')
          .update(updateData)
          .eq('id', existingShare.id as string)
      } else {
        // Create new share
        return (client as any)
          .from('report_shares')
          .insert([shareData])
      }
    })
    
    // Execute all share operations
    await Promise.all(sharePromises)

    // Get report title for notification
const { data: reportTitleData, error: reportTitleError } = await client
  .from('reports')
  .select('title')
  .eq('id', reportId)
  .single();

if (reportTitleError) {
  console.error('Error fetching report title for notification:', reportTitleError);
}

// Get sender's profile information
const { data: senderProfile, error: senderProfileError } = await client
  .from('profiles')
  .select('email, full_name')
  .eq('id', userData.user.id)
  .single();

if (senderProfileError) {
  console.error('Error fetching sender profile for notification:', senderProfileError);
}

// Get shared user profiles (for notification)
const sharedUserIds = shares.map(share => share.userId);
if (sharedUserIds.length > 0) {
  const { data: userProfiles, error: userProfilesError } = await client
    .from('profiles')
    .select('id, email, full_name')
    .in('id', sharedUserIds);

  if (!userProfilesError && userProfiles) {
    // Send notifications
    interface ReportTitle {
      title: string;
    }
    const reportTitle = ((reportTitleData as unknown) as ReportTitle)?.title || 'Untitled Report';
    interface SenderProfile {
      full_name: string | null;
      email: string | null;
    }
    
    const senderName = ((senderProfile as unknown) as SenderProfile)?.full_name || 
                      ((senderProfile as unknown) as SenderProfile)?.email || 
                      'A user';

    // Send notifications to each user
    for (const share of shares) {
      const userProfile = (userProfiles as UserProfile[]).find(p => p.id === share.userId);
      if (userProfile) {
        await sendEmailNotification(client, {
          recipientEmail: userProfile.email,
          recipientName: userProfile.full_name || undefined,
          reportTitle,
          senderName,
          accessLevel: share.accessLevel || 'viewer',
          expiresAt: share.expiresAt
        });
      }
    }
  } else {
    console.error('Error fetching user profiles for notification:', userProfilesError);
  }
}
    
    return { success: true }
  } catch (err) {
    console.error('Error sharing report:', err)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to share report',
      data: err
    })
  }
})
