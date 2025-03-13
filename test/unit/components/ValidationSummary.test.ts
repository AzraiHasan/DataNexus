// tests/unit/components/ValidationSummary.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ValidationSummary from '../../../components/ValidationSummary.vue'
import type { ValidationResult } from '../../../types/validation'

describe('ValidationSummary', () => {
  let validationResult: ValidationResult

  beforeEach(() => {
    // Reset validation result before each test
    validationResult = {
      valid: false,
      errors: [
        { row: 2, column: 'name', message: 'Name is required', severity: 'critical' },
        { row: 3, column: 'email', message: 'Invalid email format', severity: 'major' },
        { row: 5, column: 'phone', message: 'Phone number format is invalid', severity: 'minor' }
      ],
      summary: {
        total: 10,
        valid: 7,
        invalid: 3
      }
    }
  })

  it('renders loading state correctly', () => {
    const wrapper = mount(ValidationSummary, {
      props: {
        loading: true
      }
    })
    
    expect(wrapper.find('[name="i-heroicons-arrow-path"]').exists()).toBe(true)
  })

  it('displays validation summary metrics when provided', () => {
    const wrapper = mount(ValidationSummary, {
      props: {
        result: validationResult
      }
    })

    expect(wrapper.text()).toContain('Total Rows')
    expect(wrapper.text()).toContain('10')
    expect(wrapper.text()).toContain('Valid')
    expect(wrapper.text()).toContain('7')
    expect(wrapper.text()).toContain('Invalid')
    expect(wrapper.text()).toContain('3')
  })

  it('categorizes errors by severity', () => {
    const wrapper = mount(ValidationSummary, {
      props: {
        result: validationResult
      }
    })

    expect(wrapper.text()).toContain('Critical Issues')
    expect(wrapper.text()).toContain('Major Issues')
    expect(wrapper.text()).toContain('Minor Issues')
    expect(wrapper.text()).toContain('Name is required')
    expect(wrapper.text()).toContain('Invalid email format')
    expect(wrapper.text()).toContain('Phone number format is invalid')
  })

  it('shows valid badge when validation passes', () => {
    const validResult: ValidationResult = {
      valid: true,
      errors: [],
      summary: {
        total: 10,
        valid: 10,
        invalid: 0
      }
    }

    const wrapper = mount(ValidationSummary, {
      props: {
        result: validResult
      }
    })

    const badge = wrapper.find('.u-badge')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('Valid')
  })

  it('shows guidance when errors are present', () => {
    const wrapper = mount(ValidationSummary, {
      props: {
        result: validationResult
      }
    })

    expect(wrapper.text()).toContain('Next Steps')
    expect(wrapper.text()).toContain('Review the issues')
  })

  it('shows success message when no errors', () => {
    const validResult: ValidationResult = {
      valid: true,
      errors: [],
      summary: {
        total: 10,
        valid: 10,
        invalid: 0
      }
    }

    const wrapper = mount(ValidationSummary, {
      props: {
        result: validResult
      }
    })

    expect(wrapper.text()).toContain('passed all validation checks')
  })
})