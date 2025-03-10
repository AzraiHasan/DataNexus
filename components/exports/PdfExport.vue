<!-- components/exports/PdfExport.vue -->
<template>
  <UButton 
    @click="exportPdf" 
    :icon="icon" 
    :size="size" 
    :color="color" 
    :variant="variant"
    :disabled="disabled || loading"
    :loading="loading"
  >
    <slot>Export PDF</slot>
  </UButton>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface PdfExportOptions {
  title?: string;
  fileName?: string;
  pageSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
}

// Use proper Nuxt UI button types
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type ButtonColor = 'primary' | 'gray' | 'green' | 'yellow' | 'red' | 'blue';
type ButtonVariant = 'solid' | 'outline' | 'soft' | 'ghost' | 'link';

const props = defineProps({
  targetRef: {
    type: Object as () => HTMLElement,
    required: true
  },
  options: {
    type: Object as () => PdfExportOptions,
    default: () => ({})
  },
  icon: {
    type: String,
    default: 'i-heroicons-document'
  },
  size: {
    type: String as () => ButtonSize,
    default: 'md'
  },
  color: {
    type: String as () => ButtonColor,
    default: 'gray'
  },
  variant: {
    type: String as () => ButtonVariant,
    default: 'solid'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const loading = ref(false);
const toast = useToast();

const exportPdf = async () => {
  if (!props.targetRef) return;
  
  loading.value = true;
  
  try {
    // Show loading message
    toast.add({
      title: 'Exporting PDF',
      description: 'Please wait while we generate your PDF...',
      color: 'blue'
    });
    
    // Convert element to canvas
    const canvas = await html2canvas(props.targetRef);
    const imgData = canvas.toDataURL('image/png');
    
    // Create PDF with proper dimensions
    const pageSize = props.options.pageSize || 'a4';
    const orientation = props.options.orientation || 'portrait';
    
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize
    });
    
    // Calculate dimensions
    const pageWidth = orientation === 'portrait' ? 210 : 297; // A4 dimensions
    const imgWidth = pageWidth - 20; // Margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add title if provided
    if (props.options.title) {
      pdf.setFontSize(16);
      pdf.text(props.options.title, 10, 10);
      pdf.addImage(imgData, 'PNG', 10, 20, imgWidth, imgHeight);
    } else {
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    }
    
    // Save the PDF
    const fileName = props.options.fileName || 'export.pdf';
    pdf.save(fileName);
    
    toast.add({
      title: 'Success',
      description: 'PDF exported successfully',
      color: 'green'
    });
  } catch (err: unknown) {
    console.error('PDF export error:', err);
    toast.add({
      title: 'Export Failed',
      description: err instanceof Error ? err.message : 'Error generating PDF',
      color: 'red'
    });
  } finally {
    loading.value = false;
  }
};
</script>