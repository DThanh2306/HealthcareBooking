<template>
  <div>
    <Navbar />
    <div class="page-container">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import Navbar from "@/components/NavBar.vue";
</script>
