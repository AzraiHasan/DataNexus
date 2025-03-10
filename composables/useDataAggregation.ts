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

interface TimeSeriesItem {
  date: string;
  value: number;
  count: number;
  [key: string]: any;
}

interface DistributionBucket {
  bin: string;
  count: number;
  min: number;
  max: number;
  [key: string]: any;
}

interface GeoHeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number;
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
        median: 0,
        stdDev: 0,
        q1: 0,
        q3: 0
      };
    }
    
    // Sort values for percentile calculations
    const sortedValues = [...values].sort((a, b) => a - b);
    const midpoint = Math.floor(sortedValues.length / 2);
    
    // Calculate median
    const median = sortedValues.length % 2 === 0
      ? (sortedValues[midpoint - 1] + sortedValues[midpoint]) / 2
      : sortedValues[midpoint];
    
    // Calculate quartiles
    const q1Index = Math.floor(sortedValues.length / 4);
    const q3Index = Math.floor(sortedValues.length * 3 / 4);
    const q1 = sortedValues[q1Index];
    const q3 = sortedValues[q3Index];
    
    // Calculate standard deviation
    const mean = _.mean(values);
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const stdDev = Math.sqrt(_.sum(squareDiffs) / values.length);
    
    return {
      count: values.length,
      sum: _.sum(values),
      avg: mean,
      min: _.min(values) || 0,
      max: _.max(values) || 0,
      median: median,
      stdDev: stdDev,
      q1: q1,
      q3: q3
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
        items,
        stats: calculateStats(items, valueField)
      };
    });
  };
  
  /**
   * Create a frequency distribution for a field
   */
  const frequencyDistribution = (
    data: any[], 
    field: string
  ): {value: any, count: number, percentage: number}[] => {
    // Get counts of each value
    const counts = _.countBy(data, item => item[field]);
    
    // Calculate total for percentages
    const total = data.length;
    
    // Convert to array with percentages
    return Object.entries(counts).map(([value, count]) => ({
      value,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  };
  
  /**
   * Create a histogram with specified number of bins
   */
  const histogram = (
    data: any[], 
    field: string, 
    bins: number = 10
  ): DistributionBucket[] => {
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
        max: max,
        percentage: 100,
        values: values
      }];
    }
    
    const binWidth = (max - min) / bins;
    const result: DistributionBucket[] = [];
    
    // Create bins
    for (let i = 0; i < bins; i++) {
      const binMin = min + (i * binWidth);
      const binMax = binMin + binWidth;
      const binValues = values.filter(val => (i === bins - 1) 
        ? val >= binMin && val <= binMax // Include upper bound in last bin
        : val >= binMin && val < binMax
      );
      
      result.push({
        bin: `${binMin.toFixed(2)}-${binMax.toFixed(2)}`,
        count: binValues.length,
        min: binMin,
        max: binMax,
        percentage: values.length > 0 ? (binValues.length / values.length) * 100 : 0,
        values: binValues
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
  ): TimeSeriesItem[] => {
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
    const timeSeriesData = Object.entries(groups).map(([date, items]) => {
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
        count: items.length,
        items,
        stats: calculateStats(items, valueField)
      };
    }).sort((a, b) => a.date.localeCompare(b.date)); // Sort by date
    
    // Fill in missing dates for continuous series (if requested)
    
    return timeSeriesData;
  };
  
  /**
   * Calculate geographic heatmap data
   */
  const geoHeatmapData = (
    data: any[],
    latField: string,
    lngField: string,
    valueField?: string,
    radius: number = 25
  ): GeoHeatmapPoint[] => {
    // Filter out invalid coordinates
    const validData = data.filter(item => {
      const lat = parseFloat(item[latField]);
      const lng = parseFloat(item[lngField]);
      return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    });
    
    if (validData.length === 0) {
      return [];
    }
    
    // Create heatmap points
    return validData.map(item => {
      const weight = valueField 
        ? (parseFloat(item[valueField]) || 1)
        : 1;
      
      return {
        latitude: parseFloat(item[latField]),
        longitude: parseFloat(item[lngField]),
        weight,
        radius,
        item
      };
    });
  };
  
  /**
   * Calculate correlation between two numeric fields
   */
  const calculateCorrelation = (
    data: any[],
    field1: string,
    field2: string
  ): number => {
    // Extract paired values, filtering out invalid pairs
    const pairs = data
      .map(item => ({
        x: parseFloat(item[field1]),
        y: parseFloat(item[field2])
      }))
      .filter(pair => !isNaN(pair.x) && !isNaN(pair.y));
    
    if (pairs.length === 0) {
      return 0;
    }
    
    // Calculate means
    const xMean = _.meanBy(pairs, 'x');
    const yMean = _.meanBy(pairs, 'y');
    
    // Calculate covariance and standard deviations
    let xyCovar = 0;
    let xVar = 0;
    let yVar = 0;
    
    for (const pair of pairs) {
      const xDiff = pair.x - xMean;
      const yDiff = pair.y - yMean;
      xyCovar += xDiff * yDiff;
      xVar += xDiff * xDiff;
      yVar += yDiff * yDiff;
    }
    
    // Pearson correlation coefficient
    // Avoid division by zero
    if (xVar === 0 || yVar === 0) {
      return 0;
    }
    
    const correlation = xyCovar / (Math.sqrt(xVar) * Math.sqrt(yVar));
    
    // Handle NaN (division by zero)
    return isNaN(correlation) ? 0 : correlation;
  };
  
  /**
   * Calculate basic forecasting for time series
   */
  const simpleForecast = (
    data: TimeSeriesItem[],
    periods: number = 3,
    method: 'linear' | 'average' | 'last' = 'linear'
  ): TimeSeriesItem[] => {
    if (data.length === 0) {
      return [];
    }
    
    // Clone the data to avoid modifying the original
    const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
    
    // Extract last date and parse it to get the next periods
    const lastDateStr = sortedData[sortedData.length - 1].date;
    let nextDate: Date;
    let dateFormat: (d: Date) => string;
    let increment: (d: Date) => Date;
    
    // Determine date format and increment function
    if (lastDateStr.includes('-W')) {
      // Weekly format (YYYY-WW)
      const [year, week] = lastDateStr.split('-W').map(Number);
      nextDate = new Date(year, 0, 1 + (week * 7));
      dateFormat = (d: Date) => {
        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
        const daysSinceFirstDay = Math.floor((d.getTime() - firstDayOfYear.getTime()) / 86400000) + 1;
        return `${d.getFullYear()}-W${Math.ceil(daysSinceFirstDay / 7)}`;
      };
      increment = (d: Date) => {
        const newDate = new Date(d);
        newDate.setDate(d.getDate() + 7);
        return newDate;
      };
    } else if (lastDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Daily format (YYYY-MM-DD)
      const [year, month, day] = lastDateStr.split('-').map(Number);
      nextDate = new Date(year, month - 1, day);
      dateFormat = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      increment = (d: Date) => {
        const newDate = new Date(d);
        newDate.setDate(d.getDate() + 1);
        return newDate;
      };
    } else if (lastDateStr.match(/^\d{4}-\d{2}$/)) {
      // Monthly format (YYYY-MM)
      const [year, month] = lastDateStr.split('-').map(Number);
      nextDate = new Date(year, month - 1, 1);
      dateFormat = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      increment = (d: Date) => {
        const newDate = new Date(d);
        newDate.setMonth(d.getMonth() + 1);
        return newDate;
      };
    } else {
      // Yearly format (YYYY)
      nextDate = new Date(parseInt(lastDateStr), 0, 1);
      dateFormat = (d: Date) => `${d.getFullYear()}`;
      increment = (d: Date) => {
        const newDate = new Date(d);
        newDate.setFullYear(d.getFullYear() + 1);
        return newDate;
      };
    }
    
    // Generate forecasted values
    const forecasted: TimeSeriesItem[] = [];
    
    // Methods to calculate forecasted values
    const calculateForecasted = (method: 'linear' | 'average' | 'last'): number[] => {
      if (method === 'linear') {
        // Linear regression
        const n = sortedData.length;
        const xValues = Array.from({ length: n }, (_, i) => i);
        const yValues = sortedData.map(d => d.value);
        
        // Calculate slope and intercept
        const xMean = _.mean(xValues);
        const yMean = _.mean(yValues);
        
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < n; i++) {
          numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
          denominator += Math.pow(xValues[i] - xMean, 2);
        }
        
        const slope = denominator === 0 ? 0 : numerator / denominator;
        const intercept = yMean - (slope * xMean);
        
        // Generate forecasted values
        return Array.from({ length: periods }, (_, i) => intercept + slope * (n + i));
      } else if (method === 'average') {
        // Moving average (last 3 periods or all if less than 3)
        const numPeriods = Math.min(3, sortedData.length);
        const lastValues = sortedData.slice(-numPeriods).map(d => d.value);
        const avgValue = _.mean(lastValues);
        
        return Array(periods).fill(avgValue);
      } else {
        // Last value method
        const lastValue = sortedData[sortedData.length - 1].value;
        
        return Array(periods).fill(lastValue);
      }
    };
    
    const forecastedValues = calculateForecasted(method);
    
    // Create forecasted data points
    for (let i = 0; i < periods; i++) {
      // Increment date for next period
      nextDate = increment(nextDate);
      
      forecasted.push({
        date: dateFormat(nextDate),
        value: forecastedValues[i],
        count: 0,
        forecast: true
      });
    }
    
    return forecasted;
  };
  
  return {
    calculateStats,
    groupByField,
    frequencyDistribution,
    histogram,
    timeAggregation,
    geoHeatmapData,
    calculateCorrelation,
    simpleForecast
  };
};
