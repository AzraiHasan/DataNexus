// test/unit/composables/useReportGenerator.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useReportGenerator } from '../../../composables/useReportGenerator'

// Define types for interfaces
interface ReportData {
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
  data?: any;
}

interface TimeAggregationResult {
  date: string;
  count: number;
  value: number;
}

interface GroupByResult {
  group: string;
  value: number;
  count: number;
}

// Mock Vue ref
vi.mock('vue', () => ({
  ref: vi.fn((val: any) => ({
    value: val,
  })),
}))

// Mock imports from #imports
vi.mock('#imports', async () => {
  return {
    useSupabaseClient: vi.fn(() => mockSupabaseClient),
  }
})

// Mock dependent composables
vi.mock('../../../composables/useDataAggregation', () => ({
  useDataAggregation: () => ({
    timeAggregation: vi.fn((data: any[], dateField: string, valueField: string, interval: string, aggregationType: string): TimeAggregationResult[] => {
      // Simple mock implementation for timeAggregation
      if (interval === 'month') {
        return [
          { date: '2025-01', count: 2, value: 3000 },
          { date: '2025-02', count: 3, value: 4500 },
          { date: '2025-03', count: 1, value: 2000 }
        ]
      }
      return []
    }),
    groupByField: vi.fn((data: any[], groupField: string, valueField: string, aggregationType: string): GroupByResult[] => {
      // Simple mock implementation for groupByField
      if (groupField === 'landlord_name') {
        return [
          { group: 'Landlord A', value: 5000, count: 3 },
          { group: 'Landlord B', value: 3000, count: 2 },
          { group: 'Landlord C', value: 2000, count: 1 }
        ]
      } else if (groupField === 'status') {
        return [
          { group: 'paid', value: 5, count: 5 },
          { group: 'pending', value: 3, count: 3 },
          { group: 'overdue', value: 2, count: 2 }
        ]
      }
      return []
    }),
    calculateStats: vi.fn(() => ({
      count: 5,
      sum: 1500,
      avg: 300,
      min: 100,
      max: 500,
      median: 300,
      stdDev: 150
    }))
  })
}))

interface ChartItem {
  x: string | number;
  y: number;
}

interface PieChartItem {
  label: string;
  value: number;
  _isAggregated?: boolean;
  _count?: number;
}

vi.mock('../../../composables/useChartData', () => ({
  useChartData: () => ({
    transformToXYSeries: vi.fn((data: any[], labelField: string, valueField: string): ChartItem[] => {
      // Simple mock implementation
      return data.map((item: any) => ({ 
        x: typeof item.date === 'string' ? item.date : item[labelField], 
        y: typeof item.value === 'number' ? item.value : item[valueField] 
      }))
    }),
    transformToPieSeries: vi.fn((data: any[], labelField: string, valueField: string, options?: any): PieChartItem[] => {
      // Simple mock for pie chart data
      const result = data.map((item: any) => ({
        label: item.group || 'Unknown',
        value: item.value || 0
      } as PieChartItem))
      
      // If options include limit and groupOthers, add an "Others" category
      if (options?.limit && options?.groupOthers && data.length > options.limit) {
        result.push({
          label: 'Others',
          value: 1000,
          _isAggregated: true,
          _count: 2
        })
      }
      
      return result
    })
  })
}))

// Mock contract and payment data
const mockContracts = [
  {
    id: 'c-001',
    contract_id: 'CTR-001',
    tower_id: 't-001',
    landlord_id: 'l-001',
    start_date: '2024-01-01',
    end_date: '2025-04-15',
    monthly_rate: 1000,
    currency: 'USD',
    status: 'active',
    towers: {
      tower_id: 't-001',
      name: 'Tower Alpha',
      latitude: 40.7128,
      longitude: -74.0060
    },
    landlords: {
      name: 'Landlord A'
    }
  },
  {
    id: 'c-002',
    contract_id: 'CTR-002',
    tower_id: 't-002',
    landlord_id: 'l-002',
    start_date: '2024-02-01',
    end_date: '2025-06-30',
    monthly_rate: 1500,
    currency: 'USD',
    status: 'active',
    towers: {
      tower_id: 't-002',
      name: 'Tower Beta',
      latitude: 34.0522,
      longitude: -118.2437
    },
    landlords: {
      name: 'Landlord B'
    }
  }
]

const mockPayments = [
  {
    id: 'p-001',
    contract_id: 'CTR-001',
    payment_date: '2025-01-15',
    amount: 1000,
    status: 'paid',
    reference_id: 'REF-001',
    contracts: {
      landlord_id: 'l-001'
    },
    landlords: {
      name: 'Landlord A'
    }
  },
  {
    id: 'p-002',
    contract_id: 'CTR-002',
    payment_date: '2025-02-15',
    amount: 1500,
    status: 'paid',
    reference_id: 'REF-002',
    contracts: {
      landlord_id: 'l-002'
    },
    landlords: {
      name: 'Landlord B'
    }
  },
  {
    id: 'p-003',
    contract_id: 'CTR-001',
    payment_date: '2025-03-15',
    amount: 1000,
    status: 'pending',
    reference_id: 'REF-003',
    contracts: {
      landlord_id: 'l-001'
    },
    landlords: {
      name: 'Landlord A'
    }
  }
]

// Helper function to create a mock Supabase client with proper typings
function createMockSupabaseQuery(data: any, error: any = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    then: function(callback: (result: { data: any; error: any }) => any): Promise<any> {
      return Promise.resolve(callback({ data, error }))
    }
  }
}

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn().mockImplementation(() => {
    return createMockSupabaseQuery(null, null)
  })
}

describe('useReportGenerator', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Mock current date for consistent testing
    vi.setSystemTime(new Date('2025-03-15T12:00:00.000Z'))
    
    // Spy on console.error
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  
  afterEach(() => {
    // Restore timers
    vi.useRealTimers()
    
    // Restore console
    consoleErrorSpy.mockRestore()
  })
  
  describe('generateContractExpiryReport', () => {
    it('should generate a contract expiry report with the correct structure', async () => {
      const { generateContractExpiryReport, loading, error } = useReportGenerator()
      
      // Set up mock for this specific test
      mockSupabaseClient.from.mockReturnValue(createMockSupabaseQuery(mockContracts, null))
      
      const reportOptions = {
        title: 'Test Contract Expiry Report',
        description: 'Test description',
        format: 'pdf' as const,
        parameters: {
          period: 6
        }
      }
      
      const report = await generateContractExpiryReport('company-001', reportOptions)
      
      // Verify loading state
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
      
      // Verify Supabase was called correctly
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('contracts')
      
      // Check report structure
      expect(report).toHaveProperty('title', 'Test Contract Expiry Report')
      expect(report).toHaveProperty('description', 'Test description')
      expect(report).toHaveProperty('createdAt')
      expect(report).toHaveProperty('updatedAt')
      expect(report).toHaveProperty('metadata')
      expect(report).toHaveProperty('data')
      
      // Check report data contents
      expect(report.data).toHaveProperty('contracts')
      expect(report.data).toHaveProperty('chartData')
      expect(report.data).toHaveProperty('revenueChartData')
      expect(report.data).toHaveProperty('locations')
      expect(report.data).toHaveProperty('expiringContractsTable')
      
      // Verify report metrics
      expect(report.data.totalContracts).toBe(mockContracts.length)
      expect(report.metadata?.expiringContracts).toBe(mockContracts.length)
    })
    
    it('should handle an empty contract dataset', async () => {
      const { generateContractExpiryReport } = useReportGenerator()
      
      // Setup mock to return empty data
      mockSupabaseClient.from.mockReturnValue(createMockSupabaseQuery([], null))
      
      const report = await generateContractExpiryReport('company-001', { title: 'Empty Report' })
      
      // Should still return a valid report structure
      expect(report).toHaveProperty('title', 'Empty Report')
      expect(report).toHaveProperty('data')
      expect(report.data.totalContracts).toBe(0)
      expect(report.data.expiringContractsTable).toEqual([])
    })
    
    it('should handle Supabase errors gracefully', async () => {
      const { generateContractExpiryReport, error } = useReportGenerator()
      
      // Setup mock to return an error
      mockSupabaseClient.from.mockReturnValue(createMockSupabaseQuery(null, new Error('Database error')))
      
      // Should throw an error
      await expect(generateContractExpiryReport('company-001', { title: 'Error Report' }))
        .rejects.toThrow('Database error')
      
      // Check error state
      expect(error.value).toBe('Database error')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
  
  describe('generateMonthlyPaymentReport', () => {
    it('should generate a monthly payment report with the correct structure', async () => {
      const { generateMonthlyPaymentReport, loading, error } = useReportGenerator()
      
      // Set up mock for this specific test
      mockSupabaseClient.from.mockReturnValue(createMockSupabaseQuery(mockPayments, null))
      
      const reportOptions = {
        title: 'Test Monthly Payment Report',
        description: 'Test payment description',
        format: 'excel' as const,
        parameters: {
          startDate: '2025-01-01',
          endDate: '2025-03-31',
          currency: 'USD'
        }
      }
      
      const report = await generateMonthlyPaymentReport('company-001', reportOptions)
      
      // Verify loading state
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
      
      // Verify Supabase was called correctly
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('payments')
      
      // Check report structure
      expect(report).toHaveProperty('title', 'Test Monthly Payment Report')
      expect(report).toHaveProperty('description', 'Test payment description')
      expect(report).toHaveProperty('createdAt')
      expect(report).toHaveProperty('updatedAt')
      expect(report).toHaveProperty('metadata')
      expect(report).toHaveProperty('data')
      
      // Check report data contents
      expect(report.data).toHaveProperty('payments')
      expect(report.data).toHaveProperty('chartData')
      expect(report.data).toHaveProperty('landlordData')
      expect(report.data).toHaveProperty('landlordTableData')
      expect(report.data).toHaveProperty('statusData')
      expect(report.data).toHaveProperty('paymentDetails')
      
      // Verify report metrics
      expect(report.data.payments).toEqual(expect.any(Array))
      expect(report.data.payments.some((p: any) => p.landlord_name)).toBeTruthy()
    })
    
    it('should handle date filter parameters correctly', async () => {
      const { generateMonthlyPaymentReport } = useReportGenerator()
      
      // Use a spy to verify query parameters
      const eqSpy = vi.fn().mockReturnThis()
      const gteSpy = vi.fn().mockReturnThis()
      const lteSpy = vi.fn().mockReturnThis()
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: eqSpy,
        gte: gteSpy,
        lte: lteSpy,
        then: function(callback: (result: { data: any; error: any }) => any): Promise<any> {
          return Promise.resolve(callback({ data: mockPayments, error: null }))
        }
      })
      
      const reportOptions = {
        title: 'Filtered Payment Report',
        parameters: {
          startDate: '2025-01-01',
          endDate: '2025-03-31'
        }
      }
      
      await generateMonthlyPaymentReport('company-001', reportOptions)
      
      // Verify that date filters were applied
      expect(eqSpy).toHaveBeenCalledWith('company_id', 'company-001')
      expect(gteSpy).toHaveBeenCalledWith('payment_date', '2025-01-01')
      expect(lteSpy).toHaveBeenCalledWith('payment_date', '2025-03-31')
    })
    
    it('should handle Supabase errors gracefully', async () => {
      const { generateMonthlyPaymentReport, error } = useReportGenerator()
      
      // Setup mock to return an error
      mockSupabaseClient.from.mockReturnValue(createMockSupabaseQuery(null, new Error('Payment data error')))
      
      // Should throw an error
      await expect(generateMonthlyPaymentReport('company-001', { title: 'Error Report' }))
        .rejects.toThrow('Payment data error')
      
      // Check error state
      expect(error.value).toBe('Payment data error')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
  
  describe('Helper functions', () => {
    it('should format currency values correctly', () => {
      const { generateContractExpiryReport } = useReportGenerator()
      
      mockSupabaseClient.from.mockReturnValue(createMockSupabaseQuery(mockContracts, null))
      
      return generateContractExpiryReport('company-001', { title: 'Test' })
        .then(report => {
          // Check that currency values are formatted correctly in the report
          expect(report.metadata?.totalRevenue).toMatch(/\$[0-9,]+\.[0-9]{2}/)
        })
    })
    
    it('should determine expiry status correctly', () => {
      const { generateContractExpiryReport } = useReportGenerator()
      
      // Create contract data with various expiry dates
      const testContracts = [
        { ...mockContracts[0], end_date: '2025-03-20' }, // 5 days from test date (critical)
        { ...mockContracts[1], end_date: '2025-06-01' }, // ~75 days from test date (warning)
        { ...mockContracts[0], end_date: '2025-12-31', id: 'c-003' } // far future (upcoming)
      ]
      
      mockSupabaseClient.from.mockReturnValue(createMockSupabaseQuery(testContracts, null))
      
      return generateContractExpiryReport('company-001', { title: 'Test' })
        .then(report => {
          const tableData = report.data.expiringContractsTable
          
          // Check status assignments
          expect(tableData[0].status).toBe('Critical') // 5 days remaining
          expect(tableData[1].status).toBe('Warning') // ~75 days remaining
          expect(tableData[2].status).toBe('Upcoming') // Far future
          
          // Verify counts by status
          expect(report.data.expiringThisMonth).toBeGreaterThan(0)
          expect(report.metadata?.criticalExpirations).toBeGreaterThan(0)
        })
    })
    
    it('should format dates correctly', () => {
      const { generateMonthlyPaymentReport } = useReportGenerator()
      
      mockSupabaseClient.from.mockReturnValue(createMockSupabaseQuery(mockPayments, null))
      
      const reportOptions = {
        title: 'Date Format Test',
        parameters: {
          startDate: '2025-01-01',
          endDate: '2025-03-31'
        }
      }
      
      return generateMonthlyPaymentReport('company-001', reportOptions)
        .then(report => {
          // Check period formatting in metadata
          expect(report.metadata?.period).toMatch(/Jan \d+, 2025 to Mar \d+, 2025/)
        })
    })
  })
})
