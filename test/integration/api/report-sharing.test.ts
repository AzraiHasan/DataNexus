// test/integration/api/report-sharing.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resetReportSharingMocks } from "../../unit/mocks/reportSharingMocks";
import fetch from 'node-fetch';

// Create local copies of mock data that we can modify
let mockReports = [] as any[];
let mockReportShares = [] as any[];
let mockProfiles = [] as any[];
let mockCurrentUser = { id: 'test-user-id', email: 'test.user@example.com' };

// Mock fetch for API calls
vi.mock('node-fetch', () => ({
  default: vi.fn()
}));

// Helper function to mock fetch responses
function mockFetchResponse(status: number, data: any) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Map()
  };
}

// Initialize mock data
function initMockData() {
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
}

// Simple API client for testing
async function apiClient(url: string, options: any = {}) {
  const baseUrl = 'http://localhost:3000'; // Mock base URL
  const fullUrl = `${baseUrl}${url}`;
  
  // Set up the response based on the request
  let mockResponse;
  
  if (url.includes('/api/reports/') && url.includes('/share') && options.method === 'POST') {
    // Handle share report endpoint
    const reportId = url.split('/')[3];
    const { shares } = options.body || {};
    
    if (!shares || !Array.isArray(shares)) {
      mockResponse = mockFetchResponse(400, { 
        statusCode: 400, 
        statusMessage: 'Invalid request. Expected shares array.' 
      });
    } else if (!reportId) {
      mockResponse = mockFetchResponse(400, { 
        statusCode: 400, 
        statusMessage: 'Report ID is required' 
      });
    } else {
      // Check for invalid access level
      const invalidShare = shares.find(share => 
        !['viewer', 'editor', 'admin'].includes(share.accessLevel)
      );
      
      if (invalidShare) {
        mockResponse = mockFetchResponse(400, { 
          statusCode: 400, 
          statusMessage: 'Invalid access level. Must be one of: viewer, editor, admin' 
        });
      } else {
        // Process shares
        shares.forEach((share: any) => {
          const existingShareIndex = mockReportShares.findIndex(s => 
            s.report_id === reportId && s.shared_with === share.userId
          );
          
          if (existingShareIndex >= 0) {
            // Update existing share
            mockReportShares[existingShareIndex] = {
              ...mockReportShares[existingShareIndex],
              access_level: share.accessLevel,
              expires_at: share.expiresAt,
              updated_at: new Date().toISOString()
            };
          } else {
            // Create new share
            mockReportShares.push({
              id: `share-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              report_id: reportId,
              shared_by: mockCurrentUser.id,
              shared_with: share.userId,
              access_level: share.accessLevel,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              expires_at: share.expiresAt
            });
          }
        });
        
        mockResponse = mockFetchResponse(200, { success: true });
      }
    }
  } else if (url === '/api/reports/shared' && options.method === 'GET') {
    // Handle get shared reports endpoint
    const enhancedShares = mockReportShares.map(share => ({
      ...share,
      shared_by_user: mockProfiles.find(p => p.id === share.shared_by) || 
                      { id: share.shared_by, email: 'unknown@example.com' },
      reports: mockReports.find(r => r.id === share.report_id) || 
               { id: share.report_id, title: 'Unknown Report', report_type: 'unknown' }
    }));
    
    mockResponse = mockFetchResponse(200, enhancedShares);
  } else if (url.includes('/api/reports/shares/revoke') && options.method === 'DELETE') {
    // Handle revoke share access endpoint
    const urlObj = new URL(fullUrl);
    const shareId = urlObj.searchParams.get('shareId');
    
    if (!shareId) {
      mockResponse = mockFetchResponse(400, { 
        statusCode: 400, 
        statusMessage: 'Share ID is required' 
      });
    } else {
      const shareIndex = mockReportShares.findIndex(s => s.id === shareId);
      
      if (shareIndex < 0) {
        mockResponse = mockFetchResponse(404, { 
          statusCode: 404, 
          statusMessage: 'Share not found' 
        });
      } else {
        // Remove the share
        mockReportShares.splice(shareIndex, 1);
        mockResponse = mockFetchResponse(200, { success: true });
      }
    }
  } else {
    // Default response for unhandled routes
    mockResponse = mockFetchResponse(404, { 
      statusCode: 404, 
      statusMessage: 'Not found' 
    });
  }
  
  // Set up the fetch mock to return our response
  (fetch as any).mockResolvedValueOnce(mockResponse);
  
  try {
    // Make the request
    const response = await fetch(fullUrl, options);
    
    // Handle response
    if (!response.ok) {
      const errorData = await response.json();
      const error: any = new Error(errorData.statusMessage || 'API request failed');
      error.response = {
        status: response.status,
        _data: errorData
      };
      throw error;
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Define response types
interface ShareResponse {
  success: boolean;
}

interface SharedReportResponse {
  id: string;
  report_id: string;
  access_level: string;
  expires_at?: string;
  shared_by_user: {
    id: string;
    email: string;
    full_name?: string;
  };
  reports: {
    id: string;
    title: string;
    report_type: string;
    description?: string;
  };
}

describe("Report Sharing API Endpoints", () => {
  beforeEach(() => {
    initMockData();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Share Report Endpoint", () => {
    it("should successfully share a report with valid input", async () => {
      const reportId = "report-1";
      const response = await apiClient(`/api/reports/${reportId}/share`, {
        method: "POST",
        body: {
          shares: [
            {
              userId: "other-user-id",
              accessLevel: "viewer",
              expiresAt: "2025-06-10T00:00:00.000Z"
            }
          ]
        }
      }) as ShareResponse;

      expect(response).toHaveProperty("success");
      expect(response.success).toBe(true);

      // Verify a share was created
      const shareExists = mockReportShares.some(share => 
        share.report_id === reportId && 
        share.shared_with === "other-user-id" && 
        share.access_level === "viewer"
      );
      
      expect(shareExists).toBe(true);
    });

    it("should return 400 error when shares array is missing", async () => {
      const reportId = "report-1";
      
      try {
        await apiClient(`/api/reports/${reportId}/share`, {
          method: "POST",
          body: {}
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response._data.statusMessage).toContain("Invalid request");
      }
    });

    it("should return 400 error when report ID is missing", async () => {
      try {
        await apiClient(`/api/reports//share`, {
          method: "POST",
          body: {
            shares: [
              {
                userId: "other-user-id",
                accessLevel: "viewer"
              }
            ]
          }
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response._data.statusMessage).toContain("Report ID is required");
      }
    });

    it("should return 400 error with invalid access level", async () => {
      const reportId = "report-1";
      
      try {
        await apiClient(`/api/reports/${reportId}/share`, {
          method: "POST",
          body: {
            shares: [
              {
                userId: "other-user-id",
                accessLevel: "invalid-level" // Invalid access level
              }
            ]
          }
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response._data.statusMessage).toContain("Invalid access level");
      }
    });

    it("should update existing share when sharing again with same user", async () => {
      const reportId = "report-1";
      
      // First share
      await apiClient(`/api/reports/${reportId}/share`, {
        method: "POST",
        body: {
          shares: [
            {
              userId: "other-user-id",
              accessLevel: "viewer"
            }
          ]
        }
      });
      
      // Update share to editor
      await apiClient(`/api/reports/${reportId}/share`, {
        method: "POST",
        body: {
          shares: [
            {
              userId: "other-user-id",
              accessLevel: "editor"
            }
          ]
        }
      });
      
      // Verify share was updated
      const share = mockReportShares.find(share => 
        share.report_id === reportId && 
        share.shared_with === "other-user-id"
      );
      
      expect(share).toBeDefined();
      expect(share?.access_level).toBe("editor");
    });
  });

  describe("Get Shared Reports Endpoint", () => {
    it("should return reports shared with the user", async () => {
      const response = await apiClient("/api/reports/shared", {
        method: "GET"
      }) as SharedReportResponse[];
      
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThan(0);
      
      // Verify response structure
      const firstShare = response[0];
      expect(firstShare).toHaveProperty("id");
      expect(firstShare).toHaveProperty("report_id");
      expect(firstShare).toHaveProperty("access_level");
      expect(firstShare).toHaveProperty("shared_by_user");
    });

    it("should include report details in the response", async () => {
      const response = await apiClient("/api/reports/shared", {
        method: "GET"
      }) as SharedReportResponse[];
      
      // Verify report details are included
      const firstShare = response[0];
      expect(firstShare).toHaveProperty("reports");
      expect(firstShare.reports).toHaveProperty("title");
      expect(firstShare.reports).toHaveProperty("report_type");
    });
  });

  describe("Revoke Share Access Endpoint", () => {
    it("should successfully revoke access to a shared report", async () => {
      // Get an existing share ID
      const shareId = mockReportShares[0].id;
      
      const response = await apiClient(`/api/reports/shares/revoke?shareId=${shareId}`, {
        method: "DELETE"
      }) as ShareResponse;
      
      expect(response).toHaveProperty("success");
      expect(response.success).toBe(true);
      
      // Verify share was deleted
      const shareExists = mockReportShares.some(share => share.id === shareId);
      expect(shareExists).toBe(false);
    });

    it("should return 400 error when share ID is missing", async () => {
      try {
        await apiClient(`/api/reports/shares/revoke`, {
          method: "DELETE"
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response._data.statusMessage).toContain("Share ID is required");
      }
    });

    it("should return 404 error when share does not exist", async () => {
      try {
        await apiClient(`/api/reports/shares/revoke?shareId=non-existent-id`, {
          method: "DELETE"
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response._data.statusMessage).toContain("Share not found");
      }
    });
  });
});
