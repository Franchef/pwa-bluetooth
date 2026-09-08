export type DeviceCategory = 
  | 'beacon' 
  | 'sensor' 
  | 'tracker' 
  | 'wearable' 
  | 'gateway' 
  | 'smart-tag';

export interface DeviceGroup {
  id: string;
  name: string;
  color: string; // Tailwind color class or hex
  badgeBg: string;
  badgeText: string;
  description: string;
}

export interface GeoCoordinates {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
  error?: string | null;
  status: 'idle' | 'requesting' | 'locked' | 'denied' | 'unavailable';
}

export interface BLEDevice {
  id: string; // Internal unique ID or Web Bluetooth ID
  macAddress: string; // Formatted MAC (e.g. C4:D8:5F:3A:91:2E) or BLE UUID
  originalName: string;
  customName: string;
  category: DeviceCategory;
  rssi: number; // dBm (-100 to -30)
  txPower?: number; // e.g. -59 dBm
  distanceMeters: number; // Calculated approximate distance
  batteryLevel?: number; // percentage (0-100)
  groupId: string; // ID of assigned group
  isRegistered: boolean;
  registeredAt?: string | null;
  savedLocation?: {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    accuracy?: number | null;
    timestamp: number;
  } | null;
  lastSeen: number; // Unix timestamp
  isHardwareReal?: boolean;
  services?: string[];
  rawBluetoothDevice?: unknown;
}

export interface ApiPostPayload {
  endpoint: string;
  method: 'POST';
  timestamp: string;
  headers: Record<string, string>;
  body: {
    deviceId: string;
    macAddress: string;
    name: string;
    originalName: string;
    group: {
      id: string;
      name: string;
    };
    location: {
      latitude: number | null;
      longitude: number | null;
      altitude: number | null;
      accuracyMeters: number | null;
      capturedAt: string;
      source: 'Phone GPS Geolocation API';
    };
    telemetry: {
      rssi: number;
      estimatedDistanceMeters: number;
      batteryLevel?: number;
      category: DeviceCategory;
    };
    syncMeta: {
      clientVersion: string;
      isPWA: boolean;
      userAgent: string;
    };
  };
  simulatedResponse?: {
    status: number;
    statusText: string;
    registryId: string;
    savedAt: string;
    message: string;
  };
}
