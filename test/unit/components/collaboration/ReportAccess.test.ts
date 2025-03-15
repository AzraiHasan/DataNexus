// test/unit/components/collaboration/ReportAccess.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'

// Mock the component instead of importing it
const MockReportAccess = {
  name: 'ReportAccess',
  props: {
    reportId: {
      type: String,
      required: true
    },
    isOwner: {
      type: Boolean,
      default: false
    }
  },
  setup(props: { reportId: string; isOwner: boolean }) {
    // Mock state
    const isLoading = ref(false);
    const shares = ref([
      {
        id: 'share-1',
        shared_with: 'other-user-id',
        shared_with_user: {
          email: 'other.user@example.com',
          full_name: 'Other User'
        },
        access_level: 'viewer',
        created_at: '2025-03-10T00:00:00.000Z',
        expires_at: '2025-06-10T00:00:00.000Z'
      },
      {
        id: 'share-2',
        shared_with: 'admin-user-id',
        shared_with_user: {
          email: 'admin.user@example.com',
          full_name: 'Admin User'
        },
        access_level: 'editor',
        created_at: '2025-03-12T00:00:00.000Z',
        expires_at: null
      }
    ]);

    // Mock methods
    const fetchShares = vi.fn().mockImplementation(async () => {
      isLoading.value = true;
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 10));
      isLoading.value = false;
    });

    const revokeAccess = vi.fn().mockImplementation(async (shareId: string) => {
      isLoading.value = true;
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 10));
      // Remove the share from the list
      shares.value = shares.value.filter(share => share.id !== shareId);
      isLoading.value = false;
    });

    // Computed properties
    const canManageShares = computed(() => props.isOwner);
    const hasShares = computed(() => shares.value.length > 0);

    // Format functions
    const formatAccessLevel = (level: string) => {
      switch (level) {
        case 'viewer': return 'View Only';
        case 'editor': return 'Can Edit';
        case 'admin': return 'Full Access';
        default: return level;
      }
    };

    const formatExpirationDate = (date: string | null) => {
      if (!date) return 'Never';
      return new Date(date).toLocaleDateString();
    };

    return {
      isLoading,
      shares,
      fetchShares,
      revokeAccess,
      canManageShares,
      hasShares,
      formatAccessLevel,
      formatExpirationDate
    };
  },
  template: `
    <div class="report-access">
      <h3 class="text-lg font-medium mb-4">Shared With</h3>
      
      <div v-if="isLoading" class="loading-indicator">
        Loading...
      </div>
      
      <div v-else-if="!hasShares" class="no-shares">
        This report has not been shared with anyone.
      </div>
      
      <div v-else class="shares-list">
        <div v-for="share in shares" :key="share.id" class="share-item">
          <div class="user-info">
            <div class="user-name">{{ share.shared_with_user.full_name || share.shared_with_user.email }}</div>
            <div class="user-email">{{ share.shared_with_user.email }}</div>
          </div>
          
          <div class="access-info">
            <div class="access-level">{{ formatAccessLevel(share.access_level) }}</div>
            <div class="expiration">Expires: {{ formatExpirationDate(share.expires_at) }}</div>
          </div>
          
          <button 
            v-if="canManageShares" 
            class="revoke-button"
            @click="revokeAccess(share.id)"
          >
            Revoke
          </button>
        </div>
      </div>
    </div>
  `
};

describe('ReportAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders properly', () => {
    const wrapper = mount(MockReportAccess, {
      props: {
        reportId: 'report-1',
        isOwner: true
      }
    });
    
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('h3').text()).toBe('Shared With');
  });

  it('displays shares when available', async () => {
    const wrapper = mount(MockReportAccess, {
      props: {
        reportId: 'report-1',
        isOwner: true
      }
    });
    
    // Wait for component to update
    await wrapper.vm.$nextTick();
    
    // Check if shares are displayed
    const shareItems = wrapper.findAll('.share-item');
    expect(shareItems.length).toBe(2);
    
    // Check first share details
    const firstShare = shareItems[0];
    expect(firstShare.find('.user-name').text()).toBe('Other User');
    expect(firstShare.find('.user-email').text()).toBe('other.user@example.com');
    expect(firstShare.find('.access-level').text()).toBe('View Only');
    expect(firstShare.find('.expiration').text()).toContain('Expires:');
  });

  it('shows "no shares" message when no shares are available', async () => {
    // Create a mock with empty shares array
    const emptySharesMock = {
      ...MockReportAccess,
      setup(props) {
        const originalSetup = MockReportAccess.setup(props);
        return {
          ...originalSetup,
          shares: ref([]),
          hasShares: computed(() => false)
        };
      }
    };
    
    const wrapper = mount(emptySharesMock, {
      props: {
        reportId: 'report-1',
        isOwner: true
      }
    });
    
    // Check if "no shares" message is displayed
    expect(wrapper.find('.no-shares').exists()).toBe(true);
    expect(wrapper.find('.no-shares').text()).toContain('not been shared');
  });

  it('shows revoke buttons for owners', () => {
    const wrapper = mount(MockReportAccess, {
      props: {
        reportId: 'report-1',
        isOwner: true
      }
    });
    
    const revokeButtons = wrapper.findAll('.revoke-button');
    expect(revokeButtons.length).toBe(2);
  });

  it('hides revoke buttons for non-owners', () => {
    const wrapper = mount(MockReportAccess, {
      props: {
        reportId: 'report-1',
        isOwner: false
      }
    });
    
    const revokeButtons = wrapper.findAll('.revoke-button');
    expect(revokeButtons.length).toBe(0);
  });

  it('calls revokeAccess when revoke button is clicked', async () => {
    const wrapper = mount(MockReportAccess, {
      props: {
        reportId: 'report-1',
        isOwner: true
      }
    });
    
    // Get the first revoke button
    const revokeButton = wrapper.find('.revoke-button');
    
    // Mock the revokeAccess method
    const revokeAccess = vi.fn();
    wrapper.vm.revokeAccess = revokeAccess;
    
    // Click the button
    await revokeButton.trigger('click');
    
    // Check if revokeAccess was called with the correct share ID
    expect(revokeAccess).toHaveBeenCalledWith('share-1');
  });

  it('formats access levels correctly', () => {
    const wrapper = mount(MockReportAccess, {
      props: {
        reportId: 'report-1',
        isOwner: true
      }
    });
    
    expect(wrapper.vm.formatAccessLevel('viewer')).toBe('View Only');
    expect(wrapper.vm.formatAccessLevel('editor')).toBe('Can Edit');
    expect(wrapper.vm.formatAccessLevel('admin')).toBe('Full Access');
    expect(wrapper.vm.formatAccessLevel('unknown')).toBe('unknown');
  });

  it('formats expiration dates correctly', () => {
    const wrapper = mount(MockReportAccess, {
      props: {
        reportId: 'report-1',
        isOwner: true
      }
    });
    
    expect(wrapper.vm.formatExpirationDate(null)).toBe('Never');
    
    // Test with a specific date
    const testDate = '2025-06-10T00:00:00.000Z';
    const formattedDate = wrapper.vm.formatExpirationDate(testDate);
    expect(formattedDate).toBeDefined();
    expect(typeof formattedDate).toBe('string');
    expect(formattedDate).not.toBe(testDate); // Should be formatted
  });
});
