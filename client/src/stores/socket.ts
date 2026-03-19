import { defineStore } from 'pinia';
import { ref } from 'vue';
import { io, Socket } from 'socket.io-client';

export interface ScanProgress {
  status: string;
  file?: string;
  percent?: number;
  total?: number;
  current?: number;
  message?: string;
  path?: string;
  added?: number;
  skipped?: number;
}

export interface DownloadProgress {
  modelId: number;
  percent: number;
  speed: string;
  eta: string;
}

export const useSocketStore = defineStore('socket', () => {
  const socket = ref<Socket | null>(null);
  const connected = ref(false);
  const scanProgress = ref<ScanProgress | null>(null);
  const downloadProgress = ref<DownloadProgress | null>(null);

  function connect() {
    if (socket.value?.connected) return;

    const s = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      connected.value = true;
      console.log('🔌 WebSocket connected');
    });

    s.on('disconnect', () => {
      connected.value = false;
      console.log('🔌 WebSocket disconnected');
    });

    s.on('scan_progress', (data: ScanProgress) => {
      scanProgress.value = data;
    });

    s.on('download_progress', (data: DownloadProgress) => {
      downloadProgress.value = data;
    });

    socket.value = s;
  }

  function disconnect() {
    socket.value?.disconnect();
    socket.value = null;
    connected.value = false;
  }

  return {
    socket,
    connected,
    scanProgress,
    downloadProgress,
    connect,
    disconnect,
  };
});
