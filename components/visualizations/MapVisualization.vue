<!-- components/visualizations/MapVisualization.vue -->

<template>
  <div class="map-visualization-container">
    <div v-if="loading" class="flex justify-center items-center p-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
    </div>
    <div v-else-if="error" class="text-red-500 p-4">
      {{ error }}
    </div>
    <div v-else-if="!locations || locations.length === 0" class="text-center p-8 text-gray-500">
      <UIcon name="i-heroicons-map" class="h-12 w-12 mx-auto mb-2 text-gray-400" />
      <p>No location data available for map</p>
    </div>
    <div v-else>
      <h3 v-if="title" class="text-base font-medium mb-2">{{ title }}</h3>
      <div ref="mapContainer" class="map-container" :style="{ height: `${height}px` }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import 'leaflet/dist/leaflet.css';

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
}

const props = withDefaults(defineProps<MapVisualizationProps>(), {
  locations: () => [],
  title: '',
  loading: false,
  error: '',
  height: 400,
  zoom: 10,
  clusterMarkers: true,
  showPopups: true
});

const mapContainer = ref<HTMLElement | null>(null);
let map: any = null;
let markerClusterGroup: any = null;
let markers: any[] = [];

// Initialize map
const initializeMap = async () => {
  if (!mapContainer.value) return;
  
  // Dynamically import Leaflet (and plugins) to avoid SSR issues
  const L = await import('leaflet');
  
  // Create map instance
  map = L.map(mapContainer.value);
  
  // Add tile layer (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  // If clustering is enabled, create a marker cluster group
  if (props.clusterMarkers) {
    const MarkerCluster = await import('leaflet.markercluster');
    const 'leaflet.markercluster/dist/MarkerCluster.css';
    const 'leaflet.markercluster/dist/MarkerCluster.Default.css';
    
    markerClusterGroup = L.markerClusterGroup();
    map.addLayer(markerClusterGroup);
  }
  
  // Add markers to the map
  addMarkersToMap(L);
};

// Add markers to the map
const addMarkersToMap = async (L: any) => {
  // Clear existing markers
  clearMarkers();
  
  if (!props.locations || props.locations.length === 0) return;
  
  // Bounds to fit all markers
  const bounds = L.latLngBounds();
  
  // Create markers for each location
  props.locations.forEach(location => {
    const { latitude, longitude, label, popup, color, icon } = location;
    
    // Skip invalid coordinates
    if (!isValidCoordinate(latitude, longitude)) return;
    
    // Create marker
    const marker = L.marker([latitude, longitude]);
    
    // Add popup if provided
    if (props.showPopups && (popup || label)) {
      marker.bindPopup(popup || label || '');
    }
    
    // Add marker to map or cluster group
    if (props.clusterMarkers && markerClusterGroup) {
      markerClusterGroup.addLayer(marker);
    } else {
      marker.addTo(map);
    }
    
    // Store marker for later cleanup
    markers.push(marker);
    
    // Extend bounds to include this marker
    bounds.extend([latitude, longitude]);
  });
  
  // Fit map to bounds if we have valid markers
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [50, 50] });
  }
};

// Clear existing markers
const clearMarkers = () => {
  if (props.clusterMarkers && markerClusterGroup) {
    markerClusterGroup.clearLayers();
  } else if (map) {
    markers.forEach(marker => map.removeLayer(marker));
  }
  markers = [];
};

// Validate coordinates
const isValidCoordinate = (lat: any, lng: any) => {
  return (
    typeof lat === 'number' && 
    typeof lng === 'number' && 
    !isNaN(lat) && 
    !isNaN(lng) && 
    lat >= -90 && 
    lat <= 90 && 
    lng >= -180 && 
    lng <= 180
  );
};

// Initialize map on component mount
onMounted(async () => {
  await initializeMap();
});

// Clean up on unmount
onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
  markers = [];
  markerClusterGroup = null;
});

// Watch for changes in locations data
watch(() => props.locations, async () => {
  if (map) {
    const L = await import('leaflet');
    addMarkersToMap(L);
  }
}, { deep: true });
</script>

<style>
/* Fix for Leaflet images */
.map-container .leaflet-marker-icon {
  background-image: url('https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png');
}
.map-container .leaflet-marker-shadow {
  background-image: url('https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png');
}
</style>