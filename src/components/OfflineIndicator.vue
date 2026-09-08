<script setup lang="ts">
import { useOnlineStatus } from '../composables/useOnlineStatus';
import { WifiOff } from 'lucide-vue-next';

const isOnline = useOnlineStatus();
</script>

<template>
  <div
    v-if="!isOnline"
    id="pwa-offline-indicator"
    class="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full bg-amber-500/90 text-black px-4 py-2 text-xs font-semibold shadow-xl shadow-amber-950/40 backdrop-blur-md border border-amber-300/40 animate-bounce"
  >
    <WifiOff class="w-4 h-4 text-slate-950" />
    <span>Offline Mode — PWA cache active. Local registry available.</span>
  </div>
</template>
