<!-- components/reports/templates/TowerStatusReport.vue -->
<template>
  <div class="tower-status-report">
    <h1 class="text-2xl font-bold mb-4">Tower Status Report</h1>
    
    <!-- Status Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded shadow-sm">
        <div class="text-sm text-gray-500">Total Towers</div>
        <div class="text-2xl font-bold">{{ towerData.length }}</div>
      </div>
      <div class="bg-white p-4 rounded shadow-sm">
        <div class="text-sm text-gray-500">Active Towers</div>
        <div class="text-2xl font-bold text-green-600">{{ activeTowers }}</div>
      </div>
      <div class="bg-white p-4 rounded shadow-sm">
        <div class="text-sm text-gray-500">Maintenance</div>
        <div class="text-2xl font-bold text-amber-600">{{ maintenanceTowers }}</div>
      </div>
      <div class="bg-white p-4 rounded shadow-sm">
        <div class="text-sm text-gray-500">Inactive/Planned</div>
        <div class="text-2xl font-bold text-gray-600">{{ inactiveTowers }}</div>
      </div>
    </div>
    
    <!-- Status Distribution -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-4">Status Distribution</h2>
      <div v-if="loading" class="py-8 flex justify-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
      </div>
      <div v-else-if="towerData.length === 0" class="py-8 text-center text-gray-500">
        <p>No tower data available</p>
      </div>
      <div v-else class="h-64">
        <PieChart :data="statusChartData" :donut="true" />
      </div>
    </div>

    <!-- Geographic Map -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-4">Geographic Distribution</h2>
      <div v-if="loading" class="py-8 flex justify-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
      </div>
      <div v-else-if="mapLocations.length === 0" class="py-8 text-center text-gray-500">
        <p>No location data available for towers</p>
      </div>
      <div v-else>
        <MapVisualization 
          :locations="mapLocations" 
          :height="400" 
          :zoom="5" 
          :clusterMarkers="true" 
        />
      </div>
    </div>
    
    <!-- Tower List -->
    <div>
      <h2 class="text-xl font-semibold mb-4">Tower List</h2>
      <DataTable 
        :data="towerTableData" 
        :columns="towerColumns"
        :searchable="true"
        :pagination="true"
      />
    </div>

    <!-- Maintenance Timeline -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-4">Maintenance Schedule</h2>
      <div v-if="loading" class="py-8 flex justify-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
      </div>
      <div v-else-if="maintenanceData.length === 0" class="py-8 text-center text-gray-500">
        <p>No maintenance data available</p>
      </div>
      <div v-else>
        <DataTable 
          :data="maintenanceData" 
          :columns="maintenanceColumns"
          :pagination="true"
        />
      </div>
    </div>
    
    <!-- Export Options -->
    <div class="flex justify-end space-x-2 mt-6">
      <UButton 
        color="gray" 
        variant="outline" 
        icon="i-heroicons-document"
      >
        Export PDF
      </UButton>
      <UButton 
        color="gray" 
        variant="outline" 
        icon="i-heroicons-table-cells"
      >
        Export Excel
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSupabaseClient } from '#imports';
import PieChart from '~/components/visualizations/PieChart.vue';
import DataTable from '~/components/visualizations/DataTable.vue';
import MapVisualization from '~/components/visualizations/MapVisualization.vue';

// State
const loading = ref(true);
const error = ref<string | null>(null);
const towerData = ref<any[]>([]);
const supabase = useSupabaseClient();

// Computed properties
const activeTowers = computed(() => 
  towerData.value.filter(tower => tower.status === 'active').length
);

const maintenanceTowers = computed(() => 
  towerData.value.filter(tower => tower.status === 'maintenance').length
);

const inactiveTowers = computed(() => 
  towerData.value.filter(tower => 
    tower.status === 'inactive' || tower.status === 'planned'
  ).length
);

// Map locations
const mapLocations = computed(() => {
  return towerData.value
    .filter(tower => isValidCoordinate(tower.latitude, tower.longitude))
    .map(tower => ({
      latitude: tower.latitude,
      longitude: tower.longitude,
      label: tower.name || tower.tower_id,
      popup: `
        <strong>${tower.name || tower.tower_id}</strong><br>
        Status: ${capitalizeFirstLetter(tower.status || 'Unknown')}<br>
        Type: ${tower.type || 'Unknown'}<br>
        Height: ${tower.height ? tower.height + 'm' : 'Unknown'}
      `,
      color: getStatusColor(tower.status)
    }));
});

// Data for status pie chart
const statusChartData = computed(() => {
  if (towerData.value.length === 0) return [];
  
  // Count towers by status
  const statusCounts: Record<string, number> = {};
  towerData.value.forEach(tower => {
    const status = tower.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  // Convert to format needed for PieChart
  return Object.entries(statusCounts).map(([status, count]) => ({
    label: capitalizeFirstLetter(status),
    value: count,
    color: getStatusColor(status)
  }));
});

// Data for tower table
const towerTableData = computed(() => {
  return towerData.value.map(tower => ({
    id: tower.tower_id,
    name: tower.name || 'Unknown',
    status: capitalizeFirstLetter(tower.status || 'Unknown'),
    type: tower.type || 'Unknown',
    height: tower.height ? `${tower.height}m` : 'Unknown',
    location: isValidCoordinate(tower.latitude, tower.longitude) 
      ? `${tower.latitude.toFixed(4)}, ${tower.longitude.toFixed(4)}`
      : 'Unknown'
  }));
});

// Column definitions for tower table
const towerColumns = [
  { key: 'id', label: 'Tower ID' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'height', label: 'Height' },
  { key: 'location', label: 'Location' }
];

// Helper functions
function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'active': '#10B981', // Green
    'inactive': '#6B7280', // Gray
    'maintenance': '#F59E0B', // Amber
    'planned': '#3B82F6', // Blue
    'unknown': '#9CA3AF' // Gray
  };
  
  return colorMap[status.toLowerCase()] || colorMap['unknown'];
}

function isValidCoordinate(lat: any, lng: any): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

// Basic fetch function
async function fetchTowerData() {
  loading.value = true;
  
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user?.id) throw new Error('User not authenticated');
    
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userData.user.id)
      .single();
      
    if (profileError) throw profileError;
    
    const companyId = (data as {company_id: string}).company_id;
    
    // Fetch tower data
    const { data: towers, error: towerError } = await supabase
      .from('towers')
      .select('*')
      .eq('company_id', companyId);
      
    if (towerError) throw towerError;
    
    towerData.value = towers || [];
  } catch (err: any) {
    console.error('Error fetching tower data:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

// Generate mock maintenance data (to be replaced with real data when available)
const maintenanceData = computed(() => {
  // Filter towers that are in maintenance
  const maintenanceTowers = towerData.value
    .filter(tower => tower.status === 'maintenance')
    .map((tower, index) => {
      // Generate simulated start/end dates
      const today = new Date();
      const startOffset = Math.floor(Math.random() * 7); // 0-6 days ago
      const durationDays = Math.floor(Math.random() * 14) + 1; // 1-14 days
      
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - startOffset);
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + durationDays);
      
      return {
        tower_id: tower.tower_id,
        name: tower.name || 'Unknown',
        type: tower.type || 'Unknown',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        description: 'Scheduled maintenance'
      };
    })
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  
  return maintenanceTowers;
});

// Column definitions for maintenance table
const maintenanceColumns = [
  { key: 'tower_id', label: 'Tower ID' },
  { key: 'name', label: 'Tower Name' },
  { 
    key: 'start_date', 
    label: 'Start Date',
    format: (value: string) => formatDateString(value)
  },
  { 
    key: 'end_date', 
    label: 'End Date',
    format: (value: string) => formatDateString(value)
  },
  { key: 'description', label: 'Description' }
];

// Add date formatting function
function formatDateString(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Load data on mount
onMounted(() => {
  fetchTowerData();
});
</script>