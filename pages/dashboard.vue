<!-- pages/dashboard.vue -->
<template>
  <section class="container mx-auto p-6">
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-4">Dashboard</h1>
      <p class="text-gray-600">
        Welcome to your Telecom Tower Data Analysis dashboard. View key metrics, generate reports, and manage your data.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Tower Statistics -->
      <TowerStatistics ref="towerStats" />

      <!-- Contract Timeline -->
      <ContractTimeline ref="contractTimeline" />

      <!-- Quick Upload -->
      <UCard>
        <template #header>
          <div class="font-semibold text-lg">Quick Upload</div>
        </template>
        <UploadDashboard @uploaded="handleDataUploaded" @imported="handleDataImported" />
      </UCard>

      <!-- Reports & Analytics -->
      <UCard>
        <template #header>
          <div class="font-semibold text-lg">Reports & Analytics</div>
        </template>
        <div class="space-y-4">
          <p class="text-gray-600">Generate insights from your tower data.</p>
          
          <div class="grid grid-cols-2 gap-3">
            <UButton to="/reports/contract-expiry" class="flex flex-col items-center justify-center p-3 h-24">
              <UIcon name="i-heroicons-calendar" class="h-8 w-8 mb-1" />
              <span>Contract Expiry</span>
            </UButton>
            
            <UButton to="/reports/payment-summary" class="flex flex-col items-center justify-center p-3 h-24">
              <UIcon name="i-heroicons-currency-dollar" class="h-8 w-8 mb-1" />
              <span>Payment Summary</span>
            </UButton>
          </div>
          
          <UButton to="/reports" block color="gray" variant="soft">
            View All Reports
          </UButton>
          
          <UButton to="/query" block color="primary">
            Ask AI Assistant
          </UButton>
        </div>
      </UCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSupabaseClient } from '#imports';

definePageMeta({
  middleware: ['auth']
});

// Define component interfaces based on exposed methods
interface TowerStatsComponent {
  fetchTowerData: () => Promise<void>;
}

interface ContractTimelineComponent {
  fetchContractData: () => Promise<void>;
}

// Component references with proper typing
const towerStats = ref<TowerStatsComponent | null>(null);
const contractTimeline = ref<ContractTimelineComponent | null>(null);

// Handle data upload events
function handleDataUploaded(event: any) {
  // Refresh data after validation if needed
}

function handleDataImported(event: any) {
  // Refresh data components after import
  if (towerStats.value) {
    towerStats.value.fetchTowerData();
  }
  
  if (contractTimeline.value) {
    contractTimeline.value.fetchContractData();
  }
}

// Initialize data on component mount
onMounted(() => {
  // This will ensure initial data load
  if (towerStats.value) {
    towerStats.value.fetchTowerData();
  }
  
  if (contractTimeline.value) {
    contractTimeline.value.fetchContractData();
  }
});
</script>
