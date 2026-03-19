<template>
  <div class="animate-fade-in">
    <button @click="$router.back()" class="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      返回
    </button>

    <h1 class="text-2xl font-bold text-text-primary mb-8">設定</h1>

    <!-- Scan Paths -->
    <section class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg font-semibold text-text-primary">掃描路徑</h2>
          <p class="text-sm text-text-secondary mt-1">設定模型檔案所在的目錄路徑</p>
        </div>
      </div>

      <!-- Add Path Form -->
      <div class="glass rounded-xl p-4 mb-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <input
            v-model="newPath"
            type="text"
            placeholder="輸入絕對路徑（如 D:\AI\models\checkpoints）"
            class="flex-1 px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-500"
          />
          <select
            v-model="newModelType"
            class="px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-500 sm:w-40"
          >
            <option value="Checkpoint">Checkpoint</option>
            <option value="LoRA">LoRA</option>
            <option value="VAE">VAE</option>
            <option value="Embedding">Embedding</option>
          </select>
          <button
            @click="onAddPath"
            :disabled="!newPath"
            class="px-4 py-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all whitespace-nowrap"
          >
            新增路徑
          </button>
        </div>
      </div>

      <!-- Paths List -->
      <div class="space-y-2">
        <div
          v-for="scanPath in scanPaths"
          :key="scanPath.id"
          class="glass rounded-lg p-4 flex items-center justify-between gap-4"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-text-primary truncate">{{ scanPath.path }}</p>
            <div class="flex items-center gap-3 mt-1">
              <span class="text-xs px-2 py-0.5 rounded-full bg-dark-600 text-accent-300">
                {{ scanPath.modelType }}
              </span>
              <span class="text-xs text-text-tertiary">
                {{ new Date(scanPath.createdAt).toLocaleDateString('zh-TW') }}
              </span>
            </div>
          </div>

          <button
            @click="onDeletePath(scanPath.id)"
            class="p-2 text-text-tertiary hover:text-error-500 transition-colors"
            title="刪除"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <div v-if="scanPaths.length === 0" class="glass rounded-lg p-8 text-center">
          <p class="text-sm text-text-tertiary">尚未設定掃描路徑</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getScanPaths, addScanPath, deleteScanPath, type ScanPath } from '../api';

const scanPaths = ref<ScanPath[]>([]);
const newPath = ref('');
const newModelType = ref('Checkpoint');

onMounted(async () => {
  await fetchPaths();
});

async function fetchPaths() {
  try {
    const { data } = await getScanPaths();
    scanPaths.value = data;
  } catch (err) {
    console.error('Failed to fetch scan paths:', err);
  }
}

async function onAddPath() {
  if (!newPath.value) return;
  try {
    await addScanPath(newPath.value, newModelType.value);
    newPath.value = '';
    await fetchPaths();
  } catch (err: any) {
    alert(err.response?.data?.error || '新增失敗');
  }
}

async function onDeletePath(id: number) {
  if (!confirm('確定要刪除這個掃描路徑嗎？')) return;
  try {
    await deleteScanPath(id);
    await fetchPaths();
  } catch (err) {
    console.error('Failed to delete path:', err);
  }
}
</script>
