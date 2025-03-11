<!-- pages/reports/[id].vue -->
<template>
  <div class="container max-w-6xl mx-auto py-6 px-4 sm:px-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <h1 class="text-2xl font-bold">Report Details</h1>
      <UButton to="/reports" variant="ghost" class="flex items-center">
        <UIcon name="i-heroicons-arrow-left" class="mr-2" />
        Back to Reports
      </UButton>
    </div>
    
    <div v-if="loading" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
    </div>
    
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-600 p-4 mb-6 rounded-lg">
      {{ error }}
    </div>
    
    <template v-else-if="report">
      <ReportViewer 
        :reportData="report" 
        :loading="false"
        :actions="exportActions"
        id="report-content"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// Define report data interface
interface ReportData {
  id: string;
  company_id: string;
  created_by: string;
  title: string;
  description?: string;
  report_type: string;
  parameters?: Record<string, any>;
  content?: any;
  sections?: any[];
  created_at: string;
  updated_at: string;
}

// Define page metadata
definePageMeta({
  middleware: ['auth']
});

// State
const route = useRoute();
const reportId = computed(() => route.params.id as string);
const supabase = useSupabaseClient();
const report = ref<ReportData | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// Export actions
const exportActions = computed(() => [
  {
    label: 'Export PDF',
    icon: 'i-heroicons-document',
    color: 'gray' as const,
    variant: 'outline' as const,
    handler: exportPdf
  },
  {
    label: 'Export Excel',
    icon: 'i-heroicons-table-cells',
    color: 'gray' as const,
    variant: 'outline' as const,
    handler: exportExcel
  },
  {
    label: 'Export Image',
    icon: 'i-heroicons-photo',
    color: 'gray' as const,
    variant: 'outline' as const,
    handler: exportImage
  }
]);

// Fetch report data
async function fetchReport() {
  loading.value = true;
  error.value = null;
  
  try {
    const { data, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId.value)
      .single();
      
    if (fetchError) throw fetchError;
    
    // Cast data to ReportData type and ensure content and sections exist
    report.value = {
      ...data as ReportData,
      content: (data as ReportData)?.content || null,
      sections: (data as ReportData)?.sections || []
    };
  } catch (err: any) {
    console.error('Error fetching report:', err);
    error.value = err.message || 'Failed to load report';
  } finally {
    loading.value = false;
  }
}

// Export functions
async function exportPdf() {
  try {
    const toast = useToast();
    toast.add({
      title: 'Exporting PDF',
      description: 'Preparing your PDF document...',
      color: 'blue'
    });
    
    // Call the server endpoint
    const response = await fetch(`/api/reports/${reportId.value}/export/pdf`);
    if (!response.ok) throw new Error('Failed to export PDF');
    
    const data = await response.json();
    
    if (!data.report) throw new Error('Invalid report data received');
    
    // Create reference to the report content div
    const reportElement = document.getElementById('report-content');
    if (!reportElement) throw new Error('Report content element not found');
    
    // Use the PdfExport component programmatically
    const jsPDF = await import('jspdf');
    const html2canvas = await import('html2canvas');
    
    // Convert content to canvas
    const canvas = await html2canvas.default(reportElement, {
      scale: 2, // Higher resolution
      useCORS: true,
      logging: false
    });
    
    // Create PDF with proper dimensions
    const pdf = new jsPDF.default({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add metadata and title
    pdf.setProperties({
      title: data.report.title,
      subject: data.report.description,
      author: data.report.createdBy,
      creator: 'Telecom Tower Data Analysis Platform'
    });
    
    // Add title and metadata to PDF
    pdf.setFontSize(18);
    pdf.text(data.report.title, 15, 15);
    
    pdf.setFontSize(10);
    pdf.text(`Generated: ${data.report.exportDate}`, 15, 25);
    pdf.text(`Created by: ${data.report.createdBy}`, 15, 30);
    
    // Calculate dimensions to preserve aspect ratio
    const imgWidth = 180; // 210mm - margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add the content image
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 15, 35, imgWidth, imgHeight);
    
    // Save the PDF
    pdf.save(`${data.report.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    
    toast.add({
      title: 'Success',
      description: 'PDF exported successfully',
      color: 'green'
    });
  } catch (err: any) {
    console.error('PDF export error:', err);
    const toast = useToast();
    toast.add({
      title: 'Export Failed',
      description: err.message || 'Error generating PDF',
      color: 'red'
    });
  }
}

async function exportExcel() {
  try {
    const toast = useToast();
    toast.add({
      title: 'Exporting Excel',
      description: 'Preparing your Excel file...',
      color: 'blue'
    });
    
    // Call the server endpoint
    const response = await fetch(`/api/reports/${reportId.value}/export/excel`);
    if (!response.ok) throw new Error('Failed to export Excel');
    
    const data = await response.json();
    
    if (!data.report) throw new Error('Invalid report data received');
    
    // Import SheetJS
    const XLSX = await import('xlsx');
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Add metadata sheet
    const metadataRows = [
      ['Report Title', data.report.metadata.title],
      ['Description', data.report.metadata.description],
      ['Report Type', data.report.metadata.reportType],
      ['Created By', data.report.metadata.createdBy],
      ['Created At', data.report.metadata.createdAt],
      ['Exported At', data.report.metadata.exportedAt]
    ];
    
    const metadataSheet = XLSX.utils.aoa_to_sheet(metadataRows);
    XLSX.utils.book_append_sheet(wb, metadataSheet, 'Metadata');
    
    // Add data sheet if available
    if (data.report.tableData && data.report.tableData.length > 0) {
      // Extract column headers from first row
      const headers = Object.keys(data.report.tableData[0]);
      
      // Convert data to array of arrays format expected by SheetJS
      const rows = [headers];
      data.report.tableData.forEach((row: { [key: string]: any }) => {
        const rowValues = headers.map(header => row[header]);
        rows.push(rowValues);
      });
      
      const dataSheet = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, dataSheet, 'Data');
    }
    
    // Generate filename
    const filename = `${data.report.metadata.title.replace(/\s+/g, '-').toLowerCase()}.xlsx`;
    
    // Write and download file
    XLSX.writeFile(wb, filename);
    
    toast.add({
      title: 'Success',
      description: 'Excel file exported successfully',
      color: 'green'
    });
  } catch (err: any) {
    console.error('Excel export error:', err);
    const toast = useToast();
    toast.add({
      title: 'Export Failed',
      description: err.message || 'Error generating Excel file',
      color: 'red'
    });
  }
}

async function exportImage() {
  try {
    const toast = useToast();
    toast.add({
      title: 'Exporting Image',
      description: 'Preparing your image file...',
      color: 'blue'
    });
    
    // Call the server endpoint
    const response = await fetch(`/api/reports/${reportId.value}/export/image`);
    if (!response.ok) throw new Error('Failed to export image');
    
    const data = await response.json();
    
    if (!data.report) throw new Error('Invalid report data received');
    
    // Get the report content element
    const reportElement = document.getElementById('report-content');
    if (!reportElement) throw new Error('Report content element not found');
    
    // Import html2canvas
    const html2canvas = await import('html2canvas');
    
    // Convert to canvas with high quality
    const canvas = await html2canvas.default(reportElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    // Convert to data URL
    const imageUrl = canvas.toDataURL('image/png');
    
    // Create download link
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${data.report.title.replace(/\s+/g, '-').toLowerCase()}.png`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.add({
      title: 'Success',
      description: 'Image exported successfully',
      color: 'green'
    });
  } catch (err: any) {
    console.error('Image export error:', err);
    const toast = useToast();
    toast.add({
      title: 'Export Failed',
      description: err.message || 'Error generating image',
      color: 'red'
    });
  }
}

// Load report on mount
onMounted(() => {
  fetchReport();
});
</script>