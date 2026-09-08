<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBluetoothScanner } from './composables/useBluetoothScanner';
import { useGeolocation } from './composables/useGeolocation';
import { DEVICE_GROUPS } from './data/mockDevices';
import { ApiPostPayload } from './types';

import Navbar from './components/Navbar.vue';
import RadarScanner from './components/RadarScanner.vue';
import DeviceList from './components/DeviceList.vue';
import DeviceInspector from './components/DeviceInspector.vue';
import RegisteredVault from './components/RegisteredVault.vue';
import ApiPayloadModal from './components/ApiPayloadModal.vue';
import OfflineIndicator from './components/OfflineIndicator.vue';

import { 
  AlertCircle, 
  X, 
  RotateCcw, 
  Sparkles, 
  Radio, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-vue-next';

// Bluetooth scanner composable
const {
  devices,
  selectedDevice,
  selectedDeviceId,
  isScanning,
  toggleScanning,
  hardwareSupported,
  hardwareError,
  clearHardwareError,
  scanHardwareBluetooth,
  updateDeviceName,
  updateDeviceGroup,
  registerDevice,
  resetDevices,
} = useBluetoothScanner();

// Geolocation composable
const { coordinates, refreshLocation } = useGeolocation();

// UI view state
const activeTab = ref<'radar' | 'vault' | 'api-console'>('radar');
const apiPayload = ref<ApiPostPayload | null>(null);
const toastMessage = ref<string | null>(null);

const registeredCount = computed(() => devices.value.filter((d) => d.isRegistered).length);

const showToast = (msg: string) => {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = null;
  }, 3500);
};

const handleSelectDevice = (id: string) => {
  selectedDeviceId.value = id;
};

const handleUpdateName = (deviceId: string, name: string) => {
  updateDeviceName(deviceId, name);
  showToast(`Updated device name to "${name}"`);
};

const handleUpdateGroup = (deviceId: string, groupId: string) => {
  updateDeviceGroup(deviceId, groupId);
  const grp = DEVICE_GROUPS.find((g) => g.id === groupId);
  showToast(`Assigned to group "${grp?.name || groupId}"`);
};

const handleRegisterDevice = (
  deviceId: string,
  customName: string,
  groupId: string,
  location: {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    accuracy?: number | null;
    timestamp: number;
  }
) => {
  registerDevice(deviceId, customName, groupId, location);
  showToast(`✓ Device registered with GPS lock [${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}]!`);
};

const handleViewApiPayload = (payload: ApiPostPayload) => {
  apiPayload.value = payload;
};

const handleResetAll = () => {
  if (confirm('Reset Bluetooth devices to initial mock telemetry state?')) {
    resetDevices();
    showToast('Reset simulator to initial beacons');
  }
};
</script>

<template>
  <div class="min-h-screen bg-[#070A12] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
    <!-- Main Top Navigation -->
    <Navbar
      :is-scanning="isScanning"
      :hardware-supported="hardwareSupported"
      :coordinates="coordinates"
      :active-tab="activeTab"
      :registered-count="registeredCount"
      @toggle-scanning="toggleScanning"
      @scan-hardware="scanHardwareBluetooth"
      @refresh-gps="refreshLocation"
      @update:active-tab="activeTab = $event"
    />

    <!-- Hardware Web Bluetooth Warning / Error Banner -->
    <div
      v-if="hardwareError"
      id="hardware-error-banner"
      class="bg-amber-500/10 border-b border-amber-500/20 text-amber-200 text-xs px-4 py-2.5 flex items-center justify-between"
    >
      <div class="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <AlertCircle class="w-4 h-4 text-amber-400 shrink-0" />
          <span>{{ hardwareError }}</span>
        </div>
        <button
          @click="clearHardwareError"
          class="p-1 text-amber-400 hover:text-white rounded transition cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Main Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      <!-- TAB 1: Radar & Discovery View -->
      <div v-if="activeTab === 'radar'" class="space-y-6">
        
        <!-- Top Section: 360 Radar & Metrics -->
        <RadarScanner
          :devices="devices"
          :selected-device-id="selectedDeviceId"
          :is-scanning="isScanning"
          :gps-accuracy="coordinates.accuracy"
          @select-device="handleSelectDevice"
        />

        <!-- Split Grid: Device Cards List (Left) + Device Inspector & Save (Right) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- Left Column: Detected Devices List (7 cols on lg) -->
          <div class="lg:col-span-7 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Radio class="w-4 h-4 text-cyan-400" />
                <h2 class="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Nearby Proximity Nodes ({{ devices.length }})
                </h2>
              </div>
              <span class="text-[11px] font-mono text-slate-500">
                Click to inspect & tag
              </span>
            </div>

            <DeviceList
              :devices="devices"
              :selected-device-id="selectedDeviceId"
              :groups="DEVICE_GROUPS"
              @select-device="handleSelectDevice"
            />
          </div>

          <!-- Right Column: Inspector Panel (5 cols on lg) -->
          <div class="lg:col-span-5 lg:sticky lg:top-24">
            <DeviceInspector
              :device="selectedDevice"
              :groups="DEVICE_GROUPS"
              :coordinates="coordinates"
              @refresh-coordinates="refreshLocation"
              @update-name="handleUpdateName"
              @update-group="handleUpdateGroup"
              @register-device="handleRegisterDevice"
              @view-api-payload="handleViewApiPayload"
            />
          </div>

        </div>

      </div>

      <!-- TAB 2: Registered Vault View -->
      <div v-else-if="activeTab === 'vault'">
        <RegisteredVault
          :devices="devices"
          :groups="DEVICE_GROUPS"
          @select-device="(id) => { selectedDeviceId = id; activeTab = 'radar'; }"
          @go-to-discovery="activeTab = 'radar'"
        />
      </div>

    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-800/80 bg-[#090D16] py-6 text-xs text-slate-500">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div class="flex items-center gap-2">
          <span class="font-mono text-slate-400 font-semibold">BLE.TRACKER PWA</span>
          <span>•</span>
          <span class="text-slate-400">Vue 3 + Vite + Tailwind CSS</span>
        </div>

        <!-- Simulator Tools / Reset -->
        <div class="flex items-center gap-4">
          <button
            id="btn-reset-simulator"
            @click="handleResetAll"
            class="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title="Reset to default mock beacons"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>Reset Beacons</span>
          </button>

          <span class="hidden sm:inline text-slate-700">|</span>

          <span class="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles class="w-3 h-3 text-cyan-400" />
            Web Bluetooth & Geolocation API Ready
          </span>
        </div>

      </div>
    </footer>

    <!-- Offline Status Indicator -->
    <OfflineIndicator />

    <!-- Mock API Post Payload Modal -->
    <ApiPayloadModal
      :payload="apiPayload"
      @close="apiPayload = null"
    />

    <!-- Global Toast Notification -->
    <div
      v-if="toastMessage"
      id="global-toast"
      class="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-2xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 px-4 py-3 text-xs font-medium shadow-2xl backdrop-blur-md animate-fade-in"
    >
      <ShieldCheck class="w-4 h-4 text-cyan-400" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>
