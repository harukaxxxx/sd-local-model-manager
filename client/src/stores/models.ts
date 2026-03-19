import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getModels, type ModelData, type PaginatedResponse } from '../api';

export const useModelStore = defineStore('models', () => {
  const models = ref<ModelData[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const searchQuery = ref('');
  const typeFilter = ref('');
  const tagFilter = ref('');
  const viewMode = ref<'grid' | 'list'>('grid');

  const hasModels = computed(() => models.value.length > 0);

  async function fetchModels(page = 1) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await getModels({
        page,
        limit: pagination.value.limit,
        type: typeFilter.value || undefined,
        tag: tagFilter.value || undefined,
        search: searchQuery.value || undefined,
      });
      models.value = data.data;
      pagination.value = data.pagination;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch models';
      console.error('Failed to fetch models:', err);
    } finally {
      loading.value = false;
    }
  }

  function setViewMode(mode: 'grid' | 'list') {
    viewMode.value = mode;
  }

  function setSearch(query: string) {
    searchQuery.value = query;
    fetchModels(1);
  }

  function setTypeFilter(type: string) {
    typeFilter.value = type;
    fetchModels(1);
  }

  function setTagFilter(tag: string) {
    tagFilter.value = tag;
    fetchModels(1);
  }

  return {
    models,
    loading,
    error,
    pagination,
    searchQuery,
    typeFilter,
    tagFilter,
    viewMode,
    hasModels,
    fetchModels,
    setViewMode,
    setSearch,
    setTypeFilter,
    setTagFilter,
  };
});
