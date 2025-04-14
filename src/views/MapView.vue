<template>
  <div class="d-flex vh-100">
    <!-- Sidebar -->

    <div class="col-3 bg-white shadow-sm p-3 overflow-auto">
      <div class="d-flex p-3">
        <h4>Land Mapping System</h4>
        <img style="max-width: 70px; height: auto" src="/favicon.png" alt="" />
      </div>

      <select class="form-select" aria-label="Default select example">
        <option selected>Pilih Land Manager</option>
        <option value="1">One</option>
        <option value="2">Two</option>
        <option value="3">Three</option>
      </select>

      <div class="mt-4">
        <h5>Daftar Lahan</h5>
        <div
          class="d-flex align-items-center p-2 border rounded shadow-sm mb-2"
        >
          <img
            src="/avatar1.png"
            class="rounded-circle me-2"
            width="40"
            height="40"
            alt="avatar"
          />
          <div>
            <p class="mb-0 fw-semibold">Mike Austin</p>
            <p class="text-muted small mb-0">Tsim Sha Tsui</p>
          </div>
          <span class="cursor-pointer ms-auto text-success fw-bold small">Lihat Lahan</span>
        </div>

       

        
       


      </div>
    </div>

    <!-- Map Area -->
    <div class="col-9 position-relative">
      <div class="position-absolute top-0 end-0 mt-3 me-3 d-flex gap-2">
        <button
          class="btn btn-primary btn- cursor-pointer"
          @click="$router.push('/sign-in')"
        >
          Sign In
        </button>
      </div>

      <div
        class="h-100 bg-light d-flex justify-content-center align-items-center"
      >
      <div id="map" class="rounded shadow"></div>
       
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
  data(){
    return{
      map: null,
      baseLayers: {},

    }
  },
  methods: {
    ...mapMutations(["toggleEveryDisplay", "toggleHideConfig"]),
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
    },
    initMap() {
      const center = [this.lahan.lat, this.lahan.lon];
      const defaultLayer = Object.values(this.baseLayers)[0];

      this.map = L.map("map", {
        center,
        zoom: 16,
        layers: [defaultLayer],
      });

      L.control.layers(this.baseLayers).addTo(this.map);

      if (this.lahan.polygon.type === "Polygon") {
        const coords = this.lahan.polygon.coordinates[0].map(([lng, lat]) => [
          lat,
          lng,
        ]);
        L.polygon(coords, { color: "blue" }).addTo(this.map);
        this.map.fitBounds(coords);
      } else if (this.lahan.polygon.type === "Point") {
        const [lng, lat] = this.lahan.polygon.coordinates;
        L.marker([lat, lng]).addTo(this.map);
      }
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
  mounted(){
    this.fetchBasemaps();
    this.initMap();
  }
};
</script>

<style>
</style>