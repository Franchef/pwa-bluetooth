<script setup lang="ts">
import { Bluetooth, Radio, MapPin, RefreshCw, Cpu, Database } from 'lucide-vue-next';
import PWAInstallButton from './PWAInstallButton.vue';
import { GeoCoordinates } from '../types';

defineProps<{
  isScanning: boolean;
  hardwareSupported: boolean;
  coordinates: GeoCoordinates;
  activeTab: 'radar' | 'vault' | 'api-console';
  registeredCount: number;
}>();

defineEmits<{
  (e: 'toggle-scanning'): void;
  (e: 'scan-hardware'): void;
  (e: 'refresh-gps'): void;
  (e: 'update:active-tab', tab: 'radar' | 'vault' | 'api-console'): void;
}>();
</script>

<template>
  <header id="main-header" class="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090D16]/90 backdrop-blur-xl">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 gap-4">
        
        <!-- Logo & Brand Identity -->
        <div class="flex items-center gap-3">
          <div class="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/20 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Bluetooth class="w-5 h-5 text-cyan-300 animate-pulse" />
            <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-[#090D16]"></span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-base tracking-tight text-white font-mono">
                BLE<span class="text-cyan-400">.TRACKER</span>
              </span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                PWA
              </span>
            </div>
            <p class="text-[11px] text-slate-400 hidden sm:block">
              Autonomous Proximity & Spatial Asset Registry
            </p>
          </div>
        </div>

        <!-- Navigation Tabs (Crypto Style) -->
        <nav class="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-medium">
          <button
            id="tab-radar"
            @click="$emit('update:active-tab', 'radar')"
            :class="[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer',
              activeTab === 'radar'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            <Radio class="w-3.5 h-3.5" />
            <span>Discovery</span>
          </button>
          <button
            id="tab-vault"
            @click="$emit('update:active-tab', 'vault')"
            :class="[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition relative cursor-pointer',
              activeTab === 'vault'
                ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            <Database class="w-3.5 h-3.5" />
            <span>Registry</span>
            <span
              v-if="registeredCount > 0"
              class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-purple-500/30 text-purple-200 border border-purple-500/40"
            >
              {{ registeredCount }}
            </span>
          </button>
        </nav>

        <!-- Actions & Status indicators -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- GPS Telemetry Pill -->
          <button
            id="btn-nav-gps"
            @click="$emit('refresh-gps')"
            title="Click to refresh phone GPS coordinates"
            class="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:border-slate-700 transition cursor-pointer"
          >
            <MapPin :class="['w-3.5 h-3.5', coordinates.status === 'locked' ? 'text-emerald-400' : 'text-amber-400']" />
            <span>
              {{
                coordinates.latitude !== null && coordinates.longitude !== null
                  ? `${coordinates.latitude.toFixed(4)}°, ${coordinates.longitude.toFixed(4)}°`
                  : 'Acquiring GPS...'
              }}
            </span>
            <RefreshCw :class="['w-3 h-3 text-slate-400', coordinates.status === 'requesting' ? 'animate-spin' : '']" />
          </button>

          <!-- Hardware Web Bluetooth Scan Trigger -->
          <button
            id="btn-scan-hardware-bt"
            @click="$emit('scan-hardware')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition cursor-pointer"
            title="Scan nearby physical Bluetooth devices via Web Bluetooth API"
          >
            <Cpu class="w-3.5 h-3.5 text-cyan-400" />
            <span class="hidden sm:inline">Web BLE Scan</span>
            <span class="sm:hidden">BLE</span>
          </button>

          <!-- Radar Scan Toggle -->
          <button
            id="btn-toggle-scan"
            @click="$emit('toggle-scanning')"
            :class="[
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer',
              isScanning
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
            ]"
          >
            <span :class="['w-2 h-2 rounded-full', isScanning ? 'bg-emerald-400 animate-ping' : 'bg-slate-500']" />
            <span>{{ isScanning ? 'Scanning' : 'Paused' }}</span>
          </button>

          <!-- In-app PWA install button -->
          <PWAInstallButton />
        </div>

      </div>
    </div>
  </header>
</template>
