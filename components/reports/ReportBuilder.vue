<!-- components/reports/ReportBuilder.vue -->

<template>
  <div class="report-builder">
    <!-- Report Header -->
    <div class="mb-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold">{{ title }}</h1>
        <div class="flex space-x-2">
          <slot name="actions">
            <!-- Default export actions -->
            <UButton
              v-if="showExportActions"
              @click="exportAsPDF"
              size="sm"
              icon="i-heroicons-document"
              variant="outline"
            >
              Export PDF
            </UButton>
            <UButton
              v-if="showExportActions"
              @click="exportAsExcel"
              size="sm"
              icon="i-heroicons-table-cells"
              variant="outline"
            >
              Export Excel
            </UButton>
            <UButton
              v-if="showExportActions"
              @click="exportAsImage"
              size="sm"
              icon="i-heroicons-photo"
              variant="outline"
            >
              Export Image
            </UButton>
          </slot>
        </div>
      </div>

      <p v-if="description" class="text-gray-500 mt-2">{{ description }}</p>

      <div v-if="metadata" class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <div
          v-for="(value, key) in metadata"
          :key="key"
          class="bg-gray-50 p-3 rounded-lg"
        >
          <div class="text-sm text-gray-500">{{ formatMetadataKey(key) }}</div>
          <div class="font-semibold">{{ value }}</div>
        </div>
      </div>
    </div>

    <!-- Report Sections -->
    <div class="space-y-6" ref="reportContent">
      <slot></slot>
    </div>

    <!-- Report Footer -->
    <div v-if="showFooter" class="mt-8 pt-4 border-t text-sm text-gray-500">
      <div class="flex justify-between">
        <div>{{ footerText }}</div>
        <div>Generated on {{ formatDate(new Date()) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface ReportBuilderProps {
  title: string;
  description?: string;
  metadata?: Record<string, string | number>;
  showExportActions?: boolean;
  showFooter?: boolean;
  footerText?: string;
}

const props = withDefaults(defineProps<ReportBuilderProps>(), {
  title: "Report",
  description: "",
  metadata: () => ({}),
  showExportActions: true,
  showFooter: true,
  footerText: "Telecom Tower Data Analysis Platform",
});

const reportContent = ref<HTMLElement | null>(null);

// Format metadata keys for display
const formatMetadataKey = (key: string): string => {
  // Convert camelCase to Title Case with spaces
  return key
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
};

// Format date
const formatDate = (date: Date): string => {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Replace your export functions with these simpler versions
const exportAsPDF = () => {
  // Placeholder for PDF export functionality
  alert('PDF export will be available in the next update. For now, you can use the browser print function.');
  // Later, when dependencies are properly installed, replace with full implementation
};

const exportAsExcel = () => {
  alert('Excel export will be available in the next update.');
};

const exportAsImage = () => {
  // Placeholder for image export functionality
  alert('Image export will be available in the next update. For now, you can use browser screenshot functionality.');
  // Later, when dependencies are properly installed, replace with full implementation
};
</script>
