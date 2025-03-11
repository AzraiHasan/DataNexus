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
    const sharePromises = shares.map(async (share) => {
      const { userId, accessLevel, expiresAt } = share
      
      // Build share data
      const shareData: ReportShare = {
        report_id: reportId,
        shared_by: userData.user.id,
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
