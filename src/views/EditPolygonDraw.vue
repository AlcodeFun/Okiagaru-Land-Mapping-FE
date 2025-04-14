<template>
    <div class="container-fluid">
        <h4 class="mb-3">Edit Polygon Lahan - Metode: Draw Polygon</h4>
        <h5 class="mb-3">Nama Lahan: {{ lahanData?.lahan }}</h5> 
      <div
        id="map"
        class="mb-4"
        style="height: 500px; border-radius: 12px; overflow: hidden"
      ></div>
  
      <div class="d-flex justify-content-between">
        <button class="btn btn-secondary" @click="$router.back()">Kembali</button>
        <button
          class="btn btn-success"
          :disabled="!area || !polygon"
          @click="submitEdit"
        >
          Simpan Perubahan ({{ area.toFixed(2) }} m²)
        </button>
      </div>
    </div>
  </template>
    
    <script>
  import L from "leaflet";
  import "leaflet/dist/leaflet.css";
  import "leaflet-draw/dist/leaflet.draw.css";
  import "leaflet-draw";
  import * as turf from "@turf/turf";
  import axios from "axios";
  
  export default {
    name: "EditPolygonDraw",
    data() {
      return {
        map: null,
        drawnItems: null,
        polygonLayer: null,
        polygon: null,
        area: 0,
        baseLayers: {},
        lahanId: null,
        lahanData:[]
      };
    },
    mounted() {
      this.lahanId = this.$route.params.id;
      this.fetchBasemaps().then(() => {
        this.initMap();
        this.fetchLahanData();
      });
    },
    methods: {
      // Fetch basemap dari API
      async fetchBasemaps() {
        try {
          const { data } = await axios.get("/basemaps");
          const aktif = data.data.filter((b) => b.aktif === "Ya");
  
          aktif.forEach((b) => {
            let url = b.basemap;
            let subdomains;
  
            const match = url.match(/\{([a-z]\|)+[a-z]\}/i);
            if (match) {
              subdomains = match[0].replace(/[{}]/g, "").split("|");
              url = url.replace(match[0], "{s}");
            } else if (url.includes("{s}.google.com")) {
              subdomains = ["mt0", "mt1", "mt2", "mt3"];
            }
  
            const layerOptions = {
              attribution: b.judul,
              maxZoom: 20,
            };
            if (subdomains) layerOptions.subdomains = subdomains;
  
            this.baseLayers[b.judul] = L.tileLayer(url, layerOptions);
          });
        } catch (error) {
          console.error("Gagal fetch basemap:", error);
        }
      },
  
      // Fetch data lahan yang sudah ada untuk diedit
      async fetchLahanData() {
        try {
          const response = await axios.get(`/lahan/${this.lahanId}`);
          const lahan = response.data.data;

          this.lahanData= lahan
  
          
  
          if (lahan.polygon && lahan.polygon.coordinates) {
            // Jika ada polygon yang sudah ada, buat layer dan tampilkan di map
            this.polygon = lahan.polygon.coordinates[0]; // Ambil koordinat pertama dalam array
            this.area = lahan.luas;
  
            this.initMapWithExistingPolygon();
          }
        } catch (error) {
          console.error("Gagal mengambil data lahan:", error);
        }
      },
  
      // Inisialisasi peta
      initMap() {
        const defaultLayer =
          Object.values(this.baseLayers)[0] ||
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "OpenStreetMap",
          });
  
        const fallbackCenter = [-6.921, 107.604];
  
        this.map = L.map("map", {
          center: fallbackCenter,
          zoom: 17,
          layers: [defaultLayer],
        });
  
        L.control.layers(this.baseLayers).addTo(this.map);
  
        this.drawnItems = new L.FeatureGroup();
        this.map.addLayer(this.drawnItems);

        
  
        const drawControl = new L.Control.Draw({
            edit: false,
          draw: {
            polygon: true,
            rectangle: false,
            polyline: false,
            circle: false,
            marker: false,
            circlemarker: false,
          },
        });
  
        this.map.addControl(drawControl);
        
  
        this.map.on(L.Draw.Event.CREATED, (e) => {
          if (this.polygonLayer) {
            this.drawnItems.removeLayer(this.polygonLayer);
          }
  
          this.polygonLayer = e.layer;
          this.drawnItems.addLayer(this.polygonLayer);
          this.updatePolygonData(this.polygonLayer);
        });
  
        this.map.on(L.Draw.Event.EDITED, (e) => {
          const layers = e.layers;
          layers.eachLayer((layer) => {
            this.polygonLayer = layer;
            this.updatePolygonData(layer);
          });
        });
  
        this.map.on(L.Draw.Event.DELETED, () => {
          this.polygonLayer = null;
          this.polygon = null;
          this.area = 0;
  
          // Reactivate the draw control after clearing polygons
          this.map.addControl(drawControl);
        });
      },
  
      // Inisialisasi peta dengan polygon yang sudah ada
      initMapWithExistingPolygon() {
        // Check if the map already exists, if not, initialize it
        if (!this.map) {
          const defaultLayer =
            Object.values(this.baseLayers)[0] ||
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution: "OpenStreetMap",
            });
  
          this.map = L.map("map", {
            center: [this.polygon[0][1], this.polygon[0][0]], // Menyesuaikan center dengan polygon pertama
            zoom: 17,
            layers: [defaultLayer],
          });
  
          L.control.layers(this.baseLayers).addTo(this.map);
  
          this.drawnItems = new L.FeatureGroup();
          this.map.addLayer(this.drawnItems);
        } else {
          // If map exists, just update its view
          this.map.setView([this.polygon[0][1], this.polygon[0][0]], 17);
        }
  
        // Initialize the polygon on the map
        const coords = this.polygon.map(([lng, lat]) => [lat, lng]); // Mengubah urutan ke [lat, lng]
  
        if (this.polygonLayer) {
          this.map.removeLayer(this.polygonLayer); // Remove the old layer before adding the new one
        }
  
        this.polygonLayer = L.polygon(coords).addTo(this.map);
        this.drawnItems.addLayer(this.polygonLayer);
        this.updatePolygonData(this.polygonLayer);
      },
  
      // Update data polygon setelah pengeditan
      updatePolygonData(layer) {
        const latLngs = layer.getLatLngs();
        const coords = latLngs[0].map((latlng) => [latlng.lng, latlng.lat]);
        coords.push(coords[0]); // tutup polygon
  
        this.polygon = coords;
  
        const turfPolygon = turf.polygon([coords]);
        this.area = turf.area(turfPolygon);
      },
  
      // Submit perubahan polygon
      async submitEdit() {
        try {
          const response = await axios.put(
            `/lahan/${this.lahanId}`,
            {
              polygon: this.polygon,
              luas: this.area,
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
        } catch (error) {
          console.error("Gagal mengupdate polygon:", error);
        }
      },
    },
  };
  </script>
    
    <style scoped>
  #map {
    border: 2px solid #ccc;
  }
  </style>
    