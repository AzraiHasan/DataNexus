<!-- components/reports/ReportSection.vue -->

<template>
  <div class="report-section" :class="{ 'bg-gray-50 p-6 rounded-lg': boxed }">
    <!-- Section Header -->
    <div v-if="title || subtitle || $slots.header" class="mb-4">
      <slot name="header">
        <h2 v-if="title" class="text-xl font-semibold" :class="{ 'text-primary-700': boxed }">{{ title }}</h2>
        <p v-if="subtitle" class="text-gray-500 mt-1">{{ subtitle }}</p>
      </slot>
    </div>
    
    <!-- Section Content -->
    <div class="report-section-content" :class="contentClass">
      <slot></slot>
    </div>
    
    <!-- Section Footer -->
    <div v-if="$slots.footer" class="mt-4">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ReportSectionProps {
  title?: string;
  subtitle?: string;
  boxed?: boolean;
  contentClass?: string;
}

defineProps<ReportSectionProps>();
</script>