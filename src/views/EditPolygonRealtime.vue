<template>
  <div class="container-fluid">
    <h4 class="mb-3">Edit Polygon Lahan - Metode: Realtime Tracking</h4>
    <h5 class="mb-3">Nama Lahan: {{ lahanData?.lahan }}</h5>

    <h5 class="mb-3">Polygon Lama:</h5>
    <div
      id="mapOld"
      class="mb-4"
      style="height: 300px; border-radius: 12px; overflow: hidden"
    ></div>

    <h5 class="mb-3">Polygon Baru (Tracking):</h5>
    <div
      id="map"
      class="mb-4"
      style="height: 500px; border-radius: 12px; overflow: hidden"
    ></div>

    <div class="row align-items-center gy-2 mb-2">
      <div class="col-12 col-md-4">
        <button class="btn btn-secondary w-100" @click="confirmBack">
          Kembali
        </button>
        <button
          class="btn btn-outline-danger w-100"
          v-if="path.length > 0 && !watchId"
          @click="resetTracking"
        >
          🔄 Mulai Ulang Tracking
        </button>
      </div>

      <div class="col-12 col-md-8">
        <div class="d-flex flex-wrap gap-2 justify-content-md-end">
          <button
            class="btn btn-warning"
            v-if="!watchId"
            @click="startTracking"
          >
            Mulai Tracking
          </button>
          <button class="btn btn-info" v-if="watchId" @click="togglePause">
            {{ isPaused ? "Lanjutkan" : "Jeda" }}
          </button>
          <button class="btn btn-danger" v-if="watchId" @click="stopTracking">
            Selesai Tracking
          </button>
          <button
            class="btn btn-success"
            :disabled="!area || path.length < 3"
            @click="submitEdit"
          >
            Lanjutkan ({{ area.toFixed(2) }} m²)
          </button>
        </div>

        <div class="mt-2 text-md-end text-start">
          <small v-if="watchId && !isPaused" class="text-success"
            >📡 Tracking aktif...</small
          >
          <small v-if="watchId && isPaused" class="text-warning"
            >⏸️ Tracking dijeda</small
          >
          <small v-else class="text-muted">Tracking belum dimulai.</small>
        </div>
      </div>
    </div>

    <!-- Modal Konfirmasi -->
    <div class="modal fade" id="confirmBackModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Konfirmasi</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            Tracking sedang berjalan. Yakin ingin keluar dan membatalkan proses?
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Batal
            </button>
            <button type="button" class="btn btn-danger" @click="exitTracking">
              Ya, Batalkan
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
  <script>
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as turf from "@turf/turf";
import axios from "axios";
import * as bootstrap from "bootstrap";

export default {
  name: "CreateLahanRealtime",
  data() {
    return {
      map: null,
      mapOld: null,
      baseLayersMap: {},
      baseLayersMapOld: {},
      defaultLayerMap: null,
      defaultLayerMapOld: null,
      path: [],
      drawnItems: null,
      polygonLayer: null,
      polygon: null,
      polygonNew: [],
      areaNew: 0,
      area: 0,
      watchId: null,
      isPaused: false,
      pathLayer: null,
      marker: null,
      confirmModal: null,
      lahanId: null,
      lahanData: [],
    };
  },
  mounted() {
    this.lahanId = this.$route.params.id;
    this.confirmModal = new bootstrap.Modal(
      document.getElementById("confirmBackModal")
    );

    this.fetchLahanData().then(() => {
      this.fetchBasemaps();
    });
  },

  methods: {
    fetchBasemaps() {
      axios.get("/basemaps").then(({ data }) => {
        const aktifBasemaps = data.data.filter((b) => b.aktif === "Ya");

        // Reset terlebih dahulu
        this.baseLayersMap = {};
        this.baseLayersMapOld = {};

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

          const options = {
            attribution: b.judul,
            maxZoom: 20,
            ...(subdomains && { subdomains }),
          };

          this.baseLayersMap[b.judul] = L.tileLayer(url, options);
          this.baseLayersMapOld[b.judul] = L.tileLayer(url, options); // penting: clone baru
        });

        this.defaultLayerMap = Object.values(this.baseLayersMap)[0];
        this.defaultLayerMapOld = Object.values(this.baseLayersMapOld)[0];

        this.initMap(); // tracking map
        if (this.polygon?.length > 0) {
          this.initMapOldPolygon(); // old polygon map
        }
      });
    },

    async fetchLahanData() {
      try {
        const response = await axios.get(`/lahan/${this.lahanId}`);
        const lahan = response.data.data;
        this.lahanData = lahan;

        // Simpan polygon tapi JANGAN render dulu map-nya
        if (lahan.polygon && lahan.polygon.coordinates) {
          this.polygon = lahan.polygon.coordinates[0];
          this.area = lahan.luas;
        }
      } catch (error) {
        console.error("Gagal mengambil data lahan:", error);
      }
    },
    initMapOldPolygon() {
      const coordinates = this.polygon.map(([lng, lat]) => [lat, lng]);
      const center = coordinates[0] || [0, 0];

      this.mapOld = L.map("mapOld", {
        center,
        zoom: 18,
        layers: [this.defaultLayerMapOld],
      });

      this.oldMapLayerControl = L.control
        .layers(this.baseLayersMapOld)
        .addTo(this.mapOld);

      this.polygonLayerOld = L.polygon(coordinates, {
        color: "blue",
        weight: 2,
        fillOpacity: 0.3,
      }).addTo(this.mapOld);

      this.mapOld.fitBounds(this.polygonLayerOld.getBounds());
    },

    initMap() {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;

          this.map = L.map("map", {
            center: [lat, lng],
            zoom: 18,
            layers: [this.defaultLayerMap],
          });

          this.mapLayerControl = L.control
            .layers(this.baseLayersMap)
            .addTo(this.map);

          const customIcon = L.icon({
            iconUrl: "/marker-icon.png",
            iconSize: [30, 30],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });

          this.marker = L.marker([lat, lng], { icon: customIcon }).addTo(
            this.map
          );

          // Coba restore data tracking sebelumnya
          const savedPath = localStorage.getItem("active_edit_path");
          const savedArea = localStorage.getItem("active_edit_area");

          if (savedPath) {
            this.path = JSON.parse(savedPath);
            this.drawRestoredPath();
          }

          if (savedArea) {
            this.area = parseFloat(savedArea);
          }
        },
        (err) => {
          console.error("Gagal mendapatkan lokasi:", err);
          alert("Gagal mendapatkan lokasi Anda");
        },
        { enableHighAccuracy: true }
      );
    },

    drawRestoredPath() {
      this.pathLayer = L.polyline(this.path, { color: "red" }).addTo(this.map);
      const last = this.path[this.path.length - 1];
      if (last && this.marker) {
        this.marker.setLatLng(last);
        this.map.panTo(last);
      }
    },

    getDistance(lat1, lon1, lat2, lon2) {
      const from = turf.point([lon1, lat1]);
      const to = turf.point([lon2, lat2]);
      return turf.distance(from, to, { units: "meters" });
    },

    startTracking() {
      this.isPaused = false;

      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (this.isPaused) return;

          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const last = this.path[this.path.length - 1];

          if (!last || this.getDistance(last[0], last[1], lat, lng) > 2) {
            this.path.push([lat, lng]);
            if (this.marker) {
              this.marker.setLatLng([lat, lng]);
              this.map.panTo([lat, lng], { animate: true });
            } else {
              const customIcon = L.icon({
                iconUrl: "/marker-icon.png",
                iconSize: [30, 30],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
              });

              this.marker = L.marker([lat, lng], { icon: customIcon }).addTo(
                this.map
              );
              this.map.panTo([lat, lng], { animate: true });
            }

            if (!this.pathLayer) {
              this.pathLayer = L.polyline(this.path, { color: "red" }).addTo(
                this.map
              );
            } else {
              this.pathLayer.setLatLngs(this.path);
            }

            if (this.path.length >= 3) {
              const closed = [...this.path, this.path[0]];
              const polygon = turf.polygon([
                [...closed.map(([lat, lng]) => [lng, lat])],
              ]);
              this.area = turf.area(polygon);
            }

            // Simpan ke localStorage untuk pemulihan
            localStorage.setItem("active_edit_path", JSON.stringify(this.path));
            localStorage.setItem("active_edit_area", this.area.toString());
          }
        },
        (err) => {
          console.error("Tracking gagal:", err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      );
    },

    stopTracking() {
      if (this.watchId !== null) {
        navigator.geolocation.clearWatch(this.watchId);
        this.watchId = null;
        this.isPaused = false;
      }
    },

    togglePause() {
      this.isPaused = !this.isPaused;
    },

    async submitEdit() {
      this.stopTracking();
      const polygonCoords = this.path.map(([lat, lng]) => [lng, lat]);
      localStorage.setItem("temp_polygon", JSON.stringify(polygonCoords));
      localStorage.setItem("temp_area", this.area.toFixed(2));
      this.polygonNew = JSON.parse(
        localStorage.getItem("temp_polygon") || "[]"
      );
      this.areaNew = parseFloat(localStorage.getItem("temp_area") || 0);
      try {
        const response = await axios.put(
          `/lahan/${this.lahanId}`,
          {
            polygon: this.polygonNew,
            luas: this.areaNew,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.message === "success") {
          this.$router.push({
            path: "/lahan",
            query: { success: "Polygon berhasil diperbarui!" },
          });
        }
        localStorage.removeItem("active_edit_path");
      localStorage.removeItem("active_edit_area");
      } catch (error) {
        console.error("Gagal mengupdate polygon:", error);
      }
    },

    confirmBack() {
      if (this.watchId || this.path.length > 0) {
        this.confirmModal.show();
      } else {
        this.$router.back();
      }
    },

    exitTracking() {
      this.stopTracking();
      localStorage.removeItem("active_edit_path");
      localStorage.removeItem("active_edit_area");
      this.confirmModal.hide();
      this.$router.back();
    },
    resetTracking() {
      this.path = [];
      this.area = 0;
      this.isPaused = false;
      localStorage.removeItem("active_edit_path");
      localStorage.removeItem("active_edit_area");

      if (this.pathLayer) {
        this.map.removeLayer(this.pathLayer);
        this.pathLayer = null;
      }

      if (this.marker) {
        this.map.removeLayer(this.marker);
        this.marker = null;
      }

      // 🔥 Buat ulang marker di posisi pengguna sekarang
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const customIcon = L.icon({
            iconUrl: "/marker-icon.png",
            iconSize: [30, 30],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });

          this.marker = L.marker([lat, lng], { icon: customIcon }).addTo(
            this.map
          );
          this.map.panTo([lat, lng], { animate: true });
        },
        (err) => {
          console.warn("Gagal mendapatkan posisi saat reset:", err);
        },
        { enableHighAccuracy: true }
      );
    },
  },
  beforeUnmount() {
    this.stopTracking();
    if (this.map) {
      this.map.remove();
    }
    if (this.mapOld) {
      this.mapOld.remove();
    }
    this.stopTracking();
  },
};
</script>
  
  <style scoped>
#map,
#mapOld {
  border: 2px solid #ccc;
}
</style>
  