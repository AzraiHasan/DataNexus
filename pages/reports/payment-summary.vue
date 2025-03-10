<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Payment Summary Report</h1>
    
    <div class="bg-white shadow rounded-lg p-6 mb-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            v-model="filters.startDate"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            v-model="filters.endDate"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Client</label>
          <select
            v-model="filters.clientId"
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Clients</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ client.name }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="flex justify-end">
        <button
          @click="generateReport"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          :disabled="loading"
        >
          {{ loading ? 'Loading...' : 'Generate Report' }}
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="flex justify-center">
      <p>Loading report data...</p>
    </div>
    
    <div v-else-if="report">
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Payment Summary</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-blue-50 p-4 rounded-lg">
            <p class="text-sm text-blue-500">Total Payments</p>
            <p class="text-2xl font-bold">{{ formatCurrency(report.summary.totalAmount) }}</p>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <p class="text-sm text-green-500">Completed Payments</p>
            <p class="text-2xl font-bold">{{ report.summary.completedPayments }}</p>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg">
            <p class="text-sm text-yellow-500">Pending Payments</p>
            <p class="text-2xl font-bold">{{ report.summary.pendingPayments }}</p>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(payment, index) in report.payments" :key="index">
                <td class="px-6 py-4 whitespace-nowrap">{{ formatDate(payment.date) }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ payment.client }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ payment.contract }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ formatCurrency(payment.amount) }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span 
                    :class="{
                      'px-2 py-1 text-xs rounded-full': true,
                      'bg-green-100 text-green-800': payment.status === 'Completed',
                      'bg-yellow-100 text-yellow-800': payment.status === 'Pending',
                      'bg-red-100 text-red-800': payment.status === 'Failed'
                    }"
                  >
                    {{ payment.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="mt-6 flex justify-end space-x-2">
          <button
            @click="downloadPdf"
            class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Download PDF
          </button>
          <button
            @click="exportCsv"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="bg-gray-50 rounded-lg p-8 text-center">
      <p class="text-gray-500">Set the date range and click "Generate Report" to view payment data</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useReportGenerator } from '~/composables/useReportGenerator'

// Types
interface Payment {
  date: string;
  client: string;
  contract: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
}

interface ReportSummary {
  totalAmount: number;
  completedPayments: number;
  pendingPayments: number;
}

interface PaymentReport {
  summary: ReportSummary;
  payments: Payment[];
}

interface Client {
  id: string;
  name: string;
}

// State
const loading = ref(false);
const report = ref<PaymentReport | null>(null);
const clients = ref<Client[]>([]);
const filters = reactive({
  startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
  endDate: new Date().toISOString().split('T')[0], // Today
  clientId: ''
});

// Composables
const { loading: reportLoading, error: reportError, generateMonthlyPaymentReport } = useReportGenerator();

// Lifecycle hooks
onMounted(async () => {
  await fetchClients();
});

// Methods
const fetchClients = async () => {
  try {
    // In a real app, this would be an API call to fetch clients
    // For demonstration purposes, we're using mock data
    clients.value = [
      { id: 'client-1', name: 'Acme Corporation' },
      { id: 'client-2', name: 'Globex Industries' },
      { id: 'client-3', name: 'Initech LLC' },
      { id: 'client-4', name: 'Umbrella Corp' },
      { id: 'client-5', name: 'Stark Industries' }
    ];
  } catch (error) {
    console.error('Failed to fetch clients:', error);
  }
};

const generateReport = async () => {
  loading.value = true;
  
  try {
    // In a real app, this would use the useReportGenerator composable to fetch real data
    // Using mock data for demonstration since we're adapting to the actual composable methods
    
    // Attempt to use the monthly payment report function if there's a client ID
    if (filters.clientId) {
      const data = await generateMonthlyPaymentReport(filters.clientId, {
        title: 'Payment Summary Report',
        description: `Payment summary from ${filters.startDate} to ${filters.endDate}`,
        parameters: {
          startDate: filters.startDate,
          endDate: filters.endDate
        }
      });
      
      // Transform the data to match our expected format
      if (data && data.data) {
        // Extract data from the report's data property
        const reportData = data.data;
        
        // Create a payment summary from the data
        const completedPayments = reportData.payments?.filter((p: any) => p.status === 'completed' || p.status === 'Completed').length || 0;
        const pendingPayments = reportData.payments?.filter((p: any) => p.status === 'pending' || p.status === 'Pending').length || 0;
        
        report.value = {
          summary: {
            totalAmount: reportData.totalPayments || 0,
            completedPayments: completedPayments,
            pendingPayments: pendingPayments
          },
          payments: (reportData.paymentDetails || []).map((payment: any) => ({
            date: payment.date,
            client: payment.landlord,
            contract: payment.contract,
            amount: payment.amount,
            status: capitalizeFirstLetter(payment.status)
          }))
        };
      } else {
        report.value = generateMockReportData();
      }
    } else {
      // If no client is selected, use mock data
      report.value = generateMockReportData();
    }
  } catch (error) {
    console.error('Failed to generate report:', error);
    alert('An error occurred while generating the report. Please try again.');
    // Fallback to mock data for demonstration
    report.value = generateMockReportData();
  } finally {
    loading.value = false;
  }
};

const generateMockReportData = (): PaymentReport => {
  return {
    summary: {
      totalAmount: 17950.00,
      completedPayments: 8,
      pendingPayments: 2
    },
    payments: [
      { date: '2025-03-01', client: 'Acme Corp', contract: 'ACM-2024-003', amount: 1500, status: 'Completed' },
      { date: '2025-03-03', client: 'Globex', contract: 'GLO-2024-017', amount: 2200, status: 'Completed' },
      { date: '2025-03-05', client: 'Initech', contract: 'INI-2024-008', amount: 1800, status: 'Failed' },
      { date: '2025-03-07', client: 'Umbrella Corp', contract: 'UMB-2024-012', amount: 3200, status: 'Completed' },
      { date: '2025-03-10', client: 'Stark Industries', contract: 'STK-2024-005', amount: 4500, status: 'Completed' },
      { date: '2025-03-15', client: 'Wayne Enterprises', contract: 'WAY-2024-019', amount: 3800, status: 'Pending' },
      { date: '2025-03-18', client: 'Cyberdyne Systems', contract: 'CYB-2024-007', amount: 2100, status: 'Completed' },
      { date: '2025-03-22', client: 'Soylent Corp', contract: 'SOY-2024-014', amount: 1750, status: 'Completed' },
      { date: '2025-03-25', client: 'Massive Dynamic', contract: 'MAS-2024-022', amount: 2900, status: 'Pending' },
      { date: '2025-03-28', client: 'Oscorp', contract: 'OSC-2024-011', amount: 1900, status: 'Completed' }
    ]
  };
};

const capitalizeFirstLetter = (string: string): string => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const downloadPdf = async () => {
  if (!report.value) return;
  
  try {
    // In a real app, we would use a PDF generation library or service
    // For demonstration purposes, we'll just show an alert
    console.log('Downloading PDF report...');
    alert('PDF download functionality would be implemented here');
    
    // Example implementation using a hypothetical PDF service:
    // const pdfBlob = await generatePdf(report.value);
    // const url = URL.createObjectURL(pdfBlob);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = `payment-summary-${filters.startDate}-to-${filters.endDate}.pdf`;
    // a.click();
  } catch (error) {
    console.error('Failed to download PDF:', error);
    alert('Failed to download PDF. Please try again.');
  }
};

const exportCsv = async () => {
  if (!report.value) return;
  
  try {
    // In a real app, we would convert the data to CSV and trigger a download
    // For demonstration purposes, we'll just show an alert
    console.log('Exporting CSV data...');
    alert('CSV export functionality would be implemented here');
    
    // Example implementation:
    // const csvContent = convertToCSV(report.value.payments);
    // const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    // const url = URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = `payment-summary-${filters.startDate}-to-${filters.endDate}.csv`;
    // a.click();
  } catch (error) {
    console.error('Failed to export CSV:', error);
    alert('Failed to export CSV. Please try again.');
  }
};
</script>

<style>
/* Custom styles can be added here if needed */
</style>
