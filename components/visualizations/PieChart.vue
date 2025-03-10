<!-- components/visualizations/PieChart.vue -->

<template>
  <div class="pie-chart-container">
    <div v-if="loading" class="flex justify-center items-center p-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
    </div>
    <div v-else-if="error" class="text-red-500 p-4">
      {{ error }}
    </div>
    <div v-else-if="!chartData.datasets[0].data.length" class="text-center p-8 text-gray-500">
      <UIcon name="i-heroicons-chart-pie" class="h-12 w-12 mx-auto mb-2 text-gray-400" />
      <p>No data available for chart</p>
    </div>
    <div v-else>
      <h3 v-if="title" class="text-base font-medium mb-2">{{ title }}</h3>
      <div class="chart-wrapper">
        <Pie :data="chartData" :options="mergedOptions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js';

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);

interface DataItem {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: DataItem[];
  title?: string;
  loading?: boolean;
  error?: string;
  options?: any;
  colorScheme?: string[];
  donut?: boolean;
}

// Default color palette
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

const props = withDefaults(defineProps<PieChartProps>(), {
  data: () => [],
  title: '',
  loading: false,
  error: '',
  options: () => ({}),
  colorScheme: () => defaultColors,
  donut: false
});

// Format data for Chart.js
const chartData = computed(() => ({
  labels: props.data.map(item => item.label),
  datasets: [
    {
      data: props.data.map(item => item.value),
      backgroundColor: props.data.map((item, index) => 
        item.color || props.colorScheme[index % props.colorScheme.length]
      ),
      borderWidth: 0,
    }
  ]
}));

// Default chart options
const defaultOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: props.donut ? '50%' : 0,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        boxWidth: 12,
        padding: 15,
      },
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const label = context.label || '';
          const value = context.raw || 0;
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
          return `${label}: ${value} (${percentage}%)`;
        }
      }
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