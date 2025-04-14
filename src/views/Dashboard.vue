<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <!-- Statistik -->
      <div class="col-xl-6 col-sm-6 mb-xl-0 mb-4" v-if="isAdmin">
        <mini-statistics-card
          title="Pemilik Lahan"
          :value="dashboardData?.total_layer_groups || 0"
          :icon="{
            component: 'ni ni-briefcase-24',
            background: iconBackground,
          }"
          direction-reverse
        />
      </div>
      <div class="col-xl-6 col-sm-6 mb-xl-0 mb-4">
        <mini-statistics-card
          title="Lahan"
          :value="dashboardData?.total_lahan || 0"
          :icon="{ component: 'ni ni-square-pin', background: iconBackground }"
          direction-reverse
        />
      </div>
      <div class="col-xl-6 col-sm-6 mb-xl-0 mb-4">
        <mini-statistics-card
          title="Karakteristik Lahan"
          :value="dashboardData?.total_karakteristik_lahan || 0"
          :icon="{ component: 'ni ni-books', background: iconBackground }"
          direction-reverse
        />
      </div>
      <div class="col-xl-6 col-sm-6 mb-xl-0 mb-4">
        <mini-statistics-card
          title="Basemaps"
          :value="dashboardData?.total_basemaps || 0"
          :icon="{ component: 'ni ni-map-big', background: iconBackground }"
          direction-reverse
        />
      </div>
    </div>

    <div class="mt-2 row">
      <!-- Pemilik Lahan Terbaru -->
      <div class="mt-2 col-12 col-md-6 col-xl-6" v-if="isAdmin && notNull">
        <div class="card h-100">
          <div class="p-3 pb-0 card-header">
            <h6 class="mb-0">Pemilik Lahan Terbaru</h6>
          </div>
          <div class="p-3 card-body">
            <ul class="list-group">
              <li
                v-for="layer_group in dashboardData?.layer_groups_terbaru || []"
                :key="layer_group.id_layer_groups"
                class="px-0 mb-2 border-0 list-group-item d-flex align-items-center"
              >
                <soft-avatar
                  class="me-3"
                  :img="layer_group?.pengguna?.foto || defaultAvatar"
                  alt="Pemilik Lahan"
                  border-radius="lg"
                  shadow="regular"
                />
                <div class="d-flex flex-column justify-content-center">
                  <h6 class="mb-0 text-sm">{{ layer_group.layer_groups }}</h6>
                  <p class="mb-0 text-xs">
                    {{ layer_group?.pengguna?.telepon || "No description" }}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Lahan Terbaru - Admin -->
      <div class="mt-2 col-12 col-xl-12" v-else>
        <div class="card h-100">
          <div class="p-3 pb-0 card-header">
            <h6 class="mb-0">Lahan Terbaru</h6>
          </div>
          <div class="p-3 card-body">
            <!-- Menampilkan lahan terbaru jika ada, jika tidak tampilkan teks -->
            <ul class="list-group">
              <li
                v-for="lahan in dashboardData?.lahan_terbaru || []"
                :key="lahan.id_lahan"
                class="px-0 mb-2 border-0 list-group-item d-flex align-items-center"
              >
                <div class="d-flex flex-column justify-content-center">
                  <h6 class="mb-0 text-sm">{{ lahan.lahan }}</h6>
                  <soft-badge variant="gradient" color="success" size="lg">{{
                    lahan.layer_group?.layer_groups || "-"
                  }}</soft-badge>
                </div>
                <a
                  class="mb-0 btn btn-link pe-3 ps-0 ms-auto"
                  :href="`/lahan/${lahan.id_lahan}`"
                  >Detail</a
                >
              </li> 
              
               <div  v-if="dashboardData?.lahan_terbaru.length === 0" class="d-flex flex-column justify-content-center align-items-center">
                <img class="m-auto"   width="150" src="/no-latest-land.png" alt="No Latest Land" />
                <button class="btn btn-success mt-3" @click="$router.push('/lahan')">Tambah Lahan Sekarang!</button>
               </div>
           
              
            </ul>
          </div>
        </div>
      </div>

      <!-- Lahan Terbaru - Admin (Jika admin) -->
      <div class="mt-4 col-12 col-xl-6" v-if="isAdmin">
        <div class="card h-100">
          <div class="p-3 pb-0 card-header">
            <h6 class="mb-0">Lahan Terbaru</h6>
          </div>
          <div class="p-3 card-body">
            <!-- Menampilkan lahan terbaru jika ada, jika tidak tampilkan teks -->
            <ul class="list-group">
              <li
                v-for="lahan in dashboardData?.lahan_terbaru || []"
                :key="lahan.id_lahan"
                class="px-0 mb-2 border-0 list-group-item d-flex align-items-center"
              >
                <div class="d-flex flex-column justify-content-center">
                  <h6 class="mb-0 text-sm">{{ lahan.lahan }}</h6>
                  <soft-badge variant="gradient" color="success" size="lg">{{
                    lahan.layer_group?.layer_groups || "-"
                  }}</soft-badge>
                </div>
                <a
                  class="mb-0 btn btn-link pe-3 ps-0 ms-auto"
                  :href="`/lahan/${lahan.id_lahan}`"
                  >Detail</a
                >
              </li>
              <div  v-if="dashboardData?.lahan_terbaru.length === 0" class="d-flex flex-column justify-content-center align-items-center">
                <img class="m-auto"   width="150" src="/no-latest-land.png" alt="No Latest Land" />
                <button class="btn btn-success mt-3" @click="$router.push('/lahan')">Tambah Lahan Sekarang!</button>
               </div>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>




<script>
import MiniStatisticsCard from "@/examples/Cards/MiniStatisticsCard.vue";
import SoftAvatar from "@/components/SoftAvatar.vue";
import SoftBadge from "@/components/SoftBadge.vue";
import defaultAvatar from "@/assets/img/profile.png";
import defaultLandImage from "@/assets/img/land-placeholder.jpg";

export default {
  name: "dashboard-default",
  components: {
    MiniStatisticsCard,
    SoftAvatar,
    SoftBadge,
  },
  data() {
    return {
      iconBackground: "bg-gradient-success",
      dashboardData: null,
      defaultAvatar,
      defaultLandImage,
      isAdmin: true,
      notNull: true,
    };
  },
  methods: {
    async fetchDashboardAdminData() {
      try {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (role === "Owner") {
          this.isAdmin = false;
          const response = await this.$axios.get("/dashboard-owner", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          this.dashboardData = response.data;
        } else {
          const response = await this.$axios.get("/dashboard-admin", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          this.dashboardData = response.data;
          if (this.dashboardData.lahan_terbaru === null) {
            this.notNull = false;
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    },
  },
  mounted() {
    this.fetchDashboardAdminData();
  },
};
</script>