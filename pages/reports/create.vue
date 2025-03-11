<!-- pages/reports/create.vue -->
<template>
  <div class="container max-w-4xl mx-auto py-6 px-4 sm:px-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <h1 class="text-2xl font-bold">Create Report</h1>
      <UButton to="/reports" variant="ghost" class="flex items-center">
        <UIcon name="i-heroicons-arrow-left" class="mr-2" />
        Back to Reports
      </UButton>
    </div>

    <UCard>
      <template #header>
        <div class="font-semibold text-lg">Select Report Type</div>
      </template>
      
      <form @submit.prevent="createReport">
        <!-- Report Type Selection -->
        <UFormGroup label="Report Type" required>
          <URadio v-model="reportType" name="reportType" value="contract-expiry">
            Contract Expiry Timeline
          </URadio>
          <URadio v-model="reportType" name="reportType" value="payment-summary">
            Payment Summary
          </URadio>
        </UFormGroup>
        
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
        
        <div class="mt-4 flex justify-end">
          <UButton type="submit" color="primary" :loading="loading">
            Generate Report
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Define interfaces for database types
interface ProfileData {
  id: string;
  company_id: string;
  [key: string]: any;
}

// Interface for returned report data
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

// Interface for creating a new report (without id)
interface CreateReportData {
  company_id: string;
  created_by: string;
  report_type: string;
  title: string;
  description?: string;
  parameters?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Define page metadata
definePageMeta({
  middleware: ['auth']
});

// State
const reportType = ref('contract-expiry');
const reportTitle = ref('');
const reportDescription = ref('');
const periodMonths = ref(12);
const startDate = ref('');
const endDate = ref('');
const loading = ref(false);
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

// Initialize date range with default values if empty
onMounted(() => {
  if (!startDate.value) {
    const firstDay = new Date();
    firstDay.setDate(1);
    startDate.value = firstDay.toISOString().split('T')[0];
  }
  
  if (!endDate.value) {
    const today = new Date();
    endDate.value = today.toISOString().split('T')[0];
  }
});

// Create report
async function createReport() {
  if (!reportTitle.value || !reportType.value) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fill in all required fields',
      color: 'red'
    });
    return;
  }
  
  loading.value = true;
  
  try {
    // Get user data
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) throw new Error('User not authenticated');
    
    // Get company ID from profile
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userData.user.id)
      .single();
      
    if (profileError) throw profileError;
    
    const profileData = data as ProfileData;
    
    // Safely access company_id
    if (!profileData || typeof profileData.company_id !== 'string') {
      throw new Error('No company associated with user');
    }
    
    // Prepare report parameters based on type
    const parameters: Record<string, any> = {};
    
    if (reportType.value === 'contract-expiry') {
      parameters.period = periodMonths.value;
    } else if (reportType.value === 'payment-summary') {
      parameters.startDate = startDate.value;
      parameters.endDate = endDate.value;
    }
    
    // Create report data object
    const reportData: CreateReportData = {
      company_id: profileData.company_id,
      created_by: userData.user.id,
      report_type: reportType.value,
      title: reportTitle.value,
      description: reportDescription.value || undefined,
      parameters: parameters,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert record - using type assertion to bypass Supabase typing limitations
    const { data: insertResult, error: reportError } = await supabase
      .from('reports')
      .insert(reportData as any)
      .select();
      
    if (reportError) throw reportError;
    
    toast.add({
      title: 'Success',
      description: 'Report created successfully',
      color: 'green'
    });
    
    // Navigate to the report view
    if (insertResult && insertResult.length > 0) {
      const createdReport = insertResult[0] as ReportData;
      router.push(`/reports/${reportType.value}/${createdReport.id}`);
    } else {
      router.push('/reports');
    }
  } catch (err: any) {
    console.error('Error creating report:', err);
    toast.add({
      title: 'Error',
      description: err.message || 'Failed to create report',
      color: 'red'
    });
  } finally {
    loading.value = false;
  }
}
</script>
