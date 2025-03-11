// server/api/reports/[id]/export/excel.ts
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
    
    // Extract table data based on report type
    let tableData: Record<string, any>[] = [];
    
    if (report.content?.data) {
      // Different handling based on report type
      if (report.report_type === 'contract-expiry') {
        tableData = report.content.data.expiringContractsTable || [];
      } else if (report.report_type === 'payment-summary') {
        tableData = report.content.data.paymentDetails || [];
      }
    }
    
    // Format report metadata for Excel
    const metadata = {
      title: report.title,
      description: report.description || '',
      reportType: report.report_type,
      createdBy: report.created_by?.email || 'Unknown',
      createdAt: report.created_at ? new Date(report.created_at).toLocaleString() : 'Unknown',
      exportedAt: new Date().toLocaleString()
    };
    
    // Return structured data for client-side Excel generation
    return {
      report: {
        metadata,
        tableData
      },
      status: 'success',
      message: 'Report data retrieved successfully for Excel generation'
    };
    
  } catch (err: unknown) {
    console.error('Excel export error:', err);
    return createError({
      statusCode: 500,
      statusMessage: err instanceof Error ? err.message : 'Internal server error'
    });
  }
});