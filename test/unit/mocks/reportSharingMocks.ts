// test/unit/mocks/reportSharingMocks.ts
import { vi } from 'vitest'
import type { Tables } from '~/types/database'

// Define mock data types
export interface MockReport extends Tables<'reports'> {}
export interface MockReportShare extends Tables<'report_shares'> {}
export interface MockProfile extends Tables<'profiles'> {}

// Mock data for reports
export let mockReports: MockReport[] = [
  {
    id: 'report-1',
    company_id: 'test-company-id',
    created_by: 'test-user-id',
    report_type: 'tower-status',
    title: 'Tower Status Report',
    description: 'Monthly tower status overview',
    parameters: { period: 'monthly' },
    created_at: '2025-03-01T00:00:00.000Z',
    updated_at: '2025-03-01T00:00:00.000Z'
  },
  {
    id: 'report-2',
    company_id: 'test-company-id',
    created_by: 'test-user-id',
    report_type: 'contract-expiry',
    title: 'Contract Expiry Report',
    description: 'Upcoming contract expirations',
    parameters: { timeframe: 'next-90-days' },
    created_at: '2025-03-05T00:00:00.000Z',
    updated_at: '2025-03-05T00:00:00.000Z'
  }
]

// Mock data for report shares
export let mockReportShares: MockReportShare[] = [
  {
    id: 'share-1',
    report_id: 'report-1',
    shared_by: 'test-user-id',
    shared_with: 'other-user-id',
    access_level: 'viewer',
    created_at: '2025-03-10T00:00:00.000Z',
    updated_at: '2025-03-10T00:00:00.000Z',
    expires_at: '2025-06-10T00:00:00.000Z'
  },
  {
    id: 'share-2',
    report_id: 'report-2',
    shared_by: 'test-user-id',
    shared_with: 'admin-user-id',
    access_level: 'editor',
    created_at: '2025-03-12T00:00:00.000Z',
    updated_at: '2025-03-12T00:00:00.000Z',
    expires_at: undefined
  }
]

// Mock data for user profiles
export let mockProfiles: MockProfile[] = [
  {
    id: 'test-user-id',
    email: 'test.user@example.com',
    full_name: 'Test User',
    company_id: 'test-company-id',
    role: 'admin',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'other-user-id',
    email: 'other.user@example.com',
    full_name: 'Other User',
    company_id: 'test-company-id',
    role: 'user',
    created_at: '2025-01-02T00:00:00.000Z',
    updated_at: '2025-01-02T00:00:00.000Z'
  },
  {
    id: 'admin-user-id',
    email: 'admin.user@example.com',
    full_name: 'Admin User',
    company_id: 'test-company-id',
    role: 'admin',
    created_at: '2025-01-03T00:00:00.000Z',
    updated_at: '2025-01-03T00:00:00.000Z'
  }
]

// Mock for shared reports view
export let mockSharedReportsView = [
  {
    id: 'share-1',
    report_id: 'report-1',
    access_level: 'viewer',
    expires_at: '2025-06-10T00:00:00.000Z',
    created_at: '2025-03-10T00:00:00.000Z',
    report_title: 'Tower Status Report',
    report_type: 'tower-status',
    shared_by_email: 'test.user@example.com',
    shared_by_name: 'Test User',
    shared_with_email: 'other.user@example.com',
    shared_with_name: 'Other User'
  },
  {
    id: 'share-2',
    report_id: 'report-2',
    access_level: 'editor',
    expires_at: null,
    created_at: '2025-03-12T00:00:00.000Z',
    report_title: 'Contract Expiry Report',
    report_type: 'contract-expiry',
    shared_by_email: 'test.user@example.com',
    shared_by_name: 'Test User',
    shared_with_email: 'admin.user@example.com',
    shared_with_name: 'Admin User'
  }
]

// Mock for current authenticated user
export let mockCurrentUser = {
  id: 'test-user-id',
  email: 'test.user@example.com'
}

// Define filter and order types for type safety
interface QueryFilter {
  column: string;
  value: any;
  op: 'eq' | 'in';
}

interface QueryOrder {
  column: string;
  ascending: boolean;
}

// Enhanced Supabase client mock with report sharing functionality
export const createReportSharingSupabaseMock = () => {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockCurrentUser },
        error: null
      }),
      signIn: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn()
    },
    from: vi.fn().mockImplementation((table: string) => {
      // Create a query builder with chainable methods
      const queryBuilder = {
        // Data to be returned based on table
        _data: table === 'reports' 
          ? [...mockReports]
          : table === 'report_shares' 
            ? [...mockReportShares] 
            : table === 'profiles'
              ? [...mockProfiles]
              : table === 'shared_reports_view'
                ? [...mockSharedReportsView]
                : [],
        
        // Filters to apply
        _filters: [] as QueryFilter[],
        
        // Track if this is a single result query
        _single: false,
        
        // Track order
        _order: null as QueryOrder | null,
        
        // Select method (start of chain)
        select: vi.fn().mockImplementation((columns: string) => {
          return queryBuilder;
        }),
        
        // Filter methods
        eq: vi.fn().mockImplementation((column: string, value: any) => {
          queryBuilder._filters.push({ column, value, op: 'eq' });
          return queryBuilder;
        }),
        
        in: vi.fn().mockImplementation((column: string, values: any[]) => {
          queryBuilder._filters.push({ column, value: values, op: 'in' });
          return queryBuilder;
        }),
        
        // Order method
        order: vi.fn().mockImplementation((column: string, { ascending }: { ascending: boolean }) => {
          queryBuilder._order = { column, ascending };
          return queryBuilder;
        }),
        
        // Single result method
        single: vi.fn().mockImplementation(() => {
          queryBuilder._single = true;
          return queryBuilder;
        }),
        
        // Insert method
        insert: vi.fn().mockImplementation((data: any) => {
          // Handle array or single object
          const items = Array.isArray(data) ? data : [data];
          const newItems = items.map((item: any, index: number) => {
            const newItem = {
              ...item,
              id: item.id || `new-${table}-${Date.now()}-${index}`,
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at || new Date().toISOString()
            };
            
            // Add to mock data
            if (table === 'reports') {
              mockReports.push(newItem as MockReport);
            } else if (table === 'report_shares') {
              mockReportShares.push(newItem as MockReportShare);
            } else if (table === 'profiles') {
              mockProfiles.push(newItem as MockProfile);
            }
            
            return newItem;
          });
          
          return Promise.resolve({
            data: newItems,
            error: null
          });
        }),
        
        // Update method
        update: vi.fn().mockImplementation((data: any) => {
          // Apply filters to find items to update
          let itemsToUpdate = queryBuilder._applyFilters(queryBuilder._data);
          
          // Update the items
          itemsToUpdate.forEach((item: any) => {
            const updatedItem = {
              ...item,
              ...data,
              updated_at: new Date().toISOString()
            };
            
            // Update in the original array
            if (table === 'reports') {
              const index = mockReports.findIndex(r => r.id === item.id);
              if (index >= 0) mockReports[index] = updatedItem as MockReport;
            } else if (table === 'report_shares') {
              const index = mockReportShares.findIndex(s => s.id === item.id);
              if (index >= 0) mockReportShares[index] = updatedItem as MockReportShare;
            } else if (table === 'profiles') {
              const index = mockProfiles.findIndex(p => p.id === item.id);
              if (index >= 0) mockProfiles[index] = updatedItem as MockProfile;
            }
          });
          
          return Promise.resolve({
            data: itemsToUpdate.length > 0 ? itemsToUpdate : null,
            error: null
          });
        }),
        
        // Delete method
        delete: vi.fn().mockImplementation(() => {
          // Apply filters to find items to delete
          const itemsToDelete = queryBuilder._applyFilters(queryBuilder._data);
          
          // Remove from the original array
          if (table === 'reports') {
            mockReports = mockReports.filter(item => 
              !itemsToDelete.some((i: any) => i.id === item.id)
            );
          } else if (table === 'report_shares') {
            mockReportShares = mockReportShares.filter(item => 
              !itemsToDelete.some((i: any) => i.id === item.id)
            );
          } else if (table === 'profiles') {
            mockProfiles = mockProfiles.filter(item => 
              !itemsToDelete.some((i: any) => i.id === item.id)
            );
          }
          
          return Promise.resolve({
            data: itemsToDelete.length > 0 ? {} : null,
            error: null
          });
        }),
        
        // Helper method to apply filters
        _applyFilters: (data: any[]) => {
          return data.filter(item => {
            return queryBuilder._filters.every(filter => {
              if (filter.op === 'eq') {
                return item[filter.column] === filter.value;
              } else if (filter.op === 'in') {
                return filter.value.includes(item[filter.column]);
              }
              return true;
            });
          });
        },
        
        // Execute the query
        then: function(callback: (result: { data: any, error: null }) => any) {
          // Apply filters
          let result = queryBuilder._applyFilters(queryBuilder._data);
          
          // Apply ordering if specified
          if (queryBuilder._order) {
            const { column, ascending } = queryBuilder._order;
            result.sort((a: any, b: any) => {
              if (a[column] < b[column]) return ascending ? -1 : 1;
              if (a[column] > b[column]) return ascending ? 1 : -1;
              return 0;
            });
          }
          
          // Return single item if requested
          if (queryBuilder._single) {
            const singleResult = result.length > 0 ? result[0] : null;
            return Promise.resolve(callback({
              data: singleResult,
              error: null
            }));
          }
          
          // Return all results
          return Promise.resolve(callback({
            data: result,
            error: null
          }));
        }
      };
      
      return queryBuilder;
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: vi.fn().mockImplementation((path) => ({
          data: { publicUrl: `https://example.com/storage/${path}` }
        })),
        remove: vi.fn().mockResolvedValue({ data: {}, error: null })
      })
    }
  };
};

// Reset all mocks to initial state
export function resetReportSharingMocks() {
  mockReports = [
    {
      id: 'report-1',
      company_id: 'test-company-id',
      created_by: 'test-user-id',
      report_type: 'tower-status',
      title: 'Tower Status Report',
      description: 'Monthly tower status overview',
      parameters: { period: 'monthly' },
      created_at: '2025-03-01T00:00:00.000Z',
      updated_at: '2025-03-01T00:00:00.000Z'
    },
    {
      id: 'report-2',
      company_id: 'test-company-id',
      created_by: 'test-user-id',
      report_type: 'contract-expiry',
      title: 'Contract Expiry Report',
      description: 'Upcoming contract expirations',
      parameters: { timeframe: 'next-90-days' },
      created_at: '2025-03-05T00:00:00.000Z',
      updated_at: '2025-03-05T00:00:00.000Z'
    }
  ];
  
  mockReportShares = [
    {
      id: 'share-1',
      report_id: 'report-1',
      shared_by: 'test-user-id',
      shared_with: 'other-user-id',
      access_level: 'viewer',
      created_at: '2025-03-10T00:00:00.000Z',
      updated_at: '2025-03-10T00:00:00.000Z',
      expires_at: '2025-06-10T00:00:00.000Z'
    },
    {
      id: 'share-2',
      report_id: 'report-2',
      shared_by: 'test-user-id',
      shared_with: 'admin-user-id',
      access_level: 'editor',
      created_at: '2025-03-12T00:00:00.000Z',
      updated_at: '2025-03-12T00:00:00.000Z',
      expires_at: undefined
    }
  ];
  
  mockProfiles = [
    {
      id: 'test-user-id',
      email: 'test.user@example.com',
      full_name: 'Test User',
      company_id: 'test-company-id',
      role: 'admin',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z'
    },
    {
      id: 'other-user-id',
      email: 'other.user@example.com',
      full_name: 'Other User',
      company_id: 'test-company-id',
      role: 'user',
      created_at: '2025-01-02T00:00:00.000Z',
      updated_at: '2025-01-02T00:00:00.000Z'
    },
    {
      id: 'admin-user-id',
      email: 'admin.user@example.com',
      full_name: 'Admin User',
      company_id: 'test-company-id',
      role: 'admin',
      created_at: '2025-01-03T00:00:00.000Z',
      updated_at: '2025-01-03T00:00:00.000Z'
    }
  ];
  
  mockSharedReportsView = [
    {
      id: 'share-1',
      report_id: 'report-1',
      access_level: 'viewer',
      expires_at: '2025-06-10T00:00:00.000Z',
      created_at: '2025-03-10T00:00:00.000Z',
      report_title: 'Tower Status Report',
      report_type: 'tower-status',
      shared_by_email: 'test.user@example.com',
      shared_by_name: 'Test User',
      shared_with_email: 'other.user@example.com',
      shared_with_name: 'Other User'
    },
    {
      id: 'share-2',
      report_id: 'report-2',
      access_level: 'editor',
      expires_at: null,
      created_at: '2025-03-12T00:00:00.000Z',
      report_title: 'Contract Expiry Report',
      report_type: 'contract-expiry',
      shared_by_email: 'test.user@example.com',
      shared_by_name: 'Test User',
      shared_with_email: 'admin.user@example.com',
      shared_with_name: 'Admin User'
    }
  ];
  
  mockCurrentUser = {
    id: 'test-user-id',
    email: 'test.user@example.com'
  };
}
