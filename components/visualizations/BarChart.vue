<!-- components/visualizations/BarChart.vue -->
<template>
  <div class="bar-chart">
    <div v-if="loading" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
    </div>
    <div v-else-if="error" class="text-red-500 p-4">
      {{ error }}
    </div>
    <div v-else-if="!chartData.datasets[0].data.length" class="text-center py-8 text-gray-500">
      <UIcon name="i-heroicons-chart-bar" class="h-12 w-12 mx-auto mb-2 text-gray-400" />
      <p>No data available for chart</p>
    </div>
    <div v-else>
      <h3 v-if="title" class="text-base font-medium mb-2">{{ title }}</h3>
      <div class="chart-wrapper h-64">
        <Bar :data="chartData" :options="mergedOptions" />
      </div>
      <div v-if="xAxisLabel || yAxisLabel" class="flex justify-between text-xs text-gray-500 mt-2">
        <div v-if="xAxisLabel" class="text-center w-full">{{ xAxisLabel }}</div>
        <div v-if="yAxisLabel" class="transform -rotate-90 absolute left-0 top-1/2 text-center" style="width: 0; white-space: nowrap;">{{ yAxisLabel }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

interface DataPoint {
  x: string | number;
  y: number;
  [key: string]: any;
}

interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderRadius?: number;
}

interface BarChartProps {
  data: DataPoint[];
  labels?: string[];
  datasets?: Dataset[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  color?: string;
  colors?: string[];
  loading?: boolean;
  error?: string;
  options?: any;
  showLegend?: boolean;
  horizontal?: boolean;
  stacked?: boolean;
}

const emit = defineEmits(['bar-click']);

const props = withDefaults(defineProps<BarChartProps>(), {
  data: () => [],
  labels: undefined,
  datasets: undefined,
  title: '',
  xAxisLabel: '',
  yAxisLabel: '',
  color: '#2563EB', // Primary blue
  colors: () => [],
  loading: false,
  error: '',
  options: () => ({}),
  showLegend: false,
  horizontal: false,
  stacked: false,
});

// Default colors if not provided
const defaultColors = [
  '#2563EB', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#EC4899', // Pink
];

// Format data for Chart.js
const chartData = computed(() => {
  // If datasets are directly provided, use them
  if (props.datasets && props.labels) {
    return {
      labels: props.labels,
      datasets: props.datasets.map((dataset, index) => ({
        ...dataset,
        backgroundColor: dataset.backgroundColor || 
          (props.colors.length > 0 ? props.colors[index % props.colors.length] : defaultColors[index % defaultColors.length]),
        borderRadius: dataset.borderRadius !== undefined ? dataset.borderRadius : 4,
      }))
    };
  }
  
  // Determine if we should use multiple colors for single dataset bars
  const useMultipleColors = !props.datasets && props.colors.length > 0;
  
  // Otherwise, construct from data points
  return {
    labels: props.data.map(item => item.x),
    datasets: [
      {
        label: props.title,
        data: props.data.map(item => item.y),
        backgroundColor: useMultipleColors
          ? props.data.map((_, index) => props.colors[index % props.colors.length])
          : props.color,
        borderRadius: 4,
        borderWidth: 0,
        borderSkipped: false,
      }
    ]
  };
});

// Default chart options
const defaultOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: props.horizontal ? 'y' : 'x',
  plugins: {
    legend: {
      display: props.showLegend || (props.datasets && props.datasets.length > 1),
      position: 'top',
      align: 'end',
    },
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
  },
  scales: {
    x: {
      stacked: props.stacked,
      grid: {
        display: !props.horizontal,
        color: props.horizontal ? 'rgba(0, 0, 0, 0.05)' : undefined,
      },
      title: {
        display: false, // We display axis label separately
      },
      ticks: {
        maxRotation: 45,
        minRotation: 0,
      }
    },
    y: {
      stacked: props.stacked,
      beginAtZero: true,
      grid: {
        display: props.horizontal,
        color: !props.horizontal ? 'rgba(0, 0, 0, 0.05)' : undefined,
      },
      title: {
        display: false, // We display axis label separately
      },
    },
  },
}));

// Merge default options with user-provided options
const mergedOptions = computed(() => ({
  ...defaultOptions.value,
  ...props.options,
  onClick: (event: any, elements: any[]) => {
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const clickedLabel = chartData.value.labels[clickedIndex];
      const clickedValue = chartData.value.datasets[0].data[clickedIndex];
      
      // Get original data item if available
      const originalItem = props.data[clickedIndex];
      
      // Emit event with clicked data
      emit('bar-click', {
        label: clickedLabel,
        value: clickedValue,
        index: clickedIndex,
        originalItem
      });
    }
  }
}));
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  width: 100%;
}
</style>