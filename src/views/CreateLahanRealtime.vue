<template>
  <div class="container-fluid">
    <h4 class="mb-3">Buat Polygon Lahan - Metode: Realtime Tracking</h4>

    <div
      id="map"
      class="mb-4"
      style="height: 500px; border-radius: 12px; overflow: hidden"
    ></div>

    <div class="row align-items-center gy-2 mb-2">
      <div class="col-12 col-md-4 ">
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
            @click="goToForm"
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
      baseLayers: {},
      path: [],
      area: 0,
      watchId: null,
      isPaused: false,
      pathLayer: null,
      marker: null,
      confirmModal: null,
    };
  },
  mounted() {
    this.fetchBasemaps();
    this.confirmModal = new bootstrap.Modal(
      document.getElementById("confirmBackModal")
    );
  },
  methods: {
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

        if (subdomains) tileLayerOptions.subdomains = subdomains;

        this.baseLayers[b.judul] = L.tileLayer(url, tileLayerOptions);
      });

      this.initMap();
    },

    initMap() {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const defaultLayer = Object.values(this.baseLayers)[0];

          this.map = L.map("map", {
            center: [lat, lng],
            zoom: 18,
            layers: [defaultLayer],
          });

          L.control.layers(this.baseLayers).addTo(this.map);

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
          const savedPath = localStorage.getItem("active_path");
          const savedArea = localStorage.getItem("active_area");

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
            localStorage.setItem("active_path", JSON.stringify(this.path));
            localStorage.setItem("active_area", this.area.toString());
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

    goToForm() {
      this.stopTracking();
      const polygonCoords = this.path.map(([lat, lng]) => [lng, lat]);
      localStorage.setItem("temp_polygon", JSON.stringify(polygonCoords));
      localStorage.setItem("temp_area", this.area.toFixed(2));
      this.$router.push("/lahan/form");
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
      localStorage.removeItem("active_path");
      localStorage.removeItem("active_area");
      this.confirmModal.hide();
      this.$router.back();
    },
    resetTracking() {
  this.path = [];
  this.area = 0;
  this.isPaused = false;
  localStorage.removeItem("active_path");
  localStorage.removeItem("active_area");

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

      this.marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);
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
  },
};
</script>

<style scoped>
#map {
  border: 2px solid #ccc;
}
</style>
