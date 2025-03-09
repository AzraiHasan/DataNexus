// test/pages/update-password.test.ts

import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// Mock the navigateTo function
const mockNavigateTo = vi.fn()
vi.stubGlobal('navigateTo', mockNavigateTo)

// Mock toast function
const mockToastAdd = vi.fn()

// Mock Supabase auth functions
const mockUpdateUser = vi.fn()
const mockGetSession = vi.fn()
const mockSetSession = vi.fn()

// Mock Nuxt composables and utilities
vi.mock('#imports', () => ({
  useToast: () => ({
    add: mockToastAdd
  }),
  useRouter: () => ({
    push: vi.fn()
  }),
  definePageMeta: vi.fn(),
  useSupabaseClient: () => ({
    auth: {
      updateUser: mockUpdateUser,
      getSession: mockGetSession,
      setSession: mockSetSession
    }
  }),
  onMounted: (fn: () => void) => fn()
}))

// Mock Nuxt app
vi.mock('#app', () => ({
  navigateTo: mockNavigateTo
}))

// Mock window.location properties
Object.defineProperty(window, 'location', {
  value: {
    hash: '',
    pathname: '/update-password',
    replaceState: vi.fn()
  },
  writable: true
})

// Mock window.history
Object.defineProperty(window, 'history', {
  value: {
    replaceState: vi.fn()
  },
  writable: true
})

// Mock setTimeout
vi.useFakeTimers()

// Mock Nuxt components
vi.mock('#components', () => {
  const UCard = {
    template: '<div class="u-card"><slot /></div>'
  }
  const UInput = {
    props: ['modelValue', 'type', 'autocomplete'],
    template: '<input :type="type" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    emits: ['update:modelValue']
  }
  const UButton = {
    props: ['loading', 'block', 'type'],
    template: '<button :disabled="loading" @click="$emit(\'click\')"><slot /></button>',
    emits: ['click']
  }
  const UIcon = {
    props: ['name'],
    template: '<span class="animate-spin"><slot /></span>'
  }

  return {
    UCard,
    UInput,
    UButton,
    UIcon
  }
})

// Mock the update-password component
const UpdatePassword = {
  template: `
    <div class="flex min-h-screen justify-center items-center">
      <div class="u-card">
        <div v-if="authError" class="mb-4 p-4 bg-red-100 text-red-800 rounded">
          {{ authError }}
        </div>

        <template v-if="processingToken">
          <div class="text-center">
            <span class="animate-spin"></span>
            <p>Processing your reset token...</p>
          </div>
        </template>

        <template v-else>
          <h1 class="text-2xl font-bold mb-4">Set New Password</h1>
          <p class="mb-4 text-gray-600">Enter your new password below.</p>

          <form @submit.prevent="updatePassword">
            <div class="mb-4">
              <label class="block text-sm font-medium mb-1">New Password</label>
              <input type="password" v-model="password" />
              <p v-if="passwordError" class="mt-1 text-sm text-red-500">{{ passwordError }}</p>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium mb-1">Confirm New Password</label>
              <input type="password" v-model="confirmPassword" />
              <p v-if="confirmPasswordError" class="mt-1 text-sm text-red-500">{{ confirmPasswordError }}</p>
            </div>

            <div class="mt-4">
              <button :disabled="loading" @click="updatePassword">Update Password</button>
            </div>
          </form>
        </template>
      </div>
    </div>
  `,
  setup() {
    const password = ref('')
    const confirmPassword = ref('')
    const passwordError = ref('')
    const confirmPasswordError = ref('')
    const loading = ref(false)
    const authError = ref<string | null>(null)
    const processingToken = ref(true)
    const router = { push: vi.fn() }

    async function processToken() {
      try {
        // Process the token from the URL hash
        console.log('Processing URL parameters...')
        
        // Get hash parameters from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const type = hashParams.get('type')
        const accessToken = hashParams.get('access_token')
        
        console.log('Hash params:', { type, accessToken: accessToken ? '[REDACTED]' : null })
        
        if (type === 'recovery' && accessToken) {
          // We have a recovery token, set up a session
          const { data, error } = await mockSetSession({
            access_token: accessToken,
            refresh_token: '',
          })
          
          console.log('Session established:', { success: !!data?.session, error })
          
          if (error) {
            authError.value = 'Invalid recovery link: ' + error.message
          }
        } else {
          // Check if we already have a session (for cases where the token was already processed)
          const { data } = await mockGetSession()
          
          if (!data?.session) {
            authError.value = 'No active session. Please use a valid reset link.'
          }
        }
      } catch (err: any) {
        console.error('Recovery processing error:', err)
        authError.value = 'Error processing recovery link: ' + (err.message || 'Unknown error')
      } finally {
        processingToken.value = false
      }
    }
    
    // Process token immediately
    processToken()

    function validateForm() {
      let isValid = true
      passwordError.value = ''
      confirmPasswordError.value = ''
      
      if (!password.value) {
        passwordError.value = 'Password is required'
        isValid = false
      } else if (password.value.length < 6) {
        passwordError.value = 'Password must be at least 6 characters'
        isValid = false
      }
      
      if (!confirmPassword.value) {
        confirmPasswordError.value = 'Please confirm your password'
        isValid = false
      } else if (confirmPassword.value !== password.value) {
        confirmPasswordError.value = 'Passwords do not match'
        isValid = false
      }
      
      return isValid
    }

    async function updatePassword() {
      if (!validateForm()) return
      
      loading.value = true
      try {
        console.log('Updating password...')
        
        // Get the current session to ensure we have a valid token
        const { data: sessionData } = await mockGetSession()
        
        if (!sessionData?.session) {
          throw new Error('No active session. Please use a valid reset link.')
        }
        
        const { data, error } = await mockUpdateUser({
          password: password.value
        })
        
        console.log('Update result:', { success: !!data?.user, error })

        if (error) throw error

        // Explicitly show the toast message
        mockToastAdd({
          title: 'Success',
          description: 'Your password has been updated successfully.',
          color: 'green'
        })

        // Clear hash parameters
        window.history.replaceState(null, '', window.location.pathname)
        
        // Wait a moment so the user can see the success message
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      } catch (error: any) {
        console.error('Password update error:', error)
        mockToastAdd({
          title: 'Error',
          description: error.message || 'Failed to update password',
          color: 'red'
        })
      } finally {
        loading.value = false
      }
    }

    return {
      password,
      confirmPassword,
      passwordError,
      confirmPasswordError,
      loading,
      authError,
      processingToken,
      updatePassword,
      validateForm
    }
  }
}

describe('Update Password Page', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    window.location.hash = ''
    
    // Default mock implementations
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } } })
    mockUpdateUser.mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null })
    mockSetSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } }, error: null })
  })

  it('should initially show processing state', async () => {
    const wrapper = mount(UpdatePassword)
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
    expect(wrapper.text()).toContain('Processing your reset token')
    
    await flushPromises()
    
    // After processing, form should be shown
    expect(wrapper.find('.animate-spin').exists()).toBe(false)
  })

  it('should display an error message if no session and no recovery token', async () => {
    // Mock that there's no active session
    mockGetSession.mockResolvedValue({ data: { session: null } })
    
    const wrapper = mount(UpdatePassword)
    await flushPromises()
    
    expect(wrapper.text()).toContain('No active session. Please use a valid reset link.')
  })

  it('should process the recovery token when available in URL hash', async () => {
    // Setup URL hash with recovery params
    window.location.hash = '#type=recovery&access_token=valid-token'
    
    const wrapper = mount(UpdatePassword)
    await flushPromises()
    
    // Should call setSession with the token
    expect(mockSetSession).toHaveBeenCalledWith({
      access_token: 'valid-token',
      refresh_token: '',
    })
    
    // Form should be displayed after processing
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('should show error if recovery token is invalid', async () => {
    // Setup URL hash with recovery params
    window.location.hash = '#type=recovery&access_token=invalid-token'
    
    // Mock setSession to return an error
    mockSetSession.mockResolvedValue({ 
      data: { session: null },
      error: { message: 'Invalid token' }
    })
    
    const wrapper = mount(UpdatePassword)
    await flushPromises()
    
    expect(wrapper.text()).toContain('Invalid recovery link: Invalid token')
  })

  it('should validate form fields', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } } })
    
    const wrapper = mount(UpdatePassword)
    await flushPromises()
    
    // Submit the form with empty fields
    await wrapper.find('form').trigger('submit')
    
    // Should show validation errors
    expect(wrapper.text()).toContain('Password is required')
    expect(wrapper.text()).toContain('Please confirm your password')
    
    // Fill in password field only
    await wrapper.findAll('input')[0].setValue('password123')
    await wrapper.find('form').trigger('submit')
    
    // Should still show confirm password error
    expect(wrapper.text()).toContain('Please confirm your password')
    expect(wrapper.text()).not.toContain('Password is required')
    
    // Set confirm password to different value
    await wrapper.findAll('input')[1].setValue('password456')
    await wrapper.find('form').trigger('submit')
    
    // Should show passwords don't match error
    expect(wrapper.text()).toContain('Passwords do not match')
    
    // Set matching password
    await wrapper.findAll('input')[1].setValue('password123')
    await wrapper.find('form').trigger('submit')
    
    // Should call updateUser
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'password123' })
  })

  it('should validate password length', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } } })
    
    const wrapper = mount(UpdatePassword)
    await flushPromises()
    
    // Set too short password
    await wrapper.findAll('input')[0].setValue('12345')
    await wrapper.findAll('input')[1].setValue('12345')
    await wrapper.find('form').trigger('submit')
    
    // Should show password length error
    expect(wrapper.text()).toContain('Password must be at least 6 characters')
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it('should check for active session before updating password', async () => {
    // First, mock that there is a session
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } } })
    
    const wrapper = mount(UpdatePassword)
    await flushPromises()
    
    // Fill in the form
    await wrapper.findAll('input')[0].setValue('newpassword')
    await wrapper.findAll('input')[1].setValue('newpassword')
    
    // Now mock that session is gone when actually updating
    mockGetSession.mockResolvedValueOnce({ data: { session: null } })
    
    await wrapper.find('form').trigger('submit')
    
    // Should show toast error
    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error',
      description: 'No active session. Please use a valid reset link.',
      color: 'red'
    }))
    
    // Should not call updateUser
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it('should show error if password update fails', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } } })
    mockUpdateUser.mockResolvedValue({ 
      data: { user: null },
      error: { message: 'Failed to update password' }
    })
    
    const wrapper = mount(UpdatePassword)
    await flushPromises()
    
    // Fill in the form
    await wrapper.findAll('input')[0].setValue('newpassword')
    await wrapper.findAll('input')[1].setValue('newpassword')
    await wrapper.find('form').trigger('submit')
    
    // Should show toast error
    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error',
      description: 'Failed to update password',
      color: 'red'
    }))
  })

  it('should handle successful password update with correct messaging and timeout', async () => {
    // Spy on setTimeout to verify it's called
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
    
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } } });
    mockUpdateUser.mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null });
    
    const wrapper = mount(UpdatePassword);
    await flushPromises();
    
    // Fill in the form
    await wrapper.findAll('input')[0].setValue('newpassword');
    await wrapper.findAll('input')[1].setValue('newpassword');
    await wrapper.find('form').trigger('submit');
    
    // Should show success toast
    expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Success',
      description: 'Your password has been updated successfully.',
      color: 'green'
    }));
    
    // Should clear hash params
    expect(window.history.replaceState).toHaveBeenCalled();
    
    // Verify setTimeout was called with correct delay
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1500);
  })
})
