<!-- components/reports/templates/MonthlyPaymentReport.vue -->

<template>
  <ReportBuilder 
    title="Monthly Payment Summary" 
    :description="reportDescription" 
    :metadata="reportMetadata"
  >
    <!-- Overview Section -->
    <ReportSection title="Payment Overview" boxed>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white p-4 rounded shadow-sm">
          <div class="text-sm text-gray-500">Total Payments</div>
          <div class="text-2xl font-bold">{{ formatCurrency(totalPayments) }}</div>
        </div>
        <div class="bg-white p-4 rounded shadow-sm">
          <div class="text-sm text-gray-500">Contracts Paid</div>
          <div class="text-2xl font-bold">{{ contractCount }}</div>
        </div>
        <div class="bg-white p-4 rounded shadow-sm">
          <div class="text-sm text-gray-500">Average Payment</div>
          <div class="text-2xl font-bold">{{ formatCurrency(averagePayment) }}</div>
        </div>
      </div>
    </ReportSection>
    
    <!-- Monthly Trend Chart -->
    <ReportSection title="Payment Trend" subtitle="Monthly payment totals">
      <div v-if="loading" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
      </div>
      <div v-else-if="chartData.length === 0" class="text-center py-8 text-gray-500">
        <p>No payment data available for the selected period</p>
      </div>
      <LineChart 
        v-else
        :data="chartData"
        xAxisLabel="Month"
        yAxisLabel="Total Payments"
        color="#10B981"
      />
    </ReportSection>
    
    <!-- Landlord Distribution Chart -->
    <ReportSection title="Payments by Landlord" subtitle="Distribution of payments by landlord">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <PieChart 
            :data="landlordData"
            :donut="true"
          />
        </div>
        <div>
          <DataTable 
            :data="landlordTableData"
            :columns="landlordColumns"
            :pagination="true"
            :page-size="5"
          />
        </div>
      </div>
    </ReportSection>
    
    <!-- Payment Status Section -->
    <ReportSection title="Payment Status" subtitle="Status of payments in the selected period">
      <BarChart 
        :data="statusData"
        xAxisLabel="Status"
        yAxisLabel="Count"
        color="#2563EB"
      />
    </ReportSection>
    
    <!-- Detailed Payment Table -->
    <ReportSection title="Payment Details" subtitle="Comprehensive list of all payments">
      <DataTable 
        :data="paymentDetails"
        :columns="paymentColumns"
        :searchable="true"
        :pagination="true"
      />
    </ReportSection>
  </ReportBuilder>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ReportBuilder, ReportSection } from '../';
import { LineChart, BarChart, PieChart, DataTable } from '../../visualizations';
import { useChartData } from '../../../composables/useChartData';
import { useDataAggregation } from '../../../composables/useDataAggregation';

interface PaymentReportProps {
  startDate?: string;
  endDate?: string;
  companyId?: string;
  currency?: string;
}

const props = withDefaults(defineProps<PaymentReportProps>(), {
  startDate: undefined,
  endDate: undefined,
  companyId: undefined,
  currency: 'USD'
});

// State
const loading = ref(true);
const error = ref<string | null>(null);
const paymentData = ref<any[]>([]);

// Composables
const supabase = useSupabaseClient();
const { transformToXYSeries, transformToPieSeries } = useChartData();
const { groupByField, timeAggregation } = useDataAggregation();

// Report metadata
const reportDescription = computed(() => {
  if (props.startDate && props.endDate) {
    return `Payment summary for the period ${formatDateString(props.startDate)} to ${formatDateString(props.endDate)}`;
  }
  return 'Monthly payment summary for all contracts';
});

const reportMetadata = computed(() => {
  return {
    period: props.startDate && props.endDate 
      ? `${formatDateString(props.startDate)} to ${formatDateString(props.endDate)}` 
      : 'All time',
    totalPayments: formatCurrency(totalPayments.value),
    totalContracts: contractCount.value,
    currency: props.currency
  };
});

// Computed properties
const totalPayments = computed(() => {
  return paymentData.value.reduce((sum, payment) => sum + (payment.amount || 0), 0);
});

const contractCount = computed(() => {
  // Get unique contract IDs
  const uniqueContracts = new Set(paymentData.value.map(payment => payment.contract_id));
  return uniqueContracts.size;
});

const averagePayment = computed(() => {
  if (paymentData.value.length === 0) return 0;
  return totalPayments.value / paymentData.value.length;
});

// Chart data
const chartData = computed(() => {
  if (loading.value || paymentData.value.length === 0) return [];
  
  // Use the timeAggregation composable to group by month
  const monthlyData = timeAggregation(
    paymentData.value,
    'payment_date',
    'amount',
    'month',
    'sum'
  );
  
  // Transform to XY series format for LineChart
  return monthlyData.map(item => ({
    x: formatMonthYear(item.date),
    y: item.value
  }));
});

// Landlord data
const landlordData = computed(() => {
  if (loading.value || paymentData.value.length === 0) return [];
  
  // Group payments by landlord
  const landlordGroups = groupByField(
    paymentData.value,
    'landlord_name',
    'amount',
    'sum'
  );
  
  // Sort by value and limit to top 5 plus "Others"
  const sortedGroups = [...landlordGroups].sort((a, b) => b.value - a.value);
  
  // Transform to pie chart format
  return transformToPieSeries(
    sortedGroups,
    'group',
    'value',
    { limit: 5, groupOthers: true, sortBy: 'value', sortDirection: 'desc' }
  );
});

// Landlord table data
const landlordTableData = computed(() => {
  if (loading.value || paymentData.value.length === 0) return [];
  
  // Group payments by landlord
  const landlordGroups = groupByField(
    paymentData.value,
    'landlord_name',
    'amount',
    'sum'
  );
  
  // Sort by value
  return [...landlordGroups]
    .sort((a, b) => b.value - a.value)
    .map(item => ({
      landlord: item.group,
      total: item.value,
      count: item.count,
      average: item.value / item.count
    }));
});

// Landlord table columns
const landlordColumns = [
  { key: 'landlord', label: 'Landlord' },
  { 
    key: 'total', 
    label: 'Total Payments',
    format: (value: number) => formatCurrency(value),
    align: 'right'
  },
  { key: 'count', label: 'Payment Count', align: 'right' },
  { 
    key: 'average', 
    label: 'Average Payment',
    format: (value: number) => formatCurrency(value),
    align: 'right'
  }
];

// Status data
const statusData = computed(() => {
  if (loading.value || paymentData.value.length === 0) return [];
  
  // Group payments by status
  const statusGroups = groupByField(
    paymentData.value,
    'status',
    'amount',
    'count'
  );
  
  // Transform to XY series for BarChart
  return statusGroups.map(item => ({
    x: capitalizeFirstLetter(item.group),
    y: item.count
  }));
});

// Payment details table
const paymentDetails = computed(() => {
  return paymentData.value.map(payment => ({
    date: payment.payment_date,
    contract: payment.contract_id,
    landlord: payment.landlord_name,
    amount: payment.amount,
    status: payment.status,
    reference: payment.reference_id
  }));
});

// Payment table columns
const paymentColumns = [
  { 
    key: 'date', 
    label: 'Payment Date',
    format: (value: string) => formatDateString(value)
  },
  { key: 'contract', label: 'Contract ID' },
  { key: 'landlord', label: 'Landlord' },
  { 
    key: 'amount', 
    label: 'Amount',
    format: (value: number) => formatCurrency(value),
    align: 'right'
  },
  { 
    key: 'status', 
    label: 'Status',
    format: (value: string) => capitalizeFirstLetter(value)
  },
  { key: 'reference', label: 'Reference ID' }
];

// Fetch payment data
const fetchPaymentData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user?.id) throw new Error('User not authenticated');
    
    // Get company ID from profile if not provided
    let companyId = props.companyId;
    if (!companyId) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userData.user.id)
        .single();
        
      if (profileError) throw profileError;
      companyId = profileData.company_id;
    }
    
    // Build query
    let query = supabase
      .from('payments')
      .select(`
        id,
        contract_id,
        payment_date,
        amount,
        status,
        reference_id,
        contracts(landlord_id),
        landlords(name)
      `)
      .eq('company_id', companyId);
    
    // Add date range if provided
    if (props.startDate) {
      query = query.gte('payment_date', props.startDate);
    }
    
    if (props.endDate) {
      query = query.lte('payment_date', props.endDate);
    }
    
    // Execute query
    const { data, error: queryError } = await query;
    
    if (queryError) throw queryError;
    
    // Transform data to add landlord name
    paymentData.value = (data || []).map(payment => ({
      ...payment,
      landlord_name: payment.landlords?.name || 'Unknown'
    }));
  } catch (err: any) {
    console.error('Error fetching payment data:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// Helper functions
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: props.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatDateString = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatMonthYear = (monthYearString: string): string => {
  // Convert YYYY-MM format to Mon YYYY
  const [year, month] = monthYearString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Load data on mount
onMounted(() => {
  fetchPaymentData();
});
</script>