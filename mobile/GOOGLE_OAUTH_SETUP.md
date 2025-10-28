# Google OAuth Setup for BizPilot Mobile

This guide explains how to configure Google OAuth authentication for the BizPilot mobile app using expo-auth-session.

## Prerequisites

- Google Cloud Console account
- Expo development environment
- BizPilot Mobile app project

## Step 1: Google Cloud Console Configuration

### 1.1 Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Select **Application type**: `Web application`

### 1.2 Configure Authorized Redirect URIs

For **Expo Go** and development, add these redirect URIs:

```
https://auth.expo.io/@your-expo-username/your-app-slug
```

For **standalone apps**, add:

```
exp://localhost:19000/--/oauth
exp://your-app.exp.direct/--/oauth
```

For **web builds**, add:

```
http://localhost:19006/oauth
https://your-domain.com/oauth
```

### 1.3 Get Client ID

After creating the credentials, copy the **Client ID** (looks like: `123456789-abc123.apps.googleusercontent.com`)

## Step 2: Environment Configuration

### 2.1 Create Environment File

Create a `.env` file in your project root (copy from `.env.example`):

```env
EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id_here
```

### 2.2 Update app.json/app.config.js

Add the Google OAuth scheme to your Expo configuration:

```json
{
  "expo": {
    "scheme": "exp",
    "web": {
      "bundler": "metro"
    }
  }
}
```

## Step 3: Expo Configuration

### 3.1 Get Your Expo Redirect URI

Run this command to get your redirect URI:

```bash
npx expo start
```

The redirect URI will be logged in the console and should look like:
```
https://auth.expo.io/@your-username/bizpilot-mobile
```

### 3.2 Update Google Cloud Console

Go back to Google Cloud Console and add the exact redirect URI from step 3.1 to your OAuth client configuration.

## Step 4: Test the Implementation

### 4.1 Run the App

```bash
npx expo start
```

### 4.2 Test Google Login

1. Open the app in Expo Go
2. Navigate to the login screen
3. Tap "Sign in with Google"
4. Complete the OAuth flow in the browser
5. Verify successful login and session storage

## Step 5: Production Configuration

### 5.1 Standalone App

For production builds, update the redirect URI to:

```
your-app-scheme://oauth
```

### 5.2 Web Deployment

For web deployments, add your production domain:

```
https://your-production-domain.com/oauth
```

## Troubleshooting

### Common Issues

1. **"OAuth client ID not configured"**
   - Ensure `EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` is set in your `.env` file
   - Restart your Expo development server

2. **"redirect_uri_mismatch"**
   - Verify the redirect URI in Google Cloud Console matches exactly
   - Check for extra spaces or trailing slashes

3. **"invalid_client"**
   - Verify your client ID is correct
   - Ensure you're using a Web Application type client ID

4. **OAuth flow doesn't complete**
   - Check that `WebBrowser.maybeCompleteAuthSession()` is called
   - Verify your app scheme configuration

### Debug Mode

Enable debug logging by adding this to your hook:

```typescript
console.log('Google OAuth Config:');
console.log('Client ID:', clientId);
console.log('Redirect URI:', redirectUri);
```

## Security Notes

- Never commit your `.env` file to version control
- Use different OAuth clients for development and production
- Regularly rotate your client secrets
- Monitor OAuth usage in Google Cloud Console

## Next Steps

After completing OAuth setup:

1. Integrate with Supabase authentication
2. Implement user profile management
3. Handle session persistence
4. Add logout functionality
