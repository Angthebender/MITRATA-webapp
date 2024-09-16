<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center bg-grey-2">
        <q-card class="q-pa-md shadow-2 my_card" bordered>
          <q-card-section class="text-center">
            <div class="text-grey-9 text-h5 text-weight-bold">Sign up</div>
            <div class="text-grey-8">
              Sign up below if you want to create an account
            </div>
          </q-card-section>
          <q-card-section>
            <q-input
              dense
              outlined
              v-model="store.email"
              label="Email Address"
              type="email"
            ></q-input>
            <q-input
              dense
              outlined
              class="q-mt-md"
              v-model="store.username"
              type="username"
              label="username"
            ></q-input>

            <q-input
              dense
              outlined
              class="q-mt-md"
              v-model="store.password"
              type="password"
              label="Password"
            ></q-input>
            <q-input
              dense
              outlined
              class="q-mt-md"
              v-model="store.dob"
              type="date"
              label="Date of birth"
            ></q-input>
          </q-card-section>
          <q-card-section>
            <q-btn
              style="border-radius: 8px"
              color="dark"
              rounded
              size="md"
              label="Create account"
              no-caps
              class="full-width"
              @click="store.CreateAccount()"
            ></q-btn>
          </q-card-section>
          <q-card-section class="text-center q-pt-none">
            <div class="text-grey-8">
              Do you already have an account?
              <a
                href="/login"
                class="text-dark text-weight-bold"
                style="text-decoration: none"
                >sign in.</a
              >
            </div>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useAuthenticationstore } from 'stores/AuthenticationStore.ts';
import { useRouter } from 'vue-router';
import { watch } from 'vue';
const $router = useRouter();
const store = useAuthenticationstore();

watch(
  () => store.createAcc,
  (newValue) => {
    if (newValue) {
      $router.push('/login'); // Redirect upon creating account
      store.createAcc = false; // Reset the flag to prevent repeated redirects
    }
  }
);
</script>

<style>
.q-footer {
  display: none;
}
</style>
