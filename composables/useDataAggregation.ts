// composables/useDataAggregation.ts
import _ from 'lodash'

interface AggregationResult {
  [key: string]: number;
}

interface GroupedAggregation {
  group: string | number;
  value: number;
  count: number;
  [key: string]: any;
}

export const useDataAggregation = () => {
  
  /**
   * Calculate basic statistical metrics for a numeric field
   */
  const calculateStats = (data: any[], field: string): AggregationResult => {
    // Extract numeric values, filtering out non-numeric ones
    const values = data
      .map(item => parseFloat(item[field]))
      .filter(val => !isNaN(val));
    
    if (values.length === 0) {
      return {
        count: 0,
        sum: 0,
        avg: 0,
        min: 0,
        max: 0,
        median: 0
      };
    }
    
    // Sort values for percentile calculations
    const sortedValues = [...values].sort((a, b) => a - b);
    const midpoint = Math.floor(sortedValues.length / 2);
    
    // Calculate median
    const median = sortedValues.length % 2 === 0
      ? (sortedValues[midpoint - 1] + sortedValues[midpoint]) / 2
      : sortedValues[midpoint];
    
    return {
      count: values.length,
      sum: _.sum(values),
      avg: _.mean(values),
      min: _.min(values) || 0,
      max: _.max(values) || 0,
      median: median
    };
  };
  
  /**
   * Group by a field and perform aggregation on another field
   */
  const groupByField = (
    data: any[],
    groupField: string,
    valueField: string,
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' = 'count'
  ): GroupedAggregation[] => {
    const grouped = _.groupBy(data, groupField);
    
    return Object.entries(grouped).map(([group, items]) => {
      const values = items
        .map(item => parseFloat(item[valueField]))
        .filter(val => !isNaN(val));
      
      let value = 0;
      
      switch (aggregation) {
        case 'sum':
          value = _.sum(values);
          break;
        case 'avg':
          value = values.length > 0 ? _.mean(values) : 0;
          break;
        case 'min':
          value = values.length > 0 ? _.min(values) || 0 : 0;
          break;
        case 'max':
          value = values.length > 0 ? _.max(values) || 0 : 0;
          break;
        case 'count':
          value = items.length;
          break;
      }
      
      return {
        group,
        value,
        count: items.length,
        _groupData: items // Keep reference to original data
      };
    });
  };
  
  /**
   * Create a frequency distribution for a field
   */
  const frequencyDistribution = (data: any[], field: string): {value: any, count: number}[] => {
    const counts = _.countBy(data, item => item[field]);
    
    return Object.entries(counts).map(([value, count]) => ({
      value,
      count
    }));
  };
  
  /**
   * Create a histogram with specified number of bins
   */
  const histogram = (data: any[], field: string, bins: number = 10): {bin: string, count: number, min: number, max: number}[] => {
    // Extract numeric values
    const values = data
      .map(item => parseFloat(item[field]))
      .filter(val => !isNaN(val));
    
    if (values.length === 0) {
      return [];
    }
    
    const min = _.min(values) || 0;
    const max = _.max(values) || 0;
    
    // Handle edge case of all same values
    if (min === max) {
      return [{
        bin: `${min}`,
        count: values.length,
        min: min,
        max: max
      }];
    }
    
    const binWidth = (max - min) / bins;
    const result = [];
    
    // Create bins
    for (let i = 0; i < bins; i++) {
      const binMin = min + (i * binWidth);
      const binMax = binMin + binWidth;
      const count = values.filter(val => (i === bins - 1) 
        ? val >= binMin && val <= binMax // Include upper bound in last bin
        : val >= binMin && val < binMax
      ).length;
      
      result.push({
        bin: `${binMin.toFixed(2)}-${binMax.toFixed(2)}`,
        count,
        min: binMin,
        max: binMax
      });
    }
    
    return result;
  };
  
  /**
   * Calculate time-based aggregations (daily, weekly, monthly, yearly)
   */
  const timeAggregation = (
    data: any[],
    dateField: string,
    valueField: string,
    interval: 'day' | 'week' | 'month' | 'year',
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' = 'sum'
  ): {date: string, value: number, count: number}[] => {
    // Convert dates and prepare data
    const validData = data.filter(item => {
      const dateValue = new Date(item[dateField]);
      return !isNaN(dateValue.getTime());
    });
    
    if (validData.length === 0) {
      return [];
    }
    
    // Group by the appropriate time interval
    const groups = _.groupBy(validData, item => {
      const date = new Date(item[dateField]);
      
      switch (interval) {
        case 'day':
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        case 'week':
          // Get the week number
          const weekDate = new Date(date.getTime());
          weekDate.setHours(0, 0, 0, 0);
          weekDate.setDate(weekDate.getDate() - weekDate.getDay()); // Start of week (Sunday)
          return `${weekDate.getFullYear()}-W${Math.ceil((((weekDate.getTime() - new Date(weekDate.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7)}`;
        case 'month':
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        case 'year':
          return `${date.getFullYear()}`;
        default:
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }
    });
    
    // Calculate aggregation for each group
    return Object.entries(groups).map(([date, items]) => {
      const values = items
        .map(item => parseFloat(item[valueField]))
        .filter(val => !isNaN(val));
      
      let value = 0;
      
      switch (aggregation) {
        case 'sum':
          value = _.sum(values);
          break;
        case 'avg':
          value = values.length > 0 ? _.mean(values) : 0;
          break;
        case 'min':
          value = values.length > 0 ? _.min(values) || 0 : 0;
          break;
        case 'max':
          value = values.length > 0 ? _.max(values) || 0 : 0;
          break;
        case 'count':
          value = items.length;
          break;
      }
      
      return {
        date,
        value,
        count: items.length
      };
    }).sort((a, b) => a.date.localeCompare(b.date)); // Sort by date
  };
  
  return {
    calculateStats,
    groupByField,
    frequencyDistribution,
    histogram,
    timeAggregation
  };
};