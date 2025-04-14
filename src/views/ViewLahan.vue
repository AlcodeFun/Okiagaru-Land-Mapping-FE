<template>
  <div class="container-fluid">
    <div class="row">
      <!-- Map -->
      <div class="col-12 mb-4">
        <div id="map" style="height: 500px" class="rounded shadow"></div>
      </div>

      <!-- Informasi Lahan -->
      <div class="col-12">
        <h3 class="mb-0">Informasi Lahan</h3>
        <div class="card mb-4 mt-3">
          <div class="card-body table-responsive">
            <table class="table table-bordered mb-0">
              <tbody>
                <tr><th>Lahan</th><td>{{ lahan?.lahan }}</td></tr>
                <tr><th>Pemilik Lahan</th><td>{{ layerGroupName }}</td></tr>
                <tr><th>Deskripsi</th><td>{{ lahan?.deskripsi }}</td></tr>
                <tr><th>Luas</th><td>{{ lahan?.luas }} m²</td></tr>
                <tr><th>Latitude</th><td>{{ lahan?.lat }}</td></tr>
                <tr><th>Longitude</th><td>{{ lahan?.lon }}</td></tr>
                <tr><th>Desa</th><td>{{ lahan?.desa }}</td></tr>
                <tr><th>Kecamatan</th><td>{{ lahan?.kecamatan }}</td></tr>
                <tr><th>Kabupaten</th><td>{{ lahan?.kabupaten }}</td></tr>
                <tr><th>Provinsi</th><td>{{ lahan?.provinsi }}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Karakteristik Lahan -->
    <div class="row mt-4">
      <h3>Karakteristik Lahan</h3>

      <div v-if="loadingKarakteristik" class="col-12">
        <div class="card mb-3" v-for="n in 2" :key="n">
          <div class="card-body">
            <div class="placeholder-glow mb-2">
              <span class="placeholder col-4"></span>
            </div>
            <div class="placeholder-glow">
              <span class="placeholder col-6 me-2"></span>
              <span class="placeholder col-3"></span>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="Object.keys(groupedKarakteristik).length === 0" class="text-center mt-3">
        <img src="/empty-state-karakteristik.png" alt="Tidak ada data"
             style="min-width: 200px; max-width: 250px; height: auto" />
        <p class="mt-2 text-muted">Belum ada data karakteristik untuk lahan ini.</p>
      </div>

      <div v-else v-for="(group, kualitasId) in groupedKarakteristik"
           :key="kualitasId" class="col-12 mb-3">
        <div class="card">
          <div class="card-body">
            <h5 class="mb-0">{{ group.deskripsi }} ({{ group.kode }})</h5>
            <ul class="list-unstyled mb-0 mt-2">
              <li v-for="item in group.karakteristik"
                  :key="item.karakteristik_lahan">
                <strong>{{ item.karakteristik_lahan }}:</strong>
                {{ item.nilai }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default {
  name: "DetailLahanView",
  data() {
    return {
      lahan: null,
      layerGroupName: "",
      map: null,
      baseLayers: {},
      groupedKarakteristik: {},
      loadingKarakteristik: true,
    };
  },
  methods: {
    async fetchLahan() {
      const id = this.$route.params.id;
      const { data } = await axios.get(`/lahan/${id}`);
      this.lahan = data.data;

      await this.fetchLayerGroup();
      await this.fetchBasemaps();
      this.initMap();
      await this.fetchKarakteristik();
    },

    async fetchLayerGroup() {
      const { data } = await axios.get(
        `/layer-groups/${this.lahan.id_layer_groups}`
      );
      this.layerGroupName = data.data.layer_groups;
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
    },

    async fetchKarakteristik() {
      this.loadingKarakteristik = true;
      const id = this.$route.params.id;
      let angkaData = [];
      let pilihanData = [];

      try {
        const angkaRes = await axios.get(`/karakteristik-angka/lahan/${id}`);
        angkaData = angkaRes.data.data;
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error("Gagal ambil karakteristik angka:", err);
        }
      }

      try {
        const pilihanRes = await axios.get(
          `/karakteristik-pilihan/lahan/${id}`
        );
        pilihanData = pilihanRes.data.data;
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error("Gagal ambil karakteristik pilihan:", err);
        }
      }

      try {
        const kualitasRes = await axios.get("/kualitas-lahan");
        const kualitasMap = {};
        kualitasRes.data.data.forEach((k) => {
          kualitasMap[k.id_kualitas_lahan] = {
            deskripsi: k.deskripsi,
            kode: k.kualitas_lahan,
          };
        });

        const grouped = {};

        angkaData.forEach((item) => {
          const kualitasId = item.karakteristik.id_kualitas_lahan;
          if (!grouped[kualitasId]) {
            grouped[kualitasId] = {
              deskripsi: kualitasMap[kualitasId]?.deskripsi || "Tidak diketahui",
              kode: kualitasMap[kualitasId]?.kode || "-",
              karakteristik: [],
            };
          }
          grouped[kualitasId].karakteristik.push({
            karakteristik_lahan: item.karakteristik.karakteristik_lahan,
            nilai: item.nilai_angka,
          });
        });

        pilihanData.forEach((item) => {
          const kualitasId = item.karakteristik.id_kualitas_lahan;
          if (!grouped[kualitasId]) {
            grouped[kualitasId] = {
              deskripsi: kualitasMap[kualitasId]?.deskripsi || "Tidak diketahui",
              kode: kualitasMap[kualitasId]?.kode || "-",
              karakteristik: [],
            };
          }
          grouped[kualitasId].karakteristik.push({
            karakteristik_lahan: item.karakteristik.karakteristik_lahan,
            nilai: item.nilai_pilihan.pilihan,
          });
        });

        this.groupedKarakteristik = grouped;
      } catch (e) {
        console.error("Gagal memuat kualitas lahan:", e);
      } finally {
        this.loadingKarakteristik = false;
      }
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

      if (this.lahan.polygon?.type === "Polygon") {
        const coords = this.lahan.polygon.coordinates[0].map(([lng, lat]) => [
          lat,
          lng,
        ]);
        L.polygon(coords, { color: "blue" }).addTo(this.map);
        this.map.fitBounds(coords);
      } else if (this.lahan.polygon?.type === "Point") {
        const [lng, lat] = this.lahan.polygon.coordinates;
        L.marker([lat, lng]).addTo(this.map);
      }
    },
  },
  mounted() {
    this.fetchLahan();
  },
};
</script>

<style scoped>
#map {
  width: 100%;
  border: 1px solid #ccc;
}
img {
  opacity: 0.7;
}
.placeholder {
  display: inline-block;
  height: 1em;
  background-color: #dee2e6;
  border-radius: 0.2rem;
}
.placeholder-glow .placeholder {
  animation: placeholder-glow 1.5s infinite linear;
}
@keyframes placeholder-glow {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.2;
  }
  100% {
    opacity: 0.6;
  }
}
</style>
