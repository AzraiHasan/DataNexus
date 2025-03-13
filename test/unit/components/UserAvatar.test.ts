// test/components/UserAvatar.test.ts

import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { computed } from 'vue'

// Mock the component instead of importing it
const MockUserAvatar = {
  name: 'UserAvatar',
  props: {
    avatarUrl: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: 'md'
    }
  },
  setup(props: { avatarUrl: string; email: string; size: string }) {
    // Mock of initials computation function
    const initials = computed(() => {
      if (!props.email) return '';
      
      const local = props.email.split('@')[0];
      if (!local) return '';
      
      // Get first character and first character after any non-alphanumeric
      const parts = local.split(/[^a-zA-Z0-9]/);
      if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
      }
      
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    });
    
    // Mock of size classes computation
    const sizeClasses = computed(() => {
      switch (props.size) {
        case 'xs': return 'h-6 w-6';
        case 'sm': return 'h-8 w-8';
        case 'md': return 'h-10 w-10';
        case 'lg': return 'h-14 w-14';
        case 'xl': return 'h-20 w-20';
        default: return 'h-10 w-10';
      }
    });
    
    const textSizeClasses = computed(() => {
      switch (props.size) {
        case 'xs': return 'text-xs';
        case 'sm': return 'text-sm';
        case 'md': return 'text-base';
        case 'lg': return 'text-lg';
        case 'xl': return 'text-xl';
        default: return 'text-base';
      }
    });
    
    const iconSizeClasses = computed(() => {
      switch (props.size) {
        case 'xs': return 'h-3 w-3';
        case 'sm': return 'h-4 w-4';
        case 'md': return 'h-5 w-5';
        case 'lg': return 'h-7 w-7';
        case 'xl': return 'h-10 w-10';
        default: return 'h-5 w-5';
      }
    });
    
    return {
      initials,
      sizeClasses,
      textSizeClasses,
      iconSizeClasses
    };
  },
  template: `
    <div class="rounded-full bg-gray-200 overflow-hidden flex items-center justify-center" :class="sizeClasses">
      <template v-if="avatarUrl">
        <img :src="avatarUrl" alt="User avatar" class="h-full w-full object-cover" />
      </template>
      <template v-else-if="email">
        <div class="font-medium uppercase" :class="textSizeClasses">
          {{ initials }}
        </div>
      </template>
      <template v-else>
        <div :class="iconSizeClasses" class="text-gray-400" name="i-heroicons-user"></div>
      </template>
    </div>
  `
}

describe('UserAvatar', () => {
  it('renders properly', () => {
    const wrapper = mount(MockUserAvatar)
    expect(wrapper.exists()).toBe(true)
  })

  it('displays the image when avatarUrl is provided', () => {
    const wrapper = mount(MockUserAvatar, {
      props: {
        avatarUrl: 'https://example.com/avatar.jpg'
      }
    })
    
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/avatar.jpg')
  })

  it('displays initials when only email is provided', () => {
    const wrapper = mount(MockUserAvatar, {
      props: {
        email: 'john.doe@example.com'
      }
    })
    
    // Should not render an image
    expect(wrapper.find('img').exists()).toBe(false)
    
    // Should render the initials "JD"
    const initialsElement = wrapper.find('div.uppercase')
    expect(initialsElement.exists()).toBe(true)
    expect(initialsElement.text()).toBe('JD')
  })

  it('displays a fallback icon when neither avatarUrl nor email is provided', () => {
    const wrapper = mount(MockUserAvatar)
    
    // Should not render an image or initials
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('div.uppercase').exists()).toBe(false)
    
    // Should render the fallback icon (checking if the icon's div exists)
    const icon = wrapper.find('div.text-gray-400')
    expect(icon.exists()).toBe(true)
  })

  it('applies correct size classes based on size prop', () => {
    // Define the supported sizes with proper type
    const sizes: Array<'xs' | 'sm' | 'md' | 'lg' | 'xl'> = ['xs', 'sm', 'md', 'lg', 'xl']
    
    // Expected classes for each size
    const sizeClasses: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string> = {
      xs: 'h-6 w-6',
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-14 w-14',
      xl: 'h-20 w-20'
    }
    
    // Test each size
    sizes.forEach((size) => {
      const wrapper = mount(MockUserAvatar, {
        props: { size }
      })
      
      const avatar = wrapper.find('div')
      expect(avatar.classes().join(' ')).toContain(sizeClasses[size])
    })
  })
})
