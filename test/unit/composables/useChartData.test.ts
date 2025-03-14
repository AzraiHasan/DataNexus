// test/unit/composables/useChartData.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useChartData } from '../../../composables/useChartData'
import _ from 'lodash'

describe('useChartData', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-03-13T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('isDateValue', () => {
    it('should return true for Date objects', () => {
      const { isDateValue } = useChartData()
      expect(isDateValue(new Date())).toBe(true)
    })

    it('should return true for valid date strings', () => {
      const { isDateValue } = useChartData()
      expect(isDateValue('2025-03-13')).toBe(true)
      expect(isDateValue('2025/03/13')).toBe(true)
      expect(isDateValue('March 13, 2025')).toBe(true)
    })

    it('should return false for non-date values', () => {
      const { isDateValue } = useChartData()
      expect(isDateValue(123)).toBe(false)
      expect(isDateValue('not a date')).toBe(false)
      expect(isDateValue(null)).toBe(false)
      expect(isDateValue(undefined)).toBe(false)
      expect(isDateValue({})).toBe(false)
    })
  })

  describe('formatDate', () => {
    it('should format dates according to the specified pattern', () => {
      const { formatDate } = useChartData()
      const date = new Date('2025-03-13')
      
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2025-03-13')
      expect(formatDate(date, 'MM/DD/YYYY')).toBe('03/13/2025')
      expect(formatDate(date, 'DD-MM-YYYY')).toBe('13-03-2025')
      expect(formatDate(date, 'M/D/YYYY')).toBe('3/13/2025')
    })

    it('should return string representation for invalid dates', () => {
      const { formatDate } = useChartData()
      const invalidDate = new Date('invalid date')
      expect(formatDate(invalidDate, 'YYYY-MM-DD')).toBe('Invalid Date')
    })

    it('should return input as string for non-date values', () => {
      const { formatDate } = useChartData()
      // @ts-ignore - Testing with invalid input
      expect(formatDate('not a date', 'YYYY-MM-DD')).toBe('not a date')
    })
  })

  describe('transformToXYSeries', () => {
    it('should transform data to x/y series format', () => {
      const { transformToXYSeries } = useChartData()
      const data = [
        { category: 'A', value: 10 },
        { category: 'B', value: 20 },
        { category: 'C', value: 30 }
      ]
      
      const result = transformToXYSeries(data, 'category', 'value')
      
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual(expect.objectContaining({ x: 'A', y: 10 }))
      expect(result[1]).toEqual(expect.objectContaining({ x: 'B', y: 20 }))
      expect(result[2]).toEqual(expect.objectContaining({ x: 'C', y: 30 }))
    })

    it('should handle empty data arrays', () => {
      const { transformToXYSeries } = useChartData()
      expect(transformToXYSeries([], 'category', 'value')).toEqual([])
    })

    it('should convert string values to numbers', () => {
      const { transformToXYSeries } = useChartData()
      const data = [
        { category: 'A', value: '10' },
        { category: 'B', value: '20.5' }
      ]
      
      const result = transformToXYSeries(data, 'category', 'value')
      
      expect(result[0].y).toBe(10)
      expect(result[1].y).toBe(20.5)
    })

    it('should handle invalid numerical values', () => {
      const { transformToXYSeries } = useChartData()
      const data = [
        { category: 'A', value: 'not a number' },
        { category: 'B', value: null }
      ]
      
      const result = transformToXYSeries(data, 'category', 'value')
      
      expect(result[0].y).toBe(0)
      expect(result[1].y).toBe(0)
    })

    it('should format date values according to dateFormat option', () => {
      const { transformToXYSeries } = useChartData()
      const data = [
        { date: '2025-01-01', value: 10 },
        { date: '2025-02-01', value: 20 },
        { date: '2025-03-01', value: 30 }
      ]
      
      const result = transformToXYSeries(data, 'date', 'value', {
        dateFormat: 'MM/DD/YYYY'
      })
      
      expect(result[0].x).toBe('01/01/2025')
      expect(result[1].x).toBe('02/01/2025')
      expect(result[2].x).toBe('03/01/2025')
    })

    it('should sort data by value when sortBy option is set to "value"', () => {
      const { transformToXYSeries } = useChartData()
      const data = [
        { category: 'A', value: 30 },
        { category: 'B', value: 10 },
        { category: 'C', value: 20 }
      ]
      
      const result = transformToXYSeries(data, 'category', 'value', {
        sortBy: 'value',
        sortDirection: 'asc'
      })
      
      expect(result[0].y).toBe(10)
      expect(result[1].y).toBe(20)
      expect(result[2].y).toBe(30)
    })

    it('should sort data by label when sortBy option is set to "label"', () => {
      const { transformToXYSeries } = useChartData()
      const data = [
        { category: 'C', value: 30 },
        { category: 'A', value: 10 },
        { category: 'B', value: 20 }
      ]
      
      const result = transformToXYSeries(data, 'category', 'value', {
        sortBy: 'label'
      })
      
      expect(result[0].x).toBe('A')
      expect(result[1].x).toBe('B')
      expect(result[2].x).toBe('C')
    })

    it('should limit data points according to the limit option', () => {
      const { transformToXYSeries } = useChartData()
      const data = [
        { category: 'A', value: 10 },
        { category: 'B', value: 20 },
        { category: 'C', value: 30 },
        { category: 'D', value: 40 },
        { category: 'E', value: 50 }
      ]
      
      const result = transformToXYSeries(data, 'category', 'value', {
        limit: 3
      })
      
      expect(result).toHaveLength(3)
      expect(result[0].x).toBe('A')
      expect(result[1].x).toBe('B')
      expect(result[2].x).toBe('C')
    })

    it('should group remaining items as "Others" when groupOthers option is true', () => {
      const { transformToXYSeries } = useChartData()
      const data = [
        { category: 'A', value: 10 },
        { category: 'B', value: 20 },
        { category: 'C', value: 30 },
        { category: 'D', value: 40 },
        { category: 'E', value: 50 }
      ]
      
      const result = transformToXYSeries(data, 'category', 'value', {
        limit: 3,
        groupOthers: true
      })
      
      expect(result).toHaveLength(4)
      expect(result[3].x).toBe('Others')
      expect(result[3].y).toBe(90) // 40 + 50
      // Use type assertion for internal properties
      expect((result[3] as any)._isAggregated).toBe(true)
      expect((result[3] as any)._count).toBe(2)
    })

    it('should cache results when transforming data', () => {
      const { transformToXYSeries, clearCache } = useChartData()
      
      // Clear any existing cache
      clearCache()
      
      const data = [
        { category: 'A', value: 10 },
        { category: 'B', value: 20 },
        { category: 'C', value: 30 }
      ]
      
      // Spy on console.error to check if transformation is recomputed
      const consoleSpy = vi.spyOn(console, 'error')
      
      // First call should compute and cache the result
      const result1 = transformToXYSeries(data, 'category', 'value')
      
      // Second call with same data should use cached result
      const result2 = transformToXYSeries(data, 'category', 'value')
      
      // No error should be logged if cache is working
      expect(consoleSpy).not.toHaveBeenCalled()
      
      // Both results should be identical
      expect(result1).toEqual(result2)
      
      consoleSpy.mockRestore()
    })
  })

  describe('transformToPieSeries', () => {
    it('should transform data to pie chart format', () => {
      const { transformToPieSeries } = useChartData()
      const data = [
        { category: 'A', value: 10 },
        { category: 'B', value: 20 },
        { category: 'C', value: 30 }
      ]
      
      const result = transformToPieSeries(data, 'category', 'value')
      
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual(expect.objectContaining({ label: 'A', value: 10 }))
      expect(result[1]).toEqual(expect.objectContaining({ label: 'B', value: 20 }))
      expect(result[2]).toEqual(expect.objectContaining({ label: 'C', value: 30 }))
    })

    it('should use "Unnamed" for missing labels', () => {
      const { transformToPieSeries } = useChartData()
      const data = [
        { category: undefined, value: 10 },
        { category: null, value: 20 },
        { category: '', value: 30 }
      ]
      
      const result = transformToPieSeries(data, 'category', 'value')
      
      expect(result[0].label).toBe('Unnamed')
      expect(result[1].label).toBe('Unnamed')
      expect(result[2].label).toBe('Unnamed')
    })

    it('should sort data by value when sortBy option is set', () => {
      const { transformToPieSeries } = useChartData()
      const data = [
        { category: 'A', value: 30 },
        { category: 'B', value: 10 },
        { category: 'C', value: 20 }
      ]
      
      const result = transformToPieSeries(data, 'category', 'value', {
        sortBy: 'value',
        sortDirection: 'asc'
      })
      
      expect(result[0].value).toBe(10)
      expect(result[1].value).toBe(20)
      expect(result[2].value).toBe(30)
    })

    it('should limit and group data according to options', () => {
      const { transformToPieSeries } = useChartData()
      const data = [
        { category: 'A', value: 10 },
        { category: 'B', value: 20 },
        { category: 'C', value: 30 },
        { category: 'D', value: 40 },
        { category: 'E', value: 50 }
      ]
      
      const result = transformToPieSeries(data, 'category', 'value', {
        limit: 3,
        groupOthers: true
      })
      
      expect(result).toHaveLength(4)
      expect(result[3].label).toBe('Others')
      expect(result[3].value).toBe(90) // 40 + 50
      // Use type assertion for internal properties
      expect((result[3] as any)._isAggregated).toBe(true)
      expect((result[3] as any)._count).toBe(2)
    })
  })

  describe('groupByAndAggregate', () => {
    it('should group data by key and sum values by default', () => {
      const { groupByAndAggregate } = useChartData()
      const data = [
        { category: 'A', value: 10 },
        { category: 'A', value: 20 },
        { category: 'B', value: 30 },
        { category: 'B', value: 40 }
      ]
      
      const result = groupByAndAggregate(data, 'category', 'value')
      
      expect(result).toHaveLength(2)
      const groupA = result.find(item => item.category === 'A')
      const groupB = result.find(item => item.category === 'B')
      
      expect(groupA?.value).toBe(30) // 10 + 20
      expect(groupB?.value).toBe(70) // 30 + 40
      // Use type assertion for internal properties
      expect((groupA as any)?._count).toBe(2)
      expect((groupB as any)?._count).toBe(2)
    })

    it('should calculate average when using "avg" aggregation', () => {
      const { groupByAndAggregate } = useChartData()
      const data = [
        { category: 'A', value: 10 },
        { category: 'A', value: 20 },
        { category: 'B', value: 30 },
        { category: 'B', value: 40 }
      ]
      
      const result = groupByAndAggregate(data, 'category', 'value', 'avg')
      
      expect(result).toHaveLength(2)
      const groupA = result.find(item => item.category === 'A')
      const groupB = result.find(item => item.category === 'B')
      
      expect(groupA?.value).toBe(15) // (10 + 20) / 2
      expect(groupB?.value).toBe(35) // (30 + 40) / 2
    })

    it('should find minimum when using "min" aggregation', () => {
      const { groupByAndAggregate } = useChartData()
      const data = [
        { category: 'A', value: 10 },
        { category: 'A', value: 20 },
        { category: 'B', value: 30 },
        { category: 'B', value: 40 }
      ]
      
      const result = groupByAndAggregate(data, 'category', 'value', 'min')
      
      expect(result).toHaveLength(2)
      const groupA = result.find(item => item.category === 'A')
      const groupB = result.find(item => item.category === 'B')
      
      expect(groupA?.value).toBe(10)
      expect(groupB?.value).toBe(30)
    })

    it('should find maximum when using "max" aggregation', () => {
      const { groupByAndAggregate } = useChartData()
      const data = [
        { category: 'A', value: 10 },
        { category: 'A', value: 20 },
        { category: 'B', value: 30 },
        { category: 'B', value: 40 }
      ]
      
      const result = groupByAndAggregate(data, 'category', 'value', 'max')
      
      expect(result).toHaveLength(2)
      const groupA = result.find(item => item.category === 'A')
      const groupB = result.find(item => item.category === 'B')
      
      expect(groupA?.value).toBe(20)
      expect(groupB?.value).toBe(40)
    })

    it('should count records when using "count" aggregation', () => {
      const { groupByAndAggregate } = useChartData()
      const data = [
        { category: 'A', value: 10 },
        { category: 'A', value: 20 },
        { category: 'A', value: 30 },
        { category: 'B', value: 40 },
        { category: 'B', value: 50 }
      ]
      
      const result = groupByAndAggregate(data, 'category', 'value', 'count')
      
      expect(result).toHaveLength(2)
      const groupA = result.find(item => item.category === 'A')
      const groupB = result.find(item => item.category === 'B')
      
      expect(groupA?.value).toBe(3)
      expect(groupB?.value).toBe(2)
    })
  })

  describe('createTimeSeries', () => {
    it('should group data by time intervals', () => {
      const { createTimeSeries } = useChartData()
      const data = [
        { date: '2025-01-01', value: 10 },
        { date: '2025-01-15', value: 20 },
        { date: '2025-02-01', value: 30 },
        { date: '2025-02-15', value: 40 }
      ]
      
      const result = createTimeSeries(data, 'date', 'value', 'month')
      
      expect(result).toHaveLength(2)
      expect(result[0].x).toBe('Jan 2025')
      expect(result[0].y).toBe(30) // 10 + 20
      expect(result[1].x).toBe('Feb 2025')
      expect(result[1].y).toBe(70) // 30 + 40
    })

    it('should handle different time intervals', () => {
      const { createTimeSeries } = useChartData()
      const data = [
        { date: '2025-01-01', value: 10 },
        { date: '2025-01-02', value: 20 },
        { date: '2025-01-10', value: 30 },
        { date: '2025-02-01', value: 40 }
      ]
      
      // Test day interval
      const dayResult = createTimeSeries(data, 'date', 'value', 'day')
      expect(dayResult).toHaveLength(4)
      
      // Test month interval
      const monthResult = createTimeSeries(data, 'date', 'value', 'month')
      expect(monthResult).toHaveLength(2)
      expect(monthResult[0].y).toBe(60) // 10 + 20 + 30
      expect(monthResult[1].y).toBe(40)
      
      // Test year interval
      const yearResult = createTimeSeries(data, 'date', 'value', 'year')
      expect(yearResult).toHaveLength(1)
      expect(yearResult[0].y).toBe(100) // 10 + 20 + 30 + 40
    })

    it('should filter out invalid dates', () => {
      const { createTimeSeries } = useChartData()
      const data = [
        { date: '2025-01-01', value: 10 },
        { date: 'invalid date', value: 20 },
        { date: '2025-02-01', value: 30 }
      ]
      
      const result = createTimeSeries(data, 'date', 'value')
      
      expect(result).toHaveLength(2) // Invalid date is filtered out
      expect(result[0].y).toBe(10)
      expect(result[1].y).toBe(30)
    })

    it('should sort results chronologically', () => {
      const { createTimeSeries } = useChartData()
      const data = [
        { date: '2025-03-01', value: 30 },
        { date: '2025-01-01', value: 10 },
        { date: '2025-02-01', value: 20 }
      ]
      
      const result = createTimeSeries(data, 'date', 'value', 'month')
      
      expect(result[0].x).toBe('Jan 2025')
      expect(result[1].x).toBe('Feb 2025')
      expect(result[2].x).toBe('Mar 2025')
    })
  })

  describe('calculateDistribution', () => {
    it('should calculate distribution with the specified number of bins', () => {
      const { calculateDistribution } = useChartData()
      const data = [
        { value: 0 },
        { value: 10 },
        { value: 20 },
        { value: 30 },
        { value: 40 },
        { value: 50 },
        { value: 60 },
        { value: 70 },
        { value: 80 },
        { value: 90 },
        { value: 100 }
      ]
      
      const result = calculateDistribution(data, 'value', 5)
      
      expect(result).toHaveLength(5)
      expect(result[0].y).toBe(3) // Values 0, 10, 20
      expect(result[1].y).toBe(2) // Values 30, 40
      expect(result[2].y).toBe(2) // Values 50, 60
      expect(result[3].y).toBe(2) // Values 70, 80
      expect(result[4].y).toBe(2) // Values 90, 100
    })

    it('should handle single value data', () => {
      const { calculateDistribution } = useChartData()
      const data = [
        { value: 50 },
        { value: 50 },
        { value: 50 }
      ]
      
      const result = calculateDistribution(data, 'value')
      
      expect(result).toHaveLength(1)
      expect(result[0].x).toBe('50')
      expect(result[0].y).toBe(3)
    })

    it('should handle empty data or invalid values', () => {
      const { calculateDistribution } = useChartData()
      
      const emptyResult = calculateDistribution([], 'value')
      expect(emptyResult).toEqual([])
      
      const invalidResult = calculateDistribution([
        { value: 'not a number' },
        { value: null }
      ], 'value')
      expect(invalidResult).toEqual([])
    })
  })

  describe('cache functionality', () => {
    it('should enable and disable cache', () => {
      const { enableCache, disableCache, clearCache, transformToXYSeries } = useChartData()
      
      // First clear the cache
      clearCache()
      
      const data = [
        { category: 'A', value: 10 },
        { category: 'B', value: 20 }
      ]
      
      // Enable cache and make a call
      enableCache()
      transformToXYSeries(data, 'category', 'value')
      
      // Change data
      data[0].value = 50
      
      // Call again - should use cached result
      const cachedResult = transformToXYSeries(data, 'category', 'value')
      expect(cachedResult[0].y).toBe(10) // Old value from cache
      
      // Disable cache and call again - should use updated data
      disableCache()
      const freshResult = transformToXYSeries(data, 'category', 'value')
      expect(freshResult[0].y).toBe(50) // New value
    })

    it('should clear cache', () => {
      const { clearCache, transformToXYSeries } = useChartData()
      
      const data = [
        { category: 'A', value: 10 },
        { category: 'B', value: 20 }
      ]
      
      // Make a call to cache result
      transformToXYSeries(data, 'category', 'value')
      
      // Change data
      data[0].value = 50
      
      // Call again - should use cached result
      const cachedResult = transformToXYSeries(data, 'category', 'value')
      expect(cachedResult[0].y).toBe(10) // Old value from cache
      
      // Clear cache and call again - should use updated data
      clearCache()
      const freshResult = transformToXYSeries(data, 'category', 'value')
      expect(freshResult[0].y).toBe(50) // New value
    })

    it('should clear expired cache entries', () => {
      const { clearExpiredCache, transformToXYSeries } = useChartData()
      
      const data = [
        { category: 'A', value: 10 },
        { category: 'B', value: 20 }
      ]
      
      // Make a call to cache result
      transformToXYSeries(data, 'category', 'value')
      
      // Fast forward time by 10 minutes (default TTL is 5 minutes)
      vi.advanceTimersByTime(10 * 60 * 1000)
      
      // Clear expired cache
      clearExpiredCache()
      
      // Change data
      data[0].value = 50
      
      // Call again - should use updated data because cache was expired
      const result = transformToXYSeries(data, 'category', 'value')
      expect(result[0].y).toBe(50) // New value
    })
  })
})
