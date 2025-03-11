<!-- components/reports/templates/ContractExpiryReport.vue -->

<template>
  <ReportBuilder
    title="Contract Expiry Timeline"
    :description="reportDescription"
    :metadata="reportMetadata"
  >
    <!-- Overview Section -->
    <ReportSection title="Expiration Overview" boxed>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded shadow-sm">
          <div class="text-sm text-gray-500">Total Contracts</div>
          <div class="text-2xl font-bold">{{ contractsTotal }}</div>
        </div>
        <div class="bg-white p-4 rounded shadow-sm">
          <div class="text-sm text-gray-500">Expiring This Month</div>
          <div class="text-2xl font-bold text-red-600">
            {{ expiringThisMonth }}
          </div>
        </div>
        <div class="bg-white p-4 rounded shadow-sm">
          <div class="text-sm text-gray-500">Expiring Next 90 Days</div>
          <div class="text-2xl font-bold text-amber-600">
            {{ expiringNext90Days }}
          </div>
        </div>
        <div class="bg-white p-4 rounded shadow-sm">
          <div class="text-sm text-gray-500">Average Renewal Time</div>
          <div class="text-2xl font-bold">{{ averageRenewalDays }} days</div>
        </div>
      </div>
    </ReportSection>

    <!-- Monthly Expirations Chart -->
    <ReportSection
      :title="
        isDrilledDown
          ? `Expiration Details: ${selectedMonth}`
          : 'Expiration Timeline'
      "
      :subtitle="
        isDrilledDown
          ? `Showing contracts expiring in ${selectedMonth}`
          : 'Monthly contract expirations'
      "
    >
      <div v-if="loading" class="flex justify-center py-8">
        <UIcon
          name="i-heroicons-arrow-path"
          class="animate-spin h-8 w-8 text-gray-400"
        />
      </div>
      <div
        v-else-if="chartData.length === 0"
        class="text-center py-8 text-gray-500"
      >
        <p>No contract expiration data available for the selected period</p>
      </div>
      <template v-else>
        <div v-if="isDrilledDown" class="mb-4">
          <UButton
            size="sm"
            @click="resetDrillDown"
            icon="i-heroicons-arrow-uturn-left"
          >
            Back to Overview
          </UButton>
        </div>
        <BarChart
          :data="chartData"
          xAxisLabel="Month"
          yAxisLabel="Contracts Expiring"
          color="#EF4444"
          @bar-click="handleBarClick"
        />
      </template>
    </ReportSection>

    <!-- Location Map for Expiring Contracts -->
    <ReportSection
      title="Geographic Distribution"
      subtitle="Map of expiring contracts"
    >
      <div v-if="loading" class="flex justify-center py-8">
        <UIcon
          name="i-heroicons-arrow-path"
          class="animate-spin h-8 w-8 text-gray-400"
        />
      </div>
      <div
        v-else-if="mapLocations.length === 0"
        class="text-center py-8 text-gray-500"
      >
        <p>No location data available for expiring contracts</p>
      </div>
      <MapVisualization
        :locations="isDrilledDown ? filteredMapLocations : mapLocations"
        :height="400"
        :zoom="5"
        :clusterMarkers="true"
      />
    </ReportSection>

    <!-- Payment Impact Section -->
    <ReportSection
      title="Revenue Impact"
      subtitle="Monthly revenue at risk due to expirations"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <LineChart
            :data="revenueImpactData"
            xAxisLabel="Month"
            yAxisLabel="Revenue at Risk"
            color="#F59E0B"
          />
        </div>
        <div>
          <div class="bg-white p-4 rounded shadow-sm mb-4">
            <div class="text-sm text-gray-500">Total Revenue at Risk</div>
            <div class="text-2xl font-bold">
              {{ formatCurrency(totalRevenueAtRisk) }}
            </div>
            <div class="text-sm text-gray-500 mt-2">
              Over the next 12 months
            </div>
          </div>
          <div class="bg-white p-4 rounded shadow-sm">
            <div class="text-sm text-gray-500">Top Impact Month</div>
            <div class="text-2xl font-bold">{{ topImpactMonth }}</div>
            <div class="text-sm text-gray-500 mt-2">
              {{ formatCurrency(topImpactAmount) }} at risk
            </div>
          </div>
        </div>
      </div>
    </ReportSection>

    <!-- Expiring Contracts Table -->
    <ReportSection
      title="Expiring Contracts"
      subtitle="Details of contracts expiring in the selected period"
    >
      <DataTable
        :data="isDrilledDown ? filteredContractsTable : expiringContractsTable"
        :columns="contractColumns"
        :searchable="true"
        :pagination="true"
      />
    </ReportSection>
  </ReportBuilder>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
// Direct imports to avoid module resolution issues
import ReportBuilder from "../ReportBuilder.vue";
import ReportSection from "../ReportSection.vue";
import LineChart from "../../visualizations/LineChart.vue";
import BarChart from "../../visualizations/BarChart.vue";
import DataTable from "../../visualizations/DataTable.vue";
import MapVisualization from "../../visualizations/MapVisualization.vue";
import { useDataAggregation } from "../../../composables/useDataAggregation";
import { useSupabaseClient } from "#imports";

interface ContractExpiryReportProps {
  period?: number; // Number of months to look ahead
  companyId?: string;
  currency?: string;
}

const props = withDefaults(defineProps<ContractExpiryReportProps>(), {
  period: 12, // Default to 12 months
  companyId: undefined,
  currency: "USD",
});

// For drill-down functionality
const selectedMonth = ref<string | null>(null);
const filteredData = ref<any[]>([]);
const isDrilledDown = computed(() => selectedMonth.value !== null);

// Separate state for filtered data
const filteredMapLocations = ref<any[]>([]);
const filteredContractsTable = ref<any[]>([]);

// State
const loading = ref(true);
const error = ref<string | null>(null);
const contractsData = ref<any[]>([]);

// Composables
const supabase = useSupabaseClient();
const { timeAggregation } = useDataAggregation();

// Report metadata
const reportDescription = computed(() => {
  return `Contract expiration analysis for the next ${props.period} months`;
});

const reportMetadata = computed(() => {
  return {
    period: `Next ${props.period} months`,
    expiringContracts: expiringContracts.value.length,
    totalRevenue: formatCurrency(totalRevenueAtRisk.value),
    criticalExpirations: expiringThisMonth.value,
  };
});

// Computed properties
const today = new Date();
today.setHours(0, 0, 0, 0);

const expiringContracts = computed(() => {
  // Filter contracts expiring within the period
  const periodEndDate = new Date(today);
  periodEndDate.setMonth(periodEndDate.getMonth() + props.period);

  return contractsData.value.filter((contract) => {
    const contractEndDate = new Date(contract.end_date);
    return contractEndDate >= today && contractEndDate <= periodEndDate;
  });
});

const expiringThisMonth = computed(() => {
  // Contracts expiring this month
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return contractsData.value.filter((contract) => {
    const endDate = new Date(contract.end_date);
    return endDate >= today && endDate <= endOfMonth;
  }).length;
});

const expiringNext90Days = computed(() => {
  // Contracts expiring in the next 90 days
  const ninetyDaysLater = new Date(today);
  ninetyDaysLater.setDate(ninetyDaysLater.getDate() + 90);

  return contractsData.value.filter((contract) => {
    const endDate = new Date(contract.end_date);
    return endDate >= today && endDate <= ninetyDaysLater;
  }).length;
});

const contractsTotal = computed(() => {
  return contractsData.value.length;
});

const averageRenewalDays = computed(() => {
  // Calculate average contract length - use all contracts as a proxy
  if (contractsData.value.length === 0) return 0;

  const totalDays = contractsData.value.reduce((sum, contract) => {
    const startDate = new Date(contract.start_date);
    const endDate = new Date(contract.end_date);
    const days = Math.round(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return sum + days;
  }, 0);

  return Math.round(totalDays / contractsData.value.length);
});

// Chart data
const chartData = computed(() => {
  if (loading.value || expiringContracts.value.length === 0) return [];

  // Group contracts by month of expiration
  const expiryData = expiringContracts.value.map((contract) => ({
    ...contract,
    month: formatMonthYear(contract.end_date),
  }));

  // Count expirations by month
  const monthCounts: Record<string, number> = {};
  expiryData.forEach((contract) => {
    const month = contract.month;
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  });

  // Convert to chart data format and sort by date
  return Object.entries(monthCounts)
    .map(([month, count]) => ({
      x: month,
      y: count,
      _month: parseMonthYear(month),
    }))
    .sort((a, b) => a._month.getTime() - b._month.getTime())
    .map((item) => ({
      x: item.x,
      y: item.y,
    }));
});

// Map locations
const mapLocations = computed(() => {
  if (loading.value || expiringContracts.value.length === 0) return [];

  // Create map locations from expiring contracts
  return expiringContracts.value
    .filter(
      (contract) =>
        contract.towers &&
        isValidCoordinate(contract.towers.latitude, contract.towers.longitude)
    )
    .map((contract) => ({
      latitude: contract.towers.latitude,
      longitude: contract.towers.longitude,
      label: contract.towers.name || contract.towers.tower_id,
      popup: `
        <strong>${contract.towers.name || contract.towers.tower_id}</strong><br>
        Expires: ${formatDateString(contract.end_date)}<br>
        Monthly Rate: ${formatCurrency(contract.monthly_rate)}<br>
        Landlord: ${contract.landlords?.name || "Unknown"}
      `,
    }));
});

// Revenue impact data
const revenueImpactData = computed(() => {
  if (loading.value || expiringContracts.value.length === 0) return [];

  // Group by month and sum the monthly rates
  const monthlyImpact: Record<string, number> = {};

  expiringContracts.value.forEach((contract) => {
    const month = formatMonthYear(contract.end_date);
    monthlyImpact[month] = (monthlyImpact[month] || 0) + contract.monthly_rate;
  });

  // Convert to chart data format and sort by date
  return Object.entries(monthlyImpact)
    .map(([month, amount]) => ({
      x: month,
      y: amount,
      _month: parseMonthYear(month),
    }))
    .sort((a, b) => a._month.getTime() - b._month.getTime())
    .map((item) => ({
      x: item.x,
      y: item.y,
    }));
});

const totalRevenueAtRisk = computed(() => {
  // Sum of all monthly rates of expiring contracts
  return expiringContracts.value.reduce(
    (sum, contract) => sum + contract.monthly_rate,
    0
  );
});

const topImpactMonth = computed(() => {
  if (revenueImpactData.value.length === 0) return "N/A";

  // Find month with highest revenue impact
  const topImpact = revenueImpactData.value.reduce(
    (max, current) => (current.y > max.y ? current : max),
    { x: "", y: 0 }
  );

  return topImpact.x;
});

const topImpactAmount = computed(() => {
  if (revenueImpactData.value.length === 0) return 0;

  // Find month with highest revenue impact
  const topImpact = revenueImpactData.value.reduce(
    (max, current) => (current.y > max.y ? current : max),
    { x: "", y: 0 }
  );

  return topImpact.y;
});

// Expiring contracts table
const expiringContractsTable = computed(() => {
  return expiringContracts.value.map((contract) => ({
    id: contract.contract_id,
    tower: contract.towers?.name || contract.towers?.tower_id || "Unknown",
    endDate: contract.end_date,
    daysRemaining: calculateDaysRemaining(contract.end_date),
    landlord: contract.landlords?.name || "Unknown",
    monthlyRate: contract.monthly_rate,
    status: getExpiryStatus(contract.end_date),
  }));
});

// Define TableColumn type to match expected structure
interface TableColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
  sortable?: boolean;
  align?: "left" | "right" | "center";
}

// Contract table columns
const contractColumns: TableColumn[] = [
  { key: "id", label: "Contract ID" },
  { key: "tower", label: "Tower" },
  {
    key: "endDate",
    label: "Expiry Date",
    format: (value: string) => formatDateString(value),
    sortable: true,
  },
  {
    key: "daysRemaining",
    label: "Days Remaining",
    sortable: true,
    align: "right",
  },
  { key: "landlord", label: "Landlord" },
  {
    key: "monthlyRate",
    label: "Monthly Rate",
    format: (value: number) => formatCurrency(value),
    align: "right",
    sortable: true,
  },
  {
    key: "status",
    label: "Status",
    format: (value: string) => {
      const colorMap: Record<string, string> = {
        Critical: "text-red-600 font-medium",
        Warning: "text-amber-600 font-medium",
        Upcoming: "text-blue-600",
      };
      return `<span class="${colorMap[value] || ""}">${value}</span>`;
    },
  },
];

// Fetch contracts data
const fetchContractsData = async () => {
  loading.value = true;
  error.value = null;

  try {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user?.id) throw new Error("User not authenticated");

    // Define profile data interface
    interface ProfileData {
      company_id: string;
      [key: string]: any;
    }

    // Get company ID from profile if not provided
    let companyId = props.companyId;
    if (!companyId) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", userData.user.id)
        .single();

      if (profileError) throw profileError;
      companyId = (profileData as ProfileData)?.company_id;

      if (!companyId) throw new Error("Company ID not found in user profile");
    }

    // Define the date range for fetching contracts
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + props.period);

    // Build query
    const { data, error: queryError } = await supabase
      .from("contracts")
      .select(
        `
        id,
        contract_id,
        tower_id,
        landlord_id,
        start_date,
        end_date,
        monthly_rate,
        currency,
        status,
        towers(tower_id, name, latitude, longitude),
        landlords(name)
      `
      )
      .eq("company_id", companyId as string)
      .gte("end_date", today.toISOString().split("T")[0])
      .lte("end_date", endDate.toISOString().split("T")[0]);

    if (queryError) throw queryError;

    contractsData.value = data || [];
  } catch (err: any) {
    console.error("Error fetching contracts data:", err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// Helper functions
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: props.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDateString = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatMonthYear = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
};

const parseMonthYear = (monthYearString: string): Date => {
  // Parse "MMM YYYY" format (e.g., "Jan 2024")
  const parts = monthYearString.split(" ");
  const months = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const month = months[parts[0] as keyof typeof months] || 0;
  const year = parseInt(parts[1]);

  return new Date(year, month, 1);
};

const calculateDaysRemaining = (dateString: string): number => {
  const endDate = new Date(dateString);
  const timeDiff = endDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

const getExpiryStatus = (dateString: string): string => {
  const daysRemaining = calculateDaysRemaining(dateString);

  if (daysRemaining <= 30) return "Critical";
  if (daysRemaining <= 90) return "Warning";
  return "Upcoming";
};

// Validate coordinates
const isValidCoordinate = (lat: any, lng: any): boolean => {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

function handleBarClick(data: { label: string; value: number }) {
  // Store the selected month
  selectedMonth.value = data.label;

  // Filter the contracts for the selected month
  const filteredContracts = expiringContracts.value.filter((contract) => {
    const contractMonth = formatMonthYear(contract.end_date);
    return contractMonth === selectedMonth.value;
  });

  // Store filtered map locations
  filteredMapLocations.value = filteredContracts
    .filter(
      (contract) =>
        contract.towers &&
        isValidCoordinate(contract.towers.latitude, contract.towers.longitude)
    )
    .map((contract) => ({
      latitude: contract.towers.latitude,
      longitude: contract.towers.longitude,
      label: contract.towers.name || contract.towers.tower_id,
      popup: `
        <strong>${contract.towers.name || contract.towers.tower_id}</strong><br>
        Expires: ${formatDateString(contract.end_date)}<br>
        Monthly Rate: ${formatCurrency(contract.monthly_rate)}<br>
        Landlord: ${contract.landlords?.name || "Unknown"}
      `,
    }));

  // Store filtered contracts table data
  filteredContractsTable.value = filteredContracts.map((contract) => ({
    id: contract.contract_id,
    tower: contract.towers?.name || contract.towers?.tower_id || "Unknown",
    endDate: contract.end_date,
    daysRemaining: calculateDaysRemaining(contract.end_date),
    landlord: contract.landlords?.name || "Unknown",
    monthlyRate: contract.monthly_rate,
    status: getExpiryStatus(contract.end_date),
  }));
}

// Add a method to reset the drill-down
function resetDrillDown() {
  selectedMonth.value = null;
  filteredMapLocations.value = [];
  filteredContractsTable.value = [];
}

// Load data on mount
onMounted(() => {
  fetchContractsData();
});
</script>
