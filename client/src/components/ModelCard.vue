<template>
  <router-link
    :to="`/model/${model.id}`"
    class="glass glass-hover rounded-xl overflow-hidden cursor-pointer group animate-fade-in block"
  >
    <!-- Preview Image -->
    <div class="relative aspect-[3/4] bg-dark-700 overflow-hidden">
      <img
        v-if="model.previewUrl"
        :src="model.previewUrl"
        :alt="model.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <svg class="w-12 h-12 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <!-- Type Badge -->
      <div class="absolute top-2 left-2">
        <span class="px-2 py-1 text-xs font-medium rounded-md glass text-accent-300 bg-dark-900/70">
          {{ model.type }}
        </span>
      </div>

      <!-- Base Model Badge -->
      <div v-if="model.baseModel" class="absolute top-2 right-2">
        <span class="px-2 py-1 text-xs font-medium rounded-md bg-dark-900/70 text-text-secondary">
          {{ model.baseModel }}
        </span>
      </div>
    </div>

    <!-- Info -->
    <div class="p-4">
      <h3 class="text-sm font-semibold text-text-primary truncate group-hover:text-accent-300 transition-colors">
        {{ model.name }}
      </h3>
      <p class="text-xs text-text-tertiary mt-1">{{ formatFileSize(model.fileSize) }}</p>

      <!-- Tags -->
      <div v-if="model.tags.length > 0" class="flex flex-wrap gap-1.5 mt-3">
        <span
          v-for="tag in model.tags.slice(0, 3)"
          :key="tag"
          class="px-2 py-0.5 text-xs rounded-full bg-dark-600 text-text-secondary"
        >
          {{ tag }}
        </span>
        <span v-if="model.tags.length > 3" class="px-2 py-0.5 text-xs rounded-full bg-dark-600 text-text-tertiary">
          +{{ model.tags.length - 3 }}
        </span>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import type { ModelData } from '../api';

defineProps<{
  model: ModelData;
}>();

function formatFileSize(bytes: string): string {
  const size = parseInt(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
</script>
