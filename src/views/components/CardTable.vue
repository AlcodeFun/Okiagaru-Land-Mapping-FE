<template>
  <div class="card mb-4">
    <div class="card-header pb-0">
      <h6>{{ tableName }}</h6>
    </div>
    <div class="card-body px-4 pt-0 pb-2">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: "CardTable",
  props:{
    tableName: {
      type: String,
      default: "Table Name",
    },
  }
};
</script>
