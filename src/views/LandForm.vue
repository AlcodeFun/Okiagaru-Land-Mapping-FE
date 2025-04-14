<template>
  <div class="container">
    <h1>{{ isEdit ? "Update Land" : "Create Land" }}</h1>

    <form @submit.prevent="saveLand">
      <div class="form-group">
        <label>Land Name:</label>
        <input v-model="form.name" type="text" class="form-control" required />
      </div>

      <div class="form-group">
        <label>Land Manager:</label>
        <select v-model="form.land_manager_id" class="form-control" required>
          <option value="" disabled>Select Land Manager</option>
          <option
            v-for="manager in PemilikLahans"
            :key="manager.id"
            :value="manager.id"
          >
            {{ manager.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Province:</label>
        <input
          v-model="form.province"
          type="text"
          class="form-control"
          required
        />
      </div>

      <div class="form-group">
        <label>City:</label>
        <input v-model="form.city" type="text" class="form-control" required />
      </div>

      <div class="form-group">
        <label>District:</label>
        <input
          v-model="form.district"
          type="text"
          class="form-control"
          required
        />
      </div>

      <div class="form-group">
        <label>Village:</label>
        <input
          v-model="form.village"
          type="text"
          class="form-control"
          required
        />
      </div>

      <div class="form-group">
        <label>Ownership:</label>
        <input
          v-model="form.ownership"
          type="text"
          class="form-control"
          required
        />
      </div>

      <div class="form-group">
        <label>Area (m²):</label>
        <input
          v-model="form.area"
          type="number"
          class="form-control"
          readonly
        />
      </div>

      <div class="form-group">
        <label>Upload Preview Image:</label>
        <input type="file" @change="handleImageUpload" class="form-control" />
      </div>

      <div id="map" style="height: 400px"></div>
      <div class="d-flex justify-content-center">
        <button
          type="submit"
          :disabled="loading"
          class="btn btn-success mt-4 w-100"
        >
          {{ loading ? "Saving..." : isEdit ? "Update Land" : "Create Land" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import * as turf from "@turf/turf";
import axios from "axios";

export default {
  name: "LandForm",
  props: {
    isEdit: Boolean,
    existingData: Object,
  },
  setup(props) {
    const map = ref(null);
    const drawnItems = ref(null);
    const polygonLayer = ref(null);
    const PemilikLahans = ref([]);
    const loading = ref(false);

    const form = reactive({
      name: "",
      land_manager_id: "",
      province: "",
      city: "",
      district: "",
      village: "",
      ownership: "",
      area: 0,
      polygon: [],
      preview_image: null,
    });

    onMounted(() => {
      initMap();
      fetchPemilikLahans();
    });

    const fetchPemilikLahans = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/pemilik-lahans", {
          headers: { Authorization: `Bearer ${token}` },
        });
        PemilikLahans.value = response.data.data;
      } catch (error) {
        console.error("Error fetching land managers:", error);
      }
    };

    const initMap = () => {
      map.value = L.map("map").setView([-6.9209, 107.6038], 13);
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles © Esri & contributors",
          maxZoom: 18,
        }
      ).addTo(map.value);

      drawnItems.value = new L.FeatureGroup();
      map.value.addLayer(drawnItems.value);

      const drawControl = new L.Control.Draw({
        edit: { featureGroup: drawnItems.value, remove: true },
        draw: {
          polyline: false,
          marker: false,
          circle: false,
          circlemarker: false,
          rectangle: false,
          polygon: true,
        },
      });

      map.value.addControl(drawControl);

      map.value.on(L.Draw.Event.CREATED, (e) => {
        if (polygonLayer.value) {
          drawnItems.value.removeLayer(polygonLayer.value);
        }

        polygonLayer.value = e.layer;
        drawnItems.value.addLayer(polygonLayer.value);

        // 🔥 Ambil koordinat dalam format [Longitude, Latitude]
        const coordinates = polygonLayer.value
          .getLatLngs()[0]
          .map((latlng) => [latlng.lng, latlng.lat]);

        // 🔥 Pastikan polygon tertutup (titik awal == titik akhir)
        coordinates.push(coordinates[0]);

        form.polygon = coordinates;

        // 🔥 Gunakan Turf.js untuk menghitung luas
        const turfPolygon = turf.polygon([coordinates]);
        const calculatedArea = turf.area(turfPolygon);

        // 🔥 Debugging hasil area
        console.log("GeoJSON Polygon:", JSON.stringify(turfPolygon, null, 2));
        console.log("Calculated Area (m²):", calculatedArea);

        form.area = calculatedArea.toFixed(2);
      });
    };

    const resetPolygon = () => {
      if (polygonLayer.value) {
        drawnItems.value.removeLayer(polygonLayer.value);
        polygonLayer.value = null;
        form.polygon = [];
        form.area = 0;
      }
    };

    const handleImageUpload = (event) => {
      form.preview_image = event.target.files[0];
    };

    const saveLand = async () => {
      try {
        loading.value = true;
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("land_manager_id", form.land_manager_id);
        formData.append("province", form.province);
        formData.append("city", form.city);
        formData.append("district", form.district);
        formData.append("village", form.village);
        formData.append("ownership", form.ownership);
        formData.append("area", form.area);

        if (form.polygon.length > 0) {
          formData.append("polygon", JSON.stringify(form.polygon));
        } else {
          formData.append("polygon", "[]");
        }

        if (form.preview_image) {
          formData.append("preview_image", form.preview_image);
        }

        const token = localStorage.getItem("token");
        const url = props.isEdit ? `/lahan/${props.existingData.id}` : "/lahan";
        const method = props.isEdit ? "put" : "post";

        await axios({
          method,
          url,
          data: formData,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } catch (error) {
        console.error("Error saving land:", error);
      } finally {
        loading.value = false;
      }
    };

    return {
      form,
      PemilikLahans,
      saveLand,
      handleImageUpload,
      resetPolygon,
      loading,
    };
  },
};
</script>
