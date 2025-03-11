<!-- pages/reports/edit/[id].vue -->
<template>
  <div class="container max-w-4xl mx-auto py-6 px-4 sm:px-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <h1 class="text-2xl font-bold">Edit Report</h1>
      <UButton :to="`/reports/${reportId}`" variant="ghost" class="flex items-center">
        <UIcon name="i-heroicons-arrow-left" class="mr-2" />
        Back to Report
      </UButton>
    </div>

    <UCard v-if="loading">
      <div class="py-4 flex justify-center">
        <ULoader />
      </div>
    </UCard>

    <UCard v-else>
      <template #header>
        <div class="font-semibold text-lg">Edit Report Details</div>
      </template>
      
      <form @submit.prevent="updateReport">
        <!-- Report Details -->
        <UFormGroup label="Report Title" required>
          <UInput v-model="reportTitle" placeholder="Enter report title" />
        </UFormGroup>
        
        <UFormGroup label="Description">
          <UTextarea v-model="reportDescription" placeholder="Optional description" />
        </UFormGroup>
        
        <!-- Parameters based on report type -->
        <div v-if="reportType === 'contract-expiry'">
          <UFormGroup label="Time Period">
            <USelect v-model="periodMonths" :options="periodOptions" />
          </UFormGroup>
        </div>
        
        <div v-if="reportType === 'payment-summary'">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="Start Date">
              <UInput v-model="startDate" type="date" />
            </UFormGroup>
            <UFormGroup label="End Date">
              <UInput v-model="endDate" type="date" />
            </UFormGroup>
          </div>
        </div>

        <!-- Sharing Section -->
        <div class="mt-6 border-t pt-4">
          <h3 class="text-lg font-medium mb-4">Report Sharing</h3>
          
          <ShareReport 
            :report-id="reportId" 
            @shared="handleReportShared"
          />
          
          <div class="mt-4">
            <ReportAccess 
              :shared-with="sharedWith" 
              @access-updated="handleAccessUpdate"
              @access-revoked="handleAccessRevoke"
            />
          </div>
        </div>
        
        <div class="mt-6 flex justify-end space-x-3">
          <UButton 
            type="button" 
            variant="soft" 
            color="gray" 
            @click="router.push(`/reports/${reportId}`)"
          >
            Cancel
          </UButton>
          <UButton 
            type="submit" 
            color="primary" 
            :loading="submitting"
          >
            Save Changes
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ShareReport from '~/components/collaboration/ShareReport.vue';
import ReportAccess from '~/components/collaboration/ReportAccess.vue';

// Define explicit interfaces to avoid TypeScript issues
interface ReportData {
  id: string;
  company_id: string;
  created_by: string;
  report_type: string;
  title: string;
  description?: string;
  parameters?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Interface for shared user data
interface SharedUserData {
  user: { 
    id: string;
    name: string;
    email: string;
  };
  accessLevel: string;
  expiresAt?: string;
}

// Define page metadata
definePageMeta({
  middleware: ['auth']
});

// Route
const route = useRoute();
const reportId = route.params.id as string;

// State
const loading = ref(true);
const submitting = ref(false);
const reportType = ref('');
const reportTitle = ref('');
const reportDescription = ref('');
const periodMonths = ref(12);
const startDate = ref('');
const endDate = ref('');
const sharedWith = ref<SharedUserData[]>([]);
const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();

// Period options
const periodOptions = [
  { label: '3 Months', value: 3 },
  { label: '6 Months', value: 6 },
  { label: '12 Months', value: 12 },
  { label: '24 Months', value: 24 }
];

// Fetch report data
onMounted(async () => {
  try {
    // Load report data
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();
      
    if (error) throw error;
    
    // Explicitly cast to our interface
    const reportData = data as unknown as ReportData;
    
    // Populate form data
    reportType.value = reportData.report_type;
    reportTitle.value = reportData.title;
    reportDescription.value = reportData.description || '';
    
    // Set parameters based on report type
    if (reportData.parameters) {
      if (reportType.value === 'contract-expiry') {
        periodMonths.value = reportData.parameters.period || 12;
      } else if (reportType.value === 'payment-summary') {
        startDate.value = reportData.parameters.startDate || '';
        endDate.value = reportData.parameters.endDate || '';
      }
    }
    
    // Load shared users data (for demonstration - this would be a real query in a complete implementation)
    // This would be replaced with an actual query to report_shares table
    // Mock data for now
    sharedWith.value = [
      {
        user: { 
          id: '1', 
          name: 'John Operations', 
          email: 'john@example.com' 
        },
        accessLevel: 'viewer',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      }
    ];
    
  } catch (err: any) {
    console.error('Error loading report:', err);
    toast.add({
      title: 'Error',
      description: err.message || 'Failed to load report',
      color: 'red'
    });
  } finally {
    loading.value = false;
  }
});

// Update report
async function updateReport() {
  if (!reportTitle.value) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fill in all required fields',
      color: 'red'
    });
    return;
  }
  
  submitting.value = true;
  
  try {
    // Prepare report parameters based on type
    const parameters: Record<string, any> = {};
    
    if (reportType.value === 'contract-expiry') {
      parameters.period = periodMonths.value;
    } else if (reportType.value === 'payment-summary') {
      parameters.startDate = startDate.value;
      parameters.endDate = endDate.value;
    }
    
    // Use the Supabase Query Builder with explicit type casting to avoid TypeScript errors
    // This is a workaround for the TypeScript limitations with Supabase
    const result = await (supabase as any).from('reports').update({
      title: reportTitle.value,
      description: reportDescription.value || null,
      parameters,
      updated_at: new Date().toISOString()
    }).eq('id', reportId);
    
    const { error } = result;
    
    if (error) throw error;
    
    toast.add({
      title: 'Success',
      description: 'Report updated successfully',
      color: 'green'
    });
    
    // Navigate back to the report view
    router.push(`/reports/${reportId}`);
    
  } catch (err: any) {
    console.error('Error updating report:', err);
    toast.add({
      title: 'Error',
      description: err.message || 'Failed to update report',
      color: 'red'
    });
  } finally {
    submitting.value = false;
  }
}

// Handle report shared
function handleReportShared(data: any) {
  toast.add({
    title: 'Report Shared',
    description: `Report shared with ${data.shares.length} users`,
    color: 'green'
  });
  
  // In a real implementation, this would update the database and refresh the shared list
  console.log('Shared report data:', data);
}

// Handle access level update
function handleAccessUpdate(data: { userId: string, newLevel: string }) {
  // In a real implementation, this would update the database
  console.log('Updated access:', data);
  
  // Update the local state for immediate UI update
  const userIndex = sharedWith.value.findIndex(s => s.user.id === data.userId);
  if (userIndex >= 0) {
    sharedWith.value[userIndex].accessLevel = data.newLevel;
  }
  
  toast.add({
    title: 'Access Updated',
    description: 'User access level has been updated',
    color: 'green'
  });
}

// Handle access revocation
function handleAccessRevoke(data: { userId: string }) {
  // In a real implementation, this would update the database
  console.log('Revoked access:', data);
  
  // Update the local state for immediate UI update
  sharedWith.value = sharedWith.value.filter(s => s.user.id !== data.userId);
  
  toast.add({
    title: 'Access Revoked',
    description: 'User access has been revoked',
    color: 'orange'
  });
}
</script>
