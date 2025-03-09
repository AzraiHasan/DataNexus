<template>
  <div class="query-interface">
    <!-- Query input -->
    <UCard>
      <template #header>
        <div class="font-semibold text-lg">Ask AI Assistant</div>
      </template>
      
      <form @submit.prevent="submitQuery" class="space-y-4">
        <div>
          <UTextarea v-model="queryText" placeholder="Ask a question about your telecom tower data..." 
            :rows="3" class="w-full" :disabled="loading" />
        </div>
        
        <div class="flex justify-between items-center">
          <div>
            <UPopover>
              <UButton variant="ghost" :icon="modelIcon">
                {{ selectedModel.label }}
              </UButton>
              <template #panel>
                <div class="p-4 w-64">
                  <p class="text-sm text-gray-600 mb-2">Select AI model:</p>
                  <div v-for="model in availableModels" :key="model.value" 
                    @click="selectModel(model.value)"
                    class="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                    <UIcon :name="model.icon" class="mr-2" />
                    <div>
                      <p class="text-sm font-medium">{{ model.label }}</p>
                      <p class="text-xs text-gray-500">{{ model.description }}</p>
                    </div>
                  </div>
                </div>
              </template>
            </UPopover>
          </div>
          
          <UButton type="submit" color="primary" :loading="loading" :disabled="!queryText.trim()">
            Ask Question
          </UButton>
        </div>
      </form>
    </UCard>
    
    <!-- Response display -->
    <UCard v-if="currentResponse" class="mt-4">
      <template #header>
        <div class="font-semibold text-lg">AI Response</div>
      </template>
      
      <div v-if="loading" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
      </div>
      <div v-else>
        <div class="prose max-w-none">
          {{ currentResponse.content }}
        </div>
        
        <div class="mt-4 text-xs text-gray-500">
          <p>{{ currentResponse.tokensUsed }} tokens used • {{ formatDate(currentResponse.timestamp) }}</p>
        </div>
      </div>
    </UCard>
    
    <!-- Query templates -->
    <UCard v-if="!currentResponse && !loading" class="mt-4">
      <template #header>
        <div class="font-semibold text-lg">Suggested Questions</div>
      </template>
      
      <div class="grid gap-2">
        <UButton v-for="template in queryTemplates" :key="template.id" 
          variant="soft" @click="useTemplate(template.query)" size="sm" class="text-left">
          {{ template.query }}
        </UButton>
      </div>
    </UCard>
    
    <!-- Query history -->
    <UCard v-if="queryHistory.length > 0" class="mt-4">
      <template #header>
        <div class="font-semibold text-lg">Recent Questions</div>
      </template>
      
      <div class="divide-y">
        <div v-for="(item, index) in queryHistory.slice(0, 5)" :key="index" 
          class="py-2 cursor-pointer hover:bg-gray-50" @click="useHistoryItem(item)">
          <p class="text-sm">{{ item.query }}</p>
          <p class="text-xs text-gray-500">{{ formatDate(item.timestamp) }}</p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
// Setup context manager
const contextManager = useContextManager();
interface QueryHistoryItem {
  query: string;
  response: string;
  model: string;
  tokensUsed: number;
  timestamp: Date;
}

interface QueryResponse {
  content: string;
  tokensUsed: number;
  timestamp: Date;
}

interface QueryTemplate {
  id: number;
  query: string;
}

interface ModelOption {
  value: string;
  label: string;
  icon: string;
  description: string;
}

// Component state
const queryText = ref('');
const loading = ref(false);
const currentResponse = ref<QueryResponse | null>(null);
const queryHistory = ref<QueryHistoryItem[]>([]);

// Setup Claude API
const { sendPrompt, selectModel: recommendModel } = useClaudeApi();

// Available models
const availableModels = [
  {
    value: 'claude-3-5-haiku',
    label: 'Haiku',
    icon: 'i-heroicons-bolt',
    description: 'Fast responses for simple queries'
  },
  {
    value: 'claude-3-7-sonnet',
    label: 'Sonnet',
    icon: 'i-heroicons-sparkles',
    description: 'Balanced speed and depth for most questions'
  },
  {
    value: 'claude-3-opus',
    label: 'Opus',
    icon: 'i-heroicons-academic-cap',
    description: 'Advanced analysis for complex questions'
  }
];

// Current model selection
const selectedModelName = ref('claude-3-7-sonnet');

// Computed property for the selected model
const selectedModel = computed(() => {
  return availableModels.find(model => model.value === selectedModelName.value) || availableModels[1];
});

// Computed property for the model icon
const modelIcon = computed(() => {
  return selectedModel.value.icon;
});

// Common query templates
const queryTemplates = [
  { id: 1, query: 'How many towers do we have by status?' },
  { id: 2, query: 'Which contracts are expiring in the next 90 days?' },
  { id: 3, query: 'What is our monthly revenue from tower contracts?' },
  { id: 4, query: 'Show me the geographic distribution of our towers' },
  { id: 5, query: 'Which landlords have multiple towers?' }
];

// Submit a query to the Claude API
async function submitQuery() {
  if (!queryText.value.trim()) return;
  
  loading.value = true;
  
  try {
    // Save the query
    const query = queryText.value.trim();
    
    // Build prompt with context
    const prompt = contextManager.buildPrompt(query);
    
    // Add user message to context
    contextManager.addMessage('user', query);
    
    // Determine the model to use
    const modelToUse = selectedModelName.value;
    
    // Send the query to Claude
    const response = await sendPrompt(prompt, {
      model: modelToUse as any
    });
    
    if (!response.success) {
      throw new Error(response.error);
    }
    
    // Add assistant response to context
    contextManager.addMessage('assistant', response.content);
    
    // Update current response
    currentResponse.value = {
      content: response.content,
      tokensUsed: response.tokensUsed,
      timestamp: new Date()
    };
    
    // Add to history
    queryHistory.value.unshift({
      query: query,
      response: response.content,
      model: modelToUse,
      tokensUsed: response.tokensUsed,
      timestamp: new Date()
    });
    
    // Clear the input
    queryText.value = '';
    
    // Save history to local storage
    saveQueryHistory();
    
  } catch (err: any) {
    console.error('Query error:', err);
    
    const toast = useToast();
    toast.add({
      title: 'Error',
      description: err.message || 'Failed to get response',
      color: 'red'
    });
  } finally {
    loading.value = false;
  }
}

// Use a query template
function useTemplate(query: string) {
  queryText.value = query;
}

// Reuse a query from history
function useHistoryItem(item: QueryHistoryItem) {
  queryText.value = item.query;
  currentResponse.value = {
    content: item.response,
    tokensUsed: item.tokensUsed,
    timestamp: item.timestamp
  };
}

// Select a specific model
function selectModel(modelName: string) {
  selectedModelName.value = modelName;
}

// Format date for display
function formatDate(date: Date): string {
  // If today, show time
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date);
  
  if (itemDate >= today) {
    return itemDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  
  // Otherwise show date
  return itemDate.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric' 
  });
}

// Load query history from localStorage
function loadQueryHistory() {
  const savedHistory = localStorage.getItem('queryHistory');
  if (savedHistory) {
    try {
      const parsed = JSON.parse(savedHistory);
      // Convert string dates back to Date objects
      queryHistory.value = parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    } catch (err) {
      console.error('Error loading query history:', err);
    }
  }
}

// Save query history to localStorage
function saveQueryHistory() {
  // Limit history to 20 items
  const historyToSave = queryHistory.value.slice(0, 20);
  localStorage.setItem('queryHistory', JSON.stringify(historyToSave));
}

// Load history on component mount
onMounted(() => {
  loadQueryHistory();
  contextManager.loadDataContext();
}); 
</script>