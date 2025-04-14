import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "@/views/Dashboard.vue";
import Profile from "@/views/Profile.vue";
import SignIn from "@/views/SignIn.vue";
import PemilikLahan from "../views/PemilikLahan.vue";
import Lahan from "../views/Lahan.vue";
import Basemap from "../views/Basemap.vue";
import LandCharacteristic from "../views/LandCharacteristic.vue";
import MapView from "../views/MapView.vue";
import ViewLahan from "../views/ViewLahan.vue";
import CreateLahanDraw from "../views/CreateLahanDraw.vue";
import CreateLahanRealtime from "../views/CreateLahanRealtime.vue";
import CreateLahanManual from "../views/CreateLahanManual.vue";
import LahanForm from "../views/LahanForm.vue";
import EditPolygonDraw from "../views/EditPolygonDraw.vue";
import EditPolygonRealtime from "../views/EditPolygonRealtime.vue";
import EditPolygonManual from "../views/EditPolygonManual.vue";
import LahanFormEdit from "../views/LahanFormEdit.vue";
const routes = [
  {
    path: "/sign-in",
    name: "Sign In",
    component: SignIn,
    meta: { requiresGuest: true },
  },
  {
    path: "/",
    name: "Map View",
    component: MapView,
    meta: { requiresAuth: false, requiresGuest: true },
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: "/pemilik-lahan",
    name: "Pemilik Lahan",
    component: PemilikLahan,
    meta: { requiresAuth: true, role: "Administrator" },
  },
  {
    path: "/lahan",
    name:"Lahan",
    component: Lahan,
    meta: { requiresAuth: true },
  },
  {
    path: "/lahan/:id",
    name: "DetailLahan",
    component: ViewLahan,
    meta: { requiresAuth: true },
  },
  {
    path: "/lahan/form",
    name: "LahanForm",
    component: LahanForm,
    meta: { requiresAuth: true },
  },
  {
    path: "/lahan/form/edit/:id",
    name: "LahanFormEdit",
    component: LahanFormEdit,
    meta: { requiresAuth: true },
  },
  {
    path: "/lahan/create-draw",
    name: "Create Lahan Draw",
    component: CreateLahanDraw,
    meta: { requiresAuth: true },
  },
  {
    path: "/lahan/create-realtime",
    name: "Create Lahan Realtime",
    component: CreateLahanRealtime,
    meta: { requiresAuth: true },
  },
  {
    path: "/lahan/create-manual",
    name: "Create Lahan Manual",
    component: CreateLahanManual,
    meta: { requiresAuth: true },
  },
  {
    path: "/lahan/edit-draw/:id",
    name: "Edit Lahan Draw",
    component: EditPolygonDraw,
    meta: { requiresAuth: true },
  },
  {
    path: "/lahan/edit-realtime/:id",
    name: "Edit Lahan Realtime",
    component: EditPolygonRealtime,
    meta: { requiresAuth: true },
  },
  {
    path: "/lahan/edit-manual/:id",
    name: "Edit Lahan Manual",
    component: EditPolygonManual,
    meta: { requiresAuth: true },
  },

  {
    path: "/land-characteristics",
    name: "Karakteristik Lahan",
    component: LandCharacteristic,
    meta: { requiresAuth: true },
  },
  {
    path: "/basemaps",
    name: "Basemaps",
    component: Basemap,
    meta: { requiresAuth: true },
  },

  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: { requiresAuth: true },
  },

  {
    path: "/sign-in",
    name: "Sign In",
    component: SignIn,
    meta: { requiresGuest: true },
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  linkActiveClass: "active",
});
// ✅ Navigation Guard untuk proteksi route
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // **2️⃣ Cek jika halaman memerlukan autentikasi**
  if (to.meta.requiresAuth) {
    if (!token) {
      return next("/sign-in"); // Redirect jika belum login
    }

    // **3️⃣ Cek apakah role user sesuai dengan route**
    if (to.meta.role && to.meta.role !== role) {
      if (role === "Administrator") {
        return next("/dashboard"); // Admin tetap di Dashboard
      } else if (role === "Owner") {
        return next("/dashboard"); // Land Manager ke Dashboard-nya sendiri
      }
    }
  }

  // **4️⃣ Cek jika pengguna sudah login, jangan kembali ke Sign In**
  if (to.meta.requiresGuest && token) {
    return next("/dashboard"); // Redirect ke dashboard jika sudah login
  }

  next();
});

export default router;
