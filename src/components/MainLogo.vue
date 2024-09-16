<template>
  <div class="logo">
    <img :src="logoSrc" alt="Your App Logo" />
  </div>
</template>

<script setup>
const logoSrc = '~/assets/image.png'; // Path to your logo image
</script>

<style scoped>
.logo {
  /* Style your logo here */
  display: flex;
  align-items: center;
}
</style>
