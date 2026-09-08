<script setup lang="ts">
import { ref, computed } from 'vue';
import { BLEDevice, DeviceGroup } from '../types';
import { Database, Download, Copy, Check, MapPin, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-vue-next';

const props = defineProps<{
  devices: BLEDevice[];
  groups: DeviceGroup[];
}>();

defineEmits<{
  (e: 'select-device', id: string): void;
  (e: 'go-to-discovery'): void;
}>();

const copied = ref(false);
const registeredDevices = computed(() => props.devices.filter((d) => d.isRegistered));

const handleCopyRegistry = () => {
  const data = JSON.stringify(registeredDevices.value, null, 2);
  navigator.clipboard.writeText(data);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};

const handleDownloadJson = () => {
  const data = JSON.stringify(registeredDevices.value, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ble-device-registry-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
</script>

<template>
  <div v-if="registeredDevices.length === 0" class="p-8 text-center rounded-3xl bg-slate-900/60 border border-slate-800 text-slate-400 max-w-xl mx-auto my-8">
    <Database class="w-12 h-12 text-slate-600 mx-auto mb-3" />
    <h3 class="text-lg font-bold text-white">Registry Vault is Empty</h3>
    <p class="text-xs text-slate-400 mt-1 mb-5 leading-relaxed">
      No Bluetooth beacons or devices have been registered yet. Discover nearby BLE devices, choose a group, capture your phone's GPS position, and click "Save & Post to API" to populate your vault.
    </p>
    <button
      @click="$emit('go-to-discovery')"
      class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition cursor-pointer"
    >
      <span>Discover Devices Around</span>
      <ArrowRight class="w-4 h-4" />
    </button>
  </div>

  <div v-else class="space-y-4">
    <!-- Header bar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
      <div>
        <div class="flex items-center gap-2">
          <span class="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Database class="w-4 h-4" />
          </span>
          <h3 class="text-sm font-bold text-white font-sans">
            Registered Device Vault ({{ registeredDevices.length }})
          </h3>
        </div>
        <p class="text-xs text-slate-400 mt-0.5">
          Persisted in local storage and synced with mock cloud API endpoints.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="handleCopyRegistry"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
        >
          <template v-if="copied">
            <Check class="w-3.5 h-3.5 text-emerald-400" />
            <span class="text-emerald-400">Copied</span>
          </template>
          <template v-else>
            <Copy class="w-3.5 h-3.5" />
            <span>Copy JSON</span>
          </template>
        </button>
        <button
          @click="handleDownloadJson"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs transition cursor-pointer"
        >
          <Download class="w-3.5 h-3.5" />
          <span>Export File</span>
        </button>
      </div>
    </div>

    <!-- Grid of registered devices -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div
        v-for="device in registeredDevices"
        :key="device.id"
        @click="$emit('select-device', device.id)"
        class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer shadow-lg shadow-black/20"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                  (groups.find((g) => g.id === device.groupId) || groups[0]).badgeBg,
                  (groups.find((g) => g.id === device.groupId) || groups[0]).badgeText
                ]"
              >
                {{ (groups.find((g) => g.id === device.groupId) || groups[0]).name }}
              </span>
              <span class="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <ShieldCheck class="w-3 h-3" />
                Synced
              </span>
            </div>
            <h4 class="text-sm font-bold text-white mt-1 font-sans">
              {{ device.customName }}
            </h4>
            <div class="text-xs font-mono text-cyan-400 mt-0.5">
              {{ device.macAddress }}
            </div>
          </div>

          <div class="text-right text-[11px] font-mono text-slate-400">
            <span>~{{ device.distanceMeters.toFixed(1) }}m</span>
            <span class="block text-slate-500">{{ device.rssi }} dBm</span>
          </div>
        </div>

        <!-- Coordinates Preview -->
        <div
          v-if="device.savedLocation"
          class="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono"
        >
          <div class="flex items-center gap-1.5 text-slate-300">
            <MapPin class="w-3 h-3 text-cyan-400" />
            <span>
              {{ device.savedLocation.latitude.toFixed(4) }}°, {{ device.savedLocation.longitude.toFixed(4) }}°
            </span>
          </div>

          <a
            :href="`https://www.google.com/maps?q=${device.savedLocation.latitude},${device.savedLocation.longitude}`"
            target="_blank"
            rel="noreferrer"
            @click.stop
            class="text-cyan-400 hover:underline flex items-center gap-0.5"
          >
            <span>Map</span>
            <ExternalLink class="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
