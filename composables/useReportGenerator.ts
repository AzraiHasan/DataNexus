// composables/useReportGenerator.ts
import { ref } from 'vue';
import { useSupabaseClient } from '#imports';
import { useDataAggregation } from './useDataAggregation';
import { useChartData } from './useChartData';

interface ReportOptions {
  title: string;
  description?: string;
  format?: 'pdf' | 'excel' | 'html';
  parameters?: Record<string, any>;
}

interface ReportData {
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
  data?: any;
  content?: any;
  sections?: any[];
}

interface Contract {
  id: string;
  contract_id: string;
  tower_id: string;
  landlord_id: string;
  start_date: string;
  end_date: string;
  monthly_rate: number;
  currency: string;
  status: string;
  towers: {
    tower_id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  landlords: {
    name: string;
  };
  [key: string]: any;
}

interface Payment {
  id: string;
  contract_id: string;
  payment_date: string;
  amount: number;
  status: string;
  reference_id: string;
  contracts: {
    landlord_id: string;
  };
  landlords: {
    name: string;
  };
  landlord_name?: string;
  [key: string]: any;
}

export const useReportGenerator = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const { timeAggregation, groupByField, calculateStats } = useDataAggregation();
  const { transformToXYSeries, transformToPieSeries } = useChartData();
  
  /**
   * Generate a contract expiry report
   */
  const generateContractExpiryReport = async (
    companyId: string,
    options: ReportOptions
  ): Promise<ReportData> => {
    loading.value = true;
    error.value = null;
    
    try {
      const period = options.parameters?.period || 12; // Default to 12 months
      const supabase = useSupabaseClient();
      
      // Get today's date for filtering
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Define the date range for fetching contracts
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + period);
      
      // Fetch contract data
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select(`
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
        `)
        .eq('company_id', companyId)
        .gte('end_date', today.toISOString().split('T')[0])
        .lte('end_date', endDate.toISOString().split('T')[0]);
      
      if (contractError) throw contractError;
      
      // Process the data for the report
      const contracts = contractData || [];
      
      // Calculate metrics for the report
      const totalContracts = contracts.length;
      const totalValue = contracts.reduce((sum: number, contract: Contract) => sum + (contract.monthly_rate || 0), 0);
      
      // Group contracts by expiration month
      const expirationsByMonth = timeAggregation(
        contracts,
        'end_date',
        'monthly_rate',
        'month',
        'count'
      );
      
      const chartData = expirationsByMonth.map(item => ({
        x: formatMonthYear(item.date),
        y: item.count
      }));
      
      // Group by month for revenue impact
      const revenueByMonth = timeAggregation(
        contracts,
        'end_date',
        'monthly_rate',
        'month',
        'sum'
      );
      
      const revenueChartData = revenueByMonth.map(item => ({
        x: formatMonthYear(item.date),
        y: item.value
      }));
      
      // Get the locations for map visualization
      const locations = contracts
        .filter((contract: Contract) => 
          contract.towers && 
          contract.towers.latitude && 
          contract.towers.longitude
        )
        .map((contract: Contract) => ({
          latitude: contract.towers.latitude,
          longitude: contract.towers.longitude,
          label: contract.towers.name || contract.towers.tower_id || 'Tower',
          popup: `
            <strong>${contract.towers.name || contract.towers.tower_id || 'Tower'}</strong><br>
            Expires: ${formatDateString(contract.end_date)}<br>
            Monthly Rate: ${formatCurrency(contract.monthly_rate, contract.currency)}<br>
            Landlord: ${contract.landlords?.name || 'Unknown'}
          `
        }));
      
      // Calculate average renewal time based on contract lengths
      let totalDays = 0;
      let contractsWithDates = 0;
      
      contracts.forEach((contract: Contract) => {
        if (contract.start_date && contract.end_date) {
          const startDate = new Date(contract.start_date);
          const endDate = new Date(contract.end_date);
          const days = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          if (days > 0) {
            totalDays += days;
            contractsWithDates++;
          }
        }
      });
      
      const averageRenewalDays = contractsWithDates > 0 ? Math.round(totalDays / contractsWithDates) : 0;
      
      // Find the month with highest revenue impact
      let topImpactMonth = 'N/A';
      let topImpactAmount = 0;
      
      if (revenueChartData.length > 0) {
        const topImpact = revenueChartData.reduce(
          (max, current) => current.y > max.y ? current : max,
          { x: '', y: 0 }
        );
        
        topImpactMonth = topImpact.x;
        topImpactAmount = topImpact.y;
      }
      
      // Prepare table data for expiring contracts
      const expiringContractsTable = contracts.map((contract: Contract) => {
        const endDate = new Date(contract.end_date);
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: contract.contract_id,
          tower: contract.towers?.name || contract.towers?.tower_id || 'Unknown',
          endDate: contract.end_date,
          daysRemaining,
          landlord: contract.landlords?.name || 'Unknown',
          monthlyRate: contract.monthly_rate,
          status: getExpiryStatus(daysRemaining)
        };
      });
      
      // Create the report data
      const reportData: ReportData = {
        title: options.title || 'Contract Expiry Timeline',
        description: options.description || `Contract expiration analysis for the next ${period} months`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          period: `Next ${period} months`,
          expiringContracts: expiringContractsTable.length,
          totalRevenue: formatCurrency(totalValue),
          criticalExpirations: expiringContractsTable.filter((c: any) => c.status === 'Critical').length
        },
        data: {
          contracts,
          chartData,
          revenueChartData,
          locations,
          expiringContractsTable,
          averageRenewalDays,
          topImpactMonth,
          topImpactAmount,
          totalContracts,
          expiringThisMonth: expiringContractsTable.filter((c: any) => c.status === 'Critical').length,
          expiringNext90Days: expiringContractsTable.filter((c: any) => ['Critical', 'Warning'].includes(c.status)).length
        }
      };
      
      return reportData;
    } catch (err: any) {
      console.error('Error generating contract expiry report:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Generate a monthly payment report
   */
  const generateMonthlyPaymentReport = async (
    companyId: string,
    options: ReportOptions
  ): Promise<ReportData> => {
    loading.value = true;
    error.value = null;
    
    try {
      const startDate = options.parameters?.startDate;
      const endDate = options.parameters?.endDate;
      const supabase = useSupabaseClient();
      
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
      if (startDate) {
        query = query.gte('payment_date', startDate);
      }
      
      if (endDate) {
        query = query.lte('payment_date', endDate);
      }
      
      // Execute query
      const { data: paymentData, error: paymentError } = await query;
      
      if (paymentError) throw paymentError;
      
      // Process payments data
      const payments = (paymentData || []).map((payment: Payment) => ({
        ...payment,
        landlord_name: payment.landlords?.name || 'Unknown'
      }));
      
      // Calculate metrics
      const totalPayments = payments.reduce((sum: number, payment: Payment) => sum + (payment.amount || 0), 0);
      const uniqueContracts = new Set(payments.map((payment: Payment) => payment.contract_id)).size;
      const averagePayment = payments.length > 0 ? totalPayments / payments.length : 0;
      
      // Group payments by month
      const monthlyData = timeAggregation(
        payments,
        'payment_date',
        'amount',
        'month',
        'sum'
      );
      
      const chartData = monthlyData.map(item => ({
        x: formatMonthYear(item.date),
        y: item.value
      }));
      
      // Group payments by landlord
      const landlordGroups = groupByField(
        payments,
        'landlord_name',
        'amount',
        'sum'
      );
      
      // Sort by value and transform for pie chart
      const sortedGroups = [...landlordGroups].sort((a, b) => b.value - a.value);
      
      const landlordData = transformToPieSeries(
        sortedGroups,
        'group',
        'value',
        { limit: 5, groupOthers: true, sortBy: 'value', sortDirection: 'desc' }
      );
      
      // Prepare landlord table data
      const landlordTableData = sortedGroups.map(item => ({
        landlord: item.group,
        total: item.value,
        count: item.count,
        average: item.value / item.count
      }));
      
      // Group payments by status
      const statusGroups = groupByField(
        payments,
        'status',
        'amount',
        'count'
      );
      
      // Transform for bar chart
      const statusData = statusGroups.map(item => ({
        x: capitalizeFirstLetter(String(item.group)),
        y: item.count
      }));
      
      // Prepare payment details
      const paymentDetails = payments.map((payment: Payment) => ({
        date: payment.payment_date,
        contract: payment.contract_id,
        landlord: payment.landlord_name,
        amount: payment.amount,
        status: payment.status,
        reference: payment.reference_id
      }));
      
      // Create the report data
      const reportData: ReportData = {
        title: options.title || 'Monthly Payment Summary',
        description: options.description ||
          (startDate && endDate ? 
            `Payment summary for the period ${formatDateString(startDate)} to ${formatDateString(endDate)}` : 
            'Monthly payment summary for all contracts'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          period: startDate && endDate ? 
            `${formatDateString(startDate)} to ${formatDateString(endDate)}` : 
            'All time',
          totalPayments: formatCurrency(totalPayments),
          totalContracts: uniqueContracts,
          currency: options.parameters?.currency || 'USD'
        },
        data: {
          payments,
          chartData,
          landlordData,
          landlordTableData,
          statusData,
          paymentDetails,
          totalPayments,
          contractCount: uniqueContracts,
          averagePayment
        }
      };
      
      return reportData;
    } catch (err: any) {
      console.error('Error generating monthly payment report:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * Helper function to format currency values
   */
  const formatCurrency = (value: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  /**
   * Helper function to format date strings
   */
  const formatDateString = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  /**
   * Helper function to format month-year
   */
  const formatMonthYear = (monthYearString: string): string => {
    // Convert YYYY-MM format to MMM YYYY
    if (monthYearString.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = monthYearString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    }
    return monthYearString;
  };
  
  /**
   * Helper function to capitalize first letter
   */
  const capitalizeFirstLetter = (string: string): string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  
  /**
   * Helper function to determine expiry status
   */
  const getExpiryStatus = (daysRemaining: number): string => {
    if (daysRemaining <= 30) return 'Critical';
    if (daysRemaining <= 90) return 'Warning';
    return 'Upcoming';
  };
  
  return {
    loading,
    error,
    generateContractExpiryReport,
    generateMonthlyPaymentReport
  };
};
