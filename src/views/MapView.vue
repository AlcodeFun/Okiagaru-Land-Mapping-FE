<template>
  <nav class="navbar navbar-light bg-white shadow-sm p-3">
    <div class="container-fluid">
      <div class="row w-100 align-items-center">
        <!-- Logo + Nama Sistem -->
        <div
          class="col-12 col-md-6 d-flex align-items-center justify-content-center justify-content-md-start mb-3 mb-md-0"
        >
          <img
            src="/favicon.png"
            alt="Land Mapping Logo"
            style="max-width: 40px; height: auto"
            class="me-2"
          />
          <h5 class="mb-0">Land Mapping System</h5>
        </div>

        <!-- Tombol Sign In -->
        <div
          class="col-12 col-md-6 d-flex justify-content-center justify-content-md-end"
        >
          <button class="btn btn-primary" @click="$router.push('/sign-in')">
            Sign In
          </button>
        </div>
      </div>
    </div>
  </nav>

  <div class="d-flex flex-column flex-lg-row vh-100">
    <!-- Map Area -->
    <div class="col-12 col-lg-9 position-relative p-5">
      <div class="bg-light d-flex justify-content-center align-items-center">
        <!-- Leaflet Map Container -->
        <div id="map" class="rounded shadow w-100" style="height: 100vh"></div>
      </div>
    </div>

    <!-- Sidebar -->
    <div class="col-12 col-lg-3 bg-white shadow-sm p-3 overflow-hidden">
      <h5>Pemilik Lahan</h5>
      <select
        class="form-select mb-4"
        aria-label="Pilih Pemilik Lahan"
        v-model="selectedLayerGroupId"
        @change="onLayerGroupChange"
      >
       
        <option
          v-for="group in layerGroups"
          :key="group.id_layer_groups"
          :value="group.id_layer_groups"
        >
          {{ group.layer_groups }}
        </option>
      </select>

      <div>
        <h5>Daftar Lahan</h5>
        <div class="lahan-container">
          <div
            v-for="lahan in lahanList"
            :key="lahan.id_lahan"
            class="d-flex align-items-center p-2 border rounded shadow-sm mb-2"
          >
            <div>
              <p class="mb-0 fw-semibold">{{ lahan.lahan }}</p>
              <small class="text-muted">Luas :{{ lahan.luas }} m²</small>
            </div>
            <span
              class="cursor-pointer ms-auto text-success fw-bold small"
              @click="flyToLahan(lahan)"
            >
              Lihat Lahan
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapMutations } from "vuex";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default {
  name: "MapView",
  data() {
    return {
      map: null,
      baseLayers: {},
      lahanList: [],
      lahanLayerGroup: null,
      layerGroups: [],
      selectedLayerGroupId: null,
      customMarkerIcon: null,
    };
  },
  methods: {
    ...mapMutations(["toggleEveryDisplay", "toggleHideConfig"]),

    flyToLahan(selectedLahan) {
      if (selectedLahan.lat && selectedLahan.lon) {
        this.map.setView([selectedLahan.lat, selectedLahan.lon], 18, {
          animate: true,
        });

        if (selectedLahan._polygon) {
          selectedLahan._polygon.openPopup();
        }
      }
    },
    async fetchBasemaps() {
      const { data } = await axios.get("/basemaps");
      const aktifBasemaps = data.data.filter((b) => b.aktif === "Ya");

      aktifBasemaps.forEach((b) => {
        let url = b.basemap;
        let subdomains;

        const subdomainsMatch = url.match(/\{([a-z]\|)+[a-z]\}/i);
        if (subdomainsMatch) {
          subdomains = subdomainsMatch[0].replace(/[{}]/g, "").split("|");
          url = url.replace(subdomainsMatch[0], "{s}");
        } else if (url.includes("{s}.google.com")) {
          subdomains = ["mt0", "mt1", "mt2", "mt3"];
        }

        const tileLayerOptions = {
          attribution: b.judul,
          maxZoom: 20,
        };

        if (subdomains) {
          tileLayerOptions.subdomains = subdomains;
        }

        this.baseLayers[b.judul] = L.tileLayer(url, tileLayerOptions);
      });

      await this.fetchLayerGroups();
    },
    async fetchLayerGroups() {
      const { data } = await axios.get("/layer-groups");
      this.layerGroups = data.data;

      if (this.layerGroups.length > 0) {
        this.selectedLayerGroupId = this.layerGroups[0].id_layer_groups;
        this.initMap();
      }
    },
    async fetchLahanByLayerGroup() {
      if (!this.selectedLayerGroupId) return;

      const { data } = await axios.get(
        `/lahan/layer-group/${this.selectedLayerGroupId}`
      );
      this.lahanList = data.data;

      if (this.lahanLayerGroup) {
        this.lahanLayerGroup.clearLayers();
      } else {
        this.lahanLayerGroup = L.layerGroup().addTo(this.map);
      }

      this.lahanList.forEach((lahan) => {
        let polygon = null;

        if (lahan.polygon.type === "Polygon") {
          polygon = L.polygon(
            lahan.polygon.coordinates[0].map((coord) => [coord[1], coord[0]]),
            { color: "#3388ff" }
          );
        } else if (lahan.polygon.type === "Point") {
          polygon = L.marker(
            [lahan.polygon.coordinates[1], lahan.polygon.coordinates[0]],
            { icon: this.customMarkerIcon }
          );
        }

        if (polygon) {
          polygon.bindPopup(`
        <strong>${lahan.lahan}</strong><br/>
        Luas: ${lahan.luas} m²<br/>
        <button onclick="window.location.href='/lahan/detail/${lahan.id_lahan}'" class="btn btn-sm btn-primary mt-2">Detail</button>
      `);

          // 👉 Event saat popup dibuka
          polygon.on("popupopen", () => {
            this.highlightLahan(lahan);
          });

          polygon.addTo(this.lahanLayerGroup);

          // Simpan polygon supaya bisa diakses
          lahan._polygon = polygon;
        }
      });
    },
    highlightLahan(selectedLahan) {
      // Reset semua polygon ke warna biru
      this.lahanList.forEach((lahan) => {
        if (lahan._polygon && lahan.polygon.type === "Polygon") {
          lahan._polygon.setStyle({ color: "#3388ff" });
        }
      });

      // Kalau yang dipilih polygon, warnai jadi merah
      if (selectedLahan._polygon && selectedLahan.polygon.type === "Polygon") {
        selectedLahan._polygon.setStyle({ color: "red" });
      }
    },

    initMap() {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const defaultLayer = Object.values(this.baseLayers)[0];

          this.map = L.map("map", {
            center: [lat, lng],
            zoom: 14,
            layers: [defaultLayer],
          });

          L.control.layers(this.baseLayers).addTo(this.map);
          this.fetchLahanByLayerGroup();
        },
        (error) => {
          console.error("Geolocation error: ", error);
          const fallbackLat = -6.2088;
          const fallbackLng = 106.8456;
          const defaultLayer = Object.values(this.baseLayers)[0];

          this.map = L.map("map", {
            center: [fallbackLat, fallbackLng],
            zoom: 14,
            layers: [defaultLayer],
          });

          L.control.layers(this.baseLayers).addTo(this.map);
          this.fetchLahanByLayerGroup();
        }
      );
    },
    onLayerGroupChange(event) {
      this.selectedLayerGroupId = event.target.value;
      this.fetchLahanByLayerGroup();
    },
  },
  created() {
    this.toggleEveryDisplay();
    this.toggleHideConfig();
  },
  beforeUnmount() {
    this.toggleEveryDisplay();
    this.toggleHideConfig();
  },
  mounted() {
    this.fetchBasemaps();

    // Buat custom marker icon
    this.customMarkerIcon = L.icon({
      iconUrl: "/marker-icon.png",
      iconSize: [40, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  },
};
</script>


<style scoped>
#map {
  width: 100%;
  max-height: 500px;
}

.lahan-container {
  max-height: 500px;
  overflow-y: auto;
  padding: 10px;
}

@media (max-width: 768px) {
  #map {
    height: 50vh;
  }
}
</style>
