<template>
  <div class="container-fluid position-relative">
    <!-- Overlay loading -->
    <div
      v-if="loading"
      class="overlay-loading d-flex justify-content-center align-items-center"
    >
      <div class="spinner-border text-success" role="status"></div>
    </div>

    <!-- Spinner saat memuat data lahan -->
<div
  v-if="initialLoading"
  class="overlay-loading d-flex flex-column justify-content-center align-items-center text-center"
>
  <div class="spinner-border text-success mb-3" role="status"></div>
  <strong>Memuat Data Lahan...</strong>
</div>

    <!-- Form content -->
    <h4 class="mb-3">Form Data Lahan</h4>
    <form @submit.prevent="submitForm" class="card p-4" :class="{ 'opacity-50': loading || initialLoading }">


      <div class="row g-3">
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
            disabled
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
  :value="nilaiAngka[kar.id_karakteristik_lahan]?.nilai || ''"
  @input="onInputAngka($event, kar.id_karakteristik_lahan)"
  placeholder="Masukkan nilai"
/>


<select
  v-else
  class="form-select"
  :value="nilaiPilihan[kar.id_karakteristik_lahan]?.id_nilai_pilihan || ''"
  @change="onInputPilihan($event, kar.id_karakteristik_lahan)"
>
  <option value="" disabled>Pilih</option>
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
    Simpan Perubahan
  </button>
</div>
<div class="d-flex justify-content-end mt-2" v-if="loading">
  <div class="spinner-border text-success" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>
</div>

    </form>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "LahanEdit",
  data() {
    return {
      initialLoading: true,
      loading: false,
      isAdmin: localStorage.getItem("role") === "Administrator",
      form: {
        lahan: "",
        id_desa: "",
        deskripsi: "",
        luas: 0,
        aktif: "Ya",
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
      nilaiAngkaAwal: {},
nilaiPilihanAwal: {},

    };
  },
  async mounted() {
  try {
    this.fetchProvinsi();
    if (this.isAdmin) await this.fetchLayerGroups();
    await this.fetchKarakteristik();
    await this.fetchDataLahan();
  } catch (err) {
    console.error("Gagal memuat data:", err);
    alert("Gagal memuat data awal. Silakan refresh halaman.");
  } finally {
    this.initialLoading = false;
  }
},
  methods: {
    onInputAngka(event, idKar) {
  const value = event.target.value;
  if (!this.nilaiAngka[idKar]) {
    this.nilaiAngka[idKar] = { nilai: null, id_record: null };
  }
  this.nilaiAngka[idKar].nilai = value === '' ? null : Number(value);
},

onInputPilihan(event, idKar) {
  const value = event.target.value;
  if (!this.nilaiPilihan[idKar]) {
    this.nilaiPilihan[idKar] = { id_nilai_pilihan: null, id_record: null };
  }
  this.nilaiPilihan[idKar].id_nilai_pilihan = value === '' ? null : value;
},
async fetchDataLahan() {
  const id = this.$route.params.id;
  const { data } = await axios.get(`/lahan/${id}`);
  const lahan = data.data;

  this.form = {
    lahan: lahan.lahan,
    id_desa: lahan.id_desa,
    deskripsi: lahan.deskripsi,
    luas: lahan.luas,
    aktif: lahan.aktif,
    id_layer_groups: lahan.id_layer_groups,
  };

  this.selected.provinsi = lahan.id_provinsi;
  this.selected.kabupaten = lahan.id_kabupaten;
  this.selected.kecamatan = lahan.id_kecamatan;

  await this.fetchWilayahAwal(
    lahan.id_provinsi,
    lahan.id_kabupaten,
    lahan.id_kecamatan
  );

  const angka = await axios.get(`/karakteristik-angka/lahan/${id}`);
  angka.data.data.forEach((item) => {
    const idKar = item.id_karakteristik_lahan;
    this.nilaiAngka[idKar] = {
      nilai: item.nilai_angka,
      id_record: item.id_karakteristik_angka,
    };
    this.nilaiAngkaAwal[idKar] = item.nilai_angka;
  });

  const pilihan = await axios.get(`/karakteristik-pilihan/lahan/${id}`);
  pilihan.data.data.forEach((item) => {
    const idKar = item.id_karakteristik_lahan;
    this.nilaiPilihan[idKar] = {
      id_nilai_pilihan: item.id_nilai_pilihan,
      id_record: item.id_karakteristik_pilihan,
    };
    this.nilaiPilihanAwal[idKar] = item.id_nilai_pilihan;
  });
},
    async fetchProvinsi() {
      const { data } = await axios.get("/provinsi");
      this.provinsi = data.data;
    },
    async fetchLayerGroups() {
      const { data } = await axios.get("/layer-groups");
      this.layerGroups = data.data;
    },
    async fetchKarakteristik() {
      const res = await axios.get("/kualitas-lahan");
      this.karakteristik = res.data.data;

      for (const group of this.karakteristik) {
        for (const kar of group.karakteristik) {
          if (kar.jenis_nilai === "Pilihan") {
            const pilihanRes = await axios.get(
              `/nilai-pilihan/karakteristik/${kar.id_karakteristik_lahan}`
            );
            this.pilihanMap[kar.id_karakteristik_lahan] = pilihanRes.data.data;
          }
        }
      }
    },
    async fetchWilayahAwal(provId, kabId, kecId) {
      await this.getKabupatenInit(provId);
      await this.getKecamatanInit(kabId);
      await this.getDesaInit(kecId);
    },
    async getKabupatenInit(provId) {
      const { data } = await axios.get(`/kabupaten/${provId}`);
      this.kabupaten = data.data;
    },
    async getKecamatanInit(kabId) {
      const { data } = await axios.get(`/kecamatan/${kabId}`);
      this.kecamatan = data.data;
    },
    async getDesaInit(kecId) {
      const { data } = await axios.get(`/desa/${kecId}`);
      this.desa = data.data;
    },
    async getKabupaten() {
      this.kabupaten = [];
      this.kecamatan = [];
      this.desa = [];
      this.selected.kabupaten = "";
      this.selected.kecamatan = "";
      this.form.id_desa = "";

      const { data } = await axios.get(`/kabupaten/${this.selected.provinsi}`);
      this.kabupaten = data.data;
    },
    async getKecamatan() {
      this.kecamatan = [];
      this.desa = [];
      this.selected.kecamatan = "";
      this.form.id_desa = "";

      const { data } = await axios.get(`/kecamatan/${this.selected.kabupaten}`);
      this.kecamatan = data.data;
    },
    async getDesa() {
      this.desa = [];
      this.form.id_desa = "";

      const { data } = await axios.get(`/desa/${this.selected.kecamatan}`);
      this.desa = data.data;
    },
    async submitForm() {
  this.loading = true;
  const id = this.$route.params.id;
  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  try {
    const payload = { ...this.form };
    delete payload.polygon;
    delete payload.luas;

    await axios.put(`/lahan/${id}`, payload, { headers });

    const promises = [];

    // Karakteristik Angka
    for (const [idKar, obj] of Object.entries(this.nilaiAngka)) {
      const val = obj.nilai;
      const idRecord = obj.id_record;
      const awal = this.nilaiAngkaAwal[idKar];

      if (val === null || val === '' || isNaN(val)) {
        if (idRecord) {
          promises.push(axios.delete(`/karakteristik-angka/${idRecord}`, { headers }));
        }
      } else if (val !== awal) {
        if (idRecord) {
          promises.push(
            axios.put(`/karakteristik-angka/${idRecord}`, { nilai_angka: val }, { headers })
          );
        } else {
          promises.push(
            axios.post(
              `/karakteristik-angka`,
              {
                id_lahan: id,
                id_karakteristik_lahan: idKar,
                nilai_angka: val,
              },
              { headers }
            )
          );
        }
      }
    }

    // Karakteristik Pilihan
    for (const [idKar, obj] of Object.entries(this.nilaiPilihan)) {
      const idPilihan = obj.id_nilai_pilihan;
      const idRecord = obj.id_record;
      const awal = this.nilaiPilihanAwal[idKar];

      if (!idPilihan) {
        if (idRecord) {
          promises.push(axios.delete(`/karakteristik-pilihan/${idRecord}`, { headers }));
        }
      } else if (idPilihan !== awal) {
        if (idRecord) {
          promises.push(
            axios.put(
              `/karakteristik-pilihan/${idRecord}`,
              { id_nilai_pilihan: idPilihan },
              { headers }
            )
          );
        } else {
          promises.push(
            axios.post(
              `/karakteristik-pilihan`,
              {
                id_lahan: id,
                id_karakteristik_lahan: idKar,
                id_nilai_pilihan: idPilihan,
              },
              { headers }
            )
          );
        }
      }
    }

    await Promise.all(promises);
    this.$router.push({ path: "/lahan", query: { success: "Data lahan berhasil diperbarui!" } });
  } catch (err) {
    console.error("Gagal update:", err);
    alert("Gagal memperbarui data.");
  } finally {
    this.loading = false;
  }
}



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
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(1px);
}


</style>
