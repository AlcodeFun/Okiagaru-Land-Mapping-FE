<template>
  <div>
    <card-table tableName="Daftar Karakteristik Lahan">
      <div class="container" style="width: 100%">
        <ul class="list-group bg-transparent border-0">
          <!-- Loop setiap kualitas -->
          <li
            v-for="(group, index) in listGroups"
            :key="group.id_kualitas_lahan"
            class="list-group-item group-title"
          >
            <div
              class="d-flex justify-content-between align-items-center"
              @click="toggleExpand(index)"
              style="cursor: pointer"
            >
              <span class="list-group-item-text">{{ group.deskripsi }}</span>
              <i
                :class="[
                  'chevron-icon',
                  'fa',
                  expandedIndex === index ? 'fa-chevron-down' : 'fa-chevron-right'
                ]"
              ></i>
            </div>

            <!-- Karakteristik (sub-item) -->
            <transition-group name="fade-slide" tag="div">
              <li
                v-for="kar in expandedIndex === index ? group.karakteristik : []"
                :key="kar.id_karakteristik_lahan"
                class="list-group-item sub-item"
              >
                <div class="d-flex justify-content-between w-100">
                  <span class="list-group-item-text">{{ kar.karakteristik_lahan }}</span>
                  <span class="badge bg-success">{{ kar.jenis_nilai }}</span>
                </div>

                <!-- Jika jenis_nilai adalah Pilihan, tampilkan daftarnya -->
                <ul v-if="kar.jenis_nilai === 'Pilihan' && pilihanMap[kar.id_karakteristik_lahan]">
                  <li
                    v-for="pilihan in pilihanMap[kar.id_karakteristik_lahan]"
                    :key="pilihan.id_nilai_pilihan"
                    class="sub-pilihan"
                  >
                    {{ pilihan.pilihan }}
                  </li>
                </ul>
              </li>
            </transition-group>
          </li>
        </ul>
      </div>
    </card-table>
  </div>
</template>

<script>
import axios from "axios";
import CardTable from "./components/CardTable";

export default {
  components: { CardTable },
  data() {
    return {
      listGroups: [],
      expandedIndex: null,
      pilihanMap: {}, 
    };
  },
  methods: {
    toggleExpand(index) {
      this.expandedIndex = this.expandedIndex === index ? null : index;
    },
    async fetchData() {
      try {
        const res = await axios.get("/kualitas-lahan");
        this.listGroups = res.data.data;

        // Untuk setiap karakteristik bernilai "Pilihan", fetch daftarnya
        for (const group of this.listGroups) {
          for (const kar of group.karakteristik) {
            if (kar.jenis_nilai === "Pilihan") {
              this.fetchPilihan(kar.id_karakteristik_lahan);
            }
          }
        }
      } catch (error) {
        console.error("Gagal fetch kualitas lahan:", error);
      }
    },
    async fetchPilihan(id) {
      try {
        const res = await axios.get(`/nilai-pilihan/karakteristik/${id}`);
        // ✅ Gunakan assignment langsung untuk Vue 3
        this.pilihanMap[id] = res.data.data;
      } catch (error) {
        console.error(`Gagal fetch nilai pilihan untuk karakteristik ${id}:`, error);
      }
    },
  },
  mounted() {
    this.fetchData();
  },
};
</script>

<style scoped>
.group-title {
  background-color: #ffffff;
  border-radius: 10px;
  margin-bottom: 0.5rem;
  padding: 1rem 1.25rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.sub-item {
  background-color: #e6f4ea;
  border-left: 6px solid #4caf50;
  border-radius: 10px;
  margin: 0.3rem 0;
  padding: 0.75rem 1.25rem;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
}

.sub-pilihan {
  padding: 0.25rem 0 0.25rem 1rem;
  font-size: 14px;
  color: #2e7d32;
}

.list-group-item-text {
  font-weight: 600;
  color: #343a40;
  font-size: 18px;
}

.chevron-icon {
  font-size: 1.2rem;
  color: #4caf50;
  transition: transform 0.3s ease;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
