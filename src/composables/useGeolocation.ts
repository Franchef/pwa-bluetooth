import { ref, onMounted, onUnmounted } from 'vue';
import { GeoCoordinates } from '../types';

export function useGeolocation() {
  const coordinates = ref<GeoCoordinates>({
    latitude: null,
    longitude: null,
    altitude: null,
    accuracy: null,
    heading: null,
    speed: null,
    timestamp: null,
    error: null,
    status: 'idle',
  });

  const watchActive = ref(false);
  let watchId: number | null = null;

  const fetchLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      coordinates.value = {
        ...coordinates.value,
        status: 'unavailable',
        error: 'Geolocation is not supported by this browser/device.',
      };
      return;
    }

    coordinates.value = { ...coordinates.value, status: 'requesting', error: null };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        coordinates.value = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitude: pos.coords.altitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
          error: null,
          status: 'locked',
        };
      },
      (err) => {
        console.warn('Geolocation query failed or denied:', err.message);
        let errorMsg = 'Unable to retrieve location.';
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = 'Location permission denied. You can enable GPS in browser settings.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMsg = 'Location signal unavailable.';
        } else if (err.code === err.TIMEOUT) {
          errorMsg = 'Location request timed out.';
        }

        // Provide sensible fallback coordinates if unavailable/denied so the user can test the device tagging flow without being blocked
        coordinates.value = {
          ...coordinates.value,
          status: err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable',
          error: errorMsg,
          latitude: coordinates.value.latitude ?? 37.774929,
          longitude: coordinates.value.longitude ?? -122.419416,
          accuracy: coordinates.value.accuracy ?? 8.5,
          timestamp: Date.now(),
        };
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  };

  const toggleWatch = () => {
    watchActive.value = !watchActive.value;
    if (watchActive.value && typeof navigator !== 'undefined' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          coordinates.value = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            altitude: pos.coords.altitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
            error: null,
            status: 'locked',
          };
        },
        (err) => {
          console.warn('Geolocation watch error:', err.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
        }
      );
    } else if (watchId !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  };

  onMounted(() => {
    fetchLocation();
  });

  onUnmounted(() => {
    if (watchId !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchId);
    }
  });

  return {
    coordinates,
    refreshLocation: fetchLocation,
    watchActive,
    toggleWatch,
  };
}
