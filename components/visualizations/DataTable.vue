<!-- components/visualizations/DataTable.vue -->
<template>
  <div class="data-table">
    <div v-if="loading" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
    </div>
    <div v-else-if="error" class="text-red-500 p-4">
      {{ error }}
    </div>
    <div v-else-if="!data || data.length === 0" class="text-center py-8 text-gray-500">
      <UIcon name="i-heroicons-table-cells" class="h-12 w-12 mx-auto mb-2 text-gray-400" />
      <p>No data available for display</p>
    </div>
    <div v-else>
      <h3 v-if="title" class="text-base font-medium mb-2">{{ title }}</h3>
      
      <!-- Search bar -->
      <div v-if="searchable" class="mb-4">
        <UInput
          v-model="searchQuery"
          placeholder="Search..."
          icon="i-heroicons-magnifying-glass"
          @input="onSearchInput"
        />
      </div>
      
      <!-- Table -->
      <div class="overflow-x-auto">
        <UTable
          :columns="columnsWithFormatting"
          :rows="paginatedData"
          :sort="sortingInfo"
          @sort="onTableSort"
          :loading="loading"
          hover
          class="w-full"
          :ui="{ 
            td: { 
              padding: 'p-2 sm:p-3',
              base: 'whitespace-nowrap align-middle max-w-xs truncate overflow-hidden'
            },
            th: {
              padding: 'p-2 sm:p-3' 
            }
          }"
        >
          <!-- Custom cell rendering -->
          <template v-for="column in columns" :key="column.key" #[`${column.key}-data`]="{ row }">
            <div v-if="column.format" v-html="column.format(row[column.key], row)"></div>
            <span v-else>{{ row[column.key] }}</span>
          </template>
        </UTable>
      </div>
      
      <!-- Pagination -->
      <div v-if="pagination && filteredData.length > pageSize" class="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="text-sm text-gray-500">
          Showing {{ paginationStart + 1 }} to {{ Math.min(paginationStart + pageSize, filteredData.length) }} of {{ filteredData.length }} entries
        </div>
        <UPagination
          v-model="currentPage"
          :page-count="Math.ceil(filteredData.length / pageSize)"
          :total="filteredData.length"
          :ui="{ wrapper: 'flex items-center' }"
          :prev-button="{ icon: 'i-heroicons-arrow-small-left' }"
          :next-button="{ icon: 'i-heroicons-arrow-small-right' }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row: any) => string;
  width?: string;
}

interface DataTableProps {
  data: any[];
  columns: TableColumn[];
  title?: string;
  loading?: boolean;
  error?: string;
  pagination?: boolean;
  pageSize?: number;
  searchable?: boolean;
  initialSort?: { column: string; direction: 'asc' | 'desc' };
  emptyMessage?: string;
}

const props = withDefaults(defineProps<DataTableProps>(), {
  data: () => [],
  columns: () => [],
  title: '',
  loading: false,
  error: '',
  pagination: true,
  pageSize: 10,
  searchable: true,
  initialSort: undefined,
  emptyMessage: 'No data available'
});

// Internal state
const searchQuery = ref('');
const currentPage = ref(1);
const sortingInfo = ref<{ column: string; direction: 'asc' | 'desc' } | undefined>(props.initialSort);

// Reset pagination when data changes
watch(() => props.data, () => {
  currentPage.value = 1;
});

// Reset pagination when search changes
watch(searchQuery, () => {
  currentPage.value = 1;
});

// Add column formatting and alignment classes
const columnsWithFormatting = computed(() => {
  return props.columns.map(column => {
    // Add classes based on alignment
    let tdClass = '';
    if (column.align) {
      tdClass = column.align === 'right' ? 'text-right' : 
                column.align === 'center' ? 'text-center' : 'text-left';
    }
    
    return {
      ...column,
      sortable: column.sortable !== false, // Default to true unless explicitly false
      class: tdClass,
      tdClass,
      thClass: tdClass
    };
  });
});

// Filter data based on search query
const filteredData = computed(() => {
  if (!searchQuery.value.trim()) return props.data;
  
  const query = searchQuery.value.toLowerCase().trim();
  return props.data.filter(item => {
    // Search through all fields
    return Object.keys(item).some(key => {
      const value = item[key];
      return value !== null && 
             value !== undefined && 
             String(value).toLowerCase().includes(query);
    });
  });
});

// Sort data based on current sorting info
const sortedData = computed(() => {
  if (!sortingInfo.value) return filteredData.value;
  
  const { column, direction } = sortingInfo.value;
  
  return [...filteredData.value].sort((a, b) => {
    const aValue = a[column];
    const bValue = b[column];
    
    // Handle null and undefined values
    if (aValue === null || aValue === undefined) return direction === 'asc' ? -1 : 1;
    if (bValue === null || bValue === undefined) return direction === 'asc' ? 1 : -1;
    
    // Sort based on data type
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Date comparison
    if (aValue instanceof Date && bValue instanceof Date) {
      return direction === 'asc' ? 
        aValue.getTime() - bValue.getTime() :
        bValue.getTime() - aValue.getTime();
    }
    
    // Date string comparison
    if (isDateString(aValue) && isDateString(bValue)) {
      const dateA = new Date(aValue);
      const dateB = new Date(bValue);
      return direction === 'asc' ? 
        dateA.getTime() - dateB.getTime() :
        dateB.getTime() - dateA.getTime();
    }
    
    // Default string comparison
    const aString = String(aValue).toLowerCase();
    const bString = String(bValue).toLowerCase();
    return direction === 'asc' 
      ? aString.localeCompare(bString)
      : bString.localeCompare(aString);
  });
});

// Helper function to detect date strings
function isDateString(value: any): boolean {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

// Pagination
const paginationStart = computed(() => (currentPage.value - 1) * props.pageSize);

const paginatedData = computed(() => {
  if (!props.pagination) return sortedData.value;
  
  const start = paginationStart.value;
  return sortedData.value.slice(start, start + props.pageSize);
});

// Handle search input
function onSearchInput(event: Event) {
  const inputEl = event.target as HTMLInputElement;
  searchQuery.value = inputEl.value;
}

// Handle table sorting
function onTableSort({ column, direction }: { column: string; direction: 'asc' | 'desc' }) {
  sortingInfo.value = { column, direction };
}
</script>

<style scoped>
.data-table {
  width: 100%;
}
</style>