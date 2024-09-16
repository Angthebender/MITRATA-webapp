<template>
  <q-page class="constrain-more q-pa-md">
    <div class="camera-frame q-pa-md">
      <video v-show="!imagecaptured" ref="video" class="full-width" autoplay />
      <canvas
        v-show="imagecaptured"
        ref="canvas"
        class="full-width"
        height="240"
      />
    </div>
    <div class="text-center q-pa-md">
      <q-btn
        v-if="hasCameraSupport"
        @click="captureImage"
        color="grey-10"
        icon="bi-camera"
        size="lg"
        round
      />
      <q-file
        v-else
        outlined
        v-model="imageUpload"
        @input="captureImageFallback"
        label="Choose an Image"
        accept="image/*"
      >
        <template v-slot:prepend>
          <q-icon name="bi-card-image" />
        </template>
      </q-file>
      <div class="row justify-center q-ma-md">
        <q-input
          class="col col-sm-10"
          v-model="post.caption"
          label="Caption"
          dense
        />
      </div>
      <div class="row justify-center q-ma-md">
        <q-input
          class="col col-sm-10"
          v-model="post.location"
          label="Location"
          dense
        >
          <template v-slot:append>
            <q-btn round dense flat icon="bi-geo-alt" @click="fetchLocation" />
          </template>
        </q-input>
      </div>
      <div class="row justify-center q-mt-lg">
        <q-btn
          unelevated
          rounded
          color="primary"
          label="POST"
          @click="submitPost"
        />
      </div>
      <q-spinner v-if="loading" />
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { uid, Notify } from 'quasar';
import { supabase } from 'boot/supabase';

const video = ref(null);
const canvas = ref(null);
const imagecaptured = ref(false);
const imageUpload = ref(null);
const hasCameraSupport = ref(true);
const loading = ref(false);
const account = ref('');
const Username = ref('');
const currentuserid = ref('');
const post = reactive({
  id: uid(),
  caption: '',
  location: '',
  photo: null,
  date: new Date().toISOString(), // Use ISO format for the created_at field
});

async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw new Error('Error getting session or no session found');
    }
    account.value = data.session;
    currentuserid.value = data.session.user.id;

    // Fetch the username from the profiles table using the user ID
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', currentuserid.value)
      .single();

    if (profileError) {
      throw profileError;
    }
    Username.value = profileData.username;
  } catch (err) {
    console.error('Error in getSession:', err.message);
    this.$router.push('/login');
  }
}
getSession();

const initCamera = () => {
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      video.value.srcObject = stream;
    })
    .catch((error) => {
      hasCameraSupport.value = false;
      console.error('Error accessing camera:', error);
    });
};

const captureImage = () => {
  const videoElement = video.value;
  const canvasElement = canvas.value;
  canvasElement.width = videoElement.getBoundingClientRect().width;
  canvasElement.height = videoElement.getBoundingClientRect().height;
  const context = canvasElement.getContext('2d');
  context.drawImage(
    videoElement,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );
  imagecaptured.value = true;
  post.photo = dataURItoBlob(canvasElement.toDataURL());
  disableCamera();
};

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
      imagecaptured.value = true;
    };
    img.src = event.target.result;
    post.photo = file;
  };
  reader.onerror = (error) => {
    console.error('Error reading image:', error);
  };
  reader.readAsDataURL(file);
};

const disableCamera = () => {
  if (video.value && video.value.srcObject) {
    video.value.srcObject.getVideoTracks().forEach((track) => {
      track.stop();
    });
  }
};

const dataURItoBlob = (dataURI) => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mimeString });
};

const fetchLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          post.location = `${data.address.city}, ${data.address.country}`;
        } catch (error) {
          console.error('Error fetching location:', error);
        }
      },
      (error) => {
        console.error('Error getting geolocation:', error);
      }
    );
  } else {
    console.error('Geolocation is not supported by this browser.');
  }
};

const submitPost = async () => {
  if (!post.photo) {
    console.error('No photo to upload');
    return;
  }
  loading.value = true;
  Notify.create({
    spinner: true,
    type: 'positive',
    message: 'UPLOADING..',
    position: 'bottom',
    timeout: 3000,
    group: false,
  });
  try {
    // Verify the username exists in the profiles table before uploading
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', Username.value);
    if (profileError) {
      throw profileError;
    }
    if (profileData.length === 0) {
      throw new Error('User profile does not exist.');
    }
    // Generate a unique file name using user ID and current timestamp
    const fileName = `${currentuserid.value}/${Date.now()}_${post.id}.jpg`;
    // Upload the image to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('posts')
      .upload(fileName, post.photo, {
        cacheControl: '3600',
        upsert: false,
      });
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      loading.value = false;
      return;
    }
    // Get the public URL of the uploaded image
    const { data: publicUrlData, error: urlError } = supabase.storage
      .from('posts')
      .getPublicUrl(fileName);
    if (urlError) {
      console.error('Error getting public URL:', urlError);
      loading.value = false;
      return;
    }
    // Save the post details in the Supabase database
    const { error: dbError } = await supabase.from('posts').insert([
      {
        id: post.id,
        created_at: post.date,
        location: post.location,
        caption: post.caption,
        user_id: currentuserid.value,
        users_username: Username.value,
        media_url: publicUrlData.publicUrl,
      },
    ]);
    if (dbError) {
      console.error('Error saving post:', dbError);
    } else {
      console.log('Post saved successfully');
      Notify.create({
        type: 'positive',
        message: 'Post created successfully',
        position: 'bottom',
        timeout: 3000,
        group: false,
      });
      // Reset post data
      post.caption = '';
      post.location = '';
      post.photo = null;
      imagecaptured.value = false;
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  initCamera();
});

onBeforeUnmount(() => {
  if (hasCameraSupport.value) {
    disableCamera();
  }
});
</script>

<style>
.camera-frame {
  border: 2px solid;
  background-color: grey-10;
  border-radius: 10px;
}
</style>
