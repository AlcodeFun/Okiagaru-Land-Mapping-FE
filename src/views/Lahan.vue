<template>
  <div class="container-fluid">
    <card-table tableName="Data Lahan">
      <SoftAlert
        v-if="alertMessage"
        :color="alertColor"
        icon="ni ni-check-bold"
        dismissible
      >
        {{ alertMessage }}
      </SoftAlert>

      <div
        class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-3"
      >
        <soft-button color="success" variant="solid" @click="openAddModal">
          + Tambah
        </soft-button>
        <input
          v-model="searchInput"
          type="text"
          placeholder="Cari data lahan..."
          class="form-control w-100 w-md-50"
          @input="onSearchInput"
        />
      </div>

      <vue3-datatable
        :rows="rows"
        :columns="cols"
        :loading="loading"
        :totalRows="total_rows"
        :isServerMode="true"
        :pageSize="params.pagesize"
        :search="params.search"
        :sortable="true"
        :sortColumn="params.sort_column"
        :sortDirection="params.sort_direction"
        class="lahan-table"
        @change="changeServer"
      >
        <template #aksi="slotProps">
          <div class="d-flex gap-2">
            <button
              class="btn btn-sm btn-info"
              @click="goToEditForm(slotProps.value)"
              title="Edit Data & Karakteristik"
            >
              <i style="font-size: 15px" class="fas fa-edit"></i>
            </button>
            <button
              class="btn btn-sm btn-success"
              @click="openEditModal(slotProps.value)"
              title="Edit Polygon"
            >
              <i style="font-size: 15px" class="fas fa-draw-polygon"></i>
            </button>

            <button
              class="btn btn-sm btn-secondary"
              @click="goToDetail(slotProps.value)"
              title="View Lahan"
            >
              <i style="font-size: 15px" class="fas fa-eye"></i>
            </button>
            <button
              class="btn btn-sm btn-danger"
              @click="confirmDelete(slotProps.value)"
              title="Delete Lahan"
            >
              <i style="font-size: 15px" class="fas fa-trash"></i>
            </button>
          </div>
        </template>

        <template #aktif="slotProps">
          <span v-if="slotProps.value.aktif === 'Ya'" class="badge bg-success"
            >Aktif</span
          >
          <span v-else class="badge bg-secondary">Tidak Aktif</span>
        </template>
      </vue3-datatable>
    </card-table>

    <!-- Modal Edit Polygon -->

    <!-- Modal Konfirmasi Hapus -->
    <div
      class="modal fade"
      id="deleteModal"
      tabindex="-1"
      aria-hidden="true"
      ref="deleteModalRef"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">Konfirmasi Hapus</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Tutup"
            ></button>
          </div>
          <div class="modal-body">
            Yakin ingin menghapus lahan dengan deskripsi
            <strong>{{ itemToDelete?.deskripsi }}</strong
            >?
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Batal
            </button>
            <button type="button" class="btn btn-danger" @click="deleteItem">
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Tambah -->
    <div
      class="modal fade"
      id="addModal"
      tabindex="-1"
      aria-hidden="true"
      ref="addModalRef"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title text-white">Tambah Data Lahan</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Tutup"
            ></button>
          </div>
          <div class="modal-body">
            <h5 class="text-center mb-3">Pilih Metode Pembuatan Polygon</h5>
            <div class="row g-3 text-center">
              <div class="col-12 col-md-4">
                <div
                  class="border rounded p-3 h-100 method-option"
                  :class="{ selected: selectedMethod === 'draw' }"
                  @click="selectMethod('draw')"
                >
                  <i class="fas fa-pencil-ruler fa-2x mb-2 text-info"></i>
                  <h6 class="fw-bold">Draw Polygon</h6>
                  <small class="text-muted"
                    >Gambarlah langsung di peta untuk menentukan area
                    lahan.</small
                  >
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div
                  class="border rounded p-3 h-100 method-option"
                  :class="{ selected: selectedMethod === 'realtime' }"
                  @click="selectMethod('realtime')"
                >
                  <i class="fas fa-route fa-2x mb-2 text-success"></i>
                  <h6 class="fw-bold">Realtime Tracking</h6>
                  <small class="text-muted"
                    >Gunakan GPS untuk merekam saat berjalan mengelilingi
                    lahan.</small
                  >
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div
                  class="border rounded p-3 h-100 method-option"
                  :class="{ selected: selectedMethod === 'manual' }"
                  @click="selectMethod('manual')"
                >
                  <i class="fas fa-map-marker-alt fa-2x mb-2 text-warning"></i>
                  <h6 class="fw-bold">Add GPS Point</h6>
                  <small class="text-muted"
                    >Tambahkan titik lokasi satu per satu dari posisi Anda saat
                    ini.</small
                  >
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Batal
            </button>
            <button
              type="button"
              class="btn btn-success"
              :disabled="!selectedMethod"
              @click="goToAddPage"
            >
              Lanjut
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Edit -->
    <div
      class="modal fade"
      id="editModal"
      tabindex="-1"
      aria-hidden="true"
      ref="editModalRef"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title text-white">Edit Polygon Lahan</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Tutup"
            ></button>
          </div>
          <div class="modal-body">
            <h5 class="text-center mb-3">Pilih Metode Edit Polygon</h5>
            <div class="row g-3 text-center">
              <div class="col-12 col-md-4">
                <div
                  class="border rounded p-3 h-100 method-option"
                  :class="{ selected: selectedEditMethod === 'draw' }"
                  @click="selectEditMethod('draw')"
                >
                  <i class="fas fa-pencil-ruler fa-2x mb-2 text-info"></i>
                  <h6 class="fw-bold">Draw Polygon</h6>
                  <small class="text-muted"
                    >Gambarlah langsung di peta untuk menentukan area
                    lahan.</small
                  >
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div
                  class="border rounded p-3 h-100 method-option"
                  :class="{ selected: selectedEditMethod === 'realtime' }"
                  @click="selectEditMethod('realtime')"
                >
                  <i class="fas fa-route fa-2x mb-2 text-success"></i>
                  <h6 class="fw-bold">Realtime Tracking</h6>
                  <small class="text-muted"
                    >Gunakan GPS untuk merekam saat berjalan mengelilingi
                    lahan.</small
                  >
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div
                  class="border rounded p-3 h-100 method-option"
                  :class="{ selected: selectedEditMethod === 'manual' }"
                  @click="selectEditMethod('manual')"
                >
                  <i class="fas fa-map-marker-alt fa-2x mb-2 text-warning"></i>
                  <h6 class="fw-bold">Add GPS Point</h6>
                  <small class="text-muted"
                    >Tambahkan titik lokasi satu per satu dari posisi Anda saat
                    ini.</small
                  >
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Batal
            </button>
            <button
              type="button"
              class="btn btn-success"
              :disabled="!selectedEditMethod"
              @click="goToEditPage"
            >
              Lanjut
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import * as bootstrap from "bootstrap";
import Vue3Datatable from "@bhplugin/vue3-datatable";
import "@bhplugin/vue3-datatable/dist/style.css";
import CardTable from "./components/CardTable";
import SoftAlert from "@/components/SoftAlert.vue";
import SoftButton from "@/components/SoftButton.vue";

export default {
  name: "LahanView",
  components: {
    Vue3Datatable,
    CardTable,
    SoftAlert,
    SoftButton,
  },
  data() {
    return {
      selectedMethod: null,
      selectedEditMethod: null,
      rows: [],
      loading: true,
      total_rows: 0,
      alertMessage: "",
      alertColor: "success",
      itemToDelete: null,
      itemToEdit: null,
      searchTimer: null,
      params: {
        current_page: 1,
        pagesize: 10,
        sort_column: "id_lahan",
        sort_direction: "asc",
        search: "",
      },
      cols: [
        { field: "aksi", title: "Aksi", sort: false },
        { field: "aktif", title: "Status" },
        { field: "nama_layer_group", title: "Pemilik" },
        { field: "lahan", title: "Nama Lahan" },
        { field: "desa", title: "Desa" },
        { field: "kecamatan", title: "Kecamatan" },
        { field: "kabupaten", title: "Kabupaten" },
        { field: "provinsi", title: "Provinsi" },
        { field: "deskripsi", title: "Deskripsi" },
        { field: "luas", title: "Luas" },
      ],
    };
  },
  methods: {
    async getLahan() {
      this.loading = true;
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get("/lahan", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page: this.params.current_page,
            per_page: this.params.pagesize,
            search: this.params.search,
            sort_column: this.params.sort_column,
            sort_direction: this.params.sort_direction,
            // Ambil dari query string route seperti ?id_layer_groups=1
            id_layer_groups: this.$route.query.id_layer_groups || undefined,
          },
        });

        const lahans = response.data.data;
        const meta = response.data.meta;

        const layerGroupIds = [
          ...new Set(lahans.map((l) => l.id_layer_groups)),
        ];
        const layerGroupMap = {};

        await Promise.all(
          layerGroupIds.map(async (id) => {
            const { data } = await axios.get(`/layer-groups/${id}`);
            layerGroupMap[id] = data.data.layer_groups;
          })
        );

        this.rows = lahans.map((item) => ({
          ...item,
          nama_layer_group: layerGroupMap[item.id_layer_groups] || "-",
        }));

        this.total_rows = meta.total;
      } catch (error) {
        console.error("Gagal mengambil data lahan:", error);
      } finally {
        this.loading = false;
      }
    },

    changeServer(data) {
      this.params.current_page = data.current_page;
      this.params.pagesize = data.pagesize;
      this.params.search = data.search;

      // Cek dan simpan perubahan sorting jika ada
      if (data.sort_column) {
        this.params.sort_column = data.sort_column;
        this.params.sort_direction = data.sort_direction;
      }

      this.getLahan();
    },

    onSearchInput() {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.params.search = this.searchInput;
        this.params.current_page = 1;
        this.getLahan();
      }, 500);
    },
    goToDetail(item) {
      this.$router.push(`/lahan/${item.id_lahan}`);
    },
    confirmDelete(item) {
      this.itemToDelete = item;
      const modal = new bootstrap.Modal(this.$refs.deleteModalRef);
      modal.show();
    },
    selectMethod(method) {
      this.selectedMethod = method;
    },
    selectEditMethod(method) {
      this.selectedEditMethod = method;
    },
    openEditModal(item) {
      this.selectedEditMethod = null;
      this.itemToEdit = item;
      const modal = new bootstrap.Modal(this.$refs.editModalRef);
      modal.show();
    },
    goToEditPage() {
      if (!this.selectedEditMethod) return;
      localStorage.setItem("selectedEditMethod", this.selectedEditMethod);

      const routes = {
        draw: `/lahan/edit-draw/${this.itemToEdit.id_lahan}`,
        realtime: `/lahan/edit-realtime/${this.itemToEdit.id_lahan}`,
        manual: `/lahan/edit-manual/${this.itemToEdit.id_lahan}`,
      };

      const modal = bootstrap.Modal.getInstance(this.$refs.editModalRef);
      modal.hide();
      this.$router.push(routes[this.selectedEditMethod]);
    },
    goToAddPage() {
      if (!this.selectedMethod) return;
      localStorage.setItem("selectedMethod", this.selectedMethod);

      const routes = {
        draw: "/lahan/create-draw",
        realtime: "/lahan/create-realtime",
        manual: "/lahan/create-manual",
      };

      const modal = bootstrap.Modal.getInstance(this.$refs.addModalRef);
      modal.hide();
      this.$router.push(routes[this.selectedMethod]);
    },

    async deleteItem() {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`/lahan/${this.itemToDelete.id_lahan}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.alertColor = "success";
        this.alertMessage = "Data berhasil dihapus.";
        this.getLahan();
        const modal = bootstrap.Modal.getInstance(this.$refs.deleteModalRef);
        modal.hide();
        setTimeout(() => (this.alertMessage = ""), 3000);
      } catch (error) {
        this.alertColor = "danger";
        this.alertMessage = "Gagal menghapus data.";
        console.error("Gagal menghapus lahan:", error);
      }
    },
    openAddModal() {
      this.selectedMethod = null;
      const modal = new bootstrap.Modal(this.$refs.addModalRef);
      modal.show();
    },
    submitAdd() {},
    goToEditForm(item) {
      this.$router.push(`/lahan/form/edit/${item.id_lahan}`);
    },
  },
  mounted() {
    this.getLahan();

    const successMessage = this.$route.query.success;
    if (successMessage) {
      this.alertMessage = successMessage;
      this.alertColor = "success";
      setTimeout(() => {
        this.alertMessage = "";
        this.$router.replace({ query: null });
      }, 3000);
    }

    const modalEl = this.$refs.addModalRef;
    if (modalEl) {
      modalEl.addEventListener("hidden.bs.modal", () => {
        this.selectedMethod = null;
      });
    }
  },
};
</script>

<style scoped>
.lahan-table .btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.method-option {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.method-option:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.method-option.selected {
  border: 2px solid #198754;
  background-color: #e8f5e9;
}
::v-deep .bh-pagination .bh-page-item.bh-active {
  background-color: chartreuse !important;
  border: 1px chartreuse !important;
  color: white !important;
  font-weight: bold;
}
::v-deep .bh-text-primary {
  color: chartreuse !important;
}
</style>
