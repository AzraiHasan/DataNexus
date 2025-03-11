// server/api/reports/[id]/export/image.ts
import { createError, getRouterParam } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

// Define interfaces for type safety
interface ReportData {
  id: string;
  company_id: string;
  created_by: string | null;
  report_type: string;
  title: string;
  description?: string;
  parameters?: Record<string, any>;
  content?: any;
  created_at: string;
  updated_at: string;
}

interface ReportWithUser {
  id: string;
  company_id: string;
  created_by: { email: string } | null;
  report_type: string;
  title: string;
  description?: string;
  parameters?: Record<string, any>;
  content?: any;
  created_at: string;
  updated_at: string;
}

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
    
    // Fetch report data
    const { data, error } = await client
      .from('reports')
      .select('*, created_by:profiles(email)')
      .eq('id', id)
      .single();
      
    if (error) {
      return createError({
        statusCode: 404,
        statusMessage: 'Report not found'
      });
    }
    
    // Type assertion for TypeScript
    const report = data as unknown as ReportWithUser;
    
    // Format report data for image generation
    const formattedReport = {
      id: report.id,
      title: report.title,
      description: report.description || '',
      report_type: report.report_type,
      parameters: report.parameters || {},
      content: report.content || {},
      createdBy: report.created_by?.email || 'Unknown',
      created_at: report.created_at ? new Date(report.created_at).toLocaleString() : 'Unknown',
      exportDate: new Date().toLocaleString()
    };
    
    // Return structured data for client-side image generation
    return {
      report: formattedReport,
      status: 'success',
      message: 'Report data retrieved successfully for image generation'
    };
    
  } catch (err: unknown) {
    console.error('Image export error:', err);
    return createError({
      statusCode: 500,
      statusMessage: err instanceof Error ? err.message : 'Internal server error'
    });
  }
});