import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const shareId = query.shareId as string
  
  if (!shareId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Share ID is required'
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
    
    // Delete the share
    // Note: The Row Level Security policies will ensure only authorized users
    // can delete shares (either the creator, report owner, or company admin)
    const { error: deleteError } = await client
      .from('report_shares')
      .delete()
      .eq('id', shareId)
    
    if (deleteError) {
      // Check if it's a permission error or not found
      if (deleteError.code === 'PGRST116') {
        throw createError({
          statusCode: 403,
          statusMessage: 'Not authorized to revoke this access'
        })
      } else if (deleteError.code === '42P01') {
        throw createError({ 
          statusCode: 404,
          statusMessage: 'Share not found'
        })
      } else {
        throw deleteError
      }
    }
    
    return { success: true }
  } catch (err) {
    console.error('Error revoking access:', err)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to revoke access',
      data: err
    })
  }
})
