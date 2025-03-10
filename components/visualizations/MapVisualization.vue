<!-- components/visualizations/MapVisualization.vue -->
<template>
  <div class="map-visualization">
    <div v-if="loading" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
    </div>
    <div v-else-if="error" class="text-red-500 p-4">
      {{ error }}
    </div>
    <div v-else class="map-container" :style="{ height: `${height}px` }">
      <ClientOnly>
        <LMap
          ref="mapRef"
          :zoom="zoom"
          :center="center"
          :use-global-leaflet="true"
          @ready="onMapReady"
        >
          <LTileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            layer-type="base"
          />
          
          <!-- Regular markers when not clustering -->
          <template v-if="!clusterMarkers">
            <LMarker 
              v-for="(location, index) in validLocations" 
              :key="index" 
              :lat-lng="[location.latitude, location.longitude]"
            >
              <LPopup v-if="showPopups && (location.popup || location.label)">
                <div v-if="location.popup" v-html="location.popup"></div>
                <div v-else>{{ location.label }}</div>
              </LPopup>
            </LMarker>
          </template>
          
          <!-- Use LMarkerCluster for clustered markers -->
          <template v-else>
            <LMarkerCluster>
              <LMarker 
                v-for="(location, index) in validLocations" 
                :key="index" 
                :lat-lng="[location.latitude, location.longitude]"
              >
                <LPopup v-if="showPopups && (location.popup || location.label)">
                  <div v-if="location.popup" v-html="location.popup"></div>
                  <div v-else>{{ location.label }}</div>
                </LPopup>
              </LMarker>
            </LMarkerCluster>
          </template>
        </LMap>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface Location {
  latitude: number;
  longitude: number;
  label?: string;
  popup?: string;
  color?: string;
  icon?: string;
  [key: string]: any;
}

interface MapVisualizationProps {
  locations: Location[];
  title?: string;
  loading?: boolean;
  error?: string;
  height?: number;
  zoom?: number;
  clusterMarkers?: boolean;
  showPopups?: boolean;
  center?: [number, number];
}

const props = withDefaults(defineProps<MapVisualizationProps>(), {
  locations: () => [],
  title: '',
  loading: false,
  error: '',
  height: 400,
  zoom: 10,
  clusterMarkers: true,
  showPopups: true,
  center: () => [0, 0]
});

import type { Map as LeafletMap } from 'leaflet';

// Need to use a more specific type for the ref that will hold the LMap component
const mapRef = ref<any>(null);
const markerClusterGroup = ref<any>(null);

// Filter out invalid locations
const validLocations = computed(() => {
  return props.locations.filter(
    loc => typeof loc.latitude === 'number' && 
           typeof loc.longitude === 'number' &&
           !isNaN(loc.latitude) && 
           !isNaN(loc.longitude) &&
           loc.latitude >= -90 && 
           loc.latitude <= 90 &&
           loc.longitude >= -180 && 
           loc.longitude <= 180
  );
});

// Compute map center based on locations or provided center
const center = computed((): [number, number] => {
  if (props.center && props.center[0] !== 0 && props.center[1] !== 0) {
    return props.center;
  }
  
  if (validLocations.value.length === 0) {
    return [0, 0];
  }
  
  if (validLocations.value.length === 1) {
    return [validLocations.value[0].latitude, validLocations.value[0].longitude];
  }
  
  // Calculate the average center of all locations
  const sumLat = validLocations.value.reduce((sum, loc) => sum + loc.latitude, 0);
  const sumLng = validLocations.value.reduce((sum, loc) => sum + loc.longitude, 0);
  
  return [
    sumLat / validLocations.value.length,
    sumLng / validLocations.value.length
  ];
});

// Handle map ready event - set up marker clusters if needed
const onMapReady = async () => {
  if (props.clusterMarkers && mapRef.value) {
    try {
      // Access the Leaflet map instance
      const map = mapRef.value.leafletObject as LeafletMap;
      
      if (!map) {
        console.error('Map instance not available');
        return;
      }
      
      // For marker clustering, we'll use the LMarkerCluster component
      // which is added directly in the template for the clustered markers
      
      // We'll just use this event to fit bounds if needed
      if (validLocations.value.length > 1) {
        const bounds = getBounds(validLocations.value);
        map.fitBounds(bounds);
      }
    } catch (err) {
      console.error('Error handling map ready:', err);
    }
  }
};

// Calculate bounds from locations
const getBounds = (locations: Location[]): [[number, number], [number, number]] => {
  if (locations.length === 0) {
    return [[0, 0], [0, 0]];
  }

  const lats = locations.map(loc => loc.latitude);
  const lngs = locations.map(loc => loc.longitude);
  
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)]
  ];
};
</script>

<style scoped>
.map-container {
  min-height: 300px;
  width: 100%;
  border-radius: 0.5rem;
  z-index: 0;
}
</style>