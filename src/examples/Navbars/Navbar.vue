<template>
  <nav
    class="shadow-none navbar navbar-main navbar-expand-lg border-radius-xl"
    v-bind="$attrs"
    id="navbarBlur"
    data-scroll="true"
  >
    <div class="px-3 py-1 container-fluid">
      <!-- SweetAlert Notification -->
      <div v-if="alertMessage">
        <!-- Replace the SoftAlert component with SweetAlert -->
        <p>{{ alertMessage }}</p>
      </div>

      <breadcrumbs :currentPage="currentRouteName" :textWhite="textWhite" />
      <div
        class="mt-2 collapse navbar-collapse mt-sm-0 me-md-0 me-sm-4"
        :class="this.$store.state.isRTL ? 'px-0' : 'me-sm-4'"
        id="navbar"
      >
        <div
          class="pe-md-3 d-flex align-items-center"
          :class="this.$store.state.isRTL ? 'me-md-auto' : 'ms-md-auto'"
        ></div>
        <ul class="navbar-nav justify-content-end">
          <li class="nav-item d-flex ps-2 align-items-center">
            <h6 :style="{ color: textColor }">
              {{ username }}
            </h6>
          </li>

          <li
            class="nav-item dropdown ms-1 ms-sm-0 mb-1 d-flex align-items-center"
            :class="this.$store.state.isRTL ? 'ps-2' : 'pe-2'"
          >
            <a
              href="#"
              class="p-2 nav-link"
              :class="[
                textWhite ? textWhite : 'text-body',
                showMenu ? 'show' : '',
              ]"
              id="dropdownMenuButton"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              @click="showMenu = !showMenu"
            >
              <i
                class="nav-item dropdown ms-2 mb-1 d-flex align-items-center cursor-pointer fa fa-user"
                :class="this.$store.state.isRTL ? 'ps-2' : 'pe-2'"
              ></i>
            </a>
            <ul
              class="px-2 py-3 dropdown-menu dropdown-menu-end me-sm-n4"
              :class="showMenu ? 'show' : ''"
              aria-labelledby="dropdownMenuButton"
            >
              <li class="mb-2" @click="$router.push('/profile')">
                <a class="dropdown-item border-radius-md" href="javascript:;">
                  <div class="py-1 d-flex">
                    <div class="my-auto">
                      <img
                        src="../../assets/img/profile.png"
                        class="avatar avatar-sm me-3"
                        alt="user image"
                      />
                    </div>
                    <div class="d-flex flex-column justify-content-center">
                      <h6 class="mb-1 text-sm font-weight-bold">Profile</h6>
                    </div>
                  </div>
                </a>
              </li>

              <li class="mb-2">
                <a
                  class="dropdown-item border-radius-md"
                  href="javascript:;"
                  @click="logout"
                >
                  <div class="py-1 d-flex">
                    <div class="my-auto">
                      <img
                        src="../../assets/img/switch.png"
                        class="avatar avatar-sm me-3"
                        alt="user image"
                      />
                    </div>
                    <div class="d-flex flex-column justify-content-center">
                      <h6 class="mb-1 text-sm font-weight-bold">Logout</h6>
                    </div>
                  </div>
                </a>
              </li>
            </ul>
          </li>

          <li class="nav-item d-xl-none ps-1 mb-1 d-flex align-items-center">
            <a
              href="#"
              @click="toggleSidebar"
              class="p-0 nav-link text-body"
              id="iconNavbarSidenav"
            >
              <div class="sidenav-toggler-inner">
                <i class="sidenav-toggler-line"></i>
                <i class="sidenav-toggler-line"></i>
                <i class="sidenav-toggler-line"></i>
              </div>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script>
import Breadcrumbs from "../Breadcrumbs.vue";
import { mapMutations, mapActions } from "vuex";
import Swal from "sweetalert2"; // Import SweetAlert2

export default {
  name: "navbar",
  data() {
    return {
      textColor: "black",
      showMenu: false,
      alertMessage: "",
      alertColor: "danger",
    };
  },
  watch: {
    "$route.path": "updateTextColor",
  },
  props: ["minNav", "textWhite"],
  created() {
    this.minNav;
  },
  methods: {
    ...mapMutations(["navbarMinimize", "toggleConfigurator"]),
    ...mapActions(["toggleSidebarColor"]),
    updateTextColor() {
      this.textColor = this.$route.path === "/profile" ? "white" : "black";
    },
    async logout() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          this.alertColor = "warning";
          this.alertMessage = "Anda sudah logout.";
          Swal.fire({
            icon: "warning",
            title: "Anda sudah logout.",
            timer: 2000,
            showConfirmButton: false,
          }).then(() => {
            this.$router.push("/");
          });
          return;
        }

        await this.$axios.post(
          "/logout",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Hapus token dan data sesi dari localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        localStorage.removeItem("session_expire");

        // Tampilkan alert sukses dan redirect setelah beberapa detik
        this.alertColor = "success";
        this.alertMessage = "Logout berhasil! Redirecting...";

        Swal.fire({
          icon: "success",
          title: "Logout berhasil!",
          text: "Redirecting...",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          this.$router.push("/");
        });
      } catch (error) {
        console.error("Logout gagal:", error);

        // Tetap hapus token jika gagal logout untuk keamanan
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        localStorage.removeItem("session_expire");

        // Tampilkan alert error
        this.alertColor = "danger";
        this.alertMessage = "Logout gagal! Redirecting...";

        Swal.fire({
          icon: "error",
          title: "Logout gagal!",
          text: "Redirecting...",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          this.$router.push("/");
        });
      }
    },
    toggleSidebar() {
      this.toggleSidebarColor("bg-white");
      this.navbarMinimize();
    },
  },
  components: {
    Breadcrumbs,
  },
  computed: {
    currentRouteName() {
      return this.$route.name;
    },
    username() {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user).username : "Username";
    },
  },
};
</script>
