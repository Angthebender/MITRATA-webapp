<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center bg-grey-2">
        <q-card class="q-pa-md shadow-2 my_card" bordered>
          <q-card-section class="text-center">
            <div class="text-grey-9 text-h5 text-weight-bold">Sign in</div>
            <div class="text-grey-8">Sign in below to access your account</div>
          </q-card-section>
          <q-card-section>
            <q-input
              dense
              outlined
              v-model="store.email"
              label="Email Address"
              @keyup.enter="store.handleSubmit()"
              type="email"
            ></q-input>
            <q-input
              dense
              outlined
              class="q-mt-md"
              v-model="store.password"
              type="password"
              label="Password"
              @keyup.enter="store.handleSubmit()"
            ></q-input>
          </q-card-section>
          <q-card-section>
            <q-btn
              style="border-radius: 8px"
              color="dark"
              rounded
              size="md"
              label="Sign in"
              type="submit"
              no-caps
              @click="store.handleSubmit()"
              class="full-width"
            />
          </q-card-section>
          <q-card-section class="text-center q-pt-none">
            <div class="text-grey-8">
              Don't have an account yet?
              <a
                href="/signup"
                class="text-dark text-weight-bold"
                style="text-decoration: none"
                >Sign up.</a
              >
            </div>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { watch } from 'vue';
import { useAuthenticationstore } from 'stores/AuthenticationStore.ts';

const $router = useRouter();
const store = useAuthenticationstore();

// Watch for successful login and navigate to the home page
watch(
  () => store.loginSuccess,
  (newValue) => {
    if (newValue) {
      $router.push('/'); // Redirect upon login success
      store.loginSuccess = false; // Reset the flag to prevent repeated redirects
    }
  }
);
</script>

<style>
.my_card {
  width: 25rem;
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1),
    0 8px 10px -6px rgb(0 0 0 / 0.1);
}
.q-footer {
  display: none;
}
</style>
src/stores/AuthenticationStore
