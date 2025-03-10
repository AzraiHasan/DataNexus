<!-- components/reports/ReportViewer.vue -->

<template>
  <div class="report-viewer">
    <!-- Loading state -->
    <div v-if="loading" class="py-8 flex justify-center">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
      <span class="ml-2 text-gray-600">Loading report...</span>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="py-8 text-center">
      <UIcon name="i-heroicons-exclamation-triangle" class="h-12 w-12 text-red-500 mx-auto mb-4" />
      <p class="text-red-500 font-medium">{{ error }}</p>
      <UButton @click="$emit('retry')" class="mt-4" color="gray">
        Retry
      </UButton>
    </div>
    
    <!-- Report content -->
    <div v-else-if="reportData">
      <!-- Report actions bar -->
      <div class="flex justify-between mb-6">
        <h1 class="text-2xl font-bold">{{ reportData.title }}</h1>
        <div class="flex space-x-2">
          <slot name="actions">
            <UButton 
              v-for="action in actions" 
              :key="action.label"
              @click="action.handler"
              :color="action.color || 'gray'"
              :icon="action.icon"
              :disabled="action.disabled"
              :variant="action.variant || 'outline'"
              size="sm"
            >
              {{ action.label }}
            </UButton>
          </slot>
        </div>
      </div>
      
      <!-- Report metadata -->
      <div v-if="reportData.metadata && Object.keys(reportData.metadata).length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div v-for="(value, key) in reportData.metadata" :key="key" class="bg-gray-50 p-3 rounded-lg">
          <div class="text-sm text-gray-500">{{ formatMetadataKey(key) }}</div>
          <div class="font-semibold">{{ value }}</div>
        </div>
      </div>
      
      <!-- Report content -->
      <div v-if="reportData.content" class="report-content mb-6">
        <component :is="reportData.content" :data="reportData.data" />
      </div>
      
      <!-- Rendered sections -->
      <template v-else-if="reportData.sections && reportData.sections.length > 0">
        <div v-for="(section, index) in reportData.sections" :key="index" class="mb-6">
          <ReportSection 
            :title="section.title" 
            :subtitle="section.subtitle"
            :boxed="section.boxed"
          >
            <!-- Section content -->
            <component 
              v-if="section.component" 
              :is="section.component" 
              v-bind="section.props || {}" 
            />
            <div v-else-if="section.content" v-html="section.content"></div>
          </ReportSection>
        </div>
      </template>
      
      <!-- Fallback for no sections -->
      <div v-else class="text-center py-8 text-gray-500">
        <UIcon name="i-heroicons-document-text" class="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p>No report content available</p>
      </div>
      
      <!-- Report footer -->
      <div v-if="showFooter" class="mt-8 pt-4 border-t text-sm text-gray-500">
        <div class="flex justify-between">
          <div>{{ footerText }}</div>
          <div v-if="reportData.createdAt">
            Generated on {{ formatDate(new Date(reportData.createdAt)) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ReportSection from './ReportSection.vue';

interface ReportAction {
  label: string;
  handler: () => void;
  color?: string;
  icon?: string;
  disabled?: boolean;
  variant?: string;
}

interface ReportSection {
  title?: string;
  subtitle?: string;
  boxed?: boolean;
  component?: any;
  content?: string;
  props?: Record<string, any>;
}

interface ReportData {
  id?: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  content?: any;
  sections?: ReportSection[];
  data?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface ReportViewerProps {
  reportData?: ReportData;
  loading?: boolean;
  error?: string;
  actions?: ReportAction[];
  showFooter?: boolean;
  footerText?: string;
}

const props = withDefaults(defineProps<ReportViewerProps>(), {
  reportData: undefined,
  loading: false,
  error: '',
  actions: () => [],
  showFooter: true,
  footerText: 'Telecom Tower Data Analysis Platform'
});

defineEmits(['retry']);

// Format metadata keys for display
const formatMetadataKey = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

// Format date
const formatDate = (date: Date): string => {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
</script>