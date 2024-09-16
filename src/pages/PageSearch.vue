<template>
  <q-page class="constrain q-pa-md">
    <div class="row justify-center q-ma-md custom-margin">
      <q-input
        v-model="searchTerm"
        class="col col-sm-10"
        label="Search Username"
        dense
        @keyup.enter="searchForUsernames"
      >
        <template v-slot:append>
          <q-btn
            round
            dense
            flat
            icon="bi-search"
            @click="searchForUsernames"
          />
        </template>
      </q-input>
    </div>
    <div class="search-results">
      <q-card
        v-for="user in searchResults"
        :key="user.id"
        class="q-mb-md small-card"
        @click="goToUserProfile(user.id)"
      >
        <q-card-section>
          <div class="row no-wrap items-center">
            <q-avatar>
              <q-img
                :src="
                  user.avatar_url ||
                  'https://ovzhtgnkwevritftvhlc.supabase.co/storage/v1/object/public/avatars/default.png'
                "
                alt="Profile Picture"
              />
            </q-avatar>
            <div class="q-ml-md">
              <div class="text-bold">{{ user.username }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { supabase } from 'boot/supabase';
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
const $router = useRouter();
const searchTerm = ref('');
const searchResults = ref([]);
const currentid = ref();
const searchForUsernames = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles') // Change to your custom table
      .select('id, username, avatar_url') // Select ID, username, and profile picture directly from the profiles table
      .ilike('username', `%${searchTerm.value}%`); // Search by username

    if (error) {
      console.error('Error searching usernames:', error);
      return;
    }

    // Store the search results
    searchResults.value = data || [];
  } catch (error) {
    console.error('An error occurred while searching:', error);
  }
};

const goToUserProfile = (userId) => {
  if (userId == currentid.value) {
    $router.push('/profile');
  } else {
    $router.push({ name: 'otherprofile', params: { id: userId } }); // Navigate to the user profile page
  }
};

watch(
  () => searchTerm.value,
  (newValue) => {
    if (newValue.trim() !== '') {
      searchForUsernames(); // Trigger the search when there's input
    } else {
      searchResults.value = []; // Clear results if search term is empty
    }
  }
);

async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    console.error('Error getting session:', error);
    $router.push('/login');
    return;
  }
  currentid.value = data.session.user.id;
}
onMounted(async () => {
  await getSession();
});
</script>

<style>
.search-results {
  margin-top: 20px;
}

.small-card {
  padding: 10px;
}

.q-avatar {
  width: 40px;
  height: 40px;
}
</style>
