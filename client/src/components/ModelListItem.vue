<template>
  <router-link
    :to="`/model/${model.id}`"
    class="glass glass-hover rounded-lg p-4 flex items-center gap-4 cursor-pointer group animate-fade-in block"
  >
    <!-- Preview Thumbnail -->
    <div class="w-16 h-16 rounded-lg bg-dark-700 overflow-hidden flex-shrink-0">
      <img
        v-if="model.previewUrl"
        :src="model.previewUrl"
        :alt="model.name"
        class="w-full h-full object-cover"
        loading="lazy"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <svg class="w-6 h-6 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <h3 class="text-sm font-semibold text-text-primary truncate group-hover:text-accent-300 transition-colors">
        {{ model.name }}
      </h3>
      <p class="text-xs text-text-tertiary mt-0.5">{{ model.fileName }}</p>
    </div>

    <!-- Tags -->
    <div class="hidden md:flex items-center gap-1.5 flex-shrink-0">
      <span
        v-for="tag in model.tags.slice(0, 2)"
        :key="tag"
        class="px-2 py-0.5 text-xs rounded-full bg-dark-600 text-text-secondary"
      >
        {{ tag }}
      </span>
    </div>

    <!-- Type -->
    <span class="px-2 py-1 text-xs font-medium rounded-md bg-dark-600 text-accent-300 flex-shrink-0">
      {{ model.type }}
    </span>

    <!-- Base Model -->
    <span v-if="model.baseModel" class="hidden sm:block px-2 py-1 text-xs font-medium rounded-md bg-dark-600 text-text-secondary flex-shrink-0">
      {{ model.baseModel }}
    </span>

    <!-- File Size -->
    <span class="text-xs text-text-tertiary flex-shrink-0 w-20 text-right">
      {{ formatFileSize(model.fileSize) }}
    </span>
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
