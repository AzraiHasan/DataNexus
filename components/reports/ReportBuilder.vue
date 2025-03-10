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
import { ref, computed } from "vue";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { utils, writeFile } from 'xlsx';

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

const exportAsPDF = async () => {
  if (!reportContent.value) return;
  
  try {
    // Show loading state
    const toast = useToast();
    toast.add({
      title: 'Exporting PDF',
      description: 'Please wait while we generate your PDF...',
      color: 'blue'
    });
    
    // Convert the report content to a canvas
    const canvas = await html2canvas(reportContent.value);
    const imgData = canvas.toDataURL('image/png');
    
    // Create PDF with proper dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Calculate dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Save the PDF
    pdf.save(`${props.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    
    toast.add({
      title: 'Success',
      description: 'PDF exported successfully',
      color: 'green'
    });
  } catch (err: unknown) {
  console.error('PDF export error:', err);
  const toast = useToast();
  toast.add({
    title: 'Export Failed',
    description: err instanceof Error ? err.message : 'Error generating PDF',
    color: 'red'
  });
}
};

const exportAsExcel = () => {
  try {
    // Show loading state
    const toast = useToast();
    toast.add({
      title: 'Exporting Excel',
      description: 'Preparing Excel file...',
      color: 'blue'
    });
    
    // Create a workbook with report metadata
    const wb = utils.book_new();
    
    // Create a worksheet from the report data
    // We need to extract data from the report content
    // For now, we'll use a simple approach with metadata
    const wsData = [
      ['Report Title', props.title],
      ['Generated On', formatDate(new Date())],
      ['Description', props.description || '']
    ];
    
    // Add metadata entries
    if (props.metadata) {
  Object.entries(props.metadata).forEach(([key, value]) => {
    wsData.push([formatMetadataKey(key), String(value)]);
  });
}
    
    // Create worksheet from data
    const ws = utils.aoa_to_sheet(wsData);
    
    // Add worksheet to workbook
    utils.book_append_sheet(wb, ws, 'Report Summary');
    
    // Write and download the file
    writeFile(wb, `${props.title.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
    
    toast.add({
      title: 'Success',
      description: 'Excel file exported successfully',
      color: 'green'
    });
  } catch (err: unknown) {
    console.error('Excel export error:', err);
    const toast = useToast();
    toast.add({
      title: 'Export Failed',
      description: err instanceof Error ? err.message : 'Error generating Excel file',
      color: 'red'
    });
  }
};

const exportAsImage = async () => {
  if (!reportContent.value) return;
  
  try {
    // Show loading state
    const toast = useToast();
    toast.add({
      title: 'Exporting Image',
      description: 'Generating image...',
      color: 'blue'
    });
    
    // Convert the report content to a canvas
    const canvas = await html2canvas(reportContent.value);
    
    // Convert to data URL
    const imageUrl = canvas.toDataURL('image/png');
    
    // Create a temporary link for download
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${props.title.replace(/\s+/g, '-').toLowerCase()}.png`;
    
    // Add to document, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.add({
      title: 'Success',
      description: 'Image exported successfully',
      color: 'green'
    });
  } catch (err: unknown) {
    console.error('Image export error:', err);
    const toast = useToast();
    toast.add({
      title: 'Export Failed',
      description: err instanceof Error ? err.message : 'Error generating image',
      color: 'red'
    });
  }
};
</script>
