<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-white text-grey-10" bordered>
      <q-toolbar class="constrain">
        <q-toolbar-title class="text-madimi text-bold">
          Mitrata
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container class="bg-grey-1">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
console.log('using authicationlayout');
</script>

<style lang="scss">
.q-toolbar__title {
  font-size: 30px;

  text-align: center;
}

.q-footer {
  .q-tab__icon {
    font-size: 30px;
  }
}
.q-toolbar {
  @media (min-width: $breakpoint-sm-min) {
    height: 70px;
  }
}
</style>
