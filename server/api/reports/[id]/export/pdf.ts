// server/api/reports/[id]/export/pdf.ts - Enhanced the server endpoint for PDF export
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

// Interface for the response when the join with users table occurs
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
    
    // Type assertion to help TypeScript understand the shape
    const report = data as unknown as ReportWithUser;
    
    // Format report data for PDF generation
    const formattedReport = {
      id: report.id,
      title: report.title,
      description: report.description || '',
      report_type: report.report_type,
      createdBy: report.created_by?.email || 'Unknown',
      created_at: report.created_at ? new Date(report.created_at).toLocaleString() : 'Unknown',
      updated_at: report.updated_at ? new Date(report.updated_at).toLocaleString() : 'Unknown',
      exportDate: new Date().toLocaleString()
    };
    
    // Return structured data for client-side PDF generation
    return {
      report: formattedReport,
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