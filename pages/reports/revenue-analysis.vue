<template>
  <div class="container max-w-6xl mx-auto py-6 px-4 sm:px-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <h1 class="text-2xl font-bold">Revenue Analysis Report</h1>
      <UButton to="/reports" variant="ghost" class="flex items-center">
        <UIcon name="i-heroicons-arrow-left" class="mr-2" />
        Back to Reports
      </UButton>
    </div>
    
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 p-4 mb-6 rounded-lg">
      {{ error }}
    </div>
    
    <div class="mb-6">
      <UFormGroup label="Report Period" :help="periodHelp">
        <div class="flex items-center gap-4">
          <USelect
            v-model="reportPeriod"
            :options="periodOptions"
            placeholder="Select time period"
            class="w-52"
          />
          <UButton
            v-if="periodChanged"
            color="blue"
            @click="updateReportView"
            size="sm"
            :loading="isUpdating"
          >
            Update Report
          </UButton>
        </div>
      </UFormGroup>
    </div>
    
    <RevenueReport :period="reportPeriod" :key="reportKey" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import RevenueReport from '~/components/reports/templates/RevenueReport.vue';

// Define page metadata
definePageMeta({
  middleware: ['auth']
});

// State management
const error = ref<string | null>(null);
const reportPeriod = ref<number>(12); // Default to 12 months
const initialPeriod = ref<number>(12); // Store initial value to detect changes
const reportKey = ref<number>(0); // Key to force component refresh
const isUpdating = ref<boolean>(false);

// Define period options
const periodOptions = [
  { label: 'Quarterly (3 months)', value: 3 },
  { label: 'Half Year (6 months)', value: 6 },
  { label: 'Annual (12 months)', value: 12 },
  { label: 'Biennial (24 months)', value: 24 }
];

// Helper text
const periodHelp = 'Select the time period for revenue analysis';

// Check if period has changed from initial value
const periodChanged = computed(() => {
  return reportPeriod.value !== initialPeriod.value;
});

// Update report view
function updateReportView() {
  isUpdating.value = true;
  
  // Force component refresh by changing key
  setTimeout(() => {
    reportKey.value++;
    initialPeriod.value = reportPeriod.value;
    isUpdating.value = false;
  }, 100);
}

// Initialize component
onMounted(() => {
  // Parse URL query params for report period
  const route = useRoute();
  const queryPeriod = route.query.period;
  
  if (queryPeriod && !isNaN(Number(queryPeriod))) {
    const periodValue = Number(queryPeriod);
    // Only set valid period values
    if ([3, 6, 12, 24].includes(periodValue)) {
      reportPeriod.value = periodValue;
      initialPeriod.value = periodValue;
    }
  }
});
</script>

<style>
/* Page-specific styles can be added here */
</style>
