import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { BLEDevice, DeviceCategory } from '../types';
import { INITIAL_MOCK_DEVICES } from '../data/mockDevices';

const STORAGE_KEY = 'ble_tracker_saved_devices_v1';

const RANDOM_BEACON_NAMES: { name: string; category: DeviceCategory; prefix: string }[] = [
  { name: 'Tile Mate Tag', category: 'tracker', prefix: 'E1:90:A4' },
  { name: 'RadBeacon Dot iBeacon', category: 'beacon', prefix: '70:2C:1F' },
  { name: 'Nordic Semiconductor Thingy:52', category: 'sensor', prefix: 'C0:98:E5' },
  { name: 'Garmin Speed/Cadence BLE', category: 'wearable', prefix: '00:1E:7D' },
  { name: 'KBlue BLE Smart Beacon', category: 'beacon', prefix: 'AC:23:3F' },
  { name: 'BlueUp Proximity Disc', category: 'smart-tag', prefix: '54:4A:16' },
  { name: 'Teltonika Eye Sensor', category: 'sensor', prefix: '00:1B:C5' },
  { name: 'Smart Keyfob Tag', category: 'tracker', prefix: '28:11:A5' },
];

function generateRandomMac(prefix: string): string {
  const hexChars = '0123456789ABCDEF';
  const randByte = () =>
    hexChars[Math.floor(Math.random() * 16)] + hexChars[Math.floor(Math.random() * 16)];
  return `${prefix}:${randByte()}:${randByte()}:${randByte()}`;
}

export function useBluetoothScanner() {
  const loadInitialDevices = (): BLEDevice[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load devices from localStorage:', e);
    }
    return INITIAL_MOCK_DEVICES;
  };

  const devices = ref<BLEDevice[]>(loadInitialDevices());
  const isScanning = ref(true);
  const hardwareSupported = ref(false);
  const hardwareError = ref<string | null>(null);
  const selectedDeviceId = ref<string | null>(devices.value[0]?.id || null);

  let scanInterval: number | null = null;

  // Selected device computed
  const selectedDevice = computed(() => {
    return devices.value.find((d) => d.id === selectedDeviceId.value) || null;
  });

  // Check hardware Web Bluetooth support
  onMounted(() => {
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      hardwareSupported.value = true;
    } else {
      hardwareSupported.value = false;
    }
  });

  // Save to localStorage whenever devices change
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

  const startScanInterval = () => {
    if (scanInterval) clearInterval(scanInterval);
    scanInterval = window.setInterval(() => {
      if (!isScanning.value) return;

      // 1. Jitter RSSI for currently visible devices
      const updated = devices.value.map((dev) => {
        const jitter = (Math.random() - 0.5) * 6;
        const newRssi = Math.max(-98, Math.min(-40, Math.round(dev.rssi + jitter)));
        const n = 2.2;
        const tx = dev.txPower || -59;
        const dist = Math.max(0.3, Math.min(30, Math.round(Math.pow(10, (tx - newRssi) / (10 * n)) * 10) / 10));

        return {
          ...dev,
          rssi: newRssi,
          distanceMeters: dist,
          lastSeen: Date.now(),
        };
      });

      // 2. Occasionally discover a new peripheral if under 12 devices
      if (updated.length < 12 && Math.random() < 0.15) {
        const template =
          RANDOM_BEACON_NAMES[Math.floor(Math.random() * RANDOM_BEACON_NAMES.length)];
        const mac = generateRandomMac(template.prefix);
        const newId = `ble-dyn-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
        const initialRssi = -70 - Math.floor(Math.random() * 20);

        const newDevice: BLEDevice = {
          id: newId,
          macAddress: mac,
          originalName: `${template.name} [${mac.slice(-5)}]`,
          customName: `${template.name} [${mac.slice(-5)}]`,
          category: template.category,
          rssi: initialRssi,
          txPower: -59,
          distanceMeters: Math.round(Math.pow(10, (-59 - initialRssi) / 22) * 10) / 10,
          batteryLevel: Math.floor(65 + Math.random() * 35),
          groupId: 'grp-unassigned',
          isRegistered: false,
          lastSeen: Date.now(),
          services: ['0x1800 (Generic Access)'],
        };
        devices.value = [newDevice, ...updated];
      } else {
        devices.value = updated;
      }
    }, 2800);
  };

  onMounted(() => {
    startScanInterval();
  });

  onUnmounted(() => {
    if (scanInterval) {
      clearInterval(scanInterval);
    }
  });

  // Watch scanning toggle
  watch(isScanning, (scanning) => {
    if (!scanning && scanInterval) {
      clearInterval(scanInterval);
      scanInterval = null;
    } else if (scanning && !scanInterval) {
      startScanInterval();
    }
  });

  // Hardware Web Bluetooth Pairing / Discovery
  const scanHardwareBluetooth = async () => {
    hardwareError.value = null;

    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
      hardwareError.value =
        'Web Bluetooth API is not supported in this browser. Please use Chrome on Android, macOS, Windows, or Chromebook.';
      return;
    }

    try {
      const navBt = (navigator as unknown as {
        bluetooth: {
          requestDevice: (options: {
            acceptAllDevices?: boolean;
            optionalServices?: (string | number)[];
          }) => Promise<{
            id: string;
            name?: string;
            gatt?: { connected: boolean };
          }>;
        };
      }).bluetooth;

      const device = await navBt.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'battery_service',
          'device_information',
          0x1800,
          0x180a,
          0x180f,
        ],
      });

      if (!device) return;

      const existing = devices.value.find(
        (d) => d.id === device.id || d.originalName === device.name
      );
      if (existing) {
        selectedDeviceId.value = existing.id;
        return;
      }

      const syntheticMac = generateRandomMac('5C:F8:21');
      const newDev: BLEDevice = {
        id: device.id,
        macAddress: syntheticMac,
        originalName: device.name || `BLE Hardware Device (${device.id.slice(0, 6)})`,
        customName: device.name || `BLE Hardware Device (${device.id.slice(0, 6)})`,
        category: 'tracker',
        rssi: -52,
        distanceMeters: 0.9,
        batteryLevel: 95,
        groupId: 'grp-unassigned',
        isRegistered: false,
        lastSeen: Date.now(),
        isHardwareReal: true,
        services: ['Battery Service', 'Device Info', 'Generic Access'],
        rawBluetoothDevice: device,
      };

      devices.value = [newDev, ...devices.value];
      selectedDeviceId.value = newDev.id;
    } catch (err: unknown) {
      const error = err as Error;
      console.warn('Bluetooth hardware request error:', error);
      if (error.name === 'NotFoundError') {
        hardwareError.value = 'Pairing dialog cancelled by user.';
      } else if (error.name === 'SecurityError') {
        hardwareError.value =
          'Security restriction: Web Bluetooth is blocked in cross-origin iframes. Open the app in a new tab or use the active Beacon Radar Simulator!';
      } else {
        hardwareError.value = error.message || 'Failed to connect to Bluetooth hardware.';
      }
    }
  };

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

  const resetDevices = () => {
    devices.value = INITIAL_MOCK_DEVICES;
    localStorage.removeItem(STORAGE_KEY);
    selectedDeviceId.value = INITIAL_MOCK_DEVICES[0]?.id || null;
  };

  return {
    devices,
    selectedDevice,
    selectedDeviceId,
    isScanning,
    toggleScanning: () => {
      isScanning.value = !isScanning.value;
    },
    hardwareSupported,
    hardwareError,
    clearHardwareError: () => {
      hardwareError.value = null;
    },
    scanHardwareBluetooth,
    updateDeviceName,
    updateDeviceGroup,
    registerDevice,
    resetDevices,
  };
}
