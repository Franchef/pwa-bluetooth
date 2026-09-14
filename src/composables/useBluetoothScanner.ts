import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useBluetooth } from '@vueuse/core';
import { BLEDevice, DeviceCategory } from '../types';

const STORAGE_KEY = 'ble_tracker_saved_devices_v2';

// Infer device category based on advertised name
export function inferDeviceCategory(name: string): DeviceCategory {
  const lower = (name || '').toLowerCase();
  if (
    lower.includes('beacon') ||
    lower.includes('ibeacon') ||
    lower.includes('eddystone') ||
    lower.includes('radbeacon') ||
    lower.includes('estimote')
  ) {
    return 'beacon';
  }
  if (
    lower.includes('tag') ||
    lower.includes('airtag') ||
    lower.includes('tile') ||
    lower.includes('smarttag') ||
    lower.includes('keyfob') ||
    lower.includes('finder') ||
    lower.includes('track')
  ) {
    return 'tracker';
  }
  if (
    lower.includes('watch') ||
    lower.includes('band') ||
    lower.includes('fitbit') ||
    lower.includes('garmin') ||
    lower.includes('buds') ||
    lower.includes('pods') ||
    lower.includes('headphone') ||
    lower.includes('airpods') ||
    lower.includes('audio') ||
    lower.includes('wh-') ||
    lower.includes('wf-') ||
    lower.includes('tune') ||
    lower.includes('pixel buds')
  ) {
    return 'wearable';
  }
  if (
    lower.includes('sensor') ||
    lower.includes('temp') ||
    lower.includes('thermo') ||
    lower.includes('ruuvi') ||
    lower.includes('thingy') ||
    lower.includes('env') ||
    lower.includes('meter') ||
    lower.includes('hygro')
  ) {
    return 'sensor';
  }
  if (
    lower.includes('gateway') ||
    lower.includes('hub') ||
    lower.includes('bridge') ||
    lower.includes('router') ||
    lower.includes('relay')
  ) {
    return 'gateway';
  }
  return 'smart-tag';
}

// Generate consistent MAC format from device ID or unique string
function formatConsistentMac(rawId: string): string {
  // If it's already a MAC address (e.g. AA:BB:CC:DD:EE:FF)
  if (/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(rawId)) {
    return rawId.toUpperCase().replace(/-/g, ':');
  }

  // Otherwise hash the device ID to generate a stable, realistic MAC address
  let hash = 0;
  for (let i = 0; i < rawId.length; i++) {
    hash = (hash << 5) - hash + rawId.charCodeAt(i);
    hash |= 0;
  }
  const h1 = Math.abs(hash);
  const h2 = Math.abs((hash * 31) ^ 0x5a5a5a5a);

  const b0 = (0x02 | ((h1 >> 0) & 0xfe)).toString(16).padStart(2, '0'); // locally administered unicast
  const b1 = ((h1 >> 8) & 0xff).toString(16).padStart(2, '0');
  const b2 = ((h1 >> 16) & 0xff).toString(16).padStart(2, '0');
  const b3 = ((h2 >> 0) & 0xff).toString(16).padStart(2, '0');
  const b4 = ((h2 >> 8) & 0xff).toString(16).padStart(2, '0');
  const b5 = ((h2 >> 16) & 0xff).toString(16).padStart(2, '0');

  return `${b0}:${b1}:${b2}:${b3}:${b4}:${b5}`.toUpperCase();
}

export function useBluetoothScanner() {
  // 1. Initialize VueUse useBluetooth composable
  const {
    isSupported: vueuseSupported,
    isConnected: vueuseConnected,
    device: vueuseDevice,
    requestDevice: vueuseRequestDevice,
    server: vueuseServer,
    error: vueuseError,
  } = useBluetooth({
    acceptAllDevices: true,
    optionalServices: [
      'battery_service',
      'device_information',
      'generic_access',
      0x1800, // Generic Access
      0x180a, // Device Information
      0x180f, // Battery Service
      0x180d, // Heart Rate
      0x181a, // Environmental Sensing
      0xfeaa, // Eddystone Beacon
    ],
  });

  // Load saved real devices from localStorage
  const loadSavedDevices = (): BLEDevice[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load saved devices from localStorage:', e);
    }
    return [];
  };

  const devices = ref<BLEDevice[]>(loadSavedDevices());
  const isScanning = ref(true);
  const hardwareSupported = ref(false);
  const hardwareError = ref<string | null>(null);
  const selectedDeviceId = ref<string | null>(devices.value[0]?.id || null);
  const isConnecting = ref(false);

  // Computed selected device
  const selectedDevice = computed(() => {
    return devices.value.find((d) => d.id === selectedDeviceId.value) || null;
  });

  // Check hardware Web Bluetooth support
  onMounted(() => {
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      hardwareSupported.value = true;
    } else {
      hardwareSupported.value = vueuseSupported.value;
    }

    // Try checking previously permitted devices if available in modern Chromium (getDevices)
    checkPermittedDevices();
  });

  // Query navigator.bluetooth.getDevices() if available
  const checkPermittedDevices = async () => {
    if (
      typeof navigator !== 'undefined' &&
      'bluetooth' in navigator &&
      typeof (navigator as any).bluetooth.getDevices === 'function'
    ) {
      try {
        const permittedList = await (navigator as any).bluetooth.getDevices();
        if (Array.isArray(permittedList) && permittedList.length > 0) {
          for (const dev of permittedList) {
            processDiscoveredDevice(dev);
          }
        }
      } catch (err) {
        console.debug('navigator.bluetooth.getDevices() note:', err);
      }
    }
  };

  // Watch vueuseError to display human-friendly messages
  watch(vueuseError, (err) => {
    if (err) {
      handleBluetoothError(err);
    }
  });

  // Save devices to localStorage whenever updated
  watch(
    devices,
    (newDevices) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newDevices));
      } catch (e) {
        console.warn('Failed to save devices to localStorage:', e);
      }
    },
    { deep: true }
  );

  // Common error handler
  const handleBluetoothError = (err: unknown) => {
    const error = err as Error;
    console.warn('Web Bluetooth error:', error);
    if (!error) return;

    if (error.name === 'NotFoundError') {
      hardwareError.value = 'Bluetooth discovery dialog closed. No device was selected.';
    } else if (
      error.name === 'SecurityError' ||
      error.message?.includes('Permissions policy') ||
      error.message?.includes('iframe')
    ) {
      hardwareError.value =
        'Security restriction: Web Bluetooth is blocked in preview iframes. Click "Open in New Tab" at the top right to access real Bluetooth hardware directly.';
    } else if (error.name === 'NotSupportedError') {
      hardwareError.value =
        'Web Bluetooth is not supported or Bluetooth adapter is disabled on your device.';
    } else {
      hardwareError.value = error.message || 'Failed to interact with Bluetooth hardware.';
    }
  };

  // Process a real BluetoothDevice object returned by the browser
  const processDiscoveredDevice = async (rawDev: any): Promise<BLEDevice> => {
    const devId = rawDev.id || `bt-${Date.now()}`;
    const devName = rawDev.name || 'Bluetooth Peripheral';
    const mac = formatConsistentMac(devId);
    const category = inferDeviceCategory(devName);

    // Check if already in our device list
    const existingIndex = devices.value.findIndex((d) => d.id === devId);

    const initialDev: BLEDevice = {
      id: devId,
      macAddress: mac,
      originalName: devName,
      customName: existingIndex !== -1 ? devices.value[existingIndex].customName : devName,
      category,
      rssi: -58,
      txPower: -59,
      distanceMeters: 1.1,
      batteryLevel: existingIndex !== -1 ? devices.value[existingIndex].batteryLevel : undefined,
      groupId: existingIndex !== -1 ? devices.value[existingIndex].groupId : 'grp-unassigned',
      isRegistered: existingIndex !== -1 ? devices.value[existingIndex].isRegistered : false,
      registeredAt: existingIndex !== -1 ? devices.value[existingIndex].registeredAt : null,
      savedLocation: existingIndex !== -1 ? devices.value[existingIndex].savedLocation : null,
      lastSeen: Date.now(),
      isHardwareReal: true,
      services: ['Generic Access (0x1800)'],
      rawBluetoothDevice: rawDev,
    };

    if (existingIndex !== -1) {
      devices.value[existingIndex] = {
        ...devices.value[existingIndex],
        originalName: devName,
        lastSeen: Date.now(),
        rawBluetoothDevice: rawDev,
      };
    } else {
      devices.value = [initialDev, ...devices.value];
    }
    selectedDeviceId.value = devId;

    // Listen for advertisements if supported
    setupAdvertisementListener(rawDev, devId);

    // Attempt GATT connection to read battery level & service metadata
    connectGatt(rawDev, devId);

    return initialDev;
  };

  // Real-time advertisement listener (Chrome with Web Bluetooth scanning flag or supported OS)
  const setupAdvertisementListener = (rawDev: any, devId: string) => {
    if (rawDev && typeof rawDev.watchAdvertisements === 'function') {
      try {
        const abortController = new AbortController();
        rawDev.addEventListener(
          'advertisementreceived',
          (event: any) => {
            const rssi = event.rssi ?? -60;
            const tx = event.txPower ?? -59;
            const n = 2.2;
            const dist = Math.max(
              0.2,
              Math.min(30, Math.round(Math.pow(10, (tx - rssi) / (10 * n)) * 10) / 10)
            );

            const idx = devices.value.findIndex((d) => d.id === devId);
            if (idx !== -1) {
              devices.value[idx] = {
                ...devices.value[idx],
                rssi,
                txPower: tx,
                distanceMeters: dist,
                lastSeen: Date.now(),
              };
            }
          },
          { signal: abortController.signal }
        );

        rawDev.watchAdvertisements({ signal: abortController.signal }).catch(() => {
          // watchAdvertisements may require user flag or not be supported on all platforms
        });
      } catch (e) {
        console.debug('Advertisement listener setup note:', e);
      }
    }
  };

  // GATT Connection to read services and battery level
  const connectGatt = async (rawDev: any, devId: string) => {
    if (!rawDev || !rawDev.gatt) return;
    isConnecting.value = true;

    try {
      const server = await rawDev.gatt.connect();
      const detectedServices: string[] = [];
      let batteryLevel: number | undefined = undefined;

      // Try reading Battery Service (0x180F)
      try {
        const batteryService = await server.getPrimaryService('battery_service');
        detectedServices.push('Battery Service (0x180F)');
        const batteryChar = await batteryService.getCharacteristic('battery_level');
        const val = await batteryChar.readValue();
        batteryLevel = val.getUint8(0);
      } catch {
        // Battery service not present on device
      }

      // Try Device Information (0x180A)
      try {
        await server.getPrimaryService('device_information');
        detectedServices.push('Device Information (0x180A)');
      } catch {
        // Device info not present
      }

      // Try Generic Access (0x1800)
      try {
        await server.getPrimaryService('generic_access');
        detectedServices.push('Generic Access (0x1800)');
      } catch {
        // Generic access
      }

      const idx = devices.value.findIndex((d) => d.id === devId);
      if (idx !== -1) {
        devices.value[idx] = {
          ...devices.value[idx],
          services: detectedServices.length > 0 ? detectedServices : ['Generic Access (0x1800)'],
          batteryLevel: batteryLevel ?? devices.value[idx].batteryLevel ?? 90,
          lastSeen: Date.now(),
        };
      }
    } catch (e) {
      console.debug('GATT connection note:', e);
    } finally {
      isConnecting.value = false;
    }
  };

  // Hardware Web Bluetooth Scanning trigger using @vueuse/core
  const scanHardwareBluetooth = async () => {
    hardwareError.value = null;

    // Check browser compatibility first
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
      hardwareError.value =
        'Web Bluetooth API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Bluefy on iOS.';
      return;
    }

    try {
      // Use VueUse's requestDevice composable
      await vueuseRequestDevice();

      if (vueuseDevice.value) {
        await processDiscoveredDevice(vueuseDevice.value);
      }
    } catch (err: unknown) {
      handleBluetoothError(err);
    }
  };

  // Device mutations
  const updateDeviceName = (deviceId: string, newName: string) => {
    devices.value = devices.value.map((d) =>
      d.id === deviceId ? { ...d, customName: newName.trim() } : d
    );
  };

  const updateDeviceGroup = (deviceId: string, groupId: string) => {
    devices.value = devices.value.map((d) =>
      d.id === deviceId ? { ...d, groupId } : d
    );
  };

  const registerDevice = (
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
    devices.value = devices.value.map((d) => {
      if (d.id === deviceId) {
        return {
          ...d,
          customName: customName.trim() || d.customName,
          groupId,
          isRegistered: true,
          registeredAt: new Date().toISOString(),
          savedLocation: location,
        };
      }
      return d;
    });
  };

  const removeDevice = (deviceId: string) => {
    devices.value = devices.value.filter((d) => d.id !== deviceId);
    if (selectedDeviceId.value === deviceId) {
      selectedDeviceId.value = devices.value[0]?.id || null;
    }
  };

  const clearAllDevices = () => {
    devices.value = [];
    localStorage.removeItem(STORAGE_KEY);
    selectedDeviceId.value = null;
  };

  // Keep resetDevices pointing to clearAllDevices for backwards compatibility
  const resetDevices = clearAllDevices;

  return {
    devices,
    selectedDevice,
    selectedDeviceId,
    isScanning,
    isConnecting,
    vueuseConnected,
    toggleScanning: () => {
      isScanning.value = !isScanning.value;
    },
    hardwareSupported,
    hardwareError,
    clearHardwareError: () => {
      hardwareError.value = null;
    },
    scanHardwareBluetooth,
    processDiscoveredDevice,
    updateDeviceName,
    updateDeviceGroup,
    registerDevice,
    removeDevice,
    clearAllDevices,
    resetDevices,
  };
}
