// composables/useChartData.ts
import { ref } from 'vue'
import _ from 'lodash'

interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  [key: string]: any;
}

interface PieChartDataItem {
  label: string;
  value: number;
  color?: string;
}

interface TransformOptions {
  sortBy?: 'value' | 'label' | 'date';
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  groupOthers?: boolean;
  dateFormat?: string;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
}

export const useChartData = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  /**
   * Transform raw data into line/bar chart format with x/y coordinates
   */
  const transformToXYSeries = (
    data: any[], 
    xKey: string, 
    yKey: string,
    options: TransformOptions = {}
  ): ChartDataPoint[] => {
    try {
      if (!data || !data.length) return [];
      
      // Extract x and y values
      let transformed = data.map(item => ({
        x: item[xKey],
        y: typeof item[yKey] === 'number' ? item[yKey] : parseFloat(item[yKey]) || 0,
        ...item // Include original data for reference
      }));
      
      // Handle date formatting if x is a date
      if (options.dateFormat && transformed.length > 0 && isDateValue(transformed[0].x)) {
        transformed = transformed.map(item => ({
          ...item,
          x: formatDate(new Date(item.x), options.dateFormat || 'MM/DD/YYYY'),
          _originalDate: item.x // Keep original date for sorting
        }));
      }
      
      // Sort data if needed
      if (options.sortBy) {
        const direction = options.sortDirection === 'desc' ? 'desc' : 'asc';
        
        if (options.sortBy === 'date' && transformed.length > 0 && transformed[0]._originalDate) {
          // Sort by original date if available
          transformed = _.orderBy(transformed, ['_originalDate'], [direction]);
        } else {
          // Sort by specified field
          const sortKey = options.sortBy === 'value' ? 'y' : 'x';
          transformed = _.orderBy(transformed, [sortKey], [direction]);
        }
      }
      
      // Limit data points and group others if needed
      if (options.limit && options.limit < transformed.length) {
        if (options.groupOthers) {
          const limitedData = transformed.slice(0, options.limit);
          const othersData = transformed.slice(options.limit);
          
          // Sum y values for 'Others' category
          const othersY = othersData.reduce((sum, item) => sum + item.y, 0);
          
          limitedData.push({
            x: 'Others',
            y: othersY,
            _isAggregated: true,
            _count: othersData.length
          });
          
          transformed = limitedData;
        } else {
          transformed = transformed.slice(0, options.limit);
        }
      }
      
      return transformed;
    } catch (err: any) {
      console.error('Error transforming chart data:', err);
      error.value = err.message;
      return [];
    }
  };
  
  /**
   * Transform raw data into pie chart format
   */
  const transformToPieSeries = (
    data: any[],
    labelKey: string,
    valueKey: string,
    options: TransformOptions = {}
  ): PieChartDataItem[] => {
    try {
      if (!data || !data.length) return [];
      
      // Extract label and value
      let transformed = data.map(item => ({
        label: item[labelKey] || 'Unnamed',
        value: typeof item[valueKey] === 'number' ? item[valueKey] : parseFloat(item[valueKey]) || 0,
        color: item.color, // Pass through any color property
        ...item // Include original data for reference
      }));
      
      // Sort data if needed
      if (options.sortBy) {
        const direction = options.sortDirection === 'desc' ? 'desc' : 'asc';
        const sortKey = options.sortBy === 'value' ? 'value' : 'label';
        
        transformed = _.orderBy(transformed, [sortKey], [direction]);
      }
      
      // Limit data points and group others if needed
      if (options.limit && options.limit < transformed.length) {
        if (options.groupOthers) {
          const limitedData = transformed.slice(0, options.limit);
          const othersData = transformed.slice(options.limit);
          
          // Sum values for 'Others' category
          const othersValue = othersData.reduce((sum, item) => sum + item.value, 0);
          
          limitedData.push({
            label: 'Others',
            value: othersValue,
            _isAggregated: true,
            _count: othersData.length
          });
          
          transformed = limitedData;
        } else {
          transformed = transformed.slice(0, options.limit);
        }
      }
      
      return transformed;
    } catch (err: any) {
      console.error('Error transforming pie chart data:', err);
      error.value = err.message;
      return [];
    }
  };
  
  /**
   * Group data by a specific key and aggregate values
   */
  const groupByAndAggregate = (
    data: any[],
    groupKey: string,
    valueKey: string,
    aggregationMethod: 'sum' | 'avg' | 'min' | 'max' | 'count' = 'sum'
  ): {[key: string]: any}[] => {
    try {
      // Group data using lodash
      const grouped = _.groupBy(data, item => item[groupKey]);
      
      // Aggregate values within each group
      const result = Object.entries(grouped).map(([key, group]) => {
        let aggregatedValue: number;
        
        switch (aggregationMethod) {
          case 'sum':
            aggregatedValue = _.sumBy(group, item => parseFloat(item[valueKey]) || 0);
            break;
          case 'avg':
            aggregatedValue = _.meanBy(group, item => parseFloat(item[valueKey]) || 0);
            break;
          case 'min':
            aggregatedValue = _.minBy(group, item => parseFloat(item[valueKey]) || 0)?.[valueKey] || 0;
            break;
          case 'max':
            aggregatedValue = _.maxBy(group, item => parseFloat(item[valueKey]) || 0)?.[valueKey] || 0;
            break;
          case 'count':
            aggregatedValue = group.length;
            break;
          default:
            aggregatedValue = _.sumBy(group, item => parseFloat(item[valueKey]) || 0);
        }
        
        return {
          [groupKey]: key,
          [valueKey]: aggregatedValue,
          _count: group.length,
          _data: group
        };
      });
      
      return result;
    } catch (err: any) {
      console.error('Error grouping data:', err);
      error.value = err.message;
      return [];
    }
  };

  /**
   * Create a time series from data with date field
   */
  const createTimeSeries = (
    data: any[],
    dateField: string,
    valueField: string,
    interval: 'day' | 'week' | 'month' | 'year' = 'month',
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' = 'sum'
  ): ChartDataPoint[] => {
    try {
      if (!data || !data.length) return [];
      
      // Check if all dates are valid
      const validData = data.filter(item => {
        const date = new Date(item[dateField]);
        return !isNaN(date.getTime());
      });
      
      if (validData.length === 0) return [];
      
      // Group by time interval
      const timeGroups = _.groupBy(validData, item => {
        const date = new Date(item[dateField]);
        
        switch (interval) {
          case 'day':
            return formatDate(date, 'YYYY-MM-DD');
          case 'week':
            // Get the first day of the week (Sunday)
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            return formatDate(weekStart, 'YYYY-MM-DD');
          case 'month':
            return formatDate(date, 'YYYY-MM');
          case 'year':
            return date.getFullYear().toString();
          default:
            return formatDate(date, 'YYYY-MM');
        }
      });
      
      // Aggregate values for each time group
      const timeSeries = Object.entries(timeGroups).map(([timeKey, group]) => {
        let value: number;
        
        switch (aggregation) {
          case 'sum':
            value = _.sumBy(group, item => parseFloat(item[valueField]) || 0);
            break;
          case 'avg':
            value = _.meanBy(group, item => parseFloat(item[valueField]) || 0);
            break;
          case 'min':
            value = _.minBy(group, item => parseFloat(item[valueField]) || 0)?.[valueField] || 0;
            break;
          case 'max':
            value = _.maxBy(group, item => parseFloat(item[valueField]) || 0)?.[valueField] || 0;
            break;
          case 'count':
            value = group.length;
            break;
          default:
            value = _.sumBy(group, item => parseFloat(item[valueField]) || 0);
        }
        
        // Format display date based on interval
        let displayDate = timeKey;
        if (interval === 'month') {
          // Convert YYYY-MM to MMM YYYY
          const [year, month] = timeKey.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          displayDate = date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        }
        
        return {
          x: displayDate,
          y: value,
          _originalDate: timeKey,
          _count: group.length,
          _data: group
        };
      });
      
      // Sort chronologically
      return timeSeries.sort((a, b) => a._originalDate.localeCompare(b._originalDate));
    } catch (err: any) {
      console.error('Error creating time series:', err);
      error.value = err.message;
      return [];
    }
  };
  
  /**
   * Calculate statistical distribution for numerical data
   */
  const calculateDistribution = (
    data: any[],
    valueField: string,
    bins: number = 10
  ): ChartDataPoint[] => {
    try {
      if (!data || !data.length) return [];
      
      // Extract numeric values
      const values = data
        .map(item => parseFloat(item[valueField]))
        .filter(val => !isNaN(val));
      
      if (values.length === 0) return [];
      
      const min = _.min(values) || 0;
      const max = _.max(values) || 0;
      
      // If min === max, create a single bin
      if (min === max) {
        return [{ x: min.toString(), y: values.length }];
      }
      
      // Create bins
      const binWidth = (max - min) / bins;
      const distribution = [];
      
      for (let i = 0; i < bins; i++) {
        const binStart = min + (i * binWidth);
        const binEnd = min + ((i + 1) * binWidth);
        const binLabel = `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`;
        
        // Count values in this bin
        const count = values.filter(val => {
          if (i === bins - 1) {
            // Include upper bound for last bin
            return val >= binStart && val <= binEnd;
          }
          return val >= binStart && val < binEnd;
        }).length;
        
        if (count > 0) {
          distribution.push({
            x: binLabel,
            y: count,
            _binStart: binStart,
            _binEnd: binEnd
          });
        }
      }
      
      return distribution;
    } catch (err: any) {
      console.error('Error calculating distribution:', err);
      error.value = err.message;
      return [];
    }
  };
  
  /**
   * Check if value is a date
   */
  const isDateValue = (value: any): boolean => {
    if (value instanceof Date) return true;
    if (typeof value === 'string') {
      // Try to parse as date
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    return false;
  };
  
  /**
   * Format date with simple format patterns
   */
  const formatDate = (date: Date, format: string): string => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return String(date);
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    // Simple format replacements
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('M', String(date.getMonth() + 1))
      .replace('D', String(date.getDate()));
  };
  
  return {
    loading,
    error,
    transformToXYSeries,
    transformToPieSeries,
    groupByAndAggregate,
    createTimeSeries,
    calculateDistribution,
    isDateValue,
    formatDate
  };
};