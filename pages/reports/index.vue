<!-- pages/reports/index.vue -->
<template>
  <div class="container max-w-6xl mx-auto py-6 px-4 sm:px-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <h1 class="text-2xl font-bold">Reports</h1>
      <UButton to="/dashboard" variant="ghost" class="flex items-center">
        <UIcon name="i-heroicons-arrow-left" class="mr-2" />
        Back to Dashboard
      </UButton>
    </div>

    <p class="text-gray-600 mb-6">
      Generate and view reports about your telecom tower data. Select a report template below.
    </p>

    <!-- Standard Report Templates -->
    <div>
      <h2 class="text-xl font-semibold mb-4">Standard Reports</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Contract Expiry Report -->
        <UCard class="hover:shadow-lg transition-shadow">
          <template #header>
            <div class="font-medium text-lg">Contract Expiry Timeline</div>
          </template>
          <p class="text-sm text-gray-600 mb-4">
            View upcoming contract expirations, revenue impact, and geographic distribution.
          </p>
          <template #footer>
            <div class="flex justify-end">
              <UButton to="/reports/contract-expiry" color="primary">
                Generate Report
              </UButton>
            </div>
          </template>
        </UCard>

        <!-- Payment Summary Report -->
        <UCard class="hover:shadow-lg transition-shadow">
          <template #header>
            <div class="font-medium text-lg">Payment Summary</div>
          </template>
          <p class="text-sm text-gray-600 mb-4">
            View monthly payment trends, landlord distribution, and payment status.
          </p>
          <template #footer>
            <div class="flex justify-end">
              <UButton to="/reports/payment-summary" color="primary">
                Generate Report
              </UButton>
            </div>
          </template>
        </UCard>

        <!-- Tower Status Report (Coming Soon) -->
        <UCard class="hover:shadow-lg transition-shadow bg-gray-50">
          <template #header>
            <div class="font-medium text-lg text-gray-500">Tower Status Report</div>
          </template>
          <p class="text-sm text-gray-500 mb-4">
            View tower status distribution, geographic map, and maintenance timeline.
          </p>
          <div class="mb-4">
            <UBadge color="blue">Coming Soon</UBadge>
          </div>
          <template #footer>
            <div class="flex justify-end">
              <UButton disabled color="gray">
                Generate Report
              </UButton>
            </div>
          </template>
        </UCard>
      </div>
    </div>

    <!-- Recent Reports -->
    <div class="mt-8">
      <h2 class="text-xl font-semibold mb-4">Recent Reports</h2>
      
      <div v-if="loading" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
      </div>
      
      <div v-else-if="reports.length === 0" class="bg-gray-50 rounded-lg p-8 text-center">
        <UIcon name="i-heroicons-document-text" class="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p class="text-gray-600">No reports generated yet.</p>
        <p class="text-sm text-gray-500 mt-2">
          Select a report template above to generate your first report.
        </p>
      </div>
      
      <UTable v-else :columns="reportColumns" :rows="reports" hover>
        <template #title-data="{ row }">
          <div class="font-medium">{{ row.title }}</div>
          <div class="text-xs text-gray-500" v-if="row.description">{{ row.description }}</div>
        </template>
        
        <template #created_at-data="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
        
        <template #actions-data="{ row }">
          <div class="flex space-x-2">
            <UButton size="xs" :to="`/reports/${row.report_type}/${row.id}`" icon="i-heroicons-eye">
              View
            </UButton>
            <UButton size="xs" color="red" variant="ghost" @click="confirmDelete(row)" icon="i-heroicons-trash">
              Delete
            </UButton>
          </div>
        </template>
      </UTable>
    </div>

    <!-- Delete confirmation modal -->
    <UModal v-model="showDeleteModal">
      <UCard>
        <template #header>
          <div class="text-lg font-semibold">Confirm Deletion</div>
        </template>
        <p>Are you sure you want to delete <strong>{{ reportToDelete?.title }}</strong>?</p>
        <p class="mt-2 text-gray-600 text-sm">This action cannot be undone.</p>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showDeleteModal = false">Cancel</UButton>
            <UButton color="red" @click="deleteReport" :loading="isDeleting">Delete</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
});

interface Report {
  id: string;
  company_id: string;
  created_by: string;
  report_type: string;
  title: string;
  description?: string;
  parameters?: any;
  created_at: string;
  updated_at: string;
}

const reports = ref<Report[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const supabase = useSupabaseClient();
const toast = useToast();

// Delete modal state
const showDeleteModal = ref(false);
const reportToDelete = ref<Report | null>(null);
const isDeleting = ref(false);

// Table columns
const reportColumns = [
  { key: 'title', label: 'Report' },
  { key: 'report_type', label: 'Type' },
  { key: 'created_at', label: 'Generated' },
  { key: 'actions', label: 'Actions' }
];

// Format date for display
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Fetch reports
async function fetchReports() {
  loading.value = true;
  
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user?.id) throw new Error('User not authenticated');
    
    // Get company ID from profile
    interface ProfileData {
      id: string;
      company_id: string;
      [key: string]: any;
    }
    
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userData.user.id)
      .single();
      
    if (profileError) throw profileError;
    
    const profileData = data as ProfileData;
    const companyId = profileData.company_id;
    
    // Get reports for this company
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
      
    if (reportError) throw reportError;
    
    reports.value = reportData || [];
  } catch (err: any) {
    console.error('Error fetching reports:', err);
    error.value = err.message;
    toast.add({
      title: 'Error',
      description: 'Failed to load reports',
      color: 'red'
    });
  } finally {
    loading.value = false;
  }
}

// Confirm delete
function confirmDelete(report: Report) {
  reportToDelete.value = report;
  showDeleteModal.value = true;
}

// Delete report
async function deleteReport() {
  if (!reportToDelete.value) return;
  
  isDeleting.value = true;
  
  try {
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportToDelete.value.id);
      
    if (deleteError) throw deleteError;
    
    // Remove from list
    reports.value = reports.value.filter(r => r.id !== reportToDelete.value?.id);
    
    toast.add({
      title: 'Success',
      description: 'Report deleted successfully',
      color: 'green'
    });
    
    // Close modal
    showDeleteModal.value = false;
    reportToDelete.value = null;
  } catch (err: any) {
    console.error('Error deleting report:', err);
    toast.add({
      title: 'Error',
      description: 'Failed to delete report',
      color: 'red'
    });
  } finally {
    isDeleting.value = false;
  }
}

// Fetch reports on component mount
onMounted(() => {
  fetchReports();
});
</script>