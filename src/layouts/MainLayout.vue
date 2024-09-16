<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-white text-grey-10" bordered>
      <q-toolbar class="constrain">
        <q-btn
          v-if="$route.fullPath.includes('/chat')"
          @click="goBack"
          class="small-screen-only"
          icon="bi-x-lg"
          size="16px"
          flat
          dense
        />
        <q-btn
          class="large-screen-only q-mr-sm"
          to="/camera"
          icon="bi-patch-plus"
          size="16px"
          flat
          round
          dense
        />
        <q-btn
          to="/search"
          icon="bi-search"
          size="16px"
          flat
          round
          dense
          class="large-screen-only q-mr-sm"
        />
        <q-separator vertical spaced class="large-screen-only" />
        <q-toolbar-title
          class="text-madimi text-bold"
          v-if="$route.fullPath.includes('/chat')"
        >
          {{ username }}
        </q-toolbar-title>
        <q-toolbar-title class="text-madimi text-bold" v-else>
          Mitrata
        </q-toolbar-title>
        <q-btn
          to="/"
          icon="bi-house"
          size="16px"
          flat
          round
          dense
          class="large-screen-only q-mr-sm"
        />
        <q-btn
          class="large-screen-only q-mr-sm"
          to="/users"
          icon="bi-chat"
          size="16px"
          flat
          round
          dense
        />
      </q-toolbar>
    </q-header>

    <q-footer class="bg-white small-screen-only" bordered>
      <q-tabs
        class="text-grey-10"
        active-color="primary"
        indicator-color="transparent"
      >
        <q-route-tab to="/" icon="bi-house" />
        <q-route-tab to="/search" icon="bi-search" />
        <q-route-tab to="/camera" icon="bi-patch-plus" />
        <q-route-tab to="/users" icon="bi-chat" />
        <q-route-tab to="/profile" icon="bi-person-circle" />
      </q-tabs>
    </q-footer>

    <q-page-container class="bg-grey-1">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
console.log('using mainlayout');

import { useRouter, useRoute } from 'vue-router';
import { supabase } from 'boot/supabase';
import type { AuthError } from '@supabase/supabase-js';
import { ref, watch } from 'vue';

const $router = useRouter();
const $route = useRoute();
const to = ref('');
const username = ref('');

function goBack() {
  $router.go(-1);
}

getUser();

function getUser() {
  supabase.auth
    .getSession()
    .then(({ data, error }) => {
      if (error || !data.session) {
        // You're not authenticated. Do stuff here like redirect to login
        console.log('no user');
        $router.push('/login');
      }
    })
    .catch((error: AuthError) => {
      console.error('Error getting session:', error.message); // Handle other errors
    });
}

async function usersusername() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', to.value); // Ensure to.value is treated correctly

    if (error) {
      console.error('Error fetching username:', error);
      return;
    }

    if (data && data.length > 0) {
      username.value = data[0].username;
    } else {
      console.error('No username found for the given user ID');
    }
  } catch (error) {
    console.error('An error occurred while fetching the username:', error);
  }
}

// Watch for route changes to call usersusername when navigating to /chat
watch(
  () => $route.fullPath,
  (newPath) => {
    if (newPath.includes('/chat')) {
      // Ensure to.value is set correctly based on route query
      to.value = $route.query.to as string; // Assuming $route.query.to is always a string
      usersusername();
    }
  },
  { immediate: true }
);
</script>

<style lang="scss">
.q-toolbar__title {
  font-size: 30px;
  @media (max-width: $breakpoint-xs-max) {
    text-align: center;
  }
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
