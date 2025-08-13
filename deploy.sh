#!/bin/bash

echo "🚀 Starting AiAgenticCRM Deployment..."

# Build Frontend
echo "📦 Building Frontend..."
cd frontend
npm install
npm run build:prod
echo "✅ Frontend build completed"

# Build Backend
echo "🔧 Preparing Backend..."
cd ../backend
npm install
echo "✅ Backend dependencies installed"

echo "🎉 Deployment preparation completed!"
echo ""
echo "📋 Next steps:"
echo "1. Upload the 'frontend/build' folder to your web server"
echo "2. Deploy the 'backend' folder to your API server"
echo "3. Set up environment variables on your server"
echo "4. Start the backend with: npm run start:prod"
echo ""
echo "🌐 Production URLs:"
echo "Frontend: https://aiagenticcrm.com"
echo "Backend: https://api.aiagenticcrm.com"
