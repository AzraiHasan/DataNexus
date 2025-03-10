<!-- components/visualizations/LineChart.vue -->
<template>
  <div class="line-chart">
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
        <Line :data="chartData" :options="mergedOptions" />
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
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler
);

interface DataPoint {
  x: string | number;
  y: number;
  [key: string]: any;
}

interface Dataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  tension?: number;
  fill?: boolean;
}

interface LineChartProps {
  data: DataPoint[];
  labels?: string[];
  datasets?: Dataset[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  color?: string;
  loading?: boolean;
  error?: string;
  options?: any;
  showLegend?: boolean;
  showArea?: boolean;
}

const props = withDefaults(defineProps<LineChartProps>(), {
  data: () => [],
  labels: undefined,
  datasets: undefined,
  title: '',
  xAxisLabel: '',
  yAxisLabel: '',
  color: '#2563EB', // Primary blue
  loading: false,
  error: '',
  options: () => ({}),
  showLegend: false,
  showArea: false,
});

// Format data for Chart.js
const chartData = computed(() => {
  // If datasets are directly provided, use them
  if (props.datasets && props.labels) {
    return {
      labels: props.labels,
      datasets: props.datasets.map(dataset => ({
        ...dataset,
        borderColor: dataset.borderColor || props.color,
        backgroundColor: dataset.backgroundColor || 
          (props.showArea ? `${props.color}20` : props.color), // transparent background for area
        tension: dataset.tension !== undefined ? dataset.tension : 0.2,
        fill: dataset.fill !== undefined ? dataset.fill : props.showArea,
      }))
    };
  }
  
  // Otherwise, construct from data points
  return {
    labels: props.data.map(item => item.x),
    datasets: [
      {
        label: props.title,
        data: props.data.map(item => item.y),
        borderColor: props.color,
        backgroundColor: props.showArea ? `${props.color}20` : props.color, // Add transparency for area fill
        fill: props.showArea,
        tension: 0.2, // Slight curve
        pointBackgroundColor: props.color,
        pointRadius: 3,
        pointHoverRadius: 5,
      }
    ]
  };
});

// Default chart options
const defaultOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: props.showLegend,
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
      grid: {
        display: false,
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
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
      title: {
        display: false, // We display axis label separately
      },
      ticks: {
        padding: 10,
      }
    },
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
  elements: {
    line: {
      borderWidth: 2,
    },
  },
}));

// Merge default options with user-provided options
const mergedOptions = computed(() => ({
  ...defaultOptions.value,
  ...props.options
}));
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  width: 100%;
}
</style>