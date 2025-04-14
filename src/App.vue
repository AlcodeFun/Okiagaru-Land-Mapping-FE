<template>
  <sidenav
    :custom_class="this.$store.state.mcolor"
    :class="[
      this.$store.state.isTransparent,
      this.$store.state.isRTL ? 'fixed-end' : 'fixed-start',
    ]"
    v-if="this.$store.state.showSidenav"
  />
  <main
    class="main-content position-relative max-height-vh-100 h-100 border-radius-lg"
    :style="this.$store.state.isRTL ? 'overflow-x: hidden' : ''"
  >
    <!-- nav -->
    <navbar
      :class="[navClasses]"
      :textWhite="this.$store.state.isAbsolute ? 'text-white opacity-8' : ''"
      :minNav="navbarMinimize"
      v-if="this.$store.state.showNavbar"
    />
    <router-view />

    <configurator
      :toggle="toggleConfigurator"
      :class="[
        this.$store.state.showConfig ? 'show' : '',
        this.$store.state.hideConfigButton ? 'd-none' : '',
      ]"
    />
  </main>
</template>
<script>
import Sidenav from "@/examples/Sidenav";
import Configurator from "@/examples/Configurator.vue";
import Navbar from "@/examples/Navbars/Navbar.vue";

import { mapMutations } from "vuex";
import axios from "axios";
export default {
  name: "App",
  components: {
    Sidenav,
    Configurator,
    Navbar,
  },
  methods: {
    ...mapMutations(["toggleConfigurator", "navbarMinimize"]),
    async logoutUser() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        await axios.post(
          "/logout",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Logout berhasil");
      } catch (error) {
        console.error("Gagal logout:", error);
      } finally {
        localStorage.clear();
        this.$router.push("/sign-in");
      }
    },

    startSessionCheck() {
      setInterval(async () => {
        const sessionExpireTime = localStorage.getItem("session_expire");

        if (sessionExpireTime && new Date().getTime() > sessionExpireTime) {
          console.log("Session expired. Logging out...");
          await this.logoutUser(); // Panggil logout jika session habis
        }
      }, 10000); // Cek setiap 10 detik
    },
  },
  computed: {
    navClasses() {
      return {
        "position-sticky blur shadow-blur mt-4 left-auto top-1 z-index-sticky":
          this.$store.state.isNavFixed,
        "position-absolute px-4 mx-0 w-100 z-index-2":
          this.$store.state.isAbsolute,
        "px-0 mx-4 mt-4": !this.$store.state.isAbsolute,
      };
    },
  },
  beforeMount() {
    this.$store.state.isTransparent = "bg-transparent";
  },
  created() {
    this.startSessionCheck();
  },
};
</script>

<style>
/* Custom Scrollbar untuk Webkit (Chrome, Edge, Safari) */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #95d674;
  border-radius: 30px;
  transition: background 0.3s;
}

::-webkit-scrollbar-thumb:hover {
  background: #95d674;
}

/* Custom Scrollbar untuk Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: #95d674 #f1f1f1;
}

/* Custom Scrollbar untuk Internet Explorer & Edge */
body {
  -ms-overflow-style: none;
}

body::-webkit-scrollbar {
  display: block;
}
</style>
