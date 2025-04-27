<template>
  <button
    class="btn mb-0"
    :class="getClasses(variant, color, size, fullWidth, active)"
  >
    <slot />
  </button>
</template>

<script>
export default {
  name: "SoftButton",
  props: {
    color: {
      type: String,
      default: "success",
    },
    size: {
      type: String,
      default: "md",
    },
    variant: {
      type: String,
      default: "fill",
    },
    fullWidth: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    getClasses: (variant, color, size, fullWidth, active, disabled) => {
      let colorValue, sizeValue, fullWidthValue, activeValue, disabledValue;

      // Setting the button variant and color
      if (variant === "gradient") {
        colorValue = `bg-gradient-${color}`;
      } else if (variant === "outline") {
        colorValue = `btn-outline-${color}`;
      } else {
        colorValue = `btn-${color}`;
      }

      sizeValue = size ? `btn-${size}` : null;

      fullWidthValue = fullWidth ? `w-100` : null;

      activeValue = active ? `active` : null;

      disabledValue = disabled ? `disabled` : null;

      return `${colorValue} ${sizeValue} ${fullWidthValue} ${activeValue} ${disabledValue}`;
    },
  },
};
</script>
