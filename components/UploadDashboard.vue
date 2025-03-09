<!-- components/UploadDashboard.vue -->

<template>
  <UCard class="h-full">
    <template #header>
      <div class="font-semibold text-lg">Quick Upload</div>
    </template>

    <div v-if="!showValidation" class="space-y-4">
      <p class="text-sm text-gray-600">Upload your telecom tower data for instant analysis.</p>

      <!-- Data type selector -->
      <UFormGroup label="Data Type">
        <USelect v-model="selectedDataType" :options="dataTypeOptions" placeholder="Select data type" />
      </UFormGroup>

      <!-- File uploader -->
      <FileUpload :label="`Upload ${getDataTypeLabel(selectedDataType)} Data`" @update="handleFileUploaded"
        @processing="isProcessing = $event" />
    </div>

    <!-- Validation view -->
    <div v-else>
      <ValidationSummary :result="validationResult || undefined" :loading="validationInProgress" />

      <div class="mt-4 flex justify-between">
        <UButton @click="resetValidation" variant="soft">
          Upload Another File
        </UButton>

        <UButton v-if="validationResult?.valid" color="green" @click="confirmData">
          Import Data
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { ValidationError, ValidationResult } from '~/types/validation'

interface FileData {
  url: string;
  name: string;
  size: number;
  type: string;
  path: string;
}

// Data type options
const dataTypeOptions = [
  { label: 'Tower Data', value: 'tower' },
  { label: 'Contract Data', value: 'contract' },
  { label: 'Landlord Data', value: 'landlord' },
  { label: 'Payment Data', value: 'payment' },
];

// State
const selectedDataType = ref('tower');
const isProcessing = ref(false);
const showValidation = ref(false);
const validationInProgress = ref(false);
const validationResult = ref<ValidationResult | null>(null);
const currentFile = ref<FileData | null>(null);
const supabase = useSupabaseClient();
const toast = useToast();
const emit = defineEmits(['uploaded', 'imported']);

// Get label for data type
function getDataTypeLabel(dataType: string): string {
  const option = dataTypeOptions.find(opt => opt.value === dataType);
  return option ? option.label.replace(' Data', '') : 'Data';
}

// Handle file upload completion
async function handleFileUploaded(fileData: FileData) {
  currentFile.value = fileData;
  await validateFile(fileData);
  showValidation.value = true;
}

// Reset the validation state
function resetValidation() {
  showValidation.value = false;
  validationResult.value = null;
  currentFile.value = null;
}

// Validate the uploaded file
async function validateFile(fileData: FileData) {
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
    
    // Use our validation composable
    const { validateFile } = useValidation();
    
    // Perform validation
    const result = await validateFile(content, {
      dataType: selectedDataType.value as 'tower' | 'contract' | 'landlord' | 'payment'
    });
    
    validationResult.value = result;
    
    // Update file record with validation status
    await updateFileStatus(result.valid ? 'valid' : 'invalid');
    
    // Emit upload event
    emit('uploaded', {
      file: fileData,
      result: result,
      dataType: selectedDataType.value
    });
  } catch (err: any) {
    console.error('Validation error:', err);
    toast.add({
      title: 'Validation Error',
      description: err.message,
      color: 'red'
    });
    
    // Mark file as invalid
    if (currentFile.value) {
      await updateFileStatus('invalid');
    }
  } finally {
    validationInProgress.value = false;
  }
}

// Function to update the validation status
async function updateFileStatus(status: string) {
  if (!currentFile.value) return;
  
  try {
    // Call the API endpoint
    await fetch('/api/update-file-status', {
      method: 'POST',
      body: JSON.stringify({
        filePath: currentFile.value.path,
        status
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('Error updating file status:', err);
  }
}

// Confirm data import
function confirmData() {
  if (!validationResult.value?.valid || !currentFile.value) {
    return;
  }
  
  // Emit the import event
  emit('imported', {
    file: currentFile.value,
    result: validationResult.value,
    dataType: selectedDataType.value
  });
  
  // Show success message
  toast.add({
    title: 'Data Imported',
    description: 'Your data has been successfully imported.',
    color: 'green'
  });
  
  // Reset the form
  resetValidation();
}
</script>