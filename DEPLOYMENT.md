# Deployment Guide for Sports Game Coordination Platform

## Replit Deployment Configuration

### Prerequisites
- Ensure you have all required environment variables set up in your Replit secrets:
  - FIREBASE_API_KEY
  - FIREBASE_PROJECT_ID
  - FIREBASE_APP_ID
  - OPENWEATHER_API_KEY

### Development Environment
1. Local development uses the .env.example file as a template
2. Copy .env.example to .env and fill in your development credentials
3. Run the development server using `npm run dev`

### Production Deployment Steps

1. **Environment Setup**
   - In your Replit project, go to the "Secrets" tab
   - Add all required environment variables listed above
   - These will be automatically used in production

2. **Firebase Configuration**
   - Add your Replit deployment URL to Firebase Console:
     - Go to Firebase Console > Authentication > Settings
     - Add your replit.app domain to "Authorized domains"
     - Format: `your-project.replit.app`

3. **Deployment Process**
   - Use Replit's "Deploy" button in the top right
   - This will automatically:
     - Build the project (`npm run build`)
     - Deploy to your Replit subdomain
     - Use production environment variables

4. **Verify Deployment**
   - Check your deployed app at your Replit URL
   - Verify Firebase authentication works
   - Confirm weather integration is functioning

### Development Workflow

1. Make changes in the development environment
2. Test thoroughly using `npm run dev`
3. Deploy using Replit's deploy button
4. Verify changes in production

### Notes
- The same Firebase project is used for both development and production
- Environment variables are managed through Replit's Secrets system
- Replit handles SSL/TLS certificates automatically
- No additional configuration needed for basic deployment