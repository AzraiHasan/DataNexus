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
            <UButton v-if="showExportActions" @click="exportAsPDF" size="sm" icon="i-heroicons-document" variant="outline">
              Export PDF
            </UButton>
            <UButton v-if="showExportActions" @click="exportAsExcel" size="sm" icon="i-heroicons-table-cells" variant="outline">
              Export Excel
            </UButton>
            <UButton v-if="showExportActions" @click="exportAsImage" size="sm" icon="i-heroicons-photo" variant="outline">
              Export Image
            </UButton>
          </slot>
        </div>
      </div>
      
      <p v-if="description" class="text-gray-500 mt-2">{{ description }}</p>
      
      <div v-if="metadata" class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <div v-for="(value, key) in metadata" :key="key" class="bg-gray-50 p-3 rounded-lg">
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
import { ref } from 'vue';

interface ReportBuilderProps {
  title: string;
  description?: string;
  metadata?: Record<string, string | number>;
  showExportActions?: boolean;
  showFooter?: boolean;
  footerText?: string;
}

const props = withDefaults(defineProps<ReportBuilderProps>(), {
  title: 'Report',
  description: '',
  metadata: () => ({}),
  showExportActions: true,
  showFooter: true,
  footerText: 'Telecom Tower Data Analysis Platform'
});

const reportContent = ref<HTMLElement | null>(null);

// Format metadata keys for display
const formatMetadataKey = (key: string): string => {
  // Convert camelCase to Title Case with spaces
  return key
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
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

// Export as PDF
const exportAsPDF = async () => {
  try {
    // Import jsPDF dynamically to avoid SSR issues
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default;
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default;
    
    if (!reportContent.value) return;
    
    // Create a new jsPDF instance
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Convert the HTML content to a canvas
    const canvas = await html2canvas(reportContent.value, {
      scale: 2,
      logging: false,
      useCORS: true
    });
    
    // Add the canvas as an image to the PDF
    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;
    
    doc.setFontSize(18);
    doc.text(props.title, pdfWidth / 2, 10, { align: 'center' });
    doc.addImage(imgData, 'JPEG', imgX, imgY + 10, imgWidth * ratio, imgHeight * ratio);
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(10);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `${props.footerText} - Generated on ${formatDate(new Date())}`,
        pdfWidth / 2,
        pdfHeight - 10,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    doc.save(`${props.title.replace(/\s+/g, '_')}_report.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Failed to export PDF. Please try again later.');
  }
};

// Export as Excel
const exportAsExcel = async () => {
  try {
    alert('Export as Excel functionality will be implemented in the next phase');
    // Implementation will be added in a future increment
  } catch (error) {
    console.error('Error exporting Excel:', error);
    alert('Failed to export Excel. Please try again later.');
  }
};

// Export as Image
const exportAsImage = async () => {
  try {
    // Import html2canvas dynamically to avoid SSR issues
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default;
    
    if (!reportContent.value) return;
    
    // Convert the HTML content to a canvas
    const canvas = await html2canvas(reportContent.value, {
      scale: 2,
      logging: false,
      useCORS: true
    });
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) {
        alert('Failed to create image. Please try again.');
        return;
      }
      
      // Create a download link
      const link = document.createElement('a');
      link.download = `${props.title.replace(/\s+/g, '_')}_report.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      
      // Clean up
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  } catch (error) {
    console.error('Error exporting image:', error);
    alert('Failed to export image. Please try again later.');
  }
};
</script>