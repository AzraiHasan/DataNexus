// server/api/reports/shared.get.ts

import { serverSupabaseClient } from '#supabase/server'
import type { Tables, Views } from '~/types/database'

// Use database types
type ReportShare = Tables<'report_shares'>
type Report = Tables<'reports'> 
type Profile = Tables<'profiles'>

export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient(event)
    
    // Get current user
    const { data: userData, error: userError } = await client.auth.getUser()
    
    if (userError || !userData.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }
    
    // Define strongly typed interfaces for query results
    interface SharedReportResult {
      id: string;
      report_id: string;
      shared_by: string;
      access_level: string;
      created_at: string;
      expires_at?: string;
      reports: Report;
    }

    // Get reports shared with the user
    const { data: sharedReports, error: shareError } = await client
      .from('report_shares')
      .select(`
        id,
        report_id,
        shared_by,
        access_level,
        created_at,
        expires_at,
        reports:report_id(*)
      `)
      .eq('shared_with', userData.user.id)
      .order('created_at', { ascending: false })
    
    if (shareError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch shared reports'
      })
    }
    
    // Type assertion for query results
    const typedSharedReports = sharedReports as unknown as SharedReportResult[]
    
    // Get user information for those who shared reports
    const sharedByUserIds = [...new Set(typedSharedReports.map(share => share.shared_by))]
    
    // Create a type for users from profiles
    interface UserProfile {
      id: string;
      email: string;
      full_name?: string;
    }
    
    if (sharedByUserIds.length > 0) {
      const { data: users, error: usersError } = await client
        .from('profiles')
        .select('id, email, full_name')
        .in('id', sharedByUserIds as any)
      
      if (!usersError && users) {
        // Type assertion for profile data
        const typedUsers = users as unknown as UserProfile[];
        
        // Enhance shared report data with user information
        const enhancedSharedReports = typedSharedReports.map(share => {
          const sharedByUser = typedUsers.find(user => user.id === share.shared_by)
          return {
            ...share,
            shared_by_user: sharedByUser || { id: share.shared_by, email: 'Unknown user' }
          }
        })
        
        return enhancedSharedReports
      }
    }
    
    // Return typed shared reports if no profile enhancement was done
    return typedSharedReports
  } catch (err) {
    console.error('Error fetching shared reports:', err)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch shared reports',
      data: err
    })
  }
})
