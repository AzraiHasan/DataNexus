<template>
  <div class="container max-w-4xl mx-auto py-6 px-4 sm:px-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <h1 class="text-2xl font-bold">Data Import</h1>
      <UButton to="/dashboard" variant="ghost" class="flex items-center">
        <UIcon name="i-heroicons-arrow-left" class="mr-2" />
        Back to Dashboard
      </UButton>
    </div>
    
    <UCard>
      <template #header>
        <div class="font-semibold text-lg">Import Data</div>
      </template>
      
      <DataImport />
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
});
</script>