<template>
  <div class="container-fluid position-relative">
    <!-- Overlay loading -->
    <div
      v-if="loading"
      class="overlay-loading d-flex justify-content-center align-items-center"
    >
      <div class="spinner-border text-success" role="status"></div>
    </div>

   

    <h4 class="mb-3">Form Data Lahan</h4>
    <form @submit.prevent="submitForm" class="card p-4">
      <div class="row g-3">
        <!-- Admin: pilih layer group -->
        <div v-if="isAdmin" class="col-md-12">
          <label class="form-label">Pilih Layer Group</label>
          <select v-model="form.id_layer_groups" class="form-select" required>
            <option value="" disabled selected>Pilih Layer Group</option>
            <option
              v-for="lg in layerGroups"
              :key="lg.id_layer_groups"
              :value="lg.id_layer_groups"
            >
              {{ lg.layer_groups }}
            </option>
          </select>
        </div>

        <div class="col-md-6">
          <label class="form-label">Nama Lahan</label>
          <input
            type="text"
            v-model="form.lahan"
            class="form-control"
            required
          />
        </div>

        <div class="col-md-6">
          <label class="form-label">Deskripsi</label>
          <input
            type="text"
            v-model="form.deskripsi"
            class="form-control"
            required
          />
        </div>

        <div class="col-md-6">
          <label class="form-label">Provinsi</label>
          <select
            class="form-select"
            v-model="selected.provinsi"
            @change="getKabupaten"
            required
          >
            <option value="" disabled selected>Pilih Provinsi</option>
            <option
              v-for="item in provinsi"
              :key="item.id_provinsi"
              :value="item.id_provinsi"
            >
              {{ item.provinsi }}
            </option>
          </select>
        </div>

        <div class="col-md-6">
          <label class="form-label">Kabupaten</label>
          <select
            class="form-select"
            v-model="selected.kabupaten"
            @change="getKecamatan"
            :disabled="!selected.provinsi"
            required
          >
            <option value="" disabled selected>Pilih Kabupaten</option>
            <option
              v-for="item in kabupaten"
              :key="item.id_kabupaten"
              :value="item.id_kabupaten"
            >
              {{ item.kabupaten }}
            </option>
          </select>
        </div>

        <div class="col-md-6">
          <label class="form-label">Kecamatan</label>
          <select
            class="form-select"
            v-model="selected.kecamatan"
            @change="getDesa"
            :disabled="!selected.kabupaten"
            required
          >
            <option value="" disabled selected>Pilih Kecamatan</option>
            <option
              v-for="item in kecamatan"
              :key="item.id_kecamatan"
              :value="item.id_kecamatan"
            >
              {{ item.kecamatan }}
            </option>
          </select>
        </div>

        <div class="col-md-6">
          <label class="form-label">Desa</label>
          <select
            class="form-select"
            v-model="form.id_desa"
            :disabled="!selected.kecamatan"
            required
          >
            <option value="" disabled selected>Pilih Desa</option>
            <option
              v-for="item in desa"
              :key="item.id_desa"
              :value="item.id_desa"
            >
              {{ item.desa }}
            </option>
          </select>
        </div>

        <div class="col-md-6">
          <label class="form-label">Luas Lahan (m²)</label>
          <input
            type="number"
            class="form-control"
            v-model="form.luas"
            readonly
          />
        </div>

        <div class="col-md-6">
          <label class="form-label">Status Aktif</label>
          <select class="form-select" v-model="form.aktif">
            <option value="Ya">Ya</option>
            <option value="Tidak">Tidak</option>
          </select>
        </div>
      </div>

      <!-- 🔽 Form Karakteristik -->
      <hr class="my-4" />
      <h5>Input Karakteristik Lahan</h5>
      <div
        v-for="group in karakteristik"
        :key="group.id_kualitas_lahan"
        class="mb-3"
      >
        <h6>{{ group.deskripsi }}</h6>
        <div
          v-for="kar in group.karakteristik"
          :key="kar.id_karakteristik_lahan"
          class="mb-2"
        >
          <label class="form-label">{{ kar.karakteristik_lahan }}</label>

          <input
            v-if="kar.jenis_nilai === 'Angka'"
            type="number"
            class="form-control"
            v-model.number="nilaiAngka[kar.id_karakteristik_lahan]"
            placeholder="Masukkan nilai"
          />

          <select
            v-else
            class="form-select"
            v-model="nilaiPilihan[kar.id_karakteristik_lahan]"
          >
            <option value="" disabled selected>Pilih</option>
            <option
              v-for="pilihan in pilihanMap[kar.id_karakteristik_lahan]"
              :key="pilihan.id_nilai_pilihan"
              :value="pilihan.id_nilai_pilihan"
            >
              {{ pilihan.pilihan }}
            </option>
          </select>
        </div>
      </div>

      <div class="d-flex justify-content-end mt-4">
        <button type="submit" class="btn btn-success" :disabled="loading">
          Simpan Lahan
        </button>
      </div>
    </form>
  </div>
</template>
  
  <script>
import axios from "axios";


export default {
  name: "LahanForm",
  data() {
    return {
      loading: false,
      isAdmin: localStorage.getItem("role") === "Administrator",
      form: {
        lahan: "",
        id_desa: "",
        deskripsi: "",
        luas: 0,
        aktif: "Ya",
        polygon: [],
        id_layer_groups: "",
      },
      selected: {
        provinsi: "",
        kabupaten: "",
        kecamatan: "",
      },
      provinsi: [],
      kabupaten: [],
      kecamatan: [],
      desa: [],
      layerGroups: [],
      karakteristik: [],
      nilaiAngka: {},
      nilaiPilihan: {},
      pilihanMap: {},
    };
  },
  methods: {
    async fetchInitialData() {
      this.form.polygon = JSON.parse(
        localStorage.getItem("temp_polygon") || "[]"
      );
      this.form.luas = parseFloat(localStorage.getItem("temp_area") || 0);

      if (this.isAdmin) {
        const { data } = await axios.get("/layer-groups");
        this.layerGroups = data.data;
      }

      const { data } = await axios.get("/provinsi");
      this.provinsi = data.data;
    },
    async fetchKarakteristik() {
      try {
        const res = await axios.get("/kualitas-lahan");
        this.karakteristik = res.data.data;

        for (const group of this.karakteristik) {
          for (const kar of group.karakteristik) {
            if (kar.jenis_nilai === "Pilihan") {
              const pilihanRes = await axios.get(
                `/nilai-pilihan/karakteristik/${kar.id_karakteristik_lahan}`
              );
              this.pilihanMap[kar.id_karakteristik_lahan] =
                pilihanRes.data.data;
            }
          }
        }
      } catch (error) {
        console.error("Gagal fetch karakteristik:", error);
      }
    },
    async getKabupaten() {
      this.kabupaten = [];
      this.kecamatan = [];
      this.desa = [];
      const { data } = await axios.get(`/kabupaten/${this.selected.provinsi}`);
      this.kabupaten = data.data;
    },
    async getKecamatan() {
      this.kecamatan = [];
      this.desa = [];
      const { data } = await axios.get(`/kecamatan/${this.selected.kabupaten}`);
      this.kecamatan = data.data;
    },
    async getDesa() {
      this.desa = [];
      const { data } = await axios.get(`/desa/${this.selected.kecamatan}`);
      this.desa = data.data;
    },
    async submitForm() {
  const token = localStorage.getItem("token");
  const payload = { ...this.form };
  this.loading = true;

  try {
    // Simpan data lahan
    const res = await axios.post("/lahan", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const idLahan = res.data.data.id_lahan;
    const promises = [];
    localStorage.removeItem("active_path");
    localStorage.removeItem("active_area");

    // Simpan karakteristik angka
    for (const [idKar, nilai] of Object.entries(this.nilaiAngka)) {
      if (nilai !== null && nilai !== "") {
        promises.push(
          axios.post("/karakteristik-angka", {
            id_lahan: idLahan,
            id_karakteristik_lahan: idKar,
            nilai_angka: nilai,
          }, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );
      }
    }

    // Simpan karakteristik pilihan
    for (const [idKar, idPilihan] of Object.entries(this.nilaiPilihan)) {
      if (idPilihan) {
        promises.push(
          axios.post("/karakteristik-pilihan", {
            id_lahan: idLahan,
            id_karakteristik_lahan: idKar,
            id_nilai_pilihan: idPilihan,
          }, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );
      }
    }

    // Tunggu semua karakteristik selesai disimpan
    await Promise.all(promises);
  
          this.$router.push({
            path: "/lahan",
            query: { success: "Data berhasil disimpan!" },
          });
        } catch (err) {
          console.error("Gagal simpan:", err);
          alert("Gagal menyimpan data. Silakan coba lagi.");
        } finally {
          this.loading = false;
        }
},
  },
  mounted() {
    this.fetchInitialData();
    this.fetchKarakteristik();
  },
};
</script>
  
  <style scoped>
select,
input {
  border-radius: 8px;
}

.overlay-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.7);
}
</style>
  