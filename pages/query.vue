<template>
  <div class="container max-w-4xl mx-auto py-6 px-4 sm:px-6">
    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6"
    >
      <h1 class="text-2xl font-bold">AI Assistant</h1>
      <UButton to="/dashboard" variant="ghost" class="flex items-center">
        <UIcon name="i-heroicons-arrow-left" class="mr-2" />
        Back to Dashboard
      </UButton>
    </div>

    <p class="text-gray-600 mb-6">
      Ask questions about your telecom tower data in natural language. Our AI
      assistant will analyze your data and provide insights.
    </p>

    <QueryInterface />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});
</script>
