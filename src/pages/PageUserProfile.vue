<template>
  <q-page class="constrain q-pa-md">
    <div class="profile-header q-mb-md">
      <q-avatar class="profile-picture">
        <img :src="profilePicture" />
      </q-avatar>
      <div class="profile-info">
        <div class="username">{{ profileData.username }}</div>
        <div class="counts">
          <div>{{ posts.length }} Posts</div>
          <div>{{ profileData.followerCount }} Followers</div>
          <div>{{ profileData.followingCount }} Following</div>
        </div>
        <div class="actions">
          <q-btn
            v-if="isFollowing"
            label="Unfollow"
            color="primary"
            @click="unfollowUser"
          />
          <q-btn v-else label="Follow" color="primary" @click="followUser" />
          <q-btn
            label="Message"
            color="primary"
            @click="goToChat(profileData.userId)"
          />
        </div>
      </div>
    </div>
    <q-separator />
    <div class="user-posts">
      <div class="post-container">
        <div v-for="post in posts" :key="post.id" class="card-post">
          <img :src="post.media_url" class="post-image" />
          <div class="post-details">
            <div>{{ post.caption }}</div>
            <div class="text-caption text-grey">
              {{ niceDate(post.created_at) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from 'boot/supabase';
import { date, Notify } from 'quasar';

const $route = useRoute();
const router = useRouter();

const profilePicture = ref('');
const profileData = ref({
  username: '',
  postsCount: 0,
  followerCount: 0,
  followingCount: 0,
  userId: '',
  avatar_url: '',
});
const id = $route.params.id;

const loggedinuser = ref(null);
const isFollowing = ref(false);
const niceDate = (value) => {
  return date.formatDate(value, 'MMMM D h:mmA');
};
const posts = ref([]);
async function fetchUserPosts(userId) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user posts:', error);
      return;
    }
    posts.value = data;
  } catch (error) {
    console.error('An error occurred while fetching user posts:', error);
  }
}
async function fetchProfileData(userId) {
  try {
    // Fetch follower count
    const { count: followerCountData, error: followersError } = await supabase
      .from('followers')
      .select('id', { count: 'exact' })
      .eq('following_id', userId);

    if (followersError) {
      throw new Error(`Error fetching followers: ${followersError.message}`);
    }

    profileData.value.followerCount = followerCountData;

    // Fetch following count
    const { count: followingCountData, error: followingError } = await supabase
      .from('followers')
      .select('id', { count: 'exact' })
      .eq('followers_id', userId);

    if (followingError) {
      throw new Error(`Error fetching following: ${followingError.message}`);
    }

    profileData.value.followingCount = followingCountData;

    // Fetch user profile data
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new Error(`Error fetching profile: ${profileError.message}`);
    }

    // Set profile data
    if (data) {
      profileData.value.username = data.username;
      profileData.value.avatar_url = data.avatar_url;
      profilePicture.value = data.avatar_url;
    }
  } catch (error) {
    console.error(error.message);
  }
}

async function checkIfFollowing() {
  try {
    const { data, error } = await supabase
      .from('followers')
      .select('*')
      .eq('followers_id', loggedinuser.value.id)
      .eq('following_id', id);

    if (error) {
      throw new Error('Failed to check if following');
    }

    isFollowing.value = data.length > 0;
  } catch (error) {
    console.error('Error checking if following:', error.message);
  }
}
async function followUser() {
  try {
    const userIdToFollow = id; // Assuming id contains the user ID

    // Use Supabase client to follow the user
    const { error } = await supabase
      .from('followers')
      .insert([
        { followers_id: loggedinuser.value.id, following_id: userIdToFollow },
      ]);

    if (error) {
      throw new Error('Failed to follow user');
    }

    // Update UI or perform any additional actions upon successful follow
    isFollowing.value = true;
    profileData.value.followerCount++;

    Notify.create({
      type: 'positive',
      message: `You are now following ${profileData.value.username}`,
      position: 'bottom',
      timeout: 3000,
      group: false,
    });
  } catch (error) {
    console.error('Error following user:', error.message);
  }
}
async function unfollowUser() {
  try {
    const userIdToUnfollow = id; // Assuming id contains the user ID

    // Use Supabase client to unfollow the user
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('followers_id', loggedinuser.value.id)
      .eq('following_id', userIdToUnfollow);

    if (error) {
      throw new Error('Failed to unfollow user');
    }

    // Update UI or perform any additional actions upon successful unfollow
    isFollowing.value = false;
    profileData.value.followerCount--;

    Notify.create({
      type: 'positive',
      message: `You have unfollowed ${profileData.value.username}`,
      position: 'bottom',
      timeout: 3000,
      group: false,
    });
  } catch (error) {
    console.error('Error unfollowing user:', error.message);
  }
}
function goToChat() {
  if (loggedinuser.value) {
    router.push({
      path: '/chat',
      query: { to: id, from: loggedinuser.value.id },
    });
  } else {
    console.error('User is not logged in');
  }
}

onMounted(async () => {
  const userId = id; // Assuming id contains the user ID

  await fetchProfileData(userId);
  await fetchUserPosts(userId);

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError) {
    console.error(sessionError);
  } else if (sessionData.session) {
    loggedinuser.value = sessionData.session.user;

    await checkIfFollowing(); // Check if the user is already following the profile user
  }
});
</script>

<style scoped>
.profile-header {
  display: flex;
  align-items: center;
}

.profile-picture {
  width: 150px;
  height: 150px;
  overflow: hidden;
  border-radius: 50%;
  margin-right: 20px;
}

.profile-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 1.5em;
  font-weight: bold;
}

.counts {
  display: flex;
  gap: 10px;
  margin: 10px 0;
}

.actions {
  display: flex;
  gap: 10px;
}

.user-posts {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.post-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  grid-auto-rows: 300px;
}

.card-post {
  width: 100%;
  overflow: hidden;
  position: relative;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-details {
  position: absolute;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
}
</style>
