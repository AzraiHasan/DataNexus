<!-- components/reports/templates/RevenueReport.vue -->
<template>
  <div class="revenue-report">
    <h1 class="text-2xl font-bold mb-4">Revenue Analysis Report</h1>
    
    <!-- Revenue Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded shadow-sm">
        <div class="text-sm text-gray-500">Total Revenue (YTD)</div>
        <div class="text-2xl font-bold">{{ formatCurrency(totalRevenue) }}</div>
      </div>
      <div class="bg-white p-4 rounded shadow-sm">
        <div class="text-sm text-gray-500">Average Monthly Revenue</div>
        <div class="text-2xl font-bold text-blue-600">{{ formatCurrency(avgMonthlyRevenue) }}</div>
      </div>
      <div class="bg-white p-4 rounded shadow-sm">
        <div class="text-sm text-gray-500">Revenue Growth</div>
        <div class="text-2xl font-bold" :class="revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'">
          {{ revenueGrowth >= 0 ? '+' : '' }}{{ revenueGrowth.toFixed(1) }}%
        </div>
      </div>
      <div class="bg-white p-4 rounded shadow-sm">
        <div class="text-sm text-gray-500">Active Contracts</div>
        <div class="text-2xl font-bold text-indigo-600">{{ activeContracts }}</div>
      </div>
    </div>
    
    <!-- Revenue Trend Chart -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Revenue Trends</h2>
      <div v-if="loading" class="py-8 flex justify-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
      </div>
      <div v-else-if="revenueData.length === 0" class="py-8 text-center text-gray-500">
        <p>No revenue data available</p>
      </div>
      <div v-else class="h-80">
        <LineChart :data="revenueChartData" />
      </div>
    </div>

    <!-- Revenue By Tower Type -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Revenue by Tower Type</h2>
      <div v-if="loading" class="py-8 flex justify-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
      </div>
      <div v-else-if="towerTypeRevenue.length === 0" class="py-8 text-center text-gray-500">
        <p>No tower type revenue data available</p>
      </div>
      <div v-else class="h-64">
        <BarChart :data="towerTypeChartData" />
      </div>
    </div>
    
    <!-- Regional Revenue Distribution -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Regional Revenue Distribution</h2>
      <div v-if="loading" class="py-8 flex justify-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
      </div>
      <div v-else-if="regionalRevenue.length === 0" class="py-8 text-center text-gray-500">
        <p>No regional revenue data available</p>
      </div>
      <div v-else class="h-64">
        <PieChart :data="regionalChartData" />
      </div>
    </div>
    
    <!-- Top Revenue Towers -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Top Revenue Generating Towers</h2>
      <DataTable 
        :data="topTowerData" 
        :columns="towerColumns"
        :searchable="true"
        :pagination="true"
      />
    </div>
    
    <!-- Upcoming Contracts -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Upcoming Contract Renewals</h2>
      <DataTable 
        :data="upcomingContractData" 
        :columns="contractColumns"
        :pagination="true"
      />
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
import { ref, computed, onMounted, watch } from 'vue';
import { useSupabaseClient } from '#imports';
import LineChart from '~/components/visualizations/LineChart.vue';
import BarChart from '~/components/visualizations/BarChart.vue';
import PieChart from '~/components/visualizations/PieChart.vue';
import DataTable from '~/components/visualizations/DataTable.vue';
import { useChartData } from '~/composables/useChartData';
import { useDataAggregation } from '~/composables/useDataAggregation';
import _ from 'lodash';

// Define props
interface Props {
  period?: number; // Number of months to include in report
}

// Define component props
const props = withDefaults(defineProps<Props>(), {
  period: 12 // Default to 12 months if not specified
});

// Define types
interface TowerData {
  tower_id: string;
  name?: string;
  type?: string;
  status?: string;
  region?: string;
  monthly_revenue?: number;
  contract_start?: string;
  contract_end?: string;
  client_name?: string;
}

interface RevenueEntry {
  month: string;
  year: number;
  amount: number;
  date: Date;
}

interface TowerRevenueType {
  type: string;
  total_revenue: number;
  tower_count: number;
}

interface RegionalRevenue {
  region: string;
  total_revenue: number;
  tower_count: number;
}

// State
const loading = ref(true);
const error = ref<string | null>(null);
const towerData = ref<TowerData[]>([]);
const revenueData = ref<RevenueEntry[]>([]);
const towerTypeRevenue = ref<TowerRevenueType[]>([]);
const regionalRevenue = ref<RegionalRevenue[]>([]);
const supabase = useSupabaseClient();
const chartData = useChartData();
const dataAggregation = useDataAggregation();

// Computed properties
const totalRevenue = computed(() => {
  return revenueData.value.reduce((sum, entry) => sum + entry.amount, 0);
});

const avgMonthlyRevenue = computed(() => {
  if (revenueData.value.length === 0) return 0;
  
  // Get unique months
  const uniqueMonths = new Set(
    revenueData.value.map(entry => `${entry.year}-${entry.month}`)
  );
  
  return totalRevenue.value / uniqueMonths.size;
});

const revenueGrowth = computed(() => {
  if (revenueData.value.length < 2) return 0;
  
  // Sort by date
  const sortedData = [...revenueData.value].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Group by month-year
  const monthGroups = _.groupBy(sortedData, (entry: RevenueEntry) => `${entry.year}-${entry.month}`);
  
  // Get monthly totals
  const monthlyTotals = Object.entries(monthGroups).map(([monthYear, entries]) => ({
    monthYear,
    total: _.sumBy(entries, (entry: RevenueEntry) => entry.amount)
  }));
  
  // Need at least 2 months to calculate growth
  if (monthlyTotals.length < 2) return 0;
  
  // Get last month and previous month
  const lastMonth = monthlyTotals[monthlyTotals.length - 1];
  const previousMonth = monthlyTotals[monthlyTotals.length - 2];
  
  // Calculate growth percentage
  const growth = ((lastMonth.total - previousMonth.total) / previousMonth.total) * 100;
  
  return growth;
});

const activeContracts = computed(() => {
  // Count towers with active contracts
  const now = new Date();
  return towerData.value.filter(tower => {
    if (!tower.contract_end) return false;
    
    const endDate = new Date(tower.contract_end);
    return endDate > now;
  }).length;
});

// Format data for charts
const revenueChartData = computed(() => {
  if (revenueData.value.length === 0) return [];
  
  // Sort by date
  const sortedData = [...revenueData.value].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Group by month-year
  const monthGroups = _.groupBy(sortedData, (entry: RevenueEntry) => `${entry.year}-${entry.month}`);
  
  // Get monthly totals
  const monthlyData = Object.entries(monthGroups).map(([monthYear, entries]) => {
    // Parse month-year string
    const [year, month] = monthYear.split('-').map(part => parseInt(part));
    
    // Format label as MMM YYYY
    const date = new Date(year, month - 1);
    const label = date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    
    // Transform to x/y format for LineChart
    return {
      x: label,
      y: _.sumBy(entries, (entry: RevenueEntry) => entry.amount)
    };
  });
  
  // Sort chronologically
  return monthlyData.sort((a, b) => a.x.localeCompare(b.x));
});

const towerTypeChartData = computed(() => {
  if (towerTypeRevenue.value.length === 0) return [];
  
  // Map to DataPoint format for BarChart
  const chartData = towerTypeRevenue.value.map(item => ({
    x: item.type || 'Unknown',
    y: item.total_revenue
  }));
  
  // Sort by revenue (descending)
  return chartData.sort((a, b) => b.y - a.y);
});

const regionalChartData = computed(() => {
  if (regionalRevenue.value.length === 0) return [];
  
  // Map to DataItem format for PieChart
  const chartData = regionalRevenue.value.map(item => ({
    label: item.region || 'Unknown',
    value: item.total_revenue,
    color: getRandomColor(item.region)
  }));
  
  // Sort by revenue (descending)
  return chartData.sort((a, b) => b.value - a.value);
});

// Top revenue towers
const topTowerData = computed(() => {
  const towersWithRevenue = towerData.value
    .filter(tower => tower.monthly_revenue !== undefined && tower.monthly_revenue > 0)
    .map(tower => ({
      id: tower.tower_id,
      name: tower.name || 'Unknown',
      type: tower.type || 'Unknown',
      region: tower.region || 'Unknown',
      monthly_revenue: formatCurrency(tower.monthly_revenue || 0),
      annual_revenue: formatCurrency((tower.monthly_revenue || 0) * 12),
      client: tower.client_name || 'Unknown'
    }))
    .sort((a, b) => {
      // Extract numeric values from formatted currency strings
      const revenueA = parseFloat(a.monthly_revenue.replace(/[^0-9.-]+/g, ''));
      const revenueB = parseFloat(b.monthly_revenue.replace(/[^0-9.-]+/g, ''));
      return revenueB - revenueA;
    })
    .slice(0, 10); // Top 10 towers
    
  return towersWithRevenue;
});

// Column definitions for top towers table
const towerColumns = [
  { key: 'id', label: 'Tower ID' },
  { key: 'name', label: 'Tower Name' },
  { key: 'type', label: 'Type' },
  { key: 'region', label: 'Region' },
  { key: 'monthly_revenue', label: 'Monthly Revenue' },
  { key: 'annual_revenue', label: 'Annual Revenue' },
  { key: 'client', label: 'Client' }
];

// Upcoming contract renewals
const upcomingContractData = computed(() => {
  const now = new Date();
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(now.getMonth() + 3);
  
  return towerData.value
    .filter(tower => {
      if (!tower.contract_end) return false;
      
      const endDate = new Date(tower.contract_end);
      return endDate > now && endDate <= threeMonthsFromNow;
    })
    .map(tower => ({
      id: tower.tower_id,
      name: tower.name || 'Unknown',
      client: tower.client_name || 'Unknown',
      end_date: formatDateString(tower.contract_end || ''),
      monthly_value: formatCurrency(tower.monthly_revenue || 0),
      days_remaining: getDaysRemaining(tower.contract_end || '')
    }))
    .sort((a, b) => a.days_remaining - b.days_remaining);
});

// Column definitions for contract table
const contractColumns = [
  { key: 'id', label: 'Tower ID' },
  { key: 'name', label: 'Tower Name' },
  { key: 'client', label: 'Client' },
  { key: 'end_date', label: 'Expiry Date' },
  { key: 'monthly_value', label: 'Monthly Value' },
  { key: 'days_remaining', label: 'Days Remaining' }
];

// Helper functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDateString(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getDaysRemaining(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = new Date(dateString);
  endDate.setHours(0, 0, 0, 0);
  
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

function getRandomColor(seed: string): string {
  // Generate a consistent color based on the string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // List of predefined good-looking colors
  const colors = [
    '#4F46E5', // Indigo
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#3B82F6', // Blue
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#6366F1'  // Indigo
  ];
  
  // Pick a color from the array
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Mock data generation functions
function generateMockTowerData(count: number): TowerData[] {
  const regions = ['North', 'South', 'East', 'West', 'Central'];
  const types = ['Monopole', 'Guyed Tower', 'Lattice Tower', 'Stealth Tower', 'Rooftop'];
  const statuses = ['active', 'inactive', 'maintenance', 'planned'];
  const clients = ['AT&T', 'Verizon', 'T-Mobile', 'Sprint', 'Vodafone', 'Airtel', 'Orange'];
  
  return Array.from({ length: count }, (_, i) => {
    // Random data
    const monthly_revenue = Math.floor(Math.random() * 8000) + 2000; // $2,000 - $10,000
    
    // Contract dates - between 1-36 months
    const today = new Date();
    const contractStart = new Date(today);
    contractStart.setMonth(today.getMonth() - Math.floor(Math.random() * 24)); // 0-24 months ago
    
    const contractEnd = new Date(contractStart);
    contractEnd.setMonth(contractStart.getMonth() + Math.floor(Math.random() * 36) + 1); // 1-36 months duration
    
    return {
      tower_id: `T${1000 + i}`,
      name: `Tower ${1000 + i}`,
      type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      region: regions[Math.floor(Math.random() * regions.length)],
      monthly_revenue,
      contract_start: contractStart.toISOString().split('T')[0],
      contract_end: contractEnd.toISOString().split('T')[0],
      client_name: clients[Math.floor(Math.random() * clients.length)]
    };
  });
}

function generateMockRevenueData(towerData: TowerData[]): RevenueEntry[] {
  const result: RevenueEntry[] = [];
  const now = new Date();
  const currYear = now.getFullYear();
  const currMonth = now.getMonth() + 1; // JavaScript months are 0-based
  
  // Go back for the specified period (months)
  const periodMonths = props.period || 12;
  for (let i = 0; i < periodMonths; i++) {
    let month = currMonth - i;
    let year = currYear;
    
    if (month <= 0) {
      month += 12;
      year -= 1;
    }
    
    // Generate random daily entries for this month
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // For each tower, generate a payment entry
    towerData.forEach(tower => {
      if (tower.status === 'active' || tower.status === 'maintenance') {
        const monthlyRevenue = tower.monthly_revenue || 0;
        
        // Payment date - random day in the month
        const paymentDay = Math.floor(Math.random() * daysInMonth) + 1;
        const paymentDate = new Date(year, month - 1, paymentDay);
        
        // Only include if the tower's contract was active for this month
        const contractStart = tower.contract_start ? new Date(tower.contract_start) : null;
        const contractEnd = tower.contract_end ? new Date(tower.contract_end) : null;
        
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0);
        
        // Check if the contract was active during this month
        if (
          (!contractStart || contractStart <= monthEnd) && 
          (!contractEnd || contractEnd >= monthStart)
        ) {
          result.push({
            month: month.toString().padStart(2, '0'),
            year,
            amount: monthlyRevenue,
            date: paymentDate
          });
        }
      }
    });
  }
  
  return result;
}

function generateTowerTypeRevenue(towerData: TowerData[]): TowerRevenueType[] {
  // Group towers by type
  const typeGroups: Record<string, TowerData[]> = {};
  
  towerData.forEach(tower => {
    const type = tower.type || 'Unknown';
    if (!typeGroups[type]) {
      typeGroups[type] = [];
    }
    typeGroups[type].push(tower);
  });
  
  // Calculate revenue for each type
  return Object.entries(typeGroups).map(([type, towers]) => {
    const total_revenue = towers.reduce((sum, tower) => sum + (tower.monthly_revenue || 0) * 12, 0);
    
    return {
      type,
      total_revenue,
      tower_count: towers.length
    };
  });
}

function generateRegionalRevenue(towerData: TowerData[]): RegionalRevenue[] {
  // Group towers by region
  const regionGroups: Record<string, TowerData[]> = {};
  
  towerData.forEach(tower => {
    const region = tower.region || 'Unknown';
    if (!regionGroups[region]) {
      regionGroups[region] = [];
    }
    regionGroups[region].push(tower);
  });
  
  // Calculate revenue for each region
  return Object.entries(regionGroups).map(([region, towers]) => {
    const total_revenue = towers.reduce((sum, tower) => sum + (tower.monthly_revenue || 0) * 12, 0);
    
    return {
      region,
      total_revenue,
      tower_count: towers.length
    };
  });
}

// Simulate an API call to get tower data
async function fetchTowerData() {
  loading.value = true;
  
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user?.id) throw new Error('User not authenticated');
    
    // Attempt to get company_id from profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userData.user.id)
      .single();
      
    if (profileError) throw profileError;
    
    const companyId = (profileData as {company_id: string}).company_id;
    
    // Try to fetch real tower data
    const { data: realTowers, error: towerError } = await supabase
      .from('towers')
      .select('*')
      .eq('company_id', companyId);
      
    if (towerError) throw towerError;
    
    // If we have real tower data, use it
    if (realTowers && realTowers.length > 0) {
      towerData.value = realTowers;
    } else {
      // Otherwise, generate mock data for demo purposes
      console.log('Using mock data for demonstration');
      towerData.value = generateMockTowerData(30);
    }
    
    // Generate revenue data based on towers
    revenueData.value = generateMockRevenueData(towerData.value);
    towerTypeRevenue.value = generateTowerTypeRevenue(towerData.value);
    regionalRevenue.value = generateRegionalRevenue(towerData.value);
  } catch (err: any) {
    console.error('Error fetching tower data:', err);
    error.value = err.message;
    
    // Fall back to mock data for demo purposes
    towerData.value = generateMockTowerData(30);
    revenueData.value = generateMockRevenueData(towerData.value);
    towerTypeRevenue.value = generateTowerTypeRevenue(towerData.value);
    regionalRevenue.value = generateRegionalRevenue(towerData.value);
  } finally {
    loading.value = false;
  }
}

// Watch for changes in period prop
watch(() => props.period, (newPeriod, oldPeriod) => {
  if (newPeriod !== oldPeriod) {
    console.log(`Period changed from ${oldPeriod} to ${newPeriod} months`);
    fetchTowerData();
  }
});

// Load data on mount
onMounted(() => {
  fetchTowerData();
});
</script>
