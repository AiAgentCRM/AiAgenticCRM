# AiAgenticCRM

An AI-powered WhatsApp autoresponder system with intelligent lead qualification and CRM capabilities.

## 🚀 Overview

AiAgenticCRM is a comprehensive solution that combines WhatsApp automation with AI-powered lead qualification, providing businesses with an intelligent way to handle customer inquiries and qualify leads automatically.

## 📁 Project Structure

```
AiAgenticCRM/
├── backend/              # Express.js REST API server
│   ├── routes/           # API routes
│   ├── models/           # Database models
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   └── server.js         # Main server file
├── frontend/             # React.js web application
│   ├── src/              # React components and logic
│   └── public/           # Static assets
├── package.json          # Root dependencies
└── README.md            # This file
```

## 🛠️ Features

- **AI-Powered Responses**: Intelligent conversation handling using Groq AI
- **Lead Qualification**: Automatic categorization of leads into 8 stages
- **WhatsApp Integration**: Seamless WhatsApp Web.js integration
- **Real-time Updates**: Live console updates and status tracking
- **Media Handling**: Support for images and PDFs
- **CRM Integration**: Comprehensive lead tracking and management

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- WhatsApp account
- Groq API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd AiAgenticCRM
   ```

2. **Install dependencies:**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env` file in the backend directory:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Start the application:**
   
   ```bash
   # Start backend (from backend directory)
   cd backend
   npm start
   
   # Start frontend (from frontend directory)
   cd frontend
   npm start
   ```

## 📊 Lead Stages

The system automatically categorizes leads into these stages:

1. **INITIAL_CONTACT** - First contact, gathering information
2. **SERVICE_INQUIRY** - Asking about services and pricing
3. **BUDGET_DISCUSSION** - Financial considerations
4. **TIMELINE_INQUIRY** - Project deadlines
5. **TECHNICAL_REQUIREMENTS** - Technical specifications
6. **MEETING_REQUEST** - Requesting consultations
7. **READY_TO_PROCEED** - Ready to start project
8. **FOLLOW_UP_NEEDED** - Needs follow-up

## 🔧 Configuration

### Backend Configuration

- Edit `backend/index.js` to customize company information
- Modify lead stage detection in the `LEAD_STAGES` object
- Configure WhatsApp settings and AI responses

### Frontend Configuration

- Customize the React app in `frontend/src/`
- Update branding and styling as needed
- Configure API endpoints for backend communication

## 🐛 Troubleshooting

### Common Issues

1. **Module not found errors:**
   - Ensure all dependencies are installed with `npm install`

2. **WhatsApp connection issues:**
   - Check internet connection
   - Verify WhatsApp account status
   - Restart the application if needed

3. **AI API errors:**
   - Verify your Groq API key is correct
   - Check API quota and limits

## 📝 License

MIT License - feel free to modify and use for your business needs.

## 🤝 Support

For issues or questions, please check the troubleshooting section or create an issue in the repository.

## 🔗 Links

- [Backend Documentation](./backend/README.md)
- [Groq AI Console](https://console.groq.com/)
- [WhatsApp Web.js Documentation](https://github.com/pedroslopez/whatsapp-web.js)
