# Docker and Render Deployment Guide for GameOn

## Local Development with Docker

### Prerequisites
- Docker and Docker Compose installed on your machine
- Firebase project set up
- OpenWeather API key

### Setup Environment Variables
1. Create a `.env` file in the root directory based on `.env.example`:
   ```
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id

   # OpenWeather Configuration
   OPENWEATHER_API_KEY=your_openweather_api_key

   # Database Configuration
   DATABASE_URL=postgres://postgres:postgres@db:5432/gameon

   # Environment
   NODE_ENV=development
   DOCKER=true
   ```

### Start Development Environment
1. Build and start the containers:
   ```bash
   npm run docker:dev
   ```

2. Initialize the database (first time only):
   ```bash
   npm run docker:db:init
   ```

3. Access the application:
   - Web app: http://localhost:3000
   - API: http://localhost:3000/api
   - Vite dev server: http://localhost:5000

### Testing Production Build Locally
1. Build and run the production container:
   ```bash
   npm run docker:prod
   ```

2. Access the production build at http://localhost:3000

## Deployment to Render

### Prerequisites
- Render account
- Docker Hub account (optional)
- Domain name (optional for custom domain)

### Deployment Steps

#### Option 1: Using render.yaml (Recommended)
1. Push your code to a GitHub repository
2. In Render dashboard, click "New" and select "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file and set up the services
5. Add your environment variables in the Render dashboard:
   - VITE_FIREBASE_API_KEY
   - VITE_FIREBASE_PROJECT_ID
   - VITE_FIREBASE_APP_ID
   - OPENWEATHER_API_KEY

#### Option 2: Manual Setup
1. In Render dashboard, click "New" and select "Web Service"
2. Select "Docker" as the environment
3. Connect your GitHub repository
4. Configure the service:
   - Name: gameon
   - Root Directory: ./
   - Docker Command: leave empty (uses CMD from Dockerfile)
5. Add environment variables:
   - NODE_ENV: production
   - PORT: 3000
   - DATABASE_URL: (use Render PostgreSQL internal connection string)
   - VITE_FIREBASE_API_KEY: your Firebase API key
   - VITE_FIREBASE_PROJECT_ID: your Firebase project ID
   - VITE_FIREBASE_APP_ID: your Firebase app ID
   - OPENWEATHER_API_KEY: your OpenWeather API key
6. Set up a PostgreSQL database in Render
7. Link the database to your web service

### Setting Up Custom Domain
1. In your web service settings, go to "Custom Domain"
2. Add your domain name
3. Configure DNS records as instructed by Render
4. Wait for DNS propagation and SSL certificate issuance

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correctly set
- Check if PostgreSQL service is running
- Ensure database schemas are created

### Build Failures
- Check Docker build logs in Render
- Verify all environment variables are set
- Check for any syntax errors in your code

### Runtime Errors
- Check application logs in Render dashboard
- Verify Firebase configuration
- Check for any API rate limiting issues with OpenWeather 