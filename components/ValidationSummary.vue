<!-- components/ValidationSummary.vue -->
<template>
  <div class="validation-summary">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center p-4">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
    </div>

    <!-- Summary Metrics -->
    <div v-else-if="result" class="mb-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Validation Results</h3>
        <UBadge :color="result.valid ? 'green' : 'red'">
          {{ result.valid ? 'Valid' : 'Invalid' }}
        </UBadge>
      </div>

      <div v-if="result.summary" class="grid grid-cols-3 gap-4 mb-4">
        <div class="bg-gray-50 p-3 rounded text-center">
          <div class="text-lg font-semibold">{{ result.summary.total }}</div>
          <div class="text-sm text-gray-600">Total Rows</div>
        </div>
        <div class="bg-green-50 p-3 rounded text-center">
          <div class="text-lg font-semibold text-green-700">{{ result.summary.valid }}</div>
          <div class="text-sm text-green-600">Valid</div>
        </div>
        <div class="bg-red-50 p-3 rounded text-center">
          <div class="text-lg font-semibold text-red-700">{{ result.summary.invalid }}</div>
          <div class="text-sm text-red-600">Invalid</div>
        </div>
      </div>

      <!-- Error List -->
      <div v-if="result.errors.length > 0" class="mt-4">
        <h4 class="font-medium mb-2">Issues Found:</h4>

        <!-- Critical Errors -->
        <div v-if="criticalErrors.length > 0" class="mb-4">
          <h5 class="text-sm font-medium text-red-700 mb-1">Critical Issues</h5>
          <UCard class="bg-red-50 border-red-200">
            <ul class="list-disc pl-5 space-y-1">
              <li v-for="error in criticalErrors" :key="`${error.row}-${error.column}`" class="text-sm">
                <span v-if="error.row > 0">Row {{ error.row }}:</span>
                <span v-if="error.column">Column '{{ error.column }}':</span>
                {{ error.message }}
              </li>
            </ul>
          </UCard>
        </div>

        <!-- Major Errors -->
        <div v-if="majorErrors.length > 0" class="mb-4">
          <h5 class="text-sm font-medium text-amber-700 mb-1">Major Issues</h5>
          <UCard class="bg-amber-50 border-amber-200">
            <ul class="list-disc pl-5 space-y-1">
              <li v-for="error in majorErrors" :key="`${error.row}-${error.column}`" class="text-sm">
                <span v-if="error.row > 0">Row {{ error.row }}:</span>
                <span v-if="error.column">Column '{{ error.column }}':</span>
                {{ error.message }}
              </li>
            </ul>
          </UCard>
        </div>

        <!-- Minor Errors -->
        <div v-if="minorErrors.length > 0" class="mb-4">
          <h5 class="text-sm font-medium text-blue-700 mb-1">Minor Issues</h5>
          <UCard class="bg-blue-50 border-blue-200">
            <ul class="list-disc pl-5 space-y-1">
              <li v-for="error in minorErrors" :key="`${error.row}-${error.column}`" class="text-sm">
                <span v-if="error.row > 0">Row {{ error.row }}:</span>
                <span v-if="error.column">Column '{{ error.column }}':</span>
                {{ error.message }}
              </li>
            </ul>
          </UCard>
        </div>
      </div>

      <!-- Guidance Section -->
      <div v-if="result.errors.length > 0" class="mt-4">
        <h4 class="font-medium mb-2">Next Steps:</h4>
        <UCard class="bg-blue-50">
          <ol class="list-decimal pl-5 space-y-1 text-sm">
            <li>Review the issues highlighted above</li>
            <li>Fix the problems in your spreadsheet</li>
            <li>Re-upload the corrected file</li>
          </ol>
        </UCard>
      </div>

      <!-- Success Message -->
      <UCard v-else class="bg-green-50 border-green-200 mt-4">
        <div class="flex items-center">
          <UIcon name="i-heroicons-check-circle" class="text-green-500 h-6 w-6 mr-2" />
          <p class="text-green-700">Your data passed all validation checks!</p>
        </div>
      </UCard>
    </div>

    <!-- No Results State -->
    <div v-else class="text-center p-4 text-gray-500">
      <p>No validation results to display</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ValidationError, ValidationResult } from '~/types/validation'

const props = defineProps<{
  result?: ValidationResult;
  loading?: boolean;
}>();

// Computed properties to filter errors by severity
const criticalErrors = computed(() => 
  props.result?.errors.filter(error => error.severity === 'critical') || []
);

const majorErrors = computed(() => 
  props.result?.errors.filter(error => error.severity === 'major') || []
);

const minorErrors = computed(() => 
  props.result?.errors.filter(error => error.severity === 'minor') || []
);
</script>