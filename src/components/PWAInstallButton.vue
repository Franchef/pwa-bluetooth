<script setup lang="ts">
import { ref } from 'vue';
import { usePWAInstall } from '../composables/usePWAInstall';
import { Download, Share2, X, Smartphone, CheckCircle } from 'lucide-vue-next';

const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
const showIOSGuide = ref(false);
const justInstalled = ref(false);

const handleInstallClick = async () => {
  const success = await install();
  if (success) {
    justInstalled.value = true;
  }
};

const handleFallbackClick = () => {
  alert('To install this PWA, click the install icon in your browser URL address bar or select "Add to Home screen" in the browser menu.');
};
</script>

<template>
  <!-- If already running as an installed PWA, render a verified badge -->
  <div
    v-if="isInstalled || justInstalled"
    id="pwa-installed-badge"
    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium"
  >
    <CheckCircle class="w-3.5 h-3.5 text-emerald-400" />
    <span class="hidden sm:inline">PWA Installed</span>
    <span class="sm:hidden">Installed</span>
  </div>

  <!-- Chromium / Android / Desktop flow -->
  <button
    v-else-if="isInstallable"
    id="btn-pwa-install"
    @click="handleInstallClick"
    class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-medium shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition active:scale-95 cursor-pointer"
  >
    <Download class="w-3.5 h-3.5" />
    <span>Install PWA</span>
  </button>

  <!-- iOS Safari flow -->
  <template v-else-if="isIOS">
    <button
      id="btn-pwa-install-ios"
      @click="showIOSGuide = true"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-cyan-400 text-xs font-medium hover:bg-slate-700 transition cursor-pointer"
    >
      <Smartphone class="w-3.5 h-3.5" />
      <span>Install on iOS</span>
    </button>

    <div
      v-if="showIOSGuide"
      id="modal-ios-install-guide"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div class="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative">
        <button
          @click="showIOSGuide = false"
          class="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X class="w-5 h-5" />
        </button>

        <div class="flex items-center gap-3 mb-4">
          <div class="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Smartphone class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-white">Install BLE Tracker</h3>
            <p class="text-xs text-slate-400">Add to your iPhone / iPad Home Screen</p>
          </div>
        </div>

        <div class="space-y-3 text-xs text-slate-300">
          <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span class="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold shrink-0">1</span>
            <p>
              Tap the <strong class="text-white">Share</strong> button <Share2 class="inline w-3.5 h-3.5 mx-0.5 text-cyan-400" /> at the bottom of Safari.
            </p>
          </div>
          <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span class="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold shrink-0">2</span>
            <p>
              Scroll down and select <strong class="text-white">Add to Home Screen</strong>.
            </p>
          </div>
          <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span class="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold shrink-0">3</span>
            <p>
              Launch from your Home Screen for a full-screen, offline-enabled native experience!
            </p>
          </div>
        </div>

        <button
          @click="showIOSGuide = false"
          class="mt-5 w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition"
        >
          Got it
        </button>
      </div>
    </div>
  </template>

  <!-- Fallback -->
  <button
    v-else
    id="btn-pwa-install-fallback"
    @click="handleFallbackClick"
    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer"
    title="Installable Progressive Web App"
  >
    <Download class="w-3.5 h-3.5 text-cyan-400" />
    <span class="hidden sm:inline">PWA Ready</span>
    <span class="sm:hidden">PWA</span>
  </button>
</template>
