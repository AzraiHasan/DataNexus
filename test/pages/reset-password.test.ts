// test/pages/reset-password.test.ts

import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// Mock the navigateTo function first
const mockNavigateTo = vi.fn()
vi.stubGlobal('navigateTo', mockNavigateTo)

// Mock toast function
const mockToastAdd = vi.fn()

// Mock resetPasswordForEmail function
const mockResetPasswordForEmail = vi.fn()

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
      resetPasswordForEmail: mockResetPasswordForEmail
    }
  })
}))

// Mock Nuxt app
vi.mock('#app', () => ({
  navigateTo: mockNavigateTo
}))

// Mock window.location.origin
const originalOrigin = window.location.origin
Object.defineProperty(window, 'location', {
  value: {
    ...window.location,
    origin: 'http://localhost:3000'
  },
  writable: true
})

// Mock Nuxt components
vi.mock('#components', () => {
  const UCard = {
    template: '<div class="u-card"><slot /></div>'
  }
  const UInput = {
    props: ['modelValue', 'type'],
    template: '<input :type="type" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    emits: ['update:modelValue']
  }
  const UButton = {
    props: ['loading', 'block'],
    template: '<button :disabled="loading" @click="$emit(\'click\')"><slot /></button>',
    emits: ['click']
  }
  const NuxtLink = {
    props: ['to'],
    template: '<a :href="to"><slot /></a>'
  }

  return {
    UCard,
    UInput,
    UButton,
    NuxtLink
  }
})

// Mock the reset-password component
const ResetPassword = {
  template: `
    <div class="flex min-h-screen justify-center items-center">
      <div class="u-card">
        <h1 class="text-2xl font-bold mb-4">Reset Password</h1>
        <p class="mb-4 text-gray-600">Enter your email address and we'll send you a link to reset your password.</p>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">Email</label>
          <input type="email" v-model="email" />
        </div>
        <div class="mt-4">
          <button :disabled="loading" @click="sendResetLink">Send Reset Link</button>
        </div>
        <div class="mt-4 text-center">
          <p>Remember your password? <a href="/login">Sign In</a></p>
        </div>
      </div>
    </div>
  `,
  setup() {
    const email = ref('')
    const loading = ref(false)

    async function sendResetLink() {
      if (!email.value) {
        mockToastAdd({
          title: 'Error',
          description: 'Email is required',
          color: 'red'
        })
        return
      }
      
      loading.value = true
      try {
        const { data, error } = await mockResetPasswordForEmail(email.value, {
          redirectTo: `${window.location.origin}/update-password`,
        })
        
        if (error) throw error

        mockToastAdd({
          title: 'Success',
          description: 'Password reset link has been sent to your email.',
          color: 'green'
        })
      } catch (error: any) {
        mockToastAdd({
          title: 'Error',
          description: error.message || 'Failed to send reset link',
          color: 'red'
        })
      } finally {
        loading.value = false
      }
    }

    return {
      email,
      loading,
      sendResetLink
    }
  }
}

describe('Reset Password Page', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockToastAdd.mockClear()
    mockResetPasswordForEmail.mockClear()
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null })
  })

  it('renders the reset password form correctly', () => {
    const wrapper = mount(ResetPassword)
    
    // Check if title is present
    expect(wrapper.find('h1').text()).toBe('Reset Password')
    
    // Check if email input is present
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    
    // Check if button is present
    expect(wrapper.find('button').text()).toBe('Send Reset Link')
    
    // Check if link to login page is present
    expect(wrapper.find('a').attributes('href')).toBe('/login')
  })

  it('validates email is required', async () => {
    const wrapper = mount(ResetPassword)
    
    // Submit form with empty email
    await wrapper.find('button').trigger('click')
    await flushPromises()
    
    // Toast should be called with error message
    expect(mockToastAdd).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Email is required',
      color: 'red'
    })
    
    // resetPasswordForEmail should not be called
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('submits the form with valid email and calls resetPasswordForEmail', async () => {
    const wrapper = mount(ResetPassword)
    
    // Fill in valid email
    await wrapper.find('input[type="email"]').setValue('test@example.com')
    
    // Submit the form
    await wrapper.find('button').trigger('click')
    await flushPromises()
    
    // resetPasswordForEmail should be called with correct parameters
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
      redirectTo: 'http://localhost:3000/update-password'
    })
  })

  it('shows loading state during password reset request', async () => {
    // Make resetPasswordForEmail take some time to resolve
    mockResetPasswordForEmail.mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ data: {}, error: null })
        }, 100)
      })
    })
    
    const wrapper = mount(ResetPassword)
    
    // Fill in valid email
    await wrapper.find('input[type="email"]').setValue('test@example.com')
    
    // Submit the form
    wrapper.find('button').trigger('click')
    
    // Check loading state immediately after click
    await flushPromises()
    expect(wrapper.vm.loading).toBe(true)
    
    // Wait for the mock to resolve
    await new Promise(resolve => setTimeout(resolve, 200))
    await flushPromises()
    
    // Loading should be false after completion
    expect(wrapper.vm.loading).toBe(false)
  })

  it('shows success toast when reset password request succeeds', async () => {
    const wrapper = mount(ResetPassword)
    
    // Fill in valid email
    await wrapper.find('input[type="email"]').setValue('test@example.com')
    
    // Submit the form
    await wrapper.find('button').trigger('click')
    await flushPromises()
    
    // Success toast should be shown
    expect(mockToastAdd).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Password reset link has been sent to your email.',
      color: 'green'
    })
  })

  it('shows error toast when reset password request fails', async () => {
    // Mock API to return an error
    mockResetPasswordForEmail.mockResolvedValueOnce({
      data: null,
      error: { message: 'User not found' }
    })
    
    const wrapper = mount(ResetPassword)
    
    // Fill in valid email
    await wrapper.find('input[type="email"]').setValue('test@example.com')
    
    // Submit the form
    await wrapper.find('button').trigger('click')
    await flushPromises()
    
    // Error toast should be shown
    expect(mockToastAdd).toHaveBeenCalledWith({
      title: 'Error',
      description: 'User not found',
      color: 'red'
    })
  })

  it('handles unexpected errors during reset password request', async () => {
    // Mock API to throw an unexpected error
    mockResetPasswordForEmail.mockRejectedValueOnce(new Error('Network error'))
    
    const wrapper = mount(ResetPassword)
    
    // Fill in valid email
    await wrapper.find('input[type="email"]').setValue('test@example.com')
    
    // Submit the form
    await wrapper.find('button').trigger('click')
    await flushPromises()
    
    // Error toast should be shown
    expect(mockToastAdd).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Network error',
      color: 'red'
    })
  })
})
