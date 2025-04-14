<template>
  <div
    class="w-auto h-auto collapse navbar-collapse max-height-vh-100 h-100"
    id="sidenav-collapse-main"
  >
    <ul class="navbar-nav">
      <li class="nav-item">
        <sidenav-collapse navText="Dashboard" :to="{ name: 'Dashboard' }">
          <template #icon>
            <i class="fas fa-tachometer-alt"></i>
          </template>
        </sidenav-collapse>
      </li>

      <li class="nav-item" v-if="isAdmin">
        <sidenav-collapse navText="Pemilik Lahan" :to="{ name: 'Pemilik Lahan' }">
          <template #icon>
            <i class="fas fa-user-tie"></i>
          </template>
        </sidenav-collapse>
      </li>

      <li class="nav-item">
        <sidenav-collapse navText="Lahan" :to="{ name: 'Lahan' }">
          <template #icon>
            <i class="fas fa-map"></i>
          </template>
        </sidenav-collapse>
      </li>

      <li class="nav-item">
        <sidenav-collapse navText="Karakteristik Lahan" :to="{ name: 'Karakteristik Lahan' }">
          <template #icon>
            <i class="fas fa-cogs"></i>
          </template>
        </sidenav-collapse>
      </li>

      <li class="nav-item">
        <sidenav-collapse navText="Basemaps" :to="{ name: 'Basemaps' }">
          <template #icon>
            <i class="fas fa-globe"></i>
          </template>
        </sidenav-collapse>
      </li>
    </ul>
  </div>
</template>


<script>
import SidenavCollapse from "./SidenavCollapse.vue";



export default {
  name: "SidenavList",
  props: {
    cardBg: String,
  },
  data() {
    return {
      title: "Soft UI Dashboard PRO",
      controls: "dashboardsExamples",
      isActive: "active",
      isAdmin:true
    };
  },
  components: {
    SidenavCollapse,
   
  },
  methods: {
    getRoute() {
      const routeArr = this.$route.path.split("/");
      return routeArr[1];
    },
  },
  mounted(){
    const role= localStorage.getItem("role")
    if(role === "Owner"){
      this.isAdmin=false
    }

  }
};
</script>
