// components/visualizations/MapVisualization.vue
<template>
  <div class="map-visualization-container">
    <!-- Unchanged template code -->
    <div ref="mapContainer" class="map-container" :style="{ height: `${height}px` }"></div>
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
  // Code continues - we'll fix this in the next step
};
</script>