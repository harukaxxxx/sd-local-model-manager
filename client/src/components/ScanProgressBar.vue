<template>
  <div
    v-if="scanProgress && scanProgress.status !== 'completed'"
    class="bg-dark-800 border-b border-dark-600"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div class="flex items-center gap-3">
        <svg class="w-4 h-4 text-accent-400 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 text-sm">
            <span class="text-text-secondary">{{ statusText }}</span>
            <span v-if="scanProgress.file" class="text-text-primary font-medium truncate">
              {{ scanProgress.file }}
            </span>
          </div>
          <div v-if="scanProgress.total" class="text-xs text-text-tertiary mt-0.5">
            {{ scanProgress.current }}/{{ scanProgress.total }} 個檔案
          </div>
        </div>

        <!-- Progress Bar -->
        <div v-if="scanProgress.percent !== undefined" class="w-32 flex-shrink-0">
          <div class="h-1.5 bg-dark-600 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-accent-500 to-accent-400 rounded-full transition-all duration-300"
              :style="{ width: `${scanProgress.percent}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSocketStore } from '../stores/socket';

const socketStore = useSocketStore();
const scanProgress = computed(() => socketStore.scanProgress);

const statusText = computed(() => {
  switch (scanProgress.value?.status) {
    case 'started': return '開始掃描';
    case 'scanning': return '掃描中';
    case 'hashing': return '計算 Hash';
    case 'added': return '已新增';
    case 'skipped': return '已跳過';
    case 'error': return '錯誤';
    default: return '處理中';
  }
});
</script>
