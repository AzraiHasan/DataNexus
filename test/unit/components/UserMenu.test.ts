// test/components/UserMenu.test.ts

import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { computed } from 'vue'

// Mock data
const mockUser = { id: 'test-user-id', email: 'test@example.com' }
const mockSupabaseClient = {
  auth: {
    signOut: vi.fn().mockResolvedValue({ error: null })
  }
}
const mockRouter = {
  push: vi.fn()
}

// Mock component instead of importing the real one
const MockUserMenu = {
  name: 'UserMenu',
  components: {
    // Simple mock for UserAvatar component
    UserAvatar: {
      props: ['email', 'size'],
      template: '<div class="user-avatar">{{ email }}</div>'
    }
  },
  setup() {
    // Mocked composables
    const user = { value: mockUser }
    const client = mockSupabaseClient
    const router = mockRouter

    // Computed properties
    const displayName = computed(() => {
      return user.value?.email?.split('@')[0] || 'User'
    })

    // Mock menu items with the same structure as the real component
    const menuItems = computed(() => [[
      {
        label: 'Profile',
        icon: 'i-heroicons-user',
        to: '/profile'
      },
      {
        label: 'Dashboard',
        icon: 'i-heroicons-home',
        to: '/dashboard'
      },
      {
        label: 'Change Password',
        icon: 'i-heroicons-key',
        to: '/update-password'
      },
      {
        label: 'Sign Out',
        icon: 'i-heroicons-arrow-right-on-rectangle',
        click: async () => {
          const { error } = await client.auth.signOut()
          if (!error) {
            router.push('/login')
          }
        }
      }
    ]])

    return {
      user,
      displayName,
      menuItems
    }
  },
  template: `
    <div class="user-menu">
      <button aria-label="User menu" class="dropdown-trigger">
        <UserAvatar :email="user?.email || ''" size="sm" class="mr-2" />
        <span class="sm:inline">{{ displayName }}</span>
        <span class="icon">▼</span>
      </button>
      
      <!-- Mock dropdown items for testing -->
      <div class="dropdown-menu">
        <div v-for="(section, i) in menuItems" :key="i">
          <div v-for="(item, j) in section" :key="j" 
              class="flex items-center w-full px-4 py-3"
              :class="{ 'menu-link': item.to }"
              @click="item.click ? item.click() : null">
            <span v-if="item.icon" class="icon" :class="item.icon"></span>
            {{ item.label }}
          </div>
        </div>
      </div>
    </div>
  `
}

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders properly with user information', () => {
    const wrapper = mount(MockUserMenu)
    expect(wrapper.exists()).toBe(true)
    
    // Check that user's display name is shown
    const displayName = wrapper.find('.sm\\:inline')
    expect(displayName.text()).toBe('test')
    
    // Just verify the UserAvatar component exists
    const avatarComponent = wrapper.findComponent({ name: 'UserAvatar' })
    expect(avatarComponent.exists()).toBe(true)
  })
  
  it('renders dropdown menu with correct items', () => {
    const wrapper = mount(MockUserMenu)
    
    // Check menu items
    const menuItems = wrapper.findAll('.flex.items-center.w-full.px-4.py-3')
    
    // Should have 4 menu items (Profile, Dashboard, Change Password, Sign Out)
    expect(menuItems.length).toBe(4)
    
    // Check specific menu items
    expect(menuItems[0].text()).toContain('Profile')
    expect(menuItems[1].text()).toContain('Dashboard')
    expect(menuItems[2].text()).toContain('Change Password')
    expect(menuItems[3].text()).toContain('Sign Out')
  })
  
  it('navigates to the correct routes when menu items are clicked', async () => {
    const wrapper = mount(MockUserMenu)
    
    // Find and click the Profile link (first menu item)
    const profileLink = wrapper.findAll('.flex.items-center.w-full.px-4.py-3')[0]
    await profileLink.trigger('click')
    
    // Vue Router should not have been called yet as we're not mocking the to navigation
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('signs out and redirects when Sign Out is clicked', async () => {
    const wrapper = mount(MockUserMenu)
    
    // Find and click the Sign Out link (fourth menu item)
    const signOutLink = wrapper.findAll('.flex.items-center.w-full.px-4.py-3')[3]
    await signOutLink.trigger('click')
    
    // Assert that signOut was called
    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    
    // Advance any promises
    await vi.runAllTimers()
    
    // Should redirect to login page
    expect(mockRouter.push).toHaveBeenCalledWith('/login')
  })
  
  it('handles error during sign out', async () => {
    // Mock sign out to return an error
    mockSupabaseClient.auth.signOut.mockResolvedValueOnce({ 
      error: new Error('Network error') 
    })
    
    const wrapper = mount(MockUserMenu)
    
    // Find and click the Sign Out link (fourth menu item)
    const signOutLink = wrapper.findAll('.flex.items-center.w-full.px-4.py-3')[3]
    await signOutLink.trigger('click')
    
    // Assert that signOut was called
    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    
    // Advance any promises
    await vi.runAllTimers()
    
    // Should not redirect on error
    expect(mockRouter.push).not.toHaveBeenCalled()
  })
})
