<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">模型庫</h1>
        <p class="text-sm text-text-secondary mt-1">
          共 {{ modelStore.pagination.total }} 個模型
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Search -->
        <div class="relative">
          <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchInput"
            @input="onSearch"
            type="text"
            placeholder="搜尋模型..."
            class="pl-9 pr-4 py-2 bg-dark-700 border border-dark-500 rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30 transition-all w-64"
          />
        </div>

        <!-- Type Filter -->
        <select
          v-model="typeFilter"
          @change="modelStore.setTypeFilter(typeFilter)"
          class="px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-500 transition-all"
        >
          <option value="">所有類型</option>
          <option value="Checkpoint">Checkpoint</option>
          <option value="LoRA">LoRA</option>
          <option value="VAE">VAE</option>
          <option value="Embedding">Embedding</option>
        </select>

        <!-- View Mode Toggle -->
        <div class="flex items-center bg-dark-700 rounded-lg border border-dark-500 p-0.5">
          <button
            @click="modelStore.setViewMode('grid')"
            :class="[
              'p-1.5 rounded-md transition-all',
              modelStore.viewMode === 'grid' ? 'bg-accent-500 text-white' : 'text-text-tertiary hover:text-text-primary'
            ]"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            @click="modelStore.setViewMode('list')"
            :class="[
              'p-1.5 rounded-md transition-all',
              modelStore.viewMode === 'list' ? 'bg-accent-500 text-white' : 'text-text-tertiary hover:text-text-primary'
            ]"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <!-- Scan Button -->
        <button
          @click="onScan"
          :disabled="scanning"
          class="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-accent-500/20 hover:shadow-accent-500/40"
        >
          <svg
            class="w-4 h-4"
            :class="{ 'animate-spin': scanning }"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ scanning ? '掃描中...' : '掃描' }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="modelStore.loading && !modelStore.hasModels" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div v-for="i in 8" :key="i" class="glass rounded-xl overflow-hidden animate-fade-in">
        <div class="skeleton h-48 w-full"></div>
        <div class="p-4 space-y-3">
          <div class="skeleton h-5 w-3/4"></div>
          <div class="skeleton h-4 w-1/2"></div>
          <div class="flex gap-2">
            <div class="skeleton h-6 w-16 rounded-full"></div>
            <div class="skeleton h-6 w-12 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!modelStore.hasModels && !modelStore.loading" class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-20 h-20 rounded-2xl bg-dark-700 flex items-center justify-center mb-6">
        <svg class="w-10 h-10 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-text-primary mb-2">尚無模型</h2>
      <p class="text-text-secondary mb-6 max-w-md">
        前往設定頁面新增模型掃描路徑，然後點擊「掃描」按鈕來匯入你的模型。
      </p>
      <router-link
        to="/settings"
        class="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium rounded-lg transition-all"
      >
        前往設定
      </router-link>
    </div>

    <!-- Grid View -->
    <div
      v-else-if="modelStore.viewMode === 'grid'"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <ModelCard v-for="model in modelStore.models" :key="model.id" :model="model" />
    </div>

    <!-- List View -->
    <div v-else class="space-y-2">
      <ModelListItem v-for="model in modelStore.models" :key="model.id" :model="model" />
    </div>

    <!-- Pagination -->
    <div v-if="modelStore.pagination.totalPages > 1" class="flex items-center justify-center gap-2 mt-8">
      <button
        v-for="page in modelStore.pagination.totalPages"
        :key="page"
        @click="modelStore.fetchModels(page)"
        :class="[
          'w-9 h-9 rounded-lg text-sm font-medium transition-all',
          page === modelStore.pagination.page
            ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20'
            : 'bg-dark-700 text-text-secondary hover:text-text-primary hover:bg-dark-600'
        ]"
      >
        {{ page }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useModelStore } from '../stores/models';
import { useSocketStore } from '../stores/socket';
import { triggerScan } from '../api';
import ModelCard from '../components/ModelCard.vue';
import ModelListItem from '../components/ModelListItem.vue';

const modelStore = useModelStore();
const socketStore = useSocketStore();

const searchInput = ref('');
const typeFilter = ref('');

const scanning = computed(() => {
  const s = socketStore.scanProgress;
  return s !== null && s.status !== 'completed' && s.status !== 'error';
});

let searchTimer: ReturnType<typeof setTimeout>;
function onSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    modelStore.setSearch(searchInput.value);
  }, 300);
}

async function onScan() {
  try {
    await triggerScan();
  } catch (err) {
    console.error('Failed to start scan:', err);
  }
}

onMounted(() => {
  modelStore.fetchModels();
});
</script>
