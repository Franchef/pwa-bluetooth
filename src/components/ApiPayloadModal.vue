<script setup lang="ts">
import { ref } from 'vue';
import { ApiPostPayload } from '../types';
import { X, Check, Copy, CheckCircle2 } from 'lucide-vue-next';

const props = defineProps<{
  payload: ApiPostPayload | null;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const copied = ref(false);

const handleCopy = () => {
  if (!props.payload) return;
  navigator.clipboard.writeText(JSON.stringify(props.payload, null, 2));
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};
</script>

<template>
  <div
    v-if="payload"
    id="modal-api-payload"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
  >
    <div class="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-white font-mono flex items-center gap-2">
              <span>POST /v1/devices/register</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-sans font-semibold">
                201 Created
              </span>
            </h3>
            <p class="text-xs text-slate-400">
              Mock API HTTP Payload successfully dispatched with BLE & GPS coordinates
            </p>
          </div>
        </div>

        <button
          id="btn-close-modal"
          @click="$emit('close')"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body (Code Viewer) -->
      <div class="p-4 sm:p-5 overflow-y-auto space-y-4 font-mono text-xs">
        <!-- Endpoint & Method Info Pill -->
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
          <div class="flex items-center gap-2 text-slate-300 truncate">
            <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">POST</span>
            <span class="text-cyan-300 truncate">{{ payload.endpoint }}</span>
          </div>
          <span class="text-slate-500 shrink-0">{{ new Date(payload.timestamp).toLocaleTimeString() }}</span>
        </div>

        <!-- JSON Request Payload -->
        <div>
          <div class="flex items-center justify-between mb-1 text-[11px] text-slate-400 uppercase font-sans font-semibold">
            <span>Dispatched JSON Body</span>
            <button
              @click="handleCopy"
              class="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 normal-case font-mono cursor-pointer"
            >
              <template v-if="copied">
                <Check class="w-3 h-3 text-emerald-400" />
                <span class="text-emerald-400">Copied</span>
              </template>
              <template v-else>
                <Copy class="w-3 h-3" />
                <span>Copy Raw JSON</span>
              </template>
            </button>
          </div>
          <pre class="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 text-cyan-200 overflow-x-auto text-[11px] leading-relaxed select-all">
{{ JSON.stringify(payload.body, null, 2) }}
          </pre>
        </div>

        <!-- Simulated Server Response -->
        <div>
          <span class="text-[11px] text-slate-400 uppercase font-sans font-semibold block mb-1">
            Server Response (Mocked 201)
          </span>
          <pre class="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 overflow-x-auto text-[11px] leading-relaxed">
{{ JSON.stringify(payload.simulatedResponse, null, 2) }}
          </pre>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
        <button
          @click="$emit('close')"
          class="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition cursor-pointer"
        >
          Acknowledge & Return
        </button>
      </div>

    </div>
  </div>
</template>
