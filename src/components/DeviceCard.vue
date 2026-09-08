<script setup lang="ts">
import { ref, computed } from 'vue';
import { BLEDevice, DeviceGroup } from '../types';
import { 
  Radio, 
  Cpu, 
  Tag, 
  Watch, 
  Wifi, 
  ShieldCheck, 
  Check, 
  Copy, 
  BatteryMedium,
  Sparkles
} from 'lucide-vue-next';

const props = defineProps<{
  device: BLEDevice;
  isSelected: boolean;
  groups: DeviceGroup[];
}>();

defineEmits<{
  (e: 'select'): void;
}>();

const copied = ref(false);

const group = computed(() => {
  return props.groups.find((g) => g.id === props.device.groupId) || props.groups.find((g) => g.id === 'grp-unassigned');
});

const copyMac = (e: MouseEvent) => {
  e.stopPropagation();
  navigator.clipboard.writeText(props.device.macAddress);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 1500);
};

const signal = computed(() => {
  const rssi = props.device.rssi;
  if (rssi >= -65) {
    return { bars: 4, label: 'Strong', color: 'text-emerald-400', barBg: 'bg-emerald-400' };
  }
  if (rssi >= -78) {
    return { bars: 3, label: 'Good', color: 'text-cyan-400', barBg: 'bg-cyan-400' };
  }
  if (rssi >= -88) {
    return { bars: 2, label: 'Fair', color: 'text-amber-400', barBg: 'bg-amber-400' };
  }
  return { bars: 1, label: 'Weak', color: 'text-rose-400', barBg: 'bg-rose-400' };
});
</script>

<template>
  <div
    :id="`device-card-${device.id}`"
    @click="$emit('select')"
    :class="[
      'relative p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all duration-200 border text-left',
      isSelected
        ? 'bg-slate-900/95 border-cyan-500/70 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
        : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/80 hover:border-slate-700 shadow-md shadow-black/20'
    ]"
  >
    <!-- Top Row: Category Icon, Name, Signal Bars -->
    <div class="flex items-start justify-between gap-3">
      
      <!-- Device Icon + Title -->
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 shrink-0">
          <Radio v-if="device.category === 'beacon'" class="w-4 h-4 text-cyan-400" />
          <Sparkles v-else-if="device.category === 'sensor'" class="w-4 h-4 text-blue-400" />
          <Cpu v-else-if="device.category === 'tracker'" class="w-4 h-4 text-purple-400" />
          <Watch v-else-if="device.category === 'wearable'" class="w-4 h-4 text-emerald-400" />
          <Wifi v-else-if="device.category === 'gateway'" class="w-4 h-4 text-amber-400" />
          <Tag v-else class="w-4 h-4 text-slate-400" />
        </div>
        <div class="min-w-0">
          <h4 class="text-sm font-semibold text-white truncate font-sans">
            {{ device.customName }}
          </h4>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="text-xs font-mono text-slate-400 tracking-wider">
              {{ device.macAddress }}
            </span>
            <button
              type="button"
              @click="copyMac"
              title="Copy MAC address"
              class="p-1 rounded text-slate-500 hover:text-cyan-400 transition"
            >
              <Check v-if="copied" class="w-3 h-3 text-emerald-400" />
              <Copy v-else class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <!-- Signal Bars & RSSI value -->
      <div class="flex flex-col items-end shrink-0">
        <div class="flex items-end gap-0.5 h-3.5 mb-1">
          <div :class="['w-1 rounded-sm h-1.5', signal.bars >= 1 ? signal.barBg : 'bg-slate-700']"></div>
          <div :class="['w-1 rounded-sm h-2', signal.bars >= 2 ? signal.barBg : 'bg-slate-700']"></div>
          <div :class="['w-1 rounded-sm h-2.5', signal.bars >= 3 ? signal.barBg : 'bg-slate-700']"></div>
          <div :class="['w-1 rounded-sm h-3.5', signal.bars >= 4 ? signal.barBg : 'bg-slate-700']"></div>
        </div>
        <span class="text-[11px] font-mono text-slate-300">
          {{ device.rssi }} <span class="text-[10px] text-slate-500">dBm</span>
        </span>
      </div>

    </div>

    <!-- Bottom Row: Group badge, Distance, Status -->
    <div class="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
      
      <!-- Group chip -->
      <span
        :class="[
          'px-2 py-0.5 rounded-full text-[11px] font-medium border',
          group?.badgeBg || 'bg-slate-800 border-slate-700',
          group?.badgeText || 'text-slate-300'
        ]"
      >
        {{ group?.name || 'Unassigned' }}
      </span>

      <!-- Distance + Battery + Sync Status -->
      <div class="flex items-center gap-2.5 text-[11px] text-slate-400 font-mono">
        <span>~{{ device.distanceMeters.toFixed(1) }}m</span>

        <span v-if="device.batteryLevel !== undefined" class="flex items-center gap-1 text-slate-400">
          <BatteryMedium class="w-3 h-3 text-slate-500" />
          <span>{{ device.batteryLevel }}%</span>
        </span>

        <span
          v-if="device.isRegistered"
          class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold"
        >
          <ShieldCheck class="w-3 h-3 text-emerald-400" />
          <span>SAVED</span>
        </span>
        <span v-else class="text-slate-500 text-[10px]">Unregistered</span>
      </div>

    </div>
  </div>
</template>
