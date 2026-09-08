<script setup lang="ts">
import { ref, computed } from 'vue';
import { BLEDevice, DeviceGroup } from '../types';
import DeviceCard from './DeviceCard.vue';
import { Search, SlidersHorizontal } from 'lucide-vue-next';

const props = defineProps<{
  devices: BLEDevice[];
  selectedDeviceId: string | null;
  groups: DeviceGroup[];
}>();

defineEmits<{
  (e: 'select-device', id: string): void;
}>();

const searchQuery = ref('');
const activeFilter = ref<'all' | 'unregistered' | 'registered' | string>('all');
const sortBy = ref<'signal' | 'distance' | 'name'>('distance');

const filteredDevices = computed(() => {
  return props.devices
    .filter((device) => {
      // Search filter
      const query = searchQuery.value.toLowerCase().trim();
      const matchesSearch =
        !query ||
        device.customName.toLowerCase().includes(query) ||
        device.originalName.toLowerCase().includes(query) ||
        device.macAddress.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // Tab filter
      if (activeFilter.value === 'all') return true;
      if (activeFilter.value === 'unregistered') return !device.isRegistered;
      if (activeFilter.value === 'registered') return device.isRegistered;
      return device.groupId === activeFilter.value;
    })
    .sort((a, b) => {
      if (sortBy.value === 'signal') {
        return b.rssi - a.rssi; // higher dBm is closer
      }
      if (sortBy.value === 'distance') {
        return a.distanceMeters - b.distanceMeters;
      }
      if (sortBy.value === 'name') {
        return a.customName.localeCompare(b.customName);
      }
      return 0;
    });
});
</script>

<template>
  <div class="space-y-3">
    <!-- Controls Bar: Search & Sort -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <!-- Search input -->
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          id="input-device-search"
          type="text"
          v-model="searchQuery"
          placeholder="Filter by name, MAC (e.g. C4:D8...)..."
          class="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition"
        />
      </div>

      <!-- Sort Selector -->
      <div class="flex items-center gap-1.5 self-end sm:self-auto shrink-0 text-xs text-slate-400">
        <SlidersHorizontal class="w-3.5 h-3.5 text-slate-500" />
        <select
          id="select-device-sort"
          v-model="sortBy"
          class="bg-slate-900/80 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-cyan-500/60"
        >
          <option value="distance">Nearest Distance</option>
          <option value="signal">Strongest Signal (RSSI)</option>
          <option value="name">Device Name (A-Z)</option>
        </select>
      </div>
    </div>

    <!-- Filter Tabs / Badges -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
      <button
        @click="activeFilter = 'all'"
        :class="[
          'px-3 py-1 rounded-lg transition whitespace-nowrap font-medium cursor-pointer',
          activeFilter === 'all'
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
            : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
        ]"
      >
        All ({{ devices.length }})
      </button>
      <button
        @click="activeFilter = 'unregistered'"
        :class="[
          'px-3 py-1 rounded-lg transition whitespace-nowrap font-medium cursor-pointer',
          activeFilter === 'unregistered'
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
        ]"
      >
        Unregistered ({{ devices.filter((d) => !d.isRegistered).length }})
      </button>
      <button
        @click="activeFilter = 'registered'"
        :class="[
          'px-3 py-1 rounded-lg transition whitespace-nowrap font-medium cursor-pointer',
          activeFilter === 'registered'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
        ]"
      >
        Registered ({{ devices.filter((d) => d.isRegistered).length }})
      </button>
      <button
        v-for="grp in groups.slice(0, 3)"
        :key="grp.id"
        @click="activeFilter = grp.id"
        :class="[
          'px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer',
          activeFilter === grp.id
            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
            : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
        ]"
      >
        {{ grp.name }}
      </button>
    </div>

    <!-- Cards List -->
    <div v-if="filteredDevices.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
      <DeviceCard
        v-for="device in filteredDevices"
        :key="device.id"
        :device="device"
        :is-selected="device.id === selectedDeviceId"
        :groups="groups"
        @select="$emit('select-device', device.id)"
      />
    </div>
    <div v-else class="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 text-slate-400">
      <p class="text-sm font-medium">No Bluetooth devices matched your filters.</p>
      <button
        @click="searchQuery = ''; activeFilter = 'all';"
        class="mt-2 text-xs text-cyan-400 hover:underline cursor-pointer"
      >
        Reset search filters
      </button>
    </div>
  </div>
</template>
