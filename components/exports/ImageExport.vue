<!-- components/exports/ImageExport.vue -->
<template>
  <UButton 
    @click="exportImage" 
    :icon="icon" 
    :size="size" 
    :color="color" 
    :variant="variant"
    :disabled="disabled || loading"
    :loading="loading"
  >
    <slot>Export Image</slot>
  </UButton>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import html2canvas from 'html2canvas';

interface ImageExportOptions {
  fileName?: string;
  format?: 'png' | 'jpeg';
  quality?: number;
  backgroundColor?: string;
}

// Proper Nuxt UI button types
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type ButtonColor = 'primary' | 'gray' | 'green' | 'yellow' | 'red' | 'blue';
type ButtonVariant = 'solid' | 'outline' | 'soft' | 'ghost' | 'link';

const props = defineProps({
  targetRef: {
    type: Object as () => HTMLElement,
    required: true
  },
  options: {
    type: Object as () => ImageExportOptions,
    default: () => ({})
  },
  icon: {
    type: String,
    default: 'i-heroicons-photo'
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

const exportImage = async () => {
  if (!props.targetRef) return;
  
  loading.value = true;
  
  try {
    // Show loading message
    toast.add({
      title: 'Exporting Image',
      description: 'Generating image...',
      color: 'blue'
    });
    
    // Set html2canvas options
    const options: any = {
      logging: false,
      useCORS: true,
      scale: 2, // Better quality
      backgroundColor: props.options.backgroundColor || null
    };
    
    // Convert element to canvas
    const canvas = await html2canvas(props.targetRef, options);
    
    // Get image format and quality
    const format = props.options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const quality = props.options.quality !== undefined ? props.options.quality : 0.95;
    
    // Convert to data URL
    const imageUrl = canvas.toDataURL(format, quality);
    
    // Create filename with appropriate extension
    const extension = format === 'image/jpeg' ? 'jpg' : 'png';
    const fileName = (props.options.fileName || `export-${Date.now()}`) + `.${extension}`;
    
    // Create download link
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    
    // Trigger download
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
    toast.add({
      title: 'Export Failed',
      description: err instanceof Error ? err.message : 'Error generating image',
      color: 'red'
    });
  } finally {
    loading.value = false;
  }
};
</script>