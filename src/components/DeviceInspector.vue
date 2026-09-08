<script setup lang="ts">
import { ref, watch } from 'vue';
import { BLEDevice, DeviceGroup, GeoCoordinates, ApiPostPayload } from '../types';
import { 
  Check, 
  Copy, 
  MapPin, 
  RefreshCw, 
  Send, 
  ShieldCheck, 
  Radio, 
  Cpu, 
  ExternalLink,
  CheckCircle2
} from 'lucide-vue-next';

const props = defineProps<{
  device: BLEDevice | null;
  groups: DeviceGroup[];
  coordinates: GeoCoordinates;
}>();

const emit = defineEmits<{
  (e: 'refresh-coordinates'): void;
  (e: 'update-name', deviceId: string, name: string): void;
  (e: 'update-group', deviceId: string, groupId: string): void;
  (
    e: 'register-device',
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
  ): void;
  (e: 'view-api-payload', payload: ApiPostPayload): void;
}>();

const nameInput = ref('');
const selectedGroupId = ref('');
const copiedMac = ref(false);
const isSavingApi = ref(false);
const saveSuccess = ref(false);

watch(
  () => props.device,
  (dev) => {
    if (dev) {
      nameInput.value = dev.customName;
      selectedGroupId.value = dev.groupId;
      saveSuccess.value = false;
    }
  },
  { immediate: true }
);

const handleCopyMac = () => {
  if (!props.device) return;
  navigator.clipboard.writeText(props.device.macAddress);
  copiedMac.value = true;
  setTimeout(() => {
    copiedMac.value = false;
  }, 2000);
};

const handleNameBlur = () => {
  if (!props.device) return;
  if (nameInput.value.trim() && nameInput.value !== props.device.customName) {
    emit('update-name', props.device.id, nameInput.value);
  }
};

const handleGroupSelect = (groupId: string) => {
  if (!props.device) return;
  selectedGroupId.value = groupId;
  emit('update-group', props.device.id, groupId);
};

const applyPresetName = (preset: string) => {
  if (!props.device) return;
  nameInput.value = preset;
  emit('update-name', props.device.id, preset);
};

const handleSaveApi = async () => {
  if (!props.device) return;
  isSavingApi.value = true;
  saveSuccess.value = false;

  const lat = props.coordinates.latitude ?? 37.774929;
  const lng = props.coordinates.longitude ?? -122.419416;
  const acc = props.coordinates.accuracy ?? 4.2;
  const alt = props.coordinates.altitude ?? 15.0;
  const timestamp = props.coordinates.timestamp ?? Date.now();

  const currentGroup = props.groups.find((g) => g.id === selectedGroupId.value) || props.groups[0];

  const payload: ApiPostPayload = {
    endpoint: 'https://api.ble-registry.cloud/v1/devices/register',
    method: 'POST',
    timestamp: new Date().toISOString(),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ble_demo_jwt_token_88f9e2a',
      'X-Client-Platform': 'PWA / Vite-Tailwind-Vue3',
    },
    body: {
      deviceId: props.device.id,
      macAddress: props.device.macAddress,
      name: nameInput.value.trim() || props.device.customName,
      originalName: props.device.originalName,
      group: {
        id: currentGroup.id,
        name: currentGroup.name,
      },
      location: {
        latitude: lat,
        longitude: lng,
        altitude: alt,
        accuracyMeters: acc,
        capturedAt: new Date(timestamp).toISOString(),
        source: 'Phone GPS Geolocation API',
      },
      telemetry: {
        rssi: props.device.rssi,
        estimatedDistanceMeters: props.device.distanceMeters,
        batteryLevel: props.device.batteryLevel,
        category: props.device.category,
      },
      syncMeta: {
        clientVersion: '2.4.0-vue3-pwa',
        isPWA: window.matchMedia('(display-mode: standalone)').matches,
        userAgent: navigator.userAgent,
      },
    },
    simulatedResponse: {
      status: 201,
      statusText: 'Created',
      registryId: `REG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      savedAt: new Date().toISOString(),
      message: `Device ${props.device.macAddress} successfully linked to group "${currentGroup.name}" with GPS lock [${lat.toFixed(4)}, ${lng.toFixed(4)}].`,
    },
  };

  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 750));

  emit(
    'register-device',
    props.device.id,
    nameInput.value.trim() || props.device.customName,
    selectedGroupId.value,
    {
      latitude: lat,
      longitude: lng,
      altitude: alt,
      accuracy: acc,
      timestamp,
    }
  );

  isSavingApi.value = false;
  saveSuccess.value = true;
  emit('view-api-payload', payload);
};
</script>

<template>
  <div
    v-if="!device"
    class="h-full min-h-[380px] flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-slate-500"
  >
    <Radio class="w-10 h-10 mb-3 text-slate-700 animate-pulse" />
    <h3 class="text-base font-semibold text-slate-400">No Device Selected</h3>
    <p class="text-xs text-slate-500 mt-1 max-w-xs">
      Select any Bluetooth device or beacon from the radar or list to configure identifier, group, and phone coordinates.
    </p>
  </div>

  <div
    v-else
    id="device-inspector-panel"
    class="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl shadow-black/40 text-slate-100 relative overflow-hidden"
  >
    <!-- Background glow accent -->
    <div class="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Header Banner -->
    <div class="flex items-start justify-between gap-3 pb-4 mb-5 border-b border-slate-800/80">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
            Device Inspector
          </span>
          <span
            v-if="device.isRegistered"
            class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1"
          >
            <ShieldCheck class="w-3 h-3" />
            SAVED IN REGISTRY
          </span>
        </div>
        <h3 class="text-lg font-bold text-white mt-1">
          {{ nameInput || device.customName }}
        </h3>
        <p class="text-xs text-slate-400 font-mono mt-0.5">
          Original broadcast: {{ device.originalName }}
        </p>
      </div>

      <div class="flex flex-col items-end">
        <div class="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
          <Cpu class="w-5 h-5" />
        </div>
      </div>
    </div>

    <div class="space-y-5">
      
      <!-- SECTION 1: IDENTIFIER (MAC ADDRESS / UUID) -->
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          Device Identifier (MAC / Address)
        </label>
        <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm font-mono text-cyan-300">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span class="tracking-widest font-semibold">{{ device.macAddress }}</span>
          </div>
          <button
            id="btn-copy-identifier"
            type="button"
            @click="handleCopyMac"
            class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer"
          >
            <template v-if="copiedMac">
              <Check class="w-3.5 h-3.5 text-emerald-400" />
              <span class="text-emerald-400">Copied</span>
            </template>
            <template v-else>
              <Copy class="w-3.5 h-3.5" />
              <span>Copy</span>
            </template>
          </button>
        </div>
        <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-1 px-1">
          <span>ID: {{ device.id }}</span>
          <span>RSSI: {{ device.rssi }} dBm (~{{ device.distanceMeters.toFixed(1) }}m)</span>
        </div>
      </div>

      <!-- SECTION 2: NAME (EDITABLE) -->
      <div>
        <label for="input-device-name" class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          Device Name (Editable)
        </label>
        <div class="relative">
          <input
            id="input-device-name"
            type="text"
            v-model="nameInput"
            @blur="handleNameBlur"
            placeholder="e.g. Forklift #02 Beacon"
            class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition font-sans"
          />
        </div>

        <!-- Quick Rename Suggestions -->
        <div class="flex items-center gap-1.5 flex-wrap mt-2">
          <span class="text-[11px] text-slate-500">Presets:</span>
          <button
            v-for="preset in ['North Gate', 'Cold Storage #1', 'Asset Tag #42', 'Fleet Beacon']"
            :key="preset"
            type="button"
            @click="applyPresetName(preset)"
            class="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 transition cursor-pointer"
          >
            {{ preset }}
          </button>
        </div>
      </div>

      <!-- SECTION 3: GROUP SELECTION (MOCKED GROUPS) -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Group Selection
          </label>
          <span class="text-[11px] text-cyan-400 font-medium">
            {{ (groups.find((g) => g.id === selectedGroupId) || groups[0]).name }}
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            v-for="group in groups"
            :key="group.id"
            :id="`btn-group-${group.id}`"
            type="button"
            @click="handleGroupSelect(group.id)"
            :class="[
              'p-2.5 rounded-2xl border text-left transition relative cursor-pointer',
              selectedGroupId === group.id
                ? 'bg-slate-800/95 border-cyan-400 shadow-md shadow-cyan-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            ]"
          >
            <div class="flex items-center justify-between">
              <span
                class="w-2.5 h-2.5 rounded-full shrink-0"
                :style="{ backgroundColor: group.color }"
              ></span>
              <Check v-if="selectedGroupId === group.id" class="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div class="mt-1.5 font-medium text-xs text-white truncate">
              {{ group.name }}
            </div>
            <div class="text-[10px] text-slate-500 truncate">
              {{ group.id === 'grp-unassigned' ? 'Default' : 'Assigned' }}
            </div>
          </button>
        </div>
      </div>

      <!-- SECTION 4: LATITUDE AND LONGITUDE FROM PHONE -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <MapPin class="w-3.5 h-3.5 text-cyan-400" />
            <span>Phone GPS Coordinates</span>
          </label>
          <button
            id="btn-refresh-gps-inspector"
            type="button"
            @click="$emit('refresh-coordinates')"
            class="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer"
            title="Query phone geolocation sensor"
          >
            <RefreshCw :class="['w-3 h-3', coordinates.status === 'requesting' ? 'animate-spin' : '']" />
            <span>Refresh Fix</span>
          </button>
        </div>

        <div class="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <!-- Coordinate values -->
          <div class="grid grid-cols-2 gap-2 text-xs font-mono">
            <div class="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
              <span class="text-[10px] text-slate-500 block uppercase">Latitude</span>
              <span class="text-cyan-300 font-semibold text-sm">
                {{ (coordinates.latitude ?? 37.774929).toFixed(6) }}°
              </span>
            </div>
            <div class="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
              <span class="text-[10px] text-slate-500 block uppercase">Longitude</span>
              <span class="text-cyan-300 font-semibold text-sm">
                {{ (coordinates.longitude ?? -122.419416).toFixed(6) }}°
              </span>
            </div>
          </div>

          <!-- GPS Metadata: Altitude, Accuracy, Timestamp -->
          <div class="flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
            <div class="flex items-center gap-2">
              <span class="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300">
                Accuracy: ±{{ coordinates.accuracy ? coordinates.accuracy.toFixed(1) : '3.8' }}m
              </span>
              <span class="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300">
                Alt: {{ coordinates.altitude ? `${coordinates.altitude.toFixed(1)}m` : '15m' }}
              </span>
            </div>

            <a
              :href="`https://www.google.com/maps?q=${coordinates.latitude ?? 37.774929},${coordinates.longitude ?? -122.419416}`"
              target="_blank"
              rel="noreferrer"
              class="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 hover:underline"
            >
              <span>View Map</span>
              <ExternalLink class="w-3 h-3" />
            </a>
          </div>

          <div v-if="coordinates.error" class="text-[11px] text-amber-400/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
            {{ coordinates.error }} (Using device precision mock)
          </div>
        </div>
      </div>

      <!-- SECTION 5: BUTTON (MOCK TO POST API) SAVE -->
      <div class="pt-2">
        <button
          id="btn-save-device-api"
          type="button"
          :disabled="isSavingApi"
          @click="handleSaveApi"
          :class="[
            'w-full py-3.5 px-5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-xl',
            saveSuccess
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-cyan-500/25 active:scale-[0.99]'
          ]"
        >
          <template v-if="isSavingApi">
            <RefreshCw class="w-4 h-4 animate-spin text-white" />
            <span>Transmitting Telemetry & Syncing API...</span>
          </template>
          <template v-else-if="saveSuccess">
            <CheckCircle2 class="w-4 h-4 text-slate-950" />
            <span>Saved & Synchronized (View Payload)</span>
          </template>
          <template v-else>
            <Send class="w-4 h-4" />
            <span>Save & Post to API</span>
          </template>
        </button>

        <p class="text-[11px] text-center text-slate-500 mt-2 font-mono">
          Encodes BLE MAC, custom name, group, and phone GPS coordinates into JSON and posts to simulated endpoint.
        </p>
      </div>

    </div>
  </div>
</template>
