<template>
  <q-page class="constrain q-pa-md">
    <div class="row q-col-gutter-lg">
      <div class="col-12 col-sm-8">
        <q-card
          v-for="post in posts"
          :key="post.id"
          class="card-post q-mb-md"
          flat
          bordered
        >
          <q-item>
            <q-item-section avatar>
              <q-avatar>
                <img
                  :src="
                    post.users_avatar_url ||
                    'https://ovzhtgnkwevritftvhlc.supabase.co/storage/v1/object/public/avatars/default.png'
                  "
                />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ post.users_username }}</q-item-label>
              <q-item-label caption>{{ post.location }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator />

          <q-img :src="post.media_url" />
          <q-card-section>
            <div>{{ post.caption }}</div>
            <div class="text-caption text-grey">
              {{ niceDate(post.created_at) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-4 large-screen-only">
        <q-item class="fixed">
          <q-item-section avatar>
            <q-avatar size="48px">
              <img
                :src="
                  profilePicture ||
                  'https://ovzhtgnkwevritftvhlc.supabase.co/storage/v1/object/public/avatars/default.png'
                "
              />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <a href="/profile">
              <q-item-label>
                <p v-if="Username">{{ Username }}</p>
              </q-item-label>
            </a>
          </q-item-section>
        </q-item>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { date } from 'quasar';
import { useRouter } from 'vue-router';
import { supabase } from 'boot/supabase';
import { ref, onMounted } from 'vue';

const $router = useRouter();
const Username = ref('');
const account = ref('');
const posts = ref([]);
const profilePicture = ref('');
const userId = ref('');

const niceDate = (value) => {
  return date.formatDate(value, 'MMMM D h:mmA');
};

async function fetchProfileData() {
  try {
    // Fetch user profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId.value)
      .single();

    if (profileError) {
      throw new Error(`Error fetching profile: ${profileError.message}`);
    }

    // Set profile picture URL
    if (profileData) {
      profilePicture.value = profileData.avatar_url;
    }
  } catch (error) {
    console.error(error.message);
  }
}

async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    console.error('Error getting session:', error);
    $router.push('/login');
    return;
  }
  account.value = data.session;
  Username.value = account.value.user.user_metadata.username;
  userId.value = account.value.user.id;

  await fetchProfileData();
}

// Fetching posts and related profile data
async function fetchPosts() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false }); // Order by created_at in descending order
    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }
    const postsWithProfiles = await Promise.all(
      data.map(async (post) => {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', post.user_id)
          .single();

        if (profileError) {
          console.error(
            `Error fetching profile for user ${post.user_id}:`,
            profileError
          );
          return post;
        }
        return {
          ...post,
          users_username: profileData.username,
          users_avatar_url: profileData.avatar_url,
        };
      })
    );

    posts.value = postsWithProfiles;
  } catch (err) {
    console.error('Error fetching posts:', err);
  }
}

onMounted(async () => {
  await getSession();
  await fetchPosts();
});
</script>

<style>
.card-post .q-img {
  min-height: 200px;
}
</style>
