<template>
  <div v-if="loading" class="animate-fade-in">
    <div class="flex gap-8">
      <div class="skeleton w-80 h-[420px] rounded-xl flex-shrink-0"></div>
      <div class="flex-1 space-y-4">
        <div class="skeleton h-8 w-2/3"></div>
        <div class="skeleton h-5 w-1/3"></div>
        <div class="skeleton h-20 w-full"></div>
      </div>
    </div>
  </div>

  <div v-else-if="model" class="animate-fade-in">
    <!-- Back -->
    <button @click="$router.back()" class="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      返回
    </button>

    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Preview -->
      <div class="lg:w-80 flex-shrink-0">
        <div class="glass rounded-xl overflow-hidden aspect-[3/4]">
          <img
            v-if="model.previewUrl"
            :src="model.previewUrl"
            :alt="model.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center bg-dark-700">
            <svg class="w-16 h-16 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-4 space-y-2">
          <button
            v-if="model.civitaiModelId"
            @click="openCivitai"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-dark-700 hover:bg-dark-600 text-text-primary text-sm font-medium rounded-lg border border-dark-500 transition-all"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            在 CivitAI 上查看
          </button>

          <button
            @click="showSymlinkDialog = true"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-accent-500/20"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            建立 Symlink
          </button>
        </div>
      </div>

      <!-- Details -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-text-primary">{{ model.name }}</h1>
            <p class="text-sm text-text-tertiary mt-1">{{ model.fileName }}</p>
          </div>
        </div>

        <!-- Meta -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div class="glass rounded-lg p-3">
            <p class="text-xs text-text-tertiary">類型</p>
            <p class="text-sm font-semibold text-accent-300 mt-1">{{ model.type }}</p>
          </div>
          <div class="glass rounded-lg p-3">
            <p class="text-xs text-text-tertiary">大小</p>
            <p class="text-sm font-semibold text-text-primary mt-1">{{ formatFileSize(model.fileSize) }}</p>
          </div>
          <div class="glass rounded-lg p-3">
            <p class="text-xs text-text-tertiary">基礎模型</p>
            <p class="text-sm font-semibold text-text-primary mt-1">{{ model.baseModel || '未知' }}</p>
          </div>
          <div class="glass rounded-lg p-3">
            <p class="text-xs text-text-tertiary">Hash</p>
            <p class="text-xs font-mono text-text-secondary mt-1 truncate" :title="model.sha256 || ''">
              {{ model.sha256 ? model.sha256.substring(0, 12) + '...' : '—' }}
            </p>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="model.tags.length > 0" class="mt-6">
          <h3 class="text-sm font-semibold text-text-secondary mb-2">標籤</h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="tag in model.tags"
              :key="tag"
              class="px-3 py-1 text-xs rounded-full bg-dark-600 text-text-secondary hover:text-text-primary hover:bg-dark-500 transition-colors cursor-default"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- File Path -->
        <div class="mt-6">
          <h3 class="text-sm font-semibold text-text-secondary mb-2">檔案路徑</h3>
          <p class="text-xs font-mono text-text-tertiary bg-dark-700 p-3 rounded-lg break-all">
            {{ model.filePath }}
          </p>
        </div>

        <!-- Description -->
        <div v-if="model.description" class="mt-6">
          <h3 class="text-sm font-semibold text-text-secondary mb-2">說明</h3>
          <div class="text-sm text-text-secondary leading-relaxed glass rounded-lg p-4" v-html="model.description"></div>
        </div>
      </div>
    </div>

    <!-- Symlink Dialog -->
    <div v-if="showSymlinkDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="showSymlinkDialog = false">
      <div class="glass rounded-xl p-6 w-full max-w-md animate-fade-in">
        <h3 class="text-lg font-semibold text-text-primary mb-4">建立 Symlink</h3>
        <p class="text-sm text-text-secondary mb-4">輸入目標目錄（如 WebUI 的 models/Stable-diffusion 資料夾）</p>
        <input
          v-model="symlinkTarget"
          type="text"
          placeholder="D:\stable-diffusion-webui\models\Stable-diffusion"
          class="w-full px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-500"
        />
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showSymlinkDialog = false" class="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
            取消
          </button>
          <button
            @click="onCreateSymlink"
            :disabled="!symlinkTarget"
            class="px-4 py-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all"
          >
            建立
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getModel, createSymlink, type ModelData } from '../api';

const route = useRoute();
const model = ref<ModelData | null>(null);
const loading = ref(true);
const showSymlinkDialog = ref(false);
const symlinkTarget = ref('');

onMounted(async () => {
  const id = parseInt(route.params.id as string);
  try {
    const { data } = await getModel(id);
    model.value = data;
  } catch (err) {
    console.error('Failed to fetch model:', err);
  } finally {
    loading.value = false;
  }
});

function openCivitai() {
  if (model.value?.civitaiModelId) {
    window.open(`https://civitai.com/models/${model.value.civitaiModelId}`, '_blank');
  }
}

async function onCreateSymlink() {
  if (!model.value || !symlinkTarget.value) return;
  try {
    await createSymlink(model.value.id, symlinkTarget.value);
    showSymlinkDialog.value = false;
    symlinkTarget.value = '';
    alert('Symlink 建立成功！');
  } catch (err: any) {
    alert(`建立失敗: ${err.response?.data?.error || err.message}`);
  }
}

function formatFileSize(bytes: string): string {
  const size = parseInt(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
</script>
