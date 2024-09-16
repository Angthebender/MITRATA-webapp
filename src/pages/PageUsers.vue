<template>
  <q-page class="constrain q-pa-md">
    <q-list class="full-width" separator>
      <q-item
        v-for="user in users"
        :key="user.id"
        clickable
        v-ripple
        @click="goToChat(user.id)"
      >
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white">
            <img
              :src="
                user.avatar_url ||
                'https://ovzhtgnkwevritftvhlc.supabase.co/storage/v1/object/public/avatars/default.png'
              "
            />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ user.username }}</q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-badge :color="user.online ? 'light-green-5' : 'grey-4'">
            {{ user.online ? 'Online' : 'Offline' }}
          </q-badge>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup>
import { supabase } from 'boot/supabase';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const users = ref([]);
const loggedinuser = ref(null);
const router = useRouter();

async function fetchProfileDataForUsers(userData) {
  return await Promise.all(
    userData.map(async (user) => {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, avatar_url, online')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error(
          `Error fetching profile for user ${user.id}:`,
          profileError
        );
        return user;
      }

      return {
        ...user,
        username: profileData.username,
        avatar_url: profileData.avatar_url,
        online: profileData.online,
      };
    })
  );
}

async function fetchLastMessagedUser() {
  try {
    // Fetch the last message where the current user is the sender
    const { data: messages, error } = await supabase
      .from('messages')
      .select('to')
      .eq('from', loggedinuser.value.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching last messaged user:', error);
      return null;
    }

    // Check if any messages are returned
    if (messages.length > 0) {
      return messages[0].to;
    } else {
      return null;
    }
  } catch (err) {
    console.error('Unexpected error fetching last messaged user:', err);
    return null;
  }
}

onMounted(async () => {
  // Fetch current user session
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError) {
    console.error(sessionError);
  } else if (sessionData.session) {
    loggedinuser.value = sessionData.session.user;

    // Fetch last messaged user
    const lastMessagedUserId = await fetchLastMessagedUser();

    // Fetch all users except the current user
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .neq('id', loggedinuser.value.id); // Exclude current user

    if (userError) {
      console.error(userError);
      return;
    }

    // Fetch profile data for each user
    let fetchedUsers = await fetchProfileDataForUsers(userData);

    // Move the last messaged user to the top if found
    if (lastMessagedUserId) {
      const index = fetchedUsers.findIndex(
        (user) => user.id === lastMessagedUserId
      );
      if (index > -1) {
        const [lastMessagedUser] = fetchedUsers.splice(index, 1);
        fetchedUsers.unshift(lastMessagedUser);
      }
    }

    users.value = fetchedUsers;
  }
});

function goToChat(userId) {
  if (loggedinuser.value) {
    router.push({
      path: '/chat',
      query: { to: userId, from: loggedinuser.value.id },
    });
  } else {
    console.error('User is not logged in');
  }
}
</script>

<style></style>
