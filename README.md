# ClipShift AI

Transform your photos and videos with ClipShift! Use simple text prompts to magically edit images with powerful AI. Turn videos into visual stories by editing them frame-by-frame. No complex tools needed—if you can type, you can create. Securely save all your work to a private cloud gallery. Your imagination is the only limit!

## Features

- **Photo Studio**: Upload any image and transform it using AI-powered editing with natural language prompts
- **Video Storyboard**: Extract key frames from videos and edit them individually
- **Private Gallery**: Securely save and organize your AI-edited creations with Firebase
- **Google Authentication**: Secure sign-in with your Google account
- **Mobile-Friendly**: Works seamlessly on any device

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript with Tailwind CSS
- **Authentication**: Firebase Authentication with Google Sign-In
- **Database**: Firebase Realtime Database
- **AI Processing**: Google Gemini API
- **Hosting**: Netlify

## Setup Instructions

### 1. Firebase Configuration

Before deploying, you need to set up Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new Firebase project or use an existing one
3. Enable Firebase Authentication and select Google as a sign-in provider
4. Enable Firebase Realtime Database and set up the following security rules:

```json
{
  "rules": {
    "creations": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

5. Copy your Firebase configuration from Project Settings > General > Your apps
6. Update the `firebaseConfig` object in `script.js` with your actual Firebase credentials

### 2. Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key for the Gemini API
3. Replace the `GEMINI_API_KEY` value in `script.js` with your actual API key

### 3. Deploy to Netlify

#### Option A: Using Netlify CLI (Recommended for Mobile)

1. Install Netlify CLI globally (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Initialize your site:
   ```bash
   netlify init
   ```

4. Deploy your site:
   ```bash
   netlify deploy --prod
   ```

#### Option B: Using GitHub and Netlify Dashboard

1. Push your code to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: ClipShift AI application"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. Go to [Netlify Dashboard](https://app.netlify.com/)
3. Click "Add new site" > "Import an existing project"
4. Select "GitHub" and authorize Netlify to access your repositories
5. Choose your ClipShift repository
6. Configure build settings:
   - Build command: (leave empty)
   - Publish directory: (leave empty or use `.`)
7. Click "Deploy site"

Your site will be automatically deployed and you'll receive a URL like `https://your-site-name.netlify.app`

### 4. Configure Custom Domain (Optional)

1. In Netlify Dashboard, go to Site settings > Domain management
2. Click "Add custom domain"
3. Follow the instructions to configure your DNS settings

## Post-Deployment Configuration

After deploying, make sure to:

1. Test Google Sign-In functionality
2. Update Firebase Authentication authorized domains:
   - Go to Firebase Console > Authentication > Settings > Authorized domains
   - Add your Netlify domain (e.g., `your-site-name.netlify.app`)
3. Test image upload and AI editing features
4. Verify that the gallery is saving and loading properly

## AdSense Integration

To monetize with Google AdSense:

1. Apply for Google AdSense at [google.com/adsense](https://www.google.com/adsense)
2. Once approved, add your AdSense code to the HTML files
3. Place ad units in appropriate locations (header, sidebar, or between content sections)

## File Structure

```
clipshift-app/
├── index.html          # Main application page with tab interface
├── script.js           # All JavaScript logic and API integrations
├── about.html          # About Us page
├── contact.html        # Contact page with support email
├── privacy.html        # Privacy Policy page
└── README.md           # This file
```

## Security Notes

- Never commit your actual Firebase config or API keys to public repositories
- Use environment variables or Netlify environment variables for sensitive data in production
- Review Firebase security rules to ensure user data is properly protected
- Keep your dependencies up to date

## Support

For questions or issues, please contact: shreyashbhange9823@gmail.com

## License

© 2025 ClipShift. All rights reserved.
