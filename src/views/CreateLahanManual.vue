<template>
    <div class="container-fluid">
      <h4 class="mb-3">Buat Polygon Lahan - Metode: Tambah Titik Manual</h4>
  
      <div id="map" class="mb-4" style="height: 500px; border-radius: 12px; overflow: hidden"></div>
  
      <div class="row align-items-center gy-2 mb-2">
        <div class="col-12 col-md-4">
          <button class="btn btn-secondary w-100" @click="confirmBack">Kembali</button>
          <button class="btn btn-outline-danger w-100 mt-2" v-if="path.length > 0" @click="resetPath">
            🔄 Mulai Ulang Titik
          </button>
        </div>
  
        <div class="col-12 col-md-8">
          <div class="d-flex flex-wrap gap-2 justify-content-md-end">
            <button class="btn btn-info" @click="updateMarker">Update Lokasi</button>
            <button class="btn btn-primary" @click="addCurrentPoint">Tambah Titik</button>
            <button class="btn btn-success" :disabled="!area || path.length < 3" @click="goToForm">
              Lanjutkan ({{ area.toFixed(2) }} m²)
            </button>
          </div>
          <div class="mt-2 text-md-end text-start">
            <small class="text-muted">📍 Posisi terakhir: {{ positionString }}</small>
          </div>
        </div>
      </div>
  
      <!-- Modal Konfirmasi -->
      <div class="modal fade" id="confirmBackModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Konfirmasi</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              Anda yakin ingin membatalkan proses pembuatan polygon?
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
              <button type="button" class="btn btn-danger" @click="exitTracking">Ya, Batalkan</button>
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
    name: "CreateLahanManual",
    data() {
      return {
        map: null,
        baseLayers: {},
        path: [],
        area: 0,
        pathLayer: null,
        marker: null,
        currentLatLng: null,
        confirmModal: null,
      };
    },
    computed: {
      positionString() {
        return this.currentLatLng
          ? `${this.currentLatLng.lat.toFixed(5)}, ${this.currentLatLng.lng.toFixed(5)}`
          : "Belum tersedia";
      },
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
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            this.currentLatLng = { lat, lng };
  
            const defaultLayer = Object.values(this.baseLayers)[0];
            this.map = L.map("map", {
              center: [lat, lng],
              zoom: 18,
              layers: [defaultLayer],
            });
  
            L.control.layers(this.baseLayers).addTo(this.map);
  
            const icon = L.icon({
              iconUrl: "/marker-icon.png",
              iconSize: [30, 30],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            });
  
            this.marker = L.marker([lat, lng], { icon }).addTo(this.map);
  
            // restore jika ada
            const savedPath = localStorage.getItem("active_path");
            const savedArea = localStorage.getItem("active_area");
  
            if (savedPath) {
              this.path = JSON.parse(savedPath);
              this.drawPath();
            }
            if (savedArea) {
              this.area = parseFloat(savedArea);
            }
          },
          () => alert("Gagal mendapatkan lokasi awal"),
          { enableHighAccuracy: true }
        );
      },
  
      updateMarker() {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            this.currentLatLng = { lat, lng };
            if (this.marker) this.marker.setLatLng([lat, lng]);
            this.map.panTo([lat, lng], { animate: true });
          },
          () => alert("Gagal memperbarui lokasi"),
          { enableHighAccuracy: true }
        );
      },
  
      addCurrentPoint() {
        if (!this.currentLatLng) return;
        const { lat, lng } = this.currentLatLng;
        this.path.push([lat, lng]);
  
        // Tambahkan marker titik
        L.marker([lat, lng], {
          icon: L.icon({
            iconUrl: "/marker-icon.png",
            iconSize: [25, 25],
            iconAnchor: [12, 41],
          }),
        }).addTo(this.map);
  
        this.drawPath();
        this.calculateArea();
        localStorage.setItem("active_path", JSON.stringify(this.path));
        localStorage.setItem("active_area", this.area.toString());
      },
  
      drawPath() {
        if (this.pathLayer) this.map.removeLayer(this.pathLayer);
        this.pathLayer = L.polyline(this.path, { color: "blue" }).addTo(this.map);
      },
  
      calculateArea() {
        if (this.path.length >= 3) {
          const closed = [...this.path, this.path[0]];
          const lngLat = closed.map(([lat, lng]) => [lng, lat]);
          const polygon = turf.polygon([lngLat]);
          this.area = turf.area(polygon);
        }
      },
  
      resetPath() {
        this.path = [];
        this.area = 0;
        localStorage.removeItem("active_path");
        localStorage.removeItem("active_area");
        if (this.pathLayer) {
          this.map.removeLayer(this.pathLayer);
          this.pathLayer = null;
        }
      },
  
      goToForm() {
        const polygonCoords = this.path.map(([lat, lng]) => [lng, lat]);
        localStorage.setItem("temp_polygon", JSON.stringify(polygonCoords));
        localStorage.setItem("temp_area", this.area.toFixed(2));
        this.$router.push("/lahan/form");
      },
  
      confirmBack() {
        if (this.path.length > 0) {
          this.confirmModal.show();
        } else {
          this.$router.back();
        }
      },
  
      exitTracking() {
        localStorage.removeItem("active_path");
        localStorage.removeItem("active_area");
        this.confirmModal.hide();
        this.$router.back();
      },
    },
  };
  </script>
  
  <style scoped>
  #map {
    border: 2px solid #ccc;
  }
  </style>
  