import { createApp } from "vue";
import App from "./App.vue";
import store from "./store";
import router from "./router";
import axios from "axios"; // Import Axios
import "./assets/css/nucleo-icons.css";
import "./assets/css/nucleo-svg.css";
import SoftUIDashboard from "./soft-ui-dashboard";
import "leaflet/dist/leaflet.css";

// Development
axios.defaults.baseURL = "http://127.0.0.1:8000/api";
axios.defaults.headers.common["Content-Type"] = "application/json";

const appInstance = createApp(App);

appInstance.config.globalProperties.$axios = axios;

appInstance.use(store);
appInstance.use(router);
appInstance.use(SoftUIDashboard);
appInstance.mount("#app");
