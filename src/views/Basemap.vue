<template>
  <div>
    <card-table tableName="Daftar Basemap">
      <div class="container" style="width: 100%">
        <ul class="list-group bg-transparent border-0">
          <li
            v-for="(map, index) in basemaps"
            :key="map.id_basemap"
            class="list-group-item group-title"
          >
            <div
              class="d-flex justify-content-between align-items-center"
              @click="toggleMap(index)"
              style="cursor: pointer"
            >
              <span class="list-group-item-text">{{ map.judul }}</span>
              <i
                :class="[
                  'chevron-icon',
                  'fa',
                  activeIndex === index
                    ? 'fa-chevron-down'
                    : 'fa-chevron-right',
                ]"
              ></i>
            </div>

            <!-- Preview Map -->
            <div
              v-if="activeIndex === index"
              class="map-preview mt-3"
              :id="'map-' + map.id_basemap"
              style="
                height: 300px;
                width: 100%;
                border-radius: 10px;
                overflow: hidden;
              "
            ></div>
          </li>
        </ul>
      </div>
    </card-table>
  </div>
</template>

<script>
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import CardTable from "./components/CardTable";

export default {
  components: { CardTable },
  data() {
    return {
      basemaps: [],
      activeIndex: null,
      mapInstances: {},
      userLocation: { lat: -6.1754, lng: 106.8272 }, // default Jakarta
    };
  },
  methods: {
    toggleMap(index) {
      this.activeIndex = this.activeIndex === index ? null : index;

      if (this.activeIndex !== null) {
        const basemap = this.basemaps[this.activeIndex];
        this.$nextTick(() => this.initMap(basemap));
      }
    },
    async fetchBasemaps() {
      try {
        const res = await axios.get("/basemaps");
        this.basemaps = res.data.data;
      } catch (error) {
        console.error("Gagal fetch basemaps:", error);
      }
    },
    initMap(basemap) {
      const mapId = `map-${basemap.id_basemap}`;

      // Hindari inisialisasi ulang
      if (this.mapInstances[mapId]) {
        return;
      }

      const map = L.map(mapId).setView(
        [this.userLocation.lat, this.userLocation.lng],
        20
      );

      L.tileLayer(basemap.basemap, {
        attribution: basemap.judul,
        maxZoom: 18,
        subdomains: ["mt0", "mt1", "mt2", "mt3"], 
      }).addTo(map);

      // Ikon custom untuk marker
      const customIcon = L.icon({
        iconUrl: "/marker-icon.png",
        iconSize: [41, 45],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      L.marker([this.userLocation.lat, this.userLocation.lng], {
        icon: customIcon,
      }).addTo(map);

      this.mapInstances[mapId] = map;
    },
    getUserLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.userLocation.lat = position.coords.latitude;
            this.userLocation.lng = position.coords.longitude;
          },
          () => {
            console.warn("Lokasi tidak bisa didapat, pakai default Jakarta.");
          }
        );
      }
    },
  },
  mounted() {
    this.getUserLocation();
    this.fetchBasemaps();
  },
};
</script>

<style scoped>
.group-title {
  background-color: #ffffff;
  border-radius: 10px;
  margin-bottom: 0.75rem;
  padding: 1rem 1.25rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.list-group-item-text {
  font-weight: 600;
  color: #343a40;
  font-size: 18px;
}

.chevron-icon {
  font-size: 1.2rem;
  color: #4caf50;
  transition: transform 0.3s ease;
}
</style>
