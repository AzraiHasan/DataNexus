<!-- components/visualizations/BarChart.vue -->

<template>
  <div class="bar-chart-container">
    <div v-if="loading" class="flex justify-center items-center p-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
    </div>
    <div v-else-if="error" class="text-red-500 p-4">
      {{ error }}
    </div>
    <div v-else-if="!chartData.datasets[0].data.length" class="text-center p-8 text-gray-500">
      <UIcon name="i-heroicons-chart-bar" class="h-12 w-12 mx-auto mb-2 text-gray-400" />
      <p>No data available for chart</p>
    </div>
    <div v-else>
      <h3 v-if="title" class="text-base font-medium mb-2">{{ title }}</h3>
      <div class="chart-wrapper">
        <Bar :data="chartData" :options="mergedOptions" />
      </div>
      <div v-if="xAxisLabel || yAxisLabel" class="flex justify-between text-xs text-gray-500 mt-2">
        <div v-if="xAxisLabel">{{ xAxisLabel }}</div>
        <div v-if="yAxisLabel" class="ml-auto">{{ yAxisLabel }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

interface DataPoint {
  x: string | number | Date;
  y: number;
  [key: string]: any;
}

interface BarChartProps {
  data: DataPoint[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  color?: string;
  loading?: boolean;
  error?: string;
  options?: any;
  horizontal?: boolean;
}

const props = withDefaults(defineProps<BarChartProps>(), {
  data: () => [],
  title: '',
  xAxisLabel: '',
  yAxisLabel: '',
  color: '#2563EB', // Primary blue
  loading: false,
  error: '',
  options: () => ({}),
  horizontal: false
});

// Format data for Chart.js
const chartData = computed(() => ({
  labels: props.data.map(item => item.x),
  datasets: [
    {
      label: props.title,
      data: props.data.map(item => item.y),
      backgroundColor: props.color,
      borderRadius: 4,
      borderSkipped: false,
    }
  ]
}));

// Default chart options
const defaultOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: props.horizontal ? 'y' : 'x',
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: true,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      title: {
        display: !!props.xAxisLabel,
        text: props.xAxisLabel,
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
      title: {
        display: !!props.yAxisLabel,
        text: props.yAxisLabel,
      },
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
  height: 300px;
  position: relative;
}
</style>