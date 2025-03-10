<!-- components/visualizations/DataTable.vue -->

<template>
  <div class="data-table-container">
    <div v-if="loading" class="flex justify-center items-center py-8">
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
        >
          <!-- Custom formatting for specific columns -->
          <template v-for="column in columnsWithCustomRender" :key="column.key" #[`${column.key}-data`]="{ row }">
            <component :is="column.render" :value="row[column.key]" :row="row" />
          </template>
        </UTable>
      </div>
      
      <!-- Pagination -->
      <div v-if="pagination && filteredData.length > pageSize" class="mt-4 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          Showing {{ paginationStart + 1 }} to {{ Math.min(paginationStart + pageSize, filteredData.length) }} of {{ filteredData.length }} entries
        </div>
        <UPagination
          v-model="currentPage"
          :page-count="Math.ceil(filteredData.length / pageSize)"
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
  render?: any; // Component
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
  initialSort: undefined
});

// State
const searchQuery = ref('');
const currentPage = ref(1);
const sortingInfo = ref<{ column: string; direction: 'asc' | 'desc' } | null>(props.initialSort || null);

// Reset pagination when data changes
watch(() => props.data, () => {
  currentPage.value = 1;
});

// Reset pagination when search changes
watch(searchQuery, () => {
  currentPage.value = 1;
});

// Filter data based on search query
const filteredData = computed(() => {
  if (!searchQuery.value.trim()) return props.data;
  
  const query = searchQuery.value.toLowerCase().trim();
  return props.data.filter(item => {
    return Object.keys(item).some(key => {
      const value = item[key];
      return value !== null && 
             value !== undefined && 
             String(value).toLowerCase().includes(query);
    });
  });
});

// Sort data
const sortedData = computed(() => {
  if (!sortingInfo.value) return filteredData.value;
  
  const { column, direction } = sortingInfo.value;
  
  return [...filteredData.value].sort((a, b) => {
    const aValue = a[column];
    const bValue = b[column];
    
    // Handle nulls and undefined
    if (aValue === null || aValue === undefined) return direction === 'asc' ? -1 : 1;
    if (bValue === null || bValue === undefined) return direction === 'asc' ? 1 : -1;
    
    // Sort based on data type
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Default string comparison
    const aString = String(aValue).toLowerCase();
    const bString = String(bValue).toLowerCase();
    return direction === 'asc' 
      ? aString.localeCompare(bString)
      : bString.localeCompare(aString);
  });
});

// Pagination
const paginationStart = computed(() => (currentPage.value - 1) * props.pageSize);

const paginatedData = computed(() => {
  if (!props.pagination) return sortedData.value;
  
  const start = paginationStart.value;
  return sortedData.value.slice(start, start + props.pageSize);
});

// Add formatting functions to columns
const columnsWithFormatting = computed(() => {
  return props.columns.map(column => {
    const columnWithSort = {
      ...column,
      sortable: column.sortable !== false // Default to true unless explicitly false
    };
    
    return columnWithSort;
  });
});

// Get columns with custom render functions for templating
const columnsWithCustomRender = computed(() => {
  return props.columns.filter(column => column.render);
});

// Handle search input
const onSearchInput = (event: Event) => {
  const inputEl = event.target as HTMLInputElement;
  searchQuery.value = inputEl.value;
};

// Handle table sorting
const onTableSort = ({ column, direction }: { column: string; direction: 'asc' | 'desc' }) => {
  sortingInfo.value = { column, direction };
};
</script>