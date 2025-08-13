const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema({
  // Branding settings
  branding: {
    companyName: {
      type: String,
      default: "AiAgenticCRM",
      trim: true,
      maxlength: 100
    },
    primaryColor: {
      type: String,
      default: "#667eea",
      maxlength: 7
    },
    secondaryColor: {
      type: String,
      default: "#764ba2",
      maxlength: 7
    },
    accentColor: {
      type: String,
      default: "#f093fb",
      maxlength: 7
    },
    logoLight: {
      type: String, // URL to light version logo
      default: ""
    },
    logoDark: {
      type: String, // URL to dark version logo
      default: ""
    }
  },

  // Company Information
  company: {
    name: {
      type: String,
      default: "AiAgenticCRM",
      trim: true,
      maxlength: 100
    },
    logo: {
      type: String, // URL to company logo
      default: ""
    },
    address: {
      street: {
        type: String,
        default: "",
        maxlength: 200
      },
      city: {
        type: String,
        default: "",
        maxlength: 100
      },
      state: {
        type: String,
        default: "",
        maxlength: 100
      },
      zipCode: {
        type: String,
        default: "",
        maxlength: 20
      },
      country: {
        type: String,
        default: "",
        maxlength: 100
      }
    },
    supportPhone: {
      type: String,
      default: "",
      maxlength: 20
    },
    supportEmail: {
      type: String,
      default: "",
      maxlength: 100
    }
  },
  
  // Theme settings
  theme: {
    mode: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    fontFamily: {
      type: String,
      default: 'Inter, system-ui, sans-serif',
      maxlength: 100
    },
    borderRadius: {
      type: String,
      enum: ['none', 'sm', 'md', 'lg', 'xl'],
      default: 'md'
    },
    animationSpeed: {
      type: String,
      enum: ['slow', 'normal', 'fast'],
      default: 'normal'
    }
  },
  
  // Language and localization
  localization: {
    defaultLanguage: {
      type: String,
      default: 'en',
      maxlength: 5
    },
    supportedLanguages: [{
      code: {
        type: String,
        maxlength: 5
      },
      name: {
        type: String,
        maxlength: 50
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    timezone: {
      type: String,
      default: 'UTC',
      maxlength: 50
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY',
      maxlength: 20
    },
    timeFormat: {
      type: String,
      enum: ['12h', '24h'],
      default: '12h'
    }
  },
  
  // System modules
  modules: {
    whatsapp: {
      enabled: {
        type: Boolean,
        default: true
      },
      maxConnections: {
        type: Number,
        default: 10,
        min: 1,
        max: 100
      }
    },
    ai: {
      enabled: {
        type: Boolean,
        default: true
      },
      provider: {
        type: String,
        enum: ['openai', 'groq', 'anthropic'],
        default: 'groq'
      },
      maxTokens: {
        type: Number,
        default: 1000,
        min: 100,
        max: 4000
      }
    },
    analytics: {
      enabled: {
        type: Boolean,
        default: true
      },
      retentionDays: {
        type: Number,
        default: 90,
        min: 7,
        max: 365
      }
    },
    notifications: {
      enabled: {
        type: Boolean,
        default: true
      },
      emailNotifications: {
        type: Boolean,
        default: true
      },
      pushNotifications: {
        type: Boolean,
        default: false
      }
    },
    payments: {
      enabled: {
        type: Boolean,
        default: true
      },
      currency: {
        type: String,
        default: 'USD',
        maxlength: 3
      },
      taxRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      }
    }
  },
  
  // Security settings
  security: {
    passwordPolicy: {
      minLength: {
        type: Number,
        default: 8,
        min: 6,
        max: 20
      },
      requireUppercase: {
        type: Boolean,
        default: true
      },
      requireLowercase: {
        type: Boolean,
        default: true
      },
      requireNumbers: {
        type: Boolean,
        default: true
      },
      requireSpecialChars: {
        type: Boolean,
        default: false
      }
    },
    sessionTimeout: {
      type: Number,
      default: 480, // 8 hours in minutes
      min: 15,
      max: 1440
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
      min: 3,
      max: 10
    },
    lockoutDuration: {
      type: Number,
      default: 120, // 2 hours in minutes
      min: 15,
      max: 1440
    },
    twoFactorAuth: {
      enabled: {
        type: Boolean,
        default: false
      },
      requiredForAdmins: {
        type: Boolean,
        default: false
      }
    }
  },
  
  // Maintenance settings
  maintenance: {
    mode: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: "System is under maintenance. Please try again later.",
      maxlength: 500
    },
    allowedIPs: [{
      type: String,
      maxlength: 45
    }]
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

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);
