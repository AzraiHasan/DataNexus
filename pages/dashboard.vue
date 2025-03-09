<!-- TEMPORARY EMERGENCY FIX: This is a minimal version to bypass the type error -->
<script setup lang="ts">
import { useRouter } from 'vue-router'

definePageMeta({
  middleware: ['auth']
})

const router = useRouter()

function goToUploads() {
  router.push('/uploads')
}
</script>

<template>
  <section class="container mx-auto p-6">
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-4">Dashboard</h1>
      <p class="text-gray-600">
        The dashboard is temporarily simplified while we resolve a technical issue.
      </p>
      <div class="mt-4">
        <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded" @click="goToUploads">
          Manage Data Uploads
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Simple Stat Panels -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4">Tower Statistics</h2>
        <p class="text-gray-600">Tower statistics will be available shortly.</p>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4">Contract Timeline</h2>
        <p class="text-gray-600">Contract timeline will be available shortly.</p>
      </div>

      <!-- Simple Upload Panel -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4">Quick Upload</h2>
        <p class="text-gray-600">
          The upload component is temporarily unavailable.
          Please use the Data Management page.
        </p>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4">Data Management</h2>
        <p class="text-gray-600 mb-4">
          Access advanced data upload and validation features.
        </p>
        <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded" @click="goToUploads">
          Go to Data Management
        </button>
      </div>
    </div>
  </section>
</template>
