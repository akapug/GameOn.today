# Deployment Instructions for Sports Game Coordination Platform

## Prerequisites
1. Ensure all required environment variables are set in Replit Secrets:
   - FIREBASE_API_KEY
   - FIREBASE_PROJECT_ID
   - FIREBASE_APP_ID
   - OPENWEATHER_API_KEY

## Deployment Steps

1. **Verify Environment Variables**
   - Go to your Replit project's "Secrets" tab
   - Confirm all required environment variables are present
   - These will automatically be used in production

2. **Deploy Using Replit**
   - Click the "Deploy" button in the top right of your Replit project
   - This will automatically:
     - Build the project (`npm run build`)
     - Deploy to your Replit subdomain
     - Use production environment variables

3. **Post-Deployment Configuration**
   - Add your Replit deployment URL to Firebase Console:
     - Go to Firebase Console > Authentication > Settings
     - Add your replit.app domain to "Authorized domains"
     - Format: `your-project.replit.app`

4. **Verify Deployment**
   - Navigate to your deployed Replit URL
   - Confirm Firebase authentication works
   - Test the weather integration
   - Check mobile responsiveness

## Development Workflow

1. Make changes in development environment
2. Test locally using `npm run dev`
3. Deploy using Replit's deploy button
4. Verify changes in production

## Notes
- The same Firebase project is used for both development and production
- Environment variables are managed through Replit's Secrets
- Static assets are served from the `dist/public` directory
- API routes are prefixed with `/api`