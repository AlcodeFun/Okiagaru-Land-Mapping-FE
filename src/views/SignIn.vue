<template>
  <div class="container top-0 position-sticky z-index-sticky"></div>
  <main class="mt-0 main-content main-content-bg">
    <section>
      <div class="page-header min-vh-75">
        <div class="container">
          <div class="row">
            <div class="mx-auto col-xl-4 col-lg-5 col-md-6 d-flex flex-column">
              <div class="mt-8 card card-plain">
                <div class="pb-0 card-header text-start">
                  <h4 class="font-weight-bolder text-success text-gradient">
                    Selamat Datang di <br />Land Mapping System
                  </h4>
                  <h5>
                    <span style="color: black; font-weight: bold"
                      >Okiagaru Indonesia Agricoop</span
                    >
                  </h5>
                  <p class="mb-0">
                    Enter your username and password to sign in
                  </p>
                </div>
                <div class="card-body">
                  <!-- Alert untuk success/error -->
                  <SoftAlert
                    v-if="alertMessage"
                    :color="alertColor"
                    icon="ni ni-check-bold"
                    dismissible
                  >
                    {{ alertMessage }}
                  </SoftAlert>

                  <form role="form" class="text-start">
                    <label>Username</label>
                    <SoftInput
                      id="username"
                      :value="username"
                      @input="username = $event.target.value"
                      type="text"
                      placeholder="Username"
                      name="username"
                    />
                    <label>Password</label>
                    <SoftInput
                      id="password"
                      :value="password"
                      @input="password = $event.target.value"
                      type="password"
                      placeholder="Password"
                      name="password"
                    />

                    <div class="text-center">
                      <SoftButton
                        class="my-4 mb-2"
                        variant="gradient"
                        color="success"
                        full-width
                        :loading="isLoading"
                        @click.prevent="login"
                      >
                        Sign in
                      </SoftButton>
                    </div>
                  </form>
                </div>
      
              </div>
            </div>
            <div class="col-md-6">
              <div
                class="top-0 oblique position-absolute h-100 d-md-block d-none me-n8"
              >
                <div
                  class="bg-cover oblique-image position-absolute fixed-top ms-auto h-100 z-index-0 ms-n6"
                  :style="{
                    backgroundImage:
                      'url(' +
                      require('@/assets/img/curved-images/login-bg.jpg') +
                      ')',
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
  <app-footer />
</template>

<script>
import SoftInput from "@/components/SoftInput.vue";
import SoftButton from "@/components/SoftButton.vue";
import SoftAlert from "@/components/SoftAlert.vue";
import axios from "axios";
import { mapMutations } from "vuex";

export default {
  name: "SignIn",
  components: {
    SoftInput,
    SoftButton,
    SoftAlert,
  },
  data() {
    return {
      username: "",
      password: "",
      isLoading: false,
      alertMessage: "",
      alertColor: "danger",
    };
  },
  created() {
    this.toggleEveryDisplay();
    this.toggleHideConfig();
  },
  beforeUnmount() {
    this.toggleEveryDisplay();
    this.toggleHideConfig();
  },
  methods: {
    ...mapMutations(["toggleEveryDisplay", "toggleHideConfig"]),

    async login() {
      this.isLoading = true;
      this.alertMessage = "";

      try {
        const response = await axios.post("/login", {
          username: this.username,
          password: this.password,
        });

        const { token, data } = response.data;
        const user = data;
        const role = user.role;

        if (!role) {
          throw new Error("Role tidak ditemukan dalam response API");
        }

        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("user", JSON.stringify(user));
       

        this.alertColor = "success";
        this.alertMessage = "Login berhasil! Redirecting...";

        setTimeout(() => {
          if (role === "Administrator") {
            this.$router.push("/dashboard");
          } else {
            this.$router.push("/dashboard");
          }
        }, 1000);
      } catch (error) {
        console.error("Login error:", error);
        this.alertColor = "danger";
        this.alertMessage =
          error.response?.data?.message || "Login gagal, coba lagi.";
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>
