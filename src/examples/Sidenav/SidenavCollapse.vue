<template>
  <router-link
    class="nav-link d-flex align-items-center router-hover"
    :to="to"
    v-bind="$attrs"
  >
    <!-- Icon -->
    <div
      class="icon-wrapper me-2 d-flex align-items-center justify-content-center"
      :class="[isActive ? 'bg-success text-white' : 'bg-white text-dark']"
    >
      <slot name="icon" />
    </div>

    <!-- Text -->
    <span class="nav-link-text" :class="isActive ? 'text-success fw-bold' : ''">
      {{ navText }}
    </span>
  </router-link>
</template>

<script>
export default {
  name: "sidenav-collapse",
  props: {
    to: {
      type: [Object, String],
      required: true,
    },
    navText: {
      type: String,
      required: true,
    },
  },
  computed: {
    isActive() {
      return this.$route.name === (this.to?.name || this.to);
    },
  },
};
</script>

<style scoped>
.icon-wrapper {
  width: 40px;
  height: 40px;
  font-size: 1rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.nav-link-text {
  transition: color 0.3s ease;
}

.router-hover {
  transition: all 0.3s ease;
  border-radius: 0.5rem;
  padding: 0.4rem 0.75rem;
}


.router-hover:hover {
  background-color: #e8f5e9; 
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.15);
  transform: translateX(3px);
}

.router-hover:hover .icon-wrapper {
  background-color: #c8e6c9; 
  color: #28a745; 
}

.router-hover:hover .nav-link-text {
  color: #28a745;
}
</style>
