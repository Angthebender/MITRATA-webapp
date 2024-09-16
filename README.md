# Mitrata - Social Media Platform

## Description
Mitrata is a social media platform that allows users to connect with others through real-time messaging, following, and sharing posts. Users can upload pictures, search for new connections, and explore profiles. Built with Quasar, Vue.js, and Supabase, Mitrata offers a seamless user experience with modern features for social interaction.

## Key Features
- **Real-Time Messaging**: Users can send direct messages instantly to each other.
- **Follow System**: Users can follow each other and view followers.
- **Post Pictures**: Upload pictures from the gallery or take new ones using the camera to share with others.
- **Search & Connect**: Search for other users and connect with them easily.
- **Profile Viewing**: View posts and followers of other users.
- **Profile Editing**: Update username, profile picture, and other details.
- **Explore Specific Users' Posts**: Users can explore posts shared by specific users.

## Tech Stack
- **Frontend**: Quasar Framework, Vue.js
- **Backend**: Supabase (authentication, storage, and database)

## Setup Instructions

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/mitrata.git
    cd mitrata
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory with the following environment variables (replace with your own values):
    ```bash
    VUE_APP_SUPABASE_URL=https://your_supabase_url
    VUE_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4. Run the app:
    ```bash
    quasar dev
    ```

5. Build for production:
    ```bash
    quasar build
    ```

## Contribution
Feel free to fork this project, create pull requests, or open issues for bugs or feature requests. Contributions are welcome!
