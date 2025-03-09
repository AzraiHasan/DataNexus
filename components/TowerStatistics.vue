<template>
  <UCard class="h-full">
    <template #header>
      <div class="font-semibold text-lg">Tower Overview</div>
    </template>

    <div v-if="loading" class="py-4 flex justify-center">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-6 w-6 text-gray-400" />
    </div>

    <div v-else-if="error" class="text-red-500 text-sm">
      {{ error }}
    </div>

    <div v-else-if="!towerData.length" class="py-4 text-center text-gray-500">
      <UIcon name="i-heroicons-cube-transparent" class="h-12 w-12 mx-auto mb-2 text-gray-400" />
      <p>No tower data available</p>
      <p class="text-sm mt-1">Upload tower data to see statistics</p>
    </div>

    <div v-else class="space-y-4">
      <!-- Key metrics -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-blue-50 rounded-lg p-3 text-center">
          <div class="text-xl font-semibold text-blue-700">{{ towerData.length }}</div>
          <div class="text-sm text-blue-600">Total Towers</div>
        </div>
        <div class="bg-green-50 rounded-lg p-3 text-center">
          <div class="text-xl font-semibold text-green-700">{{ activeTowerCount }}</div>
          <div class="text-sm text-green-600">Active Towers</div>
        </div>
      </div>

      <!-- Status breakdown -->
      <div v-if="statusBreakdown.length" class="mt-4">
        <div class="text-sm font-medium mb-2">Tower Status</div>
        <div class="space-y-2">
          <div v-for="status in statusBreakdown" :key="status.status" class="flex items-center">
            <div class="w-24 text-sm text-gray-600">{{ status.status }}</div>
            <div class="flex-1 bg-gray-200 rounded-full h-2">
              <div class="rounded-full h-2"
                :style="{ width: `${status.percentage}%`, backgroundColor: getStatusColor(status.status) }">
              </div>
            </div>
            <div class="w-12 text-right text-sm text-gray-600 ml-2">{{ status.count }}</div>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Tower {
  id: string;
  company_id: string;
  tower_id: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  type?: string;
  height?: number;
  status?: string;
  created_at: string;
  updated_at: string;
}

interface ProfileData {
  company_id: string;
}

interface StatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

const supabase = useSupabaseClient();
const loading = ref(true);
const error = ref<string | null>(null);
const towerData = ref<Tower[]>([]);

// Computed properties for metrics
const activeTowerCount = computed(() => {
  return towerData.value.filter(tower => tower.status === 'active').length;
});

const statusBreakdown = computed(() => {
  if (!towerData.value.length) return [];
  
  // Count towers by status
  const statusCounts: Record<string, number> = {};
  towerData.value.forEach(tower => {
    const status = tower.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  // Convert to array with percentages
  return Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: Math.round((count / towerData.value.length) * 100)
  })).sort((a, b) => b.count - a.count);
});

// Fetch data function
async function fetchTowerData() {
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
    
    // Fetch tower data for this company
    const { data: towerResults, error: towerError } = await supabase
      .from('towers')
      .select('*')
      .eq('company_id', companyId);
      
    if (towerError) throw towerError;
    
    towerData.value = towerResults || [];
  } catch (err: any) {
    console.error('Error fetching tower data:', err);
    error.value = err.message || 'Failed to load tower data';
    towerData.value = [];
  } finally {
    loading.value = false;
  }
}

// Helper function to get color for tower status
function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'active': '#10B981', // green
    'inactive': '#6B7280', // gray
    'maintenance': '#F59E0B', // amber
    'planned': '#3B82F6', // blue
    'unknown': '#9CA3AF' // gray
  };
  
  return colorMap[status] || colorMap['unknown'];
}

// Make fetchTowerData available to parent components
defineExpose({
  fetchTowerData
});

onMounted(() => {
  fetchTowerData();
});
</script>