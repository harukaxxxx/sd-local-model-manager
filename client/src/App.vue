<template>
  <div class="min-h-screen bg-dark-900">
    <!-- Navbar -->
    <nav class="glass sticky top-0 z-50 border-b border-dark-500/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <router-link to="/" class="flex items-center gap-3 group">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-400 flex items-center justify-center shadow-lg shadow-accent-500/20 group-hover:shadow-accent-500/40 transition-shadow">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span class="text-lg font-semibold gradient-text">SD Model Manager</span>
          </router-link>

          <div class="flex items-center gap-4">
            <router-link
              to="/settings"
              class="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-dark-600 transition-all"
              title="設定"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </router-link>

            <div
              class="flex items-center gap-2 text-xs"
              :class="socketStore.connected ? 'text-success-500' : 'text-text-tertiary'"
            >
              <div class="w-2 h-2 rounded-full" :class="socketStore.connected ? 'bg-success-500 animate-pulse' : 'bg-dark-400'"></div>
              {{ socketStore.connected ? '已連線' : '離線' }}
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Scan Progress Bar -->
    <ScanProgressBar />

    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useSocketStore } from './stores/socket';
import ScanProgressBar from './components/ScanProgressBar.vue';

const socketStore = useSocketStore();

onMounted(() => {
  socketStore.connect();
});

onUnmounted(() => {
  socketStore.disconnect();
});
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
