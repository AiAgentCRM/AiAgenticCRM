# AiAgenticCRM Deployment Guide

## Production Setup

### Backend Configuration

1. **Environment Variables** - Create `.env` file in backend directory:
```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
MONGODB_URI=your_production_mongodb_uri_here
JWT_SECRET=your_production_jwt_secret_here
GROQ_API_KEY=your_groq_api_key_here
```

2. **Install Dependencies**:
```bash
cd backend
npm install
```

3. **Start Production Server**:
```bash
npm run start:prod
```

### Frontend Configuration

1. **Build for Production**:
```bash
cd frontend
npm install
npm run build:prod
```

2. **Deploy Build Folder**:
- Upload the `frontend/build` folder to your web server
- Configure your web server to serve the static files

### Domain Configuration

- **Frontend**: https://aiagenticcrm.com
- **Backend API**: https://api.aiagenticcrm.com

### CORS Configuration

The backend is configured to accept requests from:
- http://localhost:3000 (development)
- https://aiagenticcrm.com
- https://www.aiagenticcrm.com
- https://app.aiagenticcrm.com

### SSL/HTTPS Setup

Ensure both domains have valid SSL certificates for secure communication.

### Database Setup

1. Set up MongoDB Atlas or self-hosted MongoDB
2. Configure connection string in environment variables
3. Ensure proper network access and authentication

### WhatsApp Integration

1. Ensure the server can run headless Chrome for WhatsApp Web
2. Configure proper session storage for multi-tenant WhatsApp clients
3. Set up proper error handling and reconnection logic

### Monitoring & Logs

- Monitor server logs for WhatsApp connection status
- Track API usage and performance
- Set up error monitoring and alerting

### Security Considerations

1. Use strong JWT secrets
2. Implement rate limiting
3. Secure MongoDB access
4. Regular security updates
5. Backup strategies

## Quick Deployment

Run the deployment script:
```bash
chmod +x deploy.sh
./deploy.sh
```

This will:
- Install dependencies for both frontend and backend
- Build the frontend for production
- Prepare the backend for deployment
