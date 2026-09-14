<script setup lang="ts">
import { computed } from 'vue';
import { BLEDevice } from '../types';
import { Radio, Zap, ShieldCheck, Navigation } from 'lucide-vue-next';

const props = defineProps<{
  devices: BLEDevice[];
  selectedDeviceId: string | null;
  isScanning: boolean;
  gpsAccuracy: number | null;
}>();

defineEmits<{
  (e: 'select-device', id: string): void;
}>();

// Convert device ID / MAC address to fixed angle for consistent radar blip positioning
const getDeviceAngle = (mac: string) => {
  let hash = 0;
  for (let i = 0; i < mac.length; i++) {
    hash = (hash << 5) - hash + mac.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 360);
};

// Convert distance (0.3m to 25m) to radius percentage (18% to 90%)
const getRadiusPercent = (dist: number) => {
  const clamped = Math.max(0.3, Math.min(25, dist));
  const norm = Math.log10(clamped + 1) / Math.log10(26);
  return 18 + norm * 72;
};

const registeredCount = computed(() => props.devices.filter((d) => d.isRegistered).length);

const closestDevice = computed(() => {
  if (props.devices.length === 0) return null;
  return [...props.devices].sort((a, b) => a.distanceMeters - b.distanceMeters)[0];
});
</script>

<template>
  <div class="w-full">
    <!-- Crypto-Style Metric Cards Row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      
      <!-- Metric 1: Active Signals -->
      <div class="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-lg shadow-black/20 relative overflow-hidden group hover:border-cyan-500/40 transition">
        <div class="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition"></div>
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Signals Around</span>
          <span class="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Radio class="w-3.5 h-3.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-bold font-mono text-white">{{ devices.length }}</span>
          <span class="text-[11px] font-medium text-cyan-400 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            Live
          </span>
        </div>
      </div>

      <!-- Metric 2: Registered -->
      <div class="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-lg shadow-black/20 relative overflow-hidden group hover:border-emerald-500/40 transition">
        <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition"></div>
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Registered</span>
          <span class="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShieldCheck class="w-3.5 h-3.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-bold font-mono text-emerald-400">{{ registeredCount }}</span>
          <span class="text-[11px] text-slate-400">of {{ devices.length }}</span>
        </div>
      </div>

      <!-- Metric 3: Nearest Beacon -->
      <div class="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-lg shadow-black/20 relative overflow-hidden group hover:border-purple-500/40 transition">
        <div class="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition"></div>
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Nearest Node</span>
          <span class="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <Zap class="w-3.5 h-3.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-bold font-mono text-purple-300">
            {{ closestDevice ? `${closestDevice.distanceMeters.toFixed(1)}m` : '--' }}
          </span>
          <span class="text-[11px] text-slate-400 font-mono">
            {{ closestDevice ? `${closestDevice.rssi} dBm` : '' }}
          </span>
        </div>
      </div>

      <!-- Metric 4: GPS Precision -->
      <div class="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-lg shadow-black/20 relative overflow-hidden group hover:border-blue-500/40 transition">
        <div class="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition"></div>
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Phone GPS</span>
          <span class="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Navigation class="w-3.5 h-3.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-bold font-mono text-blue-300">
            {{ gpsAccuracy !== null ? `±${gpsAccuracy.toFixed(1)}m` : '3.8m' }}
          </span>
          <span class="text-[11px] text-emerald-400 font-medium">Locked</span>
        </div>
      </div>

    </div>

    <!-- Radar Visual Display Container -->
    <div class="relative rounded-3xl bg-slate-900/70 border border-slate-800/80 p-5 shadow-2xl shadow-black/40 overflow-hidden">
      
      <!-- Subtle background ambient mesh -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.06),transparent_70%)] pointer-events-none"></div>

      <!-- Radar Header / Legend -->
      <div class="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-slate-800/80">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            360° RF Proximity Radar
          </span>
          <span class="text-[10px] text-slate-500 font-mono">2.4 GHz ISM</span>
        </div>
        <div class="flex items-center gap-3 text-[11px] text-slate-400">
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
            Selected
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            Registered
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-slate-400"></span>
            Unregistered
          </span>
        </div>
      </div>

      <!-- The Circular Radar Scope -->
      <div class="relative w-full max-w-[340px] aspect-square mx-auto my-3 flex items-center justify-center">
        
        <!-- Concentric Signal Rings -->
        <div class="absolute w-[94%] h-[94%] rounded-full border border-cyan-500/10 border-dashed"></div>
        <div class="absolute w-[72%] h-[72%] rounded-full border border-cyan-500/20"></div>
        <div class="absolute w-[50%] h-[50%] rounded-full border border-blue-500/20 border-dashed"></div>
        <div class="absolute w-[28%] h-[28%] rounded-full border border-cyan-500/30"></div>

        <!-- Crosshairs -->
        <div class="absolute inset-x-0 top-1/2 h-[1px] bg-slate-800 pointer-events-none"></div>
        <div class="absolute inset-y-0 left-1/2 w-[1px] bg-slate-800 pointer-events-none"></div>
        <div class="absolute inset-0 m-auto w-[85%] h-[85%] border border-slate-800/40 rotate-45 pointer-events-none"></div>

        <!-- Distance / RSSI Range Badges on the Radar -->
        <span class="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-500 select-none">
          20m / -90dBm
        </span>
        <span class="absolute top-[16%] left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-600 select-none">
          10m
        </span>
        <span class="absolute top-[28%] left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-600 select-none">
          3m
        </span>

        <!-- Sweeping Scanner Beam -->
        <div
          v-if="isScanning"
          class="absolute inset-0 rounded-full pointer-events-none animate-spin"
          style="animation-duration: 4.5s; background: conic-gradient(from 0deg, transparent 0deg, transparent 300deg, rgba(6, 182, 212, 0.05) 330deg, rgba(6, 182, 212, 0.3) 360deg);"
        ></div>

        <!-- Center Phone Location Node -->
        <div class="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-400 shadow-lg shadow-cyan-500/40 text-cyan-300">
          <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span class="absolute w-2 h-2 rounded-full bg-cyan-300"></span>
        </div>

        <!-- Device Blips positioned around the radar -->
        <button
          v-for="device in devices"
          :key="device.id"
          :id="`radar-blip-${device.id}`"
          @click="$emit('select-device', device.id)"
          :title="`${device.customName} (${device.macAddress}) • ${device.distanceMeters.toFixed(1)}m`"
          class="absolute z-20 -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform duration-300 hover:scale-125 focus:outline-none"
          :style="{
            left: `${50 + (getRadiusPercent(device.distanceMeters) / 2) * Math.cos((getDeviceAngle(device.macAddress) * Math.PI) / 180)}%`,
            top: `${50 + (getRadiusPercent(device.distanceMeters) / 2) * Math.sin((getDeviceAngle(device.macAddress) * Math.PI) / 180)}%`
          }"
        >
          <!-- Active selection ring -->
          <span
            v-if="device.id === selectedDeviceId"
            class="absolute -inset-2 rounded-full bg-cyan-400/30 animate-ping pointer-events-none"
          ></span>
          <span
            v-if="device.id === selectedDeviceId"
            class="absolute -inset-1.5 rounded-full border border-cyan-400 animate-pulse pointer-events-none"
          ></span>

          <!-- Dot graphic -->
          <div
            :class="[
              'w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all',
              device.id === selectedDeviceId
                ? 'bg-cyan-400 ring-2 ring-cyan-200 ring-offset-1 ring-offset-slate-950 shadow-lg shadow-cyan-400/80 scale-110'
                : device.isRegistered
                ? 'bg-emerald-400 ring-1 ring-emerald-200 shadow-md shadow-emerald-400/40'
                : 'bg-slate-400 hover:bg-white ring-1 ring-slate-600'
            ]"
          >
            <span class="w-1 h-1 rounded-full bg-slate-950"></span>
          </div>

          <!-- Hover / Selected Label Tooltip -->
          <div
            :class="[
              'absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-0.5 rounded-md bg-slate-950/95 border border-slate-700 text-[10px] font-mono text-white whitespace-nowrap pointer-events-none transition shadow-lg',
              device.id === selectedDeviceId ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100'
            ]"
          >
            {{ device.customName }} ({{ device.distanceMeters.toFixed(1) }}m)
          </div>
        </button>

      </div>

      <!-- Footer tip / status -->
      <div class="text-center text-[11px] text-slate-400 font-mono">
        <span v-if="devices.length > 0">
          {{ devices.length }} BLE node{{ devices.length === 1 ? '' : 's' }} detected in vicinity. Click any blip or select from the list below.
        </span>
        <span v-else class="text-cyan-400/80">
          Radar active. Click "Web BLE Scan" to discover real nearby Bluetooth peripherals.
        </span>
      </div>

    </div>
  </div>
</template>
