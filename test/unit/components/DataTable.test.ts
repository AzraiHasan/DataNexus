// tests/unit/components/DataTable.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DataTable from '../../../components/visualizations/DataTable.vue'

describe('DataTable', () => {
  const mockData = [
    { id: 1, name: 'Tower 1', status: 'active', height: '100m' },
    { id: 2, name: 'Tower 2', status: 'inactive', height: '90m' },
    { id: 3, name: 'Tower 3', status: 'maintenance', height: '110m' }
  ]

  const mockColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'height', label: 'Height' }
  ]

  it('renders table with correct data', () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns
      }
    })

    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.findAll('th').length).toBe(4)
    expect(wrapper.findAll('tr').length).toBe(4) // Header + 3 rows
  })

  it('shows loading state when loading prop is true', () => {
    const wrapper = mount(DataTable, {
      props: {
        data: [],
        columns: mockColumns,
        loading: true
      }
    })

    expect(wrapper.find('[name="i-heroicons-arrow-path"]').exists()).toBe(true)
  })

  it('shows empty state when no data', () => {
    const wrapper = mount(DataTable, {
      props: {
        data: [],
        columns: mockColumns
      }
    })

    expect(wrapper.find('[name="i-heroicons-table-cells"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('No data available')
  })

  it('filters data with search', async () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns,
        searchable: true
      }
    })

    // Find search input and set value
    const searchInput = wrapper.find('input[type="search"]')
    await searchInput.setValue('Tower 1')
    
    // Should only show one row now
    expect(wrapper.findAll('tbody tr').length).toBe(1)
    expect(wrapper.find('tbody').text()).toContain('Tower 1')
    expect(wrapper.find('tbody').text()).not.toContain('Tower 2')
  })

  it('paginates data correctly', async () => {
    // Create more data for pagination
    const paginationData = Array(12).fill(null).map((_, i) => ({
      id: i + 1,
      name: `Tower ${i + 1}`,
      status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'inactive' : 'maintenance',
      height: `${90 + i * 5}m`
    }))

    const wrapper = mount(DataTable, {
      props: {
        data: paginationData,
        columns: mockColumns,
        pagination: true,
        pageSize: 5
      }
    })

    // First page should show 5 items
    expect(wrapper.findAll('tbody tr').length).toBe(5)
    
    // Go to next page
    const nextButton = wrapper.find('.u-pagination-next')
    await nextButton.trigger('click')
    
    // Should show items from second page
    expect(wrapper.find('tbody').text()).toContain('Tower 6')
    expect(wrapper.find('tbody').text()).not.toContain('Tower 1')
  })

  it('handles sorting', async () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns
      }
    })

    // Find the Name column header and click to sort
    const nameHeader = wrapper.findAll('th')[1]
    await nameHeader.trigger('click')
    
    // Should sort by name ascending
    let rows = wrapper.findAll('tbody tr')
    expect(rows[0].text()).toContain('Tower 1')
    expect(rows[2].text()).toContain('Tower 3')
    
    // Click again to sort descending
    await nameHeader.trigger('click')
    
    rows = wrapper.findAll('tbody tr')
    expect(rows[0].text()).toContain('Tower 3')
    expect(rows[2].text()).toContain('Tower 1')
  })
})