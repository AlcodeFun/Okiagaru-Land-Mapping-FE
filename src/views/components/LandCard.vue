<template>
  <div class="mb-4 col-xl-3 col-md-6 mb-xl-0">
    <div class="card card-blog card-plain">
      <div class="position-relative">
        <a class="shadow-xl d-block border-radius-xl">
          <img
            :src="previewImage"
            alt="img-blur-shadow"
            class="shadow img-fluid border-radius-xl"
          />
        </a>
      </div>
      <div class="px-1 pb-0 card-body">
        <p class="mb-2 text-sm text-gradient text-dark">{{ PemilikLahan }}</p>
        <a href="javascript:;">
          <h5>{{ name }}</h5>
        </a>
        <p class="mb-4 text-sm">Area : {{ area }} m2</p>
        <div class="d-flex align-items-center justify-content-between">
          <button
            type="button"
            class="mb-0 btn btn-sm w-100"
            :class="`btn-outline-${action.color}`"
          >
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LandCard",
  props: {
    previewImage: {
      type: String,
      default: "",
    },
    PemilikLahan: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "Default Project Card",
    },
    area: {
      type: Number,
      default: 0,
    },
    action: {
      type: Object,
      route: String,
      color: String,
      label: String,
      default: () => {},
    },
  },
};
</script>
