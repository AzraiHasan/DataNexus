<template>
  <div class="data-import">
    <!-- Step 1: Upload -->
    <div v-if="currentStep === 'upload'">
      <p class="text-sm text-gray-600 mb-4">
        Upload your {{ dataTypeOptions.find(opt => opt.value === selectedDataType)?.label.toLowerCase() || 'data' }} file for validation and import.
      </p>
      
      <UFormGroup label="Data Type">
        <USelect v-model="selectedDataType" :options="dataTypeOptions" placeholder="Select data type" />
      </UFormGroup>
      
      <FileUpload :label="`Upload ${getDataTypeLabel(selectedDataType)} Data`" @update="handleFileUploaded"
        @processing="isProcessing = $event" />
    </div>
    
    <!-- Step 2: Validation -->
    <div v-if="currentStep === 'validation'">
      <div class="mb-4 flex justify-between items-center">
        <h3 class="font-semibold">Validation Results</h3>
        <UButton variant="ghost" @click="currentStep = 'upload'">
          <UIcon name="i-heroicons-arrow-left" class="mr-1" />
          Back
        </UButton>
      </div>
      
      <ValidationSummary :result="validationResult || {valid: false, errors: []}" :loading="validationInProgress" />
      
      <div class="mt-4 flex justify-end">
        <UButton v-if="validationResult?.valid" color="green" @click="currentStep = 'import'">
          Proceed to Import
        </UButton>
      </div>
    </div>
    
    <!-- Step 3: Import -->
    <div v-if="currentStep === 'import'">
      <div class="mb-4 flex justify-between items-center">
        <h3 class="font-semibold">Import Settings</h3>
        <UButton variant="ghost" @click="currentStep = 'validation'">
          <UIcon name="i-heroicons-arrow-left" class="mr-1" />
          Back
        </UButton>
      </div>
      
      <div class="space-y-4">
        <UFormGroup label="Handle Duplicates">
          <URadio v-model="importOptions.skipDuplicates" :value="true" name="duplicates">
            Skip duplicate records
          </URadio>
          <URadio v-model="importOptions.skipDuplicates" :value="false" name="duplicates">
            Import all records
          </URadio>
        </UFormGroup>
        
        <UFormGroup label="Batch Size">
          <URange v-model="importOptions.batchSize" :min="10" :max="100" :step="10" />
          <div class="text-xs text-gray-500 mt-1">{{ importOptions.batchSize }} records per batch</div>
        </UFormGroup>
        
        <UButton color="green" @click="startImport" block :loading="importing">
          Start Import
        </UButton>
      </div>
      
      <!-- Import progress -->
      <div v-if="importing" class="mt-4">
        <div class="mb-2 flex justify-between items-center text-sm">
          <span>Importing data...</span>
          <span>{{ importProgress.processed }} / {{ importProgress.total }}</span>
        </div>
        <UProgress :value="importProgress.percentage" color="blue" />
      </div>
      
      <!-- Import results -->
      <UCard v-if="importResult" class="mt-4" :color="importResult.success ? 'green' : 'red'">
        <div class="space-y-2">
          <p><strong>{{ importResult.success ? 'Import Complete' : 'Import Failed' }}</strong></p>
          <div v-if="importResult.success" class="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div class="font-medium">{{ importResult.imported }}</div>
              <div class="text-xs">Imported</div>
            </div>
            <div>
              <div class="font-medium">{{ importResult.skipped }}</div>
              <div class="text-xs">Skipped</div>
            </div>
            <div>
              <div class="font-medium">{{ importResult.failed }}</div>
              <div class="text-xs">Failed</div>
            </div>
          </div>
          <p v-if="importResult.error" class="text-sm">
            Error: {{ importResult.error }}
          </p>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ValidationResult } from '~/types/validation';
import Papa from 'papaparse';

type ImportStep = 'upload' | 'validation' | 'import';

interface FileData {
  url: string;
  name: string;
  size: number;
  type: string;
  path: string;
}

interface ImportProgress {
  total: number;
  processed: number;
  percentage: number;
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  failed: number;
  error?: string;
}

// Data type options
const dataTypeOptions = [
  { label: 'Tower Data', value: 'tower' },
  { label: 'Contract Data', value: 'contract' },
  { label: 'Landlord Data', value: 'landlord' },
  { label: 'Payment Data', value: 'payment' },
];

// State
const currentStep = ref<ImportStep>('upload');
const selectedDataType = ref('tower');
const isProcessing = ref(false);
const validationInProgress = ref(false);
const validationResult = ref<ValidationResult | null>(null);
const currentFile = ref<FileData | null>(null);
const fileContent = ref<string | null>(null);
const importing = ref(false);
const importProgress = ref<ImportProgress>({
  total: 0,
  processed: 0,
  percentage: 0
});
const importResult = ref<ImportResult | null>(null);
const importOptions = ref({
  skipDuplicates: true,
  batchSize: 50
});

// Services
const supabase = useSupabaseClient();
const toast = useToast();
const { validateFile } = useValidation();
const { 
  importTowerData, 
  importContractData, 
  importLandlordData, 
  importPaymentData,
  progress: importProgressRef
} = useDataImport();

// Watch import progress from the data import service
watch(importProgressRef, (newProgress) => {
  importProgress.value = newProgress;
});

// Get label for data type
function getDataTypeLabel(dataType: string): string {
  const option = dataTypeOptions.find(opt => opt.value === dataType);
  return option ? option.label.replace(' Data', '') : 'Data';
}

// Handle file upload completion
async function handleFileUploaded(fileData: FileData) {
  currentFile.value = fileData;
  await validateUploadedFile(fileData);
}

// Validate the uploaded file
async function validateUploadedFile(fileData: FileData) {
  validationInProgress.value = true;
  
  try {
    // Fetch the file content from storage
    const { data, error: fetchError } = await supabase
      .storage
      .from('spreadsheets')
      .download(fileData.path);
      
    if (fetchError) throw fetchError;
    
    // Convert the blob to text
    const content = await data.text();
    fileContent.value = content;
    
    // Perform validation
    const result = await validateFile(content, {
      dataType: selectedDataType.value as 'tower' | 'contract' | 'landlord' | 'payment'
    });
    
    validationResult.value = result;
    
    // Move to validation step
    currentStep.value = 'validation';
  } catch (err: any) {
    console.error('Validation error:', err);
    toast.add({
      title: 'Validation Error',
      description: err.message,
      color: 'red'
    });
  } finally {
    validationInProgress.value = false;
  }
}

// Start import process
async function startImport() {
  if (!validationResult.value?.valid || !fileContent.value) {
    return;
  }
  
  importing.value = true;
  importResult.value = null;
  
  try {
    // Parse CSV to get array of objects
    const parsedData = Papa.parse(fileContent.value, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    }).data;
    
    // Choose import function based on data type
    let result: ImportResult;
    
    switch (selectedDataType.value) {
      case 'tower':
        result = await importTowerData(parsedData, {
          skipDuplicates: importOptions.value.skipDuplicates,
          batchSize: importOptions.value.batchSize,
          onProgress: (progress) => {
            importProgress.value.percentage = progress;
          }
        });
        break;
      case 'contract':
        result = await importContractData(parsedData, importOptions.value);
        break;
      case 'landlord':
        result = await importLandlordData(parsedData, importOptions.value);
        break;
      case 'payment':
        result = await importPaymentData(parsedData, importOptions.value);
        break;
      default:
        throw new Error('Invalid data type');
    }
    
    importResult.value = result;
    
    if (result.success) {
      toast.add({
        title: 'Import Complete',
        description: `Successfully imported ${result.imported} records`,
        color: 'green'
      });
    } else {
      toast.add({
        title: 'Import Failed',
        description: result.error || 'Error during import',
        color: 'red'
      });
    }
  } catch (err: any) {
    console.error('Import error:', err);
    
    importResult.value = {
      success: false,
      imported: 0,
      skipped: 0,
      failed: 0,
      error: err.message
    };
    
    toast.add({
      title: 'Import Error',
      description: err.message,
      color: 'red'
    });
  } finally {
    importing.value = false;
  }
}
</script>