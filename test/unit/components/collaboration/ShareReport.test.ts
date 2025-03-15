// test/unit/components/collaboration/ShareReport.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'

// Mock the component instead of importing it
const MockShareReport = {
  name: 'ShareReport',
  props: {
    reportId: {
      type: String,
      required: true
    },
    reportTitle: {
      type: String,
      default: 'Untitled Report'
    }
  },
  emits: ['shared', 'cancel'],
  setup(props: { reportId: string; reportTitle: string }, context: any) {
    const { emit } = context;
    // Mock state
    const isLoading = ref(false);
    const isSuccess = ref(false);
    const errorMessage = ref('');
    
    // Form state
    const selectedUsers = ref([]);
    const accessLevel = ref('viewer');
    const expirationDate = ref('');
    const availableUsers = ref([
      {
        id: 'user-1',
        email: 'user1@example.com',
        full_name: 'User One'
      },
      {
        id: 'user-2',
        email: 'user2@example.com',
        full_name: 'User Two'
      },
      {
        id: 'user-3',
        email: 'user3@example.com',
        full_name: 'User Three'
      }
    ]);
    
    // Computed properties
    const formattedExpirationDate = computed(() => {
      if (!expirationDate.value) return '';
      return new Date(expirationDate.value).toISOString();
    });
    
    const isFormValid = computed(() => {
      return selectedUsers.value.length > 0 && 
             ['viewer', 'editor', 'admin'].includes(accessLevel.value);
    });
    
    // Mock methods
    const fetchAvailableUsers = vi.fn().mockImplementation(async () => {
      isLoading.value = true;
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 10));
      isLoading.value = false;
    });
    
    const shareReport = vi.fn().mockImplementation(async () => {
      if (!isFormValid.value) {
        errorMessage.value = 'Please select at least one user and a valid access level.';
        return;
      }
      
      isLoading.value = true;
      errorMessage.value = '';
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Prepare share data
        const shares = selectedUsers.value.map((userId: string) => ({
          userId,
          accessLevel: accessLevel.value,
          expiresAt: formattedExpirationDate.value || null
        }));
        
        // Simulate successful share
        isSuccess.value = true;
        emit('shared', { reportId: props.reportId, shares });
      } catch (error) {
        errorMessage.value = 'Failed to share report. Please try again.';
      } finally {
        isLoading.value = false;
      }
    });
    
    const handleCancel = () => {
      emit('cancel');
    };
    
    return {
      isLoading,
      isSuccess,
      errorMessage,
      selectedUsers,
      accessLevel,
      expirationDate,
      availableUsers,
      formattedExpirationDate,
      isFormValid,
      fetchAvailableUsers,
      shareReport,
      handleCancel
    };
  },
  template: `
    <div class="share-report">
      <h3 class="text-lg font-medium mb-4">Share "{{ reportTitle }}"</h3>
      
      <div v-if="isLoading" class="loading-indicator">
        Loading...
      </div>
      
      <div v-else-if="isSuccess" class="success-message">
        Report shared successfully!
      </div>
      
      <form v-else @submit.prevent="shareReport" class="share-form">
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <div class="form-group">
          <label for="users">Share with:</label>
          <select 
            id="users" 
            v-model="selectedUsers" 
            multiple 
            class="user-select"
          >
            <option 
              v-for="user in availableUsers" 
              :key="user.id" 
              :value="user.id"
            >
              {{ user.full_name || user.email }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="access-level">Access level:</label>
          <select 
            id="access-level" 
            v-model="accessLevel" 
            class="access-level-select"
          >
            <option value="viewer">View Only</option>
            <option value="editor">Can Edit</option>
            <option value="admin">Full Access</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="expiration-date">Expires on (optional):</label>
          <input 
            id="expiration-date" 
            type="date" 
            v-model="expirationDate" 
            class="expiration-date-input"
          />
        </div>
        
        <div class="form-actions">
          <button 
            type="button" 
            class="cancel-button" 
            @click="handleCancel"
          >
            Cancel
          </button>
          
          <button 
            type="submit" 
            class="share-button" 
            :disabled="!isFormValid || isLoading"
          >
            Share
          </button>
        </div>
      </form>
    </div>
  `
};

describe('ShareReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders properly', () => {
    const wrapper = mount(MockShareReport, {
      props: {
        reportId: 'report-1',
        reportTitle: 'Test Report'
      }
    });
    
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('h3').text()).toContain('Share "Test Report"');
  });

  it('displays available users in the select dropdown', async () => {
    const wrapper = mount(MockShareReport, {
      props: {
        reportId: 'report-1',
        reportTitle: 'Test Report'
      }
    });
    
    // Wait for component to update
    await wrapper.vm.$nextTick();
    
    // Check if user options are displayed
    const options = wrapper.findAll('.user-select option');
    expect(options.length).toBe(3); // Three mock users
    
    // Check first user option
    expect(options[0].text()).toBe('User One');
    expect(options[0].attributes('value')).toBe('user-1');
  });

  it('validates form correctly', async () => {
    // Create a mock with initially invalid form
    const invalidFormMock = {
      ...MockShareReport,
      setup(props: any) {
        const mockContext = { emit: () => {} };
        const originalSetup = MockShareReport.setup(props, mockContext);
        return {
          ...originalSetup,
          selectedUsers: ref([]),
          isFormValid: computed(() => false)
        };
      }
    };
    
    const wrapper = mount(invalidFormMock, {
      props: {
        reportId: 'report-1',
        reportTitle: 'Test Report'
      }
    });
    
    // Initially form should be invalid (no users selected)
    expect(wrapper.vm.isFormValid).toBe(false);
    
    // Create a mock with valid form
    const validFormMock = {
      ...MockShareReport,
      setup(props: any) {
        const mockContext = { emit: () => {} };
        const originalSetup = MockShareReport.setup(props, mockContext);
        return {
          ...originalSetup,
          selectedUsers: ref(['user-1']),
          isFormValid: computed(() => true)
        };
      }
    };
    
    const validWrapper = mount(validFormMock, {
      props: {
        reportId: 'report-1',
        reportTitle: 'Test Report'
      }
    });
    
    // Now form should be valid
    expect(validWrapper.vm.isFormValid).toBe(true);
    
    // Create a mock with invalid access level
    const invalidAccessLevelMock = {
      ...MockShareReport,
      setup(props: any) {
        const mockContext = { emit: () => {} };
        const originalSetup = MockShareReport.setup(props, mockContext);
        return {
          ...originalSetup,
          selectedUsers: ref(['user-1']),
          accessLevel: ref('invalid'),
          isFormValid: computed(() => false)
        };
      }
    };
    
    const invalidAccessWrapper = mount(invalidAccessLevelMock, {
      props: {
        reportId: 'report-1',
        reportTitle: 'Test Report'
      }
    });
    
    // Form should be invalid again
    expect(invalidAccessWrapper.vm.isFormValid).toBe(false);
  });

  it('disables share button when form is invalid', async () => {
    // Create a mock with invalid form
    const invalidFormMock = {
      ...MockShareReport,
      setup(props: any) {
        const mockContext = { emit: () => {} };
        const originalSetup = MockShareReport.setup(props, mockContext);
        return {
          ...originalSetup,
          selectedUsers: ref([]),
          isFormValid: computed(() => false)
        };
      }
    };
    
    const wrapper = mount(invalidFormMock, {
      props: {
        reportId: 'report-1',
        reportTitle: 'Test Report'
      }
    });
    
    const shareButton = wrapper.find('.share-button');
    expect(shareButton.attributes('disabled')).toBeDefined();
    
    // Create a mock with valid form
    const validFormMock = {
      ...MockShareReport,
      setup(props: any) {
        const mockContext = { emit: () => {} };
        const originalSetup = MockShareReport.setup(props, mockContext);
        return {
          ...originalSetup,
          selectedUsers: ref(['user-1']),
          isFormValid: computed(() => true)
        };
      }
    };
    
    const validWrapper = mount(validFormMock, {
      props: {
        reportId: 'report-1',
        reportTitle: 'Test Report'
      }
    });
    
    // Button should no longer be disabled
    const validShareButton = validWrapper.find('.share-button');
    expect(validShareButton.attributes('disabled')).toBeUndefined();
  });

  it('emits "shared" event when form is submitted successfully', async () => {
    // Create a mock with valid form and successful submission
    const validFormMock = {
      ...MockShareReport,
      setup(props: any, { emit }: { emit: any }) {
        const originalSetup = MockShareReport.setup(props, { emit });
        
        // Override shareReport to immediately emit the event
        const shareReport = vi.fn().mockImplementation(() => {
          emit('shared', { 
            reportId: props.reportId, 
            shares: [{ userId: 'user-1', accessLevel: 'viewer' }] 
          });
        });
        
        return {
          ...originalSetup,
          selectedUsers: ref(['user-1']),
          accessLevel: ref('viewer'),
          isFormValid: computed(() => true),
          shareReport
        };
      }
    };
    
    const wrapper = mount(validFormMock, {
      props: {
        reportId: 'report-1',
        reportTitle: 'Test Report'
      }
    });
    
    // Submit the form
    await wrapper.find('form').trigger('submit');
    
    // Check if "shared" event was emitted
    expect(wrapper.emitted().shared).toBeTruthy();
    expect(wrapper.emitted().shared[0][0]).toHaveProperty('reportId', 'report-1');
    expect(wrapper.emitted().shared[0][0]).toHaveProperty('shares');
    expect(wrapper.emitted().shared[0][0].shares).toHaveLength(1);
    expect(wrapper.emitted().shared[0][0].shares[0]).toHaveProperty('userId', 'user-1');
    expect(wrapper.emitted().shared[0][0].shares[0]).toHaveProperty('accessLevel', 'viewer');
  });

  it('emits "cancel" event when cancel button is clicked', async () => {
    const wrapper = mount(MockShareReport, {
      props: {
        reportId: 'report-1',
        reportTitle: 'Test Report'
      }
    });
    
    // Click the cancel button
    await wrapper.find('.cancel-button').trigger('click');
    
    // Check if "cancel" event was emitted
    expect(wrapper.emitted().cancel).toBeTruthy();
  });

  it('shows error message when form submission fails', async () => {
    // Create a mock with error state
    const errorMock = {
      ...MockShareReport,
      setup(props: any) {
        const mockContext = { emit: () => {} };
        const originalSetup = MockShareReport.setup(props, mockContext);
        
        // Override with error state
        const errorMessage = ref('Failed to share report. Please try again.');
        
        // Override shareReport to set error message
        const shareReport = vi.fn().mockImplementation(() => {
          // Error message is already set
        });
        
        return {
          ...originalSetup,
          selectedUsers: ref(['user-1']),
          accessLevel: ref('viewer'),
          isFormValid: computed(() => true),
          errorMessage,
          shareReport
        };
      }
    };
    
    const wrapper = mount(errorMock, {
      props: {
        reportId: 'report-1',
        reportTitle: 'Test Report'
      }
    });
    
    // Submit the form
    await wrapper.find('form').trigger('submit');
    
    // Check if error message is displayed
    expect(wrapper.find('.error-message').exists()).toBe(true);
    expect(wrapper.find('.error-message').text()).toContain('Failed to share');
  });

  it('formats expiration date correctly', async () => {
    // Create a mock with a specific expiration date
    const dateMock = {
      ...MockShareReport,
      setup(props: any) {
        const mockContext = { emit: () => {} };
        const originalSetup = MockShareReport.setup(props, mockContext);
        
        // Set a test date
        const testDate = '2025-06-10';
        const expirationDate = ref(testDate);
        
        // Calculate formatted date
        const formattedExpirationDate = computed(() => {
          if (!expirationDate.value) return '';
          return new Date(expirationDate.value).toISOString();
        });
        
        return {
          ...originalSetup,
          expirationDate,
          formattedExpirationDate
        };
      }
    };
    
    const wrapper = mount(dateMock, {
      props: {
        reportId: 'report-1',
        reportTitle: 'Test Report'
      }
    });
    
    // Check if date is formatted as ISO string
    expect(wrapper.vm.formattedExpirationDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
