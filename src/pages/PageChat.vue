<template>
  <q-page class="flex column">
    <q-banner v-if="error" inline-actions class="bg-grey-5 text-center">
      {{ error }}
    </q-banner>
    <div
      ref="messageContainer"
      class="q-pa-sm flex column messages-container no-wrap"
    >
      <q-chat-message
        class="full-width"
        v-for="message in messages"
        :key="message.id"
        :name="getUserName(message.from)"
        :text="[message.message]"
        :sent="message.from === loggedInUserId"
      />
    </div>
    <q-footer elevated>
      <q-toolbar>
        <q-form class="full-width" @submit.prevent="sendMessage">
          <q-input
            class="full-width"
            bg-color="white"
            outlined
            rounded
            v-model="newMessage"
            label="Message"
            dense
          >
            <template v-slot:after>
              <q-btn
                round
                dense
                flat
                icon="send"
                color="white"
                @click="sendMessage"
              />
            </template>
          </q-input>
        </q-form>
      </q-toolbar>
    </q-footer>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { supabase } from 'boot/supabase';
import { useRoute } from 'vue-router';

const $route = useRoute();
const newMessage = ref('');
const messages = ref([]);
const usernames = ref({});
const error = ref(null);
const loggedInUserId = ref(null);

const messageContainer = ref(null);
const tousername = ref('');
const from = $route.query.from;
const to = $route.query.to;

async function usersUsername() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', to);

    if (error) {
      console.error('Error fetching username:', error);
      return;
    }

    if (data.length > 0) {
      tousername.value = data[0].username;
    } else {
      console.error('No username found for the given user ID');
    }
  } catch (error) {
    console.error('An error occurred while fetching the username:', error);
  }
}

async function fetchUsername(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching username:', error);
    return null;
  }

  return data.username;
}

function getUserName(userId) {
  return usernames.value[userId] || 'Unknown';
}

async function loadUsernames() {
  const fromUsername = await fetchUsername(from);
  const toUsername = await fetchUsername(to);

  if (fromUsername) {
    usernames.value[from] = fromUsername;
  }

  if (toUsername) {
    usernames.value[to] = toUsername;
  }
}

async function loadMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(from.eq.${loggedInUserId.value},to.eq.${to}),and(from.eq.${to},to.eq.${loggedInUserId.value})`
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching messages:', error);
    error.value = 'Failed to fetch messages';
  } else {
    messages.value = data.reverse();
    await nextTick();
    scrollToBottom(); // Ensure to scroll after loading messages
  }
}

async function scrollToBottom() {
  if (messageContainer.value !== null) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  } else {
    console.log('lastMessage ref is not defined'); // Debug log
  }
}

function subscribeToMessages() {
  return supabase
    .channel('public:messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        const newMessage = payload.new;
        if (
          (newMessage.from === loggedInUserId.value && newMessage.to === to) ||
          (newMessage.from === to && newMessage.to === loggedInUserId.value)
        ) {
          messages.value.push(newMessage);
          nextTick(scrollToBottom);
        }
      }
    )
    .subscribe();
}

onMounted(async () => {
  usersUsername();
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    console.error(sessionError);
    error.value = 'Failed to get session';
  } else {
    loggedInUserId.value = sessionData.session.user.id;
    const subscription = subscribeToMessages();
    await Promise.all([loadUsernames(), loadMessages()]);

    onUnmounted(() => {
      supabase.removeSubscription(subscription);
    });
  }
});

async function sendMessage() {
  if (newMessage.value.trim() === '') {
    return; // Do not send empty messages
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          message: newMessage.value,
          from: loggedInUserId.value,
          to: to,
          created_at: new Date(),
        },
      ])
      .select();

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    // Ensure data is not null and contains at least one element
    if (data && data.length > 0) {
      newMessage.value = ''; // Clear the input field after sending the message
      nextTick(scrollToBottom); // Scroll to bottom after sending a message
    } else {
      console.error('Unexpected response: no data returned');
    }
  } catch (err) {
    console.error('Unexpected error sending message:', err);
  }
}
</script>

<style>
.messages-container {
  overflow-y: auto; /* Enable vertical scrolling */
  padding: 10px; /* Add padding to the container */
  max-height: calc(100vh - 141px);
}
</style>
