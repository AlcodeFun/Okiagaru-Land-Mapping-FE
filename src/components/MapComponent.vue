<template>
  <div class="map-container" ref="mapContainer"></div>
</template>

<script>
import { onMounted, ref } from "vue";
import L from "leaflet";

export default {
  name: "MapComponent",
  setup() {
    const mapContainer = ref(null);
    let mapInstance = null;

    onMounted(() => {
      mapInstance = L.map(mapContainer.value).setView([-6.9209, 107.6038], 13); // Koordinat awal

      // Tambahkan layer peta dari OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapInstance);

      // Tambahkan marker
      L.marker([-6.9209, 107.6038])
        .addTo(mapInstance)
        .bindPopup("Ini adalah lokasi awal!")
        .openPopup();
    });

    return { mapContainer };
  },
};
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 500px;
  border-radius: 10px;
}
</style>
