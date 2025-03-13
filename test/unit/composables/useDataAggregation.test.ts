// test/unit/composables/useDataAggregation.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useDataAggregation } from '../../../composables/useDataAggregation'

describe('useDataAggregation', () => {
  // Sample test data
  const testData = [
    { id: 1, value: 10, category: 'A' },
    { id: 2, value: 20, category: 'B' },
    { id: 3, value: 30, category: 'A' },
    { id: 4, value: 40, category: 'B' },
    { id: 5, value: 50, category: 'C' }
  ];

  describe('calculateStats', () => {
    it('should calculate correct statistics for numeric field', () => {
      const { calculateStats } = useDataAggregation();
      
      const stats = calculateStats(testData, 'value');
      
      expect(stats.count).toBe(5);
      expect(stats.sum).toBe(150);
      expect(stats.avg).toBe(30);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(50);
      expect(stats.median).toBe(30);
      expect(stats.stdDev).toBeCloseTo(15.81, 1); // Approximation
    });

    it('should handle empty dataset', () => {
      const { calculateStats } = useDataAggregation();
      
      const stats = calculateStats([], 'value');
      
      expect(stats.count).toBe(0);
      expect(stats.sum).toBe(0);
      expect(stats.avg).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
    });
  });

  describe('groupByField', () => {
  it('should group data by field and sum values correctly', () => {
    const { groupByField } = useDataAggregation();
    
    const result = groupByField(testData, 'category', 'value', 'sum');
    
    expect(result.length).toBe(3);
    
    // Find groups and verify them
    const groupA = result.find(g => g.group === 'A');
    const groupB = result.find(g => g.group === 'B');
    const groupC = result.find(g => g.group === 'C');
    
    expect(groupA).toBeDefined();
    expect(groupA?.value).toBe(40); // 10 + 30
    expect(groupA?.count).toBe(2);
    
    expect(groupB).toBeDefined();
    expect(groupB?.value).toBe(60); // 20 + 40
    expect(groupB?.count).toBe(2);
    
    expect(groupC).toBeDefined();
    expect(groupC?.value).toBe(50);
    expect(groupC?.count).toBe(1);
  });

  it('should support different aggregation methods', () => {
    const { groupByField } = useDataAggregation();
    
    // Test average aggregation
    const avgResult = groupByField(testData, 'category', 'value', 'avg');
    const avgGroupA = avgResult.find(g => g.group === 'A');
    expect(avgGroupA?.value).toBe(20); // (10 + 30) / 2
    
    // Test min aggregation
    const minResult = groupByField(testData, 'category', 'value', 'min');
    const minGroupA = minResult.find(g => g.group === 'A');
    expect(minGroupA?.value).toBe(10);
    
    // Test max aggregation
    const maxResult = groupByField(testData, 'category', 'value', 'max');
    const maxGroupA = maxResult.find(g => g.group === 'A');
    expect(maxGroupA?.value).toBe(30);
    
    // Test count aggregation
    const countResult = groupByField(testData, 'category', 'value', 'count');
    const countGroupA = countResult.find(g => g.group === 'A');
    expect(countGroupA?.value).toBe(2);
  });

  it('should handle empty dataset', () => {
    const { groupByField } = useDataAggregation();
    const result = groupByField([], 'category', 'value', 'sum');
    expect(result).toEqual([]);
  });
});
});

