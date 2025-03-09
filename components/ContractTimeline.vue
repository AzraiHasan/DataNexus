<template>
  <UCard class="h-full">
    <template #header>
      <div class="font-semibold text-lg">Contract Expirations</div>
    </template>

    <div v-if="loading" class="py-4 flex justify-center">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-6 w-6 text-gray-400" />
    </div>

    <div v-else-if="error" class="text-red-500 text-sm">
      {{ error }}
    </div>

    <div v-else-if="!upcomingContracts.length" class="py-4 text-center text-gray-500">
      <UIcon name="i-heroicons-document-text" class="h-12 w-12 mx-auto mb-2 text-gray-400" />
      <p>No upcoming expirations</p>
      <p class="text-sm mt-1">Upload contract data to see expirations</p>
    </div>

    <div v-else class="space-y-4">
      <!-- Summary metrics -->
      <div class="grid grid-cols-3 gap-2">
        <div class="bg-red-50 rounded-lg p-2 text-center">
          <div class="text-lg font-semibold text-red-700">{{ expiringThisMonth }}</div>
          <div class="text-xs text-red-600">This Month</div>
        </div>
        <div class="bg-amber-50 rounded-lg p-2 text-center">
          <div class="text-lg font-semibold text-amber-700">{{ expiringNext90Days }}</div>
          <div class="text-xs text-amber-600">Next 90 Days</div>
        </div>
        <div class="bg-blue-50 rounded-lg p-2 text-center">
          <div class="text-lg font-semibold text-blue-700">{{ totalContracts }}</div>
          <div class="text-xs text-blue-600">Total Contracts</div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="mt-4">
        <h3 class="text-sm font-medium mb-2">Upcoming Expirations</h3>
        <div class="space-y-2">
          <div v-for="contract in upcomingContracts.slice(0, 5)" :key="contract.id" class="border-l-4 pl-3 py-1"
            :class="getExpiryColorClass(contract.days_remaining)">
            <div class="flex justify-between">
              <div class="text-sm font-medium">{{ contract.contract_id }}</div>
              <div class="text-xs text-gray-500">{{ formatDate(contract.end_date) }}</div>
            </div>
            <div class="text-xs text-gray-600">
              {{ contract.days_remaining }} days remaining
            </div>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Contract {
  id: string;
  company_id: string;
  contract_id: string;
  tower_id: string;
  landlord_id: string;
  start_date: string;
  end_date: string;
  monthly_rate: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  days_remaining: number;
}

interface ProfileData {
  company_id: string;
}

const supabase = useSupabaseClient();
const loading = ref(true);
const error = ref<string | null>(null);
const contracts = ref<Contract[]>([]);
const upcomingContracts = ref<Contract[]>([]);

// Computed properties
const expiringThisMonth = computed(() => {
  return upcomingContracts.value.filter(c => c.days_remaining <= 30).length;
});

const expiringNext90Days = computed(() => {
  return upcomingContracts.value.filter(c => c.days_remaining <= 90).length;
});

const totalContracts = computed(() => {
  return contracts.value.length;
});

// Fetch data function
async function fetchContractData() {
  loading.value = true;
  error.value = null;
  
  try {
    // Get user's company ID from profile
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userData.user?.id)
      .single();
      
    if (profileError) throw profileError;
    
    const profileData = data as ProfileData;
    const companyId = profileData.company_id;
    
    // Fetch contract data for this company
    const { data: contractResults, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('company_id', companyId);
      
    if (contractError) throw contractError;
    
    contracts.value = contractResults || [];
    
    // Calculate days remaining for each contract
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    upcomingContracts.value = contracts.value
      .map(contract => {
        const endDate = new Date(contract.end_date);
        endDate.setHours(0, 0, 0, 0);
        
        const diff = endDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
        
        return {
          ...contract,
          days_remaining: daysRemaining
        };
      })
      .filter(contract => contract.days_remaining > 0 && contract.days_remaining <= 180)
      .sort((a, b) => a.days_remaining - b.days_remaining);
    
  } catch (err: any) {
    console.error('Error fetching contract data:', err);
    error.value = err.message || 'Failed to load contract data';
  } finally {
    loading.value = false;
  }
}

// Format date (YYYY-MM-DD to readable format)
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Get color class based on days remaining
function getExpiryColorClass(daysRemaining: number): string {
  if (daysRemaining <= 30) return 'border-red-500';
  if (daysRemaining <= 90) return 'border-amber-500';
  return 'border-blue-500';
}

// Make fetchContractData available to parent components
defineExpose({
  fetchContractData
});

onMounted(() => {
  fetchContractData();
});
</script>