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
    const response = await fetch(`/api/reports/${reportId.value}/export/pdf`);
    if (!response.ok) throw new Error('Failed to export PDF');
    
    const data = await response.json();
    
    // For now just log success
    console.log('PDF export successful:', data);
    
    // TODO: Use client-side PDF generation with the returned data
  } catch (err: any) {
    console.error('PDF export error:', err);
  }
}

async function exportExcel() {
  try {
    const response = await fetch(`/api/reports/${reportId.value}/export/excel`);
    if (!response.ok) throw new Error('Failed to export Excel');
    
    const data = await response.json();
    
    // For now just log success
    console.log('Excel export successful:', data);
    
    // TODO: Use client-side Excel generation with the returned data
  } catch (err: any) {
    console.error('Excel export error:', err);
  }
}

async function exportImage() {
  try {
    const response = await fetch(`/api/reports/${reportId.value}/export/image`);
    if (!response.ok) throw new Error('Failed to export image');
    
    const data = await response.json();
    
    // For now just log success
    console.log('Image export successful:', data);
    
    // TODO: Use client-side image generation with the returned data
  } catch (err: any) {
    console.error('Image export error:', err);
  }
}

// Load report on mount
onMounted(() => {
  fetchReport();
});
</script>