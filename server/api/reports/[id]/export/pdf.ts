// server/api/reports/[id]/export/pdf.ts - Update with proper implementation
import { createError, getRouterParam } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    // Get report ID from route params
    const id = getRouterParam(event, 'id');
    if (!id) {
      return createError({
        statusCode: 400,
        statusMessage: 'Report ID is required'
      });
    }
    
    // Get auth session
    const client = await serverSupabaseClient(event)
    const { data: { session } } = await client.auth.getSession()
    if (!session) {
      return createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      });
    }
    
    // Use the authenticated Supabase client
    const supabase = client;
    
    // Fetch report data
    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      return createError({
        statusCode: 404,
        statusMessage: 'Report not found'
      });
    }
    
    // Return report data for client-side PDF generation
    return {
      report,
      status: 'success',
      message: 'Report data retrieved successfully for PDF generation'
    };
    
  } catch (err: unknown) {
    console.error('PDF export error:', err);
    return createError({
      statusCode: 500,
      statusMessage: err instanceof Error ? err.message : 'Internal server error'
    });
  }
});