const mongoose = require("mongoose");

const websiteSettingsSchema = new mongoose.Schema({
  // Site branding
  siteName: {
    type: String,
    default: "AiAgenticCRM",
    trim: true,
    maxlength: 100
  },
  siteLogo: {
    type: String, // URL to logo file
    default: ""
  },
  siteFavicon: {
    type: String, // URL to favicon file
    default: ""
  },
  
  // Homepage content
  homepage: {
    heroTitle: {
      type: String,
      default: "AI-Powered WhatsApp CRM",
      maxlength: 200
    },
    heroSubtitle: {
      type: String,
      default: "Automate your customer interactions with intelligent AI responses",
      maxlength: 500
    },
    heroDescription: {
      type: String,
      default: "Transform your business communication with our advanced WhatsApp CRM system. Get instant AI-powered responses, lead qualification, and automated follow-ups.",
      maxlength: 1000
    },
    features: [{
      title: {
        type: String,
        maxlength: 100
      },
      description: {
        type: String,
        maxlength: 300
      },
      icon: {
        type: String,
        maxlength: 50
      }
    }],
    testimonials: [{
      name: {
        type: String,
        maxlength: 100
      },
      company: {
        type: String,
        maxlength: 100
      },
      text: {
        type: String,
        maxlength: 500
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      }
    }]
  },
  
  // Contact information
  contact: {
    email: {
      type: String,
      default: "support@aiagenticcrm.com"
    },
    phone: {
      type: String,
      default: ""
    },
    address: {
      type: String,
      default: ""
    },
    socialMedia: {
      facebook: String,
      twitter: String,
      linkedin: String,
      instagram: String
    }
  },
  
  // Footer content
  footer: {
    description: {
      type: String,
      default: "Empowering businesses with AI-driven customer relationship management.",
      maxlength: 500
    },
    links: [{
      title: {
        type: String,
        maxlength: 50
      },
      url: {
        type: String,
        maxlength: 200
      }
    }]
  },
  
  // SEO settings
  seo: {
    metaTitle: {
      type: String,
      default: "AiAgenticCRM - AI-Powered WhatsApp CRM",
      maxlength: 60
    },
    metaDescription: {
      type: String,
      default: "Transform your business communication with AI-powered WhatsApp CRM. Automate responses, qualify leads, and boost customer engagement.",
      maxlength: 160
    },
    metaKeywords: {
      type: String,
      default: "WhatsApp CRM, AI CRM, customer relationship management, business automation",
      maxlength: 500
    }
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("WebsiteSettings", websiteSettingsSchema);
