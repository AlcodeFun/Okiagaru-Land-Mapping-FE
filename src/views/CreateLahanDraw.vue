<template>
  <div class="container-fluid">
    <h4 class="mb-3">Buat Polygon Lahan - Metode: Draw Polygon</h4>

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
        @click="goToForm"
      >
        Lanjutkan ({{ area.toFixed(2) }} m²)
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
  name: "CreateLahanDraw",
  data() {
    return {
      map: null,
      drawnItems: null,
      polygonLayer: null,
      polygon: null,
      area: 0,
      baseLayers: {},
    };
  },
  mounted() {
    this.fetchBasemaps().then(() => {
      this.initMap();
    });
  },
  methods: {
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
    edit: { featureGroup: this.drawnItems },
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

  // Saat membuat polygon
  this.map.on(L.Draw.Event.CREATED, (e) => {
    try {
      if (this.polygonLayer) {
        this.drawnItems.removeLayer(this.polygonLayer);
      }

      this.polygonLayer = e.layer;
      this.drawnItems.addLayer(this.polygonLayer);
      this.updatePolygonData(this.polygonLayer);
    } catch (err) {
      console.warn("Kesalahan saat menggambar polygon:", err.message);
    }
  });

  // Saat mengedit polygon
  this.map.on(L.Draw.Event.EDITED, (e) => {
    const layers = e.layers;
    layers.eachLayer((layer) => {
      this.polygonLayer = layer;
      this.updatePolygonData(layer);
    });
  });

  // Saat menghapus polygon
  this.map.on(L.Draw.Event.DELETED, () => {
    this.polygonLayer = null;
    this.polygon = null;
    this.area = 0;
  });

  // Lokasi pengguna
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        this.map.setView([lat, lng], 18);

        const markerIcon = L.icon({
          iconUrl: "/marker-icon.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowUrl:
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
          shadowSize: [41, 41],
        });

        const marker = L.marker([lat, lng], {
          icon: markerIcon,
        }).addTo(this.map);
        marker.bindPopup("Lokasi Anda Sekarang").openPopup();
      },
      (err) => {
        console.warn("Gagal mendapatkan lokasi:", err.message);
      }
    );
  }
},

    updatePolygonData(layer) {
      const latLngs = layer.getLatLngs();

      if (
        !latLngs.length ||
        !Array.isArray(latLngs[0]) ||
        latLngs[0].length < 3
      ) {
        console.warn("Polygon tidak valid: minimal 3 titik.");
        return;
      }

      const coords = latLngs[0].map((latlng) => [latlng.lng, latlng.lat]);
      coords.push(coords[0]); // tutup polygon

      this.polygon = coords;

      const turfPolygon = turf.polygon([coords]);
      this.area = turf.area(turfPolygon);
    },

    goToForm() {
      localStorage.setItem("temp_polygon", JSON.stringify(this.polygon));
      localStorage.setItem("temp_area", this.area.toFixed(2));
      this.$router.push("/lahan/form");
    },
  },
};
</script>

<style scoped>
#map {
  border: 2px solid #ccc;
}
</style>
