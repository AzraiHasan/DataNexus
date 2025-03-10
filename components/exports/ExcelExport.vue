<!-- components/exports/ExcelExport.vue -->
<template>
  <UButton 
    @click="exportExcel" 
    :icon="icon" 
    :size="size" 
    :color="color" 
    :variant="variant"
    :disabled="disabled || loading"
    :loading="loading"
  >
    <slot>Export Excel</slot>
  </UButton>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { utils, writeFile } from 'xlsx';

interface ExcelExportOptions {
  fileName?: string;
  sheetName?: string;
  includeHeader?: boolean;
}

// Proper Nuxt UI button types
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type ButtonColor = 'primary' | 'gray' | 'green' | 'yellow' | 'red' | 'blue';
type ButtonVariant = 'solid' | 'outline' | 'soft' | 'ghost' | 'link';

const props = defineProps({
  // Accept either raw data or a component reference
  data: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    default: () => []
  },
  options: {
    type: Object as () => ExcelExportOptions,
    default: () => ({})
  },
  icon: {
    type: String,
    default: 'i-heroicons-table-cells'
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

const exportExcel = async () => {
  if (!props.data.length) {
    toast.add({
      title: 'Export Failed',
      description: 'No data available to export',
      color: 'red'
    });
    return;
  }
  
  loading.value = true;
  
  try {
    // Show loading message
    toast.add({
      title: 'Exporting Excel',
      description: 'Preparing Excel file...',
      color: 'blue'
    });
    
    // Create workbook
    const wb = utils.book_new();
    
    // Generate worksheet data
    let wsData = [];
    
    // Add headers if requested and columns are provided
    if (props.options.includeHeader !== false && props.columns.length > 0) {
      const headers = props.columns.map((col: any) => col.label || col.key || '');
      wsData.push(headers);
    }
    
    // Add data rows
    props.data.forEach((row: any) => {
      if (props.columns.length > 0) {
        // Extract data based on column configuration
        const rowData = props.columns.map((col: any) => {
          const key = col.key;
          return row[key] !== undefined ? String(row[key]) : '';
        });
        wsData.push(rowData);
      } else {
        // If no columns specified, just use all row data
        wsData.push(Object.values(row).map(val => val !== undefined ? String(val) : ''));
      }
    });
    
    // Create worksheet
    const ws = utils.aoa_to_sheet(wsData);
    
    // Add worksheet to workbook
    const sheetName = props.options.sheetName || 'Sheet1';
    utils.book_append_sheet(wb, ws, sheetName);
    
    // Generate filename
    const fileName = props.options.fileName || 'export.xlsx';
    
    // Write and download file
    writeFile(wb, fileName);
    
    toast.add({
      title: 'Success',
      description: 'Excel file exported successfully',
      color: 'green'
    });
  } catch (err: unknown) {
    console.error('Excel export error:', err);
    toast.add({
      title: 'Export Failed',
      description: err instanceof Error ? err.message : 'Error generating Excel file',
      color: 'red'
    });
  } finally {
    loading.value = false;
  }
};
</script>