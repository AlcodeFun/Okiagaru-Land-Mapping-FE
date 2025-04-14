<template>
  <div class="container-fluid">
    <card-table tableName="Pemilik Lahan">
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
        class="layer-groups-table"
        @change="changeServer"
      >
        <template #aksi="slotProps">
          <div class="d-flex flex-column gap-1">
            <button class="btn btn-sm btn-info text-white" @click="editItem(slotProps.value)">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger text-white" @click="confirmDelete(slotProps.value)">
              <i class="fas fa-trash"></i>
            </button>
            <button class="btn btn-sm btn-secondary text-white" @click="goToLahan(slotProps.value)">
              <i class="fas fa-key"></i> {{ slotProps.value.total_lahan }}
            </button>
          </div>
        </template>

        <template #aktif="slotProps">
          <span v-if="slotProps.value.aktif === 'Ya'" class="badge bg-success">Aktif</span>
          <span v-else class="badge bg-danger">Tidak Aktif</span>
        </template>
      </vue3-datatable>
    </card-table>

    <!-- Modal Tambah -->
    <div class="modal fade" id="addModal" tabindex="-1" aria-hidden="true" ref="addModalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">Tambah Pemilik Lahan</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Tutup"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitAdd">
              <div class="mb-2">
                <label class="form-label">Username</label>
                <input type="text" v-model="addForm.username" class="form-control" required />
              </div>
              <div class="mb-2">
                <label class="form-label">Password</label>
                <input
                  ref="password"
                  type="password"
                  v-model="addForm.password"
                  class="form-control"
                  required
                  @input="validatePasswordConfirmation"
                />
              </div>
              <div class="mb-2">
                <label class="form-label">Konfirmasi Password</label>
                <input
                  ref="password_confirmation"
                  type="password"
                  v-model="addForm.password_confirmation"
                  class="form-control"
                  required
                  @input="validatePasswordConfirmation"
                />
              </div>
              <div class="mb-2">
                <label class="form-label">Nama</label>
                <input type="text" v-model="addForm.nama" class="form-control" required />
              </div>
              <div class="mb-2">
                <label class="form-label">Email</label>
                <input type="email" v-model="addForm.email" class="form-control" required />
              </div>
              <div class="mb-2">
                <label class="form-label">Telepon</label>
                <input type="text" v-model="addForm.telepon" class="form-control" required />
              </div>
              <div class="mb-2">
                <label class="form-label">Deskripsi</label>
                <textarea v-model="addForm.deskripsi" class="form-control" required></textarea>
              </div>
              <div class="mb-2">
                <label class="form-label">Foto</label>
                <input type="file" @change="onFotoChange" class="form-control" required />
              </div>
              <div class="text-end">
                <button type="submit" class="btn btn-success">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Konfirmasi Delete -->
    <div class="modal fade" id="deleteModal" tabindex="-1" aria-hidden="true" ref="deleteModalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">Konfirmasi Hapus</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Tutup"></button>
          </div>
          <div class="modal-body">
            Yakin ingin menghapus layer group
            <strong>{{ itemToDelete?.layer_groups }}</strong>?
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
            <button type="button" class="btn btn-danger" @click="deleteItem">Hapus</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Edit -->
    <div class="modal fade" id="editModal" tabindex="-1" aria-hidden="true" ref="editModalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-info text-white">
            <h5 class="modal-title">Edit Layer Group</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Tutup"></button>
          </div>
          <div class="modal-body">
            <form>
              <div class="mb-3">
                <label class="form-label">Nama Layer Group</label>
                <input type="text" v-model="editForm.layer_groups" class="form-control" />
              </div>
              <div class="mb-3">
                <label class="form-label">Deskripsi</label>
                <textarea v-model="editForm.deskripsi" class="form-control"></textarea>
              </div>
              <div class="form-check form-switch">
                <input type="checkbox" class="form-check-input" v-model="editForm.aktif" />
                <label class="form-check-label">Aktif</label>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
            <button type="button" class="btn btn-info" @click="submitEdit">Simpan</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from "axios";
import * as bootstrap from "bootstrap";
import SoftButton from "@/components/SoftButton";
import Vue3Datatable from "@bhplugin/vue3-datatable";
import "@bhplugin/vue3-datatable/dist/style.css";
import CardTable from "./components/CardTable";
import SoftAlert from "@/components/SoftAlert.vue";

export default {
  name: "Pemilik Lahan",
  components: {
    Vue3Datatable,
    CardTable,
    SoftAlert,
    SoftButton,
  },
  data() {
    return {
      rows: [],
      loading: true,
      total_rows: 0,
      params: {
        current_page: 1,
        pagesize: 10,
        sort_column: "id_layer_groups",
        sort_direction: "asc",
        search: "",
      },
      cols: [
        { field: "aksi", title: "Aksi", sort: false },
        { field: "aktif", title: "Aktif" },
        { field: "layer_groups", title: "Nama Pemilik" },
        { field: "username", title: "Username" },
        { field: "deskripsi", title: "Deskripsi" },
      ],
      alertMessage: "",
      alertColor: "success",
      itemToDelete: null,
      editForm: {
        id: null,
        layer_groups: "",
        deskripsi: "",
        aktif: false,
      },
      addForm: {
        username: "",
        password: "",
        password_confirmation: "",
        nama: "",
        email: "",
        telepon: "",
        deskripsi: "",
        foto: null,
      },
    };
  },
  methods: {
    async getLayerGroups() {
      this.loading = true;
      try {
        const response = await axios.get("/layer-groups", {
          params: {
            page: this.params.current_page,
            per_page: this.params.pagesize,
            search: this.params.search,
            sort_column: this.params.sort_column,
            sort_direction: this.params.sort_direction,
          },
        });

        const layer_groups = response.data.data;
        const meta = response.data.meta;



        this.rows = layer_groups.map((item) => ({
          id_layer_groups: item.id_layer_groups,
          layer_groups: item.layer_groups,
          deskripsi: item.deskripsi,
          aktif: item.aktif,
          username: item.username,
          total_lahan: item.total_lahan
        }));

        this.total_rows = meta.total;
      } catch (error) {
        console.error("Error fetching layer groups:", error);
      } finally {
        this.loading = false;
      }
    },
    goToLahan(item) {
  
      this.$router.push(`/lahan?id_layer_groups=${item.id_layer_groups}`);
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

      this.getLayerGroups();
    },
    onSearchInput() {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.params.search = this.searchInput;
        this.params.current_page = 1;
        this.getLayerGroups();
      }, 500);
    },

    hideAlert() {
      setTimeout(() => {
        this.alertMessage = "";
      }, 3000);
    },

    confirmDelete(item) {
      this.itemToDelete = item;
      const modal = new bootstrap.Modal(this.$refs.deleteModalRef);
      modal.show();
    },

    async deleteItem() {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`/layer-groups/${this.itemToDelete.id_layer_groups}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.alertColor = "success";
        this.alertMessage = "Data berhasil dihapus.";
        this.getLayerGroups();
        this.hideAlert();
        const modal = bootstrap.Modal.getInstance(this.$refs.deleteModalRef);
        modal.hide();
      } catch (error) {
        console.error("Gagal menghapus layer group:", error);
        this.alertColor = "danger";
        this.alertMessage = "Gagal menghapus data.";
      }
    },

    editItem(item) {
      this.editForm.id = item.id_layer_groups;
      this.editForm.layer_groups = item.layer_groups;
      this.editForm.deskripsi = item.deskripsi;
      this.editForm.aktif = item.aktif === "Ya";
      const modal = new bootstrap.Modal(this.$refs.editModalRef);
      modal.show();
    },

    async submitEdit() {
      const payload = {
        layer_groups: this.editForm.layer_groups,
        deskripsi: this.editForm.deskripsi,
        aktif: this.editForm.aktif ? "Ya" : "Tidak",
      };
      try {
        const token = localStorage.getItem("token");
        await axios.put(`/layer-groups/${this.editForm.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const modal = bootstrap.Modal.getInstance(this.$refs.editModalRef);
        modal.hide();
        document.activeElement.blur();
        this.alertColor = "success";
        this.alertMessage = "Data berhasil disimpan.";
        this.getLayerGroups();
        this.hideAlert();
      } catch (error) {
        console.error("Gagal menyimpan perubahan:", error);
        this.alertColor = "danger";
        this.alertMessage = "Gagal menyimpan data.";
      }
    },

    openAddModal() {
      const modal = new bootstrap.Modal(this.$refs.addModalRef);
      modal.show();
    },

    onFotoChange(event) {
      this.addForm.foto = event.target.files[0];
    },

    resetAddForm() {
      this.addForm = {
        username: "",
        password: "",
        password_confirmation: "",
        nama: "",
        email: "",
        telepon: "",
        deskripsi: "",
        foto: null,
      };
    },

    validatePasswordConfirmation() {
      const password = this.$refs.password;
      const confirmation = this.$refs.password_confirmation;
      if (password.value !== confirmation.value) {
        confirmation.setCustomValidity("Konfirmasi password tidak cocok");
      } else {
        confirmation.setCustomValidity("");
      }
    },

    async submitAdd() {
      const formData = new FormData();
      for (const key in this.addForm) {
        formData.append(key, this.addForm[key]);
      }

      try {
        const token = localStorage.getItem("token");
        await axios.post("/register-owner", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        this.alertColor = "success";
        this.alertMessage = "Pemilik berhasil ditambahkan.";
        this.getLayerGroups();
        this.resetAddForm();
        const modal = bootstrap.Modal.getInstance(this.$refs.addModalRef);
        modal.hide();
        this.hideAlert();
      } catch (error) {
        console.error("Gagal menambahkan pemilik:", error);
        this.alertColor = "danger";
        this.alertMessage = "Gagal menambahkan pemilik.";
      }
    },
  },
  mounted() {
    this.getLayerGroups();
  },
};
</script>

<style scoped>
.layer-groups-table .btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
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
