import { defineStore } from 'pinia';
import { supabase } from 'boot/supabase';
import { Notify } from 'quasar';

export const useAuthenticationstore = defineStore('counter', {
  state: () => ({
    to: '',
    from: '',
    email: '',
    password: '',
    error: '',
    username: '',
    user: '',
    dob: null,
    loginSuccess: false,
    userDetails: {},
    users: {},
    createAcc: false,
  }),
  actions: {
    async handleSubmit() {
      this.error = '';
      this.loginSuccess = false;
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: this.email,
          password: this.password,
        });
        if (error) {
          if (error.message === 'Invalid login credentials') {
            Notify.create({
              type: 'negative',
              message: 'Invalid credentials',
              position: 'bottom',
              timeout: 3000,
              group: false,
            });
          } else {
            console.error('Supabase error:', error);
          }
        } else {
          this.loginSuccess = true;
          Notify.create({
            type: 'positive',
            message: 'Login successful',
            position: 'bottom',
            timeout: 3000,
            group: false,
          });
          console.log('Logged in user:', data);
          await this.updateOnlineStatus(true);
        }
      } catch (err) {
        console.error('An unexpected error occurred:', err);
        this.error = 'An unexpected error occurred';
      }
    },
    async CreateAccount() {
      console.log('submitting...');
      this.error = '';
      if (!this.email || !this.username || !this.password || !this.dob) {
        this.error = 'All fields are required';
        Notify.create({
          type: 'negative',
          message: "Please don't leave the fields empty",
          position: 'bottom',
          timeout: 3000,
          group: false,
        });
        return;
      }

      const { data: existingUsers, error: existingUsersError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', this.username);

      if (existingUsersError) {
        console.error('Error checking existing users:', existingUsersError);
        Notify.create({
          type: 'negative',
          message: `Error checking username: ${existingUsersError.message}`,
          position: 'bottom',
          timeout: 3000,
          group: false,
        });
        return;
      }

      if (existingUsers && existingUsers.length > 0) {
        Notify.create({
          type: 'negative',
          message: `${this.username} already exists`,
          position: 'bottom',
          timeout: 3000,
          group: false,
        });
        return;
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email: this.email,
          password: this.password,
          options: {
            data: {
              username: this.username,
              dob: this.dob,
            },
          },
        });

        if (error) {
          this.error = error.message;
          console.error('Sign-up error:', error.message);
          Notify.create({
            type: 'negative',
            message: `Sign-up error: ${error.message}`,
            position: 'bottom',
            timeout: 3000,
            group: false,
          });
        } else {
          console.log('Sign-up successful:', data);
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user?.id,
              username: this.username,
              email: this.email,
              online: false, // Set default online status to false
            });
          if (profileError) {
            this.error = profileError.message;
            console.error('Inserting profile error:', profileError.message);
            Notify.create({
              type: 'negative',
              message: `Profile creation error: ${profileError.message}`,
              position: 'bottom',
              timeout: 3000,
              group: false,
            });
          } else {
            Notify.create({
              type: 'positive',
              message: 'Account created. Please check your email to verify.',
              position: 'bottom',
              timeout: 3000,
              group: false,
            });
            console.log('Account created. Please check your email to verify.');
            this.createAcc = true;
            this.email = '';
            this.password = '';
          }
        }
      } catch (err) {
        this.error = 'An unexpected error occurred';
        console.error('Unexpected error:', err);
        Notify.create({
          type: 'negative',
          message: 'An unexpected error occurred',
          position: 'bottom',
          timeout: 3000,
          group: false,
        });
      }
    },
    async logoutUser() {
      try {
        await this.updateOnlineStatus(false);
        await supabase.auth.signOut();
        this.email = '';
        this.password = '';
        this.username = '';
        Notify.create({
          type: 'positive',
          message: 'Logout successful',
          position: 'bottom',
          timeout: 3000,
          group: false,
        });
      } catch (error) {
        console.error('Error logging out:', error);
        Notify.create({
          type: 'negative',
          message: `Error logging out: ${error}`,
          position: 'bottom',
          timeout: 3000,
          group: false,
        });
      }
    },
    async updateOnlineStatus(status: boolean) {
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error);
        return;
      }
      const user = sessionData?.session?.user;
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ online: status })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating online status:', updateError);
        } else {
          console.log(
            `User ${status ? 'online' : 'offline'} status updated successfully`
          );
        }
      }
    },
    subscribeToAuthChanges() {
      supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
          this.updateOnlineStatus(true);
        } else if (event === 'SIGNED_OUT') {
          this.updateOnlineStatus(false);
        }
      });
    },

    async init() {
      this.subscribeToAuthChanges();
    },
  },
});
