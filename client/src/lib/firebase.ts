import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Verify required environment variables are present
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID'
] as const;

// Enhanced error handling for production
const missingVars = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);
if (missingVars.length > 0) {
  const errorMessage = `Missing required Firebase configuration: ${missingVars.join(', ')}`;
  if (import.meta.env.PROD) {
    console.error(errorMessage);
    throw new Error('Firebase configuration error. Please check deployment settings.');
  } else {
    console.warn(errorMessage);
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase with environment-specific configuration
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Enhanced logging for deployment troubleshooting
if (import.meta.env.DEV) {
  console.log('Firebase initialized in development mode');
} else {
  console.log('Firebase initialized in production mode');
}