<template>
  <q-page class="constrain q-pa-md">
    <div class="profile-header q-mb-md">
      <q-avatar class="profile-picture">
        <img
          :src="
            profilePicture ||
            'https://ovzhtgnkwevritftvhlc.supabase.co/storage/v1/object/public/avatars/default.png'
          "
        />
      </q-avatar>
      <div class="profile-info">
        <div class="username">{{ Username }}</div>
        <div class="bio" v-if="userBio">{{ userBio }}</div>
        <div class="counts">
          <div>{{ posts.length }} Posts</div>
          <div>{{ followerCount }} Followers</div>
          <div>{{ followingCount }} Following</div>
        </div>
        <div class="actions">
          <q-btn
            label="Edit Profile"
            color="primary"
            @click="showEditProfile = true"
          />
          <q-btn label="Logout" @click="logout" color="primary" />
        </div>
      </div>
    </div>
    <q-separator />

    <!-- Edit Profile Dialog -->
    <q-dialog v-model="showEditProfile" persistent>
      <q-card class="edit-card">
        <q-card-section>
          <div class="text-h6">Edit Profile</div>
        </q-card-section>

        <q-card-section>
          <!-- Existing username and profile picture editing -->
          <q-input v-model="editData.username" label="Username" />

          <!-- Add bio editing -->
          <q-input
            v-model="editData.bio"
            label="Bio"
            maxlength="150"
            :counter="true"
            @input="updateBioCounter"
          />

          <!-- Existing profile picture editing -->
          <div class="camera-frame q-pa-md">
            <canvas ref="canvas" class="full-width" height="240" />
          </div>
          <div class="text-center q-pa-md">
            <q-file
              outlined
              v-model="editData.profilePicture"
              @input="captureImageFallback"
              label="Choose an Image"
              accept="image/*"
            >
              <template v-slot:prepend>
                <q-icon name="bi-card-image" />
              </template>
            </q-file>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Save" color="primary" @click="saveProfile" />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
import { supabase } from 'boot/supabase';
import { date, Notify } from 'quasar';
import { ref, onMounted } from 'vue';

import { useRouter } from 'vue-router';
import { useAuthenticationstore } from 'stores/AuthenticationStore.ts';
const store = useAuthenticationstore();
const $router = useRouter();

const profilePicture = ref('');
const followerCount = ref(0);
const followingCount = ref(0);
const posts = ref([]);
const userId = ref('');
const Username = ref('');
const userBio = ref('');
const showEditProfile = ref(false);
const editData = ref({
  username: '',
  bio: '',
  profilePicture: null,
});

const canvas = ref(null);

const niceDate = (value) => {
  return date.formatDate(value, 'MMMM D h:mmA');
};

async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (data.session === null) {
    console.error('Error getting session:', error);
    console.log('no user');
    $router.push('/login');
    return;
  }
  userId.value = data.session.user.id;
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('username, bio')
    .eq('id', userId.value)
    .single();

  if (profileError) {
    throw profileError;
  }
  Username.value = profileData.username;
  userBio.value = profileData.bio;

  fetchProfileData();
}

async function fetchProfileData() {
  try {
    // Fetch follower count
    const { count: followerCountData, error: followersError } = await supabase
      .from('followers')
      .select('id', { count: 'exact' })
      .eq('following_id', userId.value);
    if (followersError) {
      throw new Error(`Error fetching followers: ${followersError.message}`);
    }
    followerCount.value = followerCountData;
    // Fetch following count
    const { count: followingCountData, error: followingError } = await supabase
      .from('followers')
      .select('id', { count: 'exact' })
      .eq('followers_id', userId.value);

    if (followingError) {
      throw new Error(`Error fetching following: ${followingError.message}`);
    }
    followingCount.value = followingCountData;
    // Fetch user profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('avatar_url,username, bio')
      .eq('id', userId.value)
      .single();
    if (profileError) {
      throw new Error(`Error fetching profile: ${profileError.message}`);
    }
    if (profileData) {
      profilePicture.value = profileData.avatar_url;
      Username.value = profileData.username;
      userBio.value = profileData.bio;
    }
  } catch (error) {
    console.error(error.message);
  }
}

async function fetchUserPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId.value);

  if (error) {
    console.error('Error fetching posts:', error);
    return;
  }
  posts.value = data;
}

async function logout() {
  await store.logoutUser();
  $router.push('/login');
}

async function saveProfile() {
  try {
    let avatarUrl = profilePicture.value;
    let changes = [];

    // Check if a new profile picture is uploaded
    if (editData.value.profilePicture) {
      const file = editData.value.profilePicture;
      const fileName = `${userId.value}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);
      if (uploadError) {
        throw uploadError;
      }
      const { data: publicURLData, error: publicUrlError } =
        await supabase.storage.from('avatars').getPublicUrl(fileName);
      if (publicUrlError) {
        throw publicUrlError;
      }
      avatarUrl = publicURLData.publicUrl;
      changes.push('profile picture');
    }
    console.log('Avatar URL:', avatarUrl);

    // Prepare update data
    const updateData = {};
    let isUsernameChanged = false;

    if (editData.value.username) {
      // Check if the new username is different from the current one
      if (editData.value.username !== Username.value) {
        // Check if the new username is already taken
        const { data: existingUser, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', editData.value.username);
        if (fetchError) {
          throw fetchError;
        }

        if (
          existingUser &&
          existingUser.length > 0 &&
          existingUser[0].id !== userId.value
        ) {
          Notify.create({
            type: 'negative',
            message: 'Username already taken',
            position: 'top',
            timeout: 3000,
            group: false,
          });
          return; // Stop execution if username is already taken
        }
        updateData.username = editData.value.username;
        isUsernameChanged = true;
      }
    }

    if (editData.value.bio !== undefined && editData.value.bio !== null) {
      if (editData.value.bio.trim() !== '') {
        updateData.bio = editData.value.bio.trim(); // Update bio if not empty
        changes.push('bio');
      } else {
        // Ask confirmation if bio is empty
        const clearBio = confirm('Are you sure you want to clear your bio?');
        if (clearBio) {
          updateData.bio = null; // Clear bio field
          changes.push('bio');
        }
      }
    }
    if (avatarUrl !== profilePicture.value) {
      updateData.avatar_url = avatarUrl;
    }
    // Check if updateData is empty
    if (Object.keys(updateData).length === 0) {
      console.warn('No fields to update.');
      return;
    }
    // Update the profile with the new data
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId.value);
    if (updateProfileError) {
      throw updateProfileError;
    }
    console.log('Update Data:', updateData);

    // If username is changed, update it in the user metadata as well
    if (isUsernameChanged) {
      const { error: updateUserError } = await supabase.auth.updateUser({
        data: {
          username: editData.value.username,
        },
      });
      if (updateUserError) {
        throw updateUserError;
      }

      Username.value = editData.value.username;
      changes.push('username');
    }

    // Reset editData and hide edit profile dialog
    editData.value.username = '';
    editData.value.bio = '';
    editData.value.profilePicture = null;
    showEditProfile.value = false;

    // Notify success with specific changes
    if (changes.length > 0) {
      Notify.create({
        type: 'positive',
        message: `Profile updated successfully: ${changes.join(', ')}`,
        position: 'top',
        timeout: 3000,
        group: false,
      });
    }

    fetchProfileData(); // Fetch updated profile data again to reflect changes
  } catch (error) {
    console.error('Error updating profile:', error.message);
    Notify.create({
      type: 'negative',
      message: error.message,
      position: 'top',
      timeout: 3000,
      group: false,
    });
  }
}

const captureImageFallback = (event) => {
  const file = event.target.files[0];
  if (!file) {
    console.error('No file selected');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvasElement = canvas.value;
      const context = canvasElement.getContext('2d');
      canvasElement.width = img.width;
      canvasElement.height = img.height;
      context.drawImage(img, 0, 0, img.width, img.height);
    };
    img.src = event.target.result;
  };
  reader.onerror = (error) => {
    console.error('Error reading image:', error);
  };
  reader.readAsDataURL(file);
};
onMounted(async () => {
  await getSession();

  await fetchUserPosts();
});
</script>

<style scoped>
.edit-card {
  width: 70vw;
  height: 70vh;
  margin: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 16px;
  box-sizing: border-box;
}

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

.bio {
  margin-top: 5px;
  font-size: 1em;
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
