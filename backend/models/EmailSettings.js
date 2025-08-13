const mongoose = require("mongoose");

const emailSettingsSchema = new mongoose.Schema({
  // SMTP Configuration
  smtp: {
    host: {
      type: String,
      trim: true,
      maxlength: 255,
      default: ''
    },
    port: {
      type: Number,
      min: 1,
      max: 65535,
      default: 587
    },
    secure: {
      type: Boolean,
      default: true
    },
    username: {
      type: String,
      trim: true,
      maxlength: 255,
      default: ''
    },
    password: {
      type: String,
      maxlength: 255,
      select: false,
      default: ''
    },
    encryption: {
      type: String,
      enum: ['tls', 'ssl', 'none'],
      default: 'tls'
    },
    fromEmail: {
      type: String,
      trim: true,
      maxlength: 255,
      default: ''
    },
    fromName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'AiAgenticCRM'
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  
  // Email Templates
  templates: {
    welcome: {
      subject: {
        type: String,
        default: "Welcome to AiAgenticCRM!",
        maxlength: 200
      },
      body: {
        type: String,
        default: `
          <h2>Welcome to AiAgenticCRM!</h2>
          <p>Hi {{userName}},</p>
          <p>Thank you for registering with AiAgenticCRM. We're excited to help you transform your business communication!</p>
          <p>Your account has been created successfully. You can now:</p>
          <ul>
            <li>Connect your WhatsApp account</li>
            <li>Set up your AI responses</li>
            <li>Start managing your leads</li>
          </ul>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Best regards,<br>The AiAgenticCRM Team</p>
        `,
        maxlength: 5000
      },
      isActive: {
        type: Boolean,
        default: true
      }
    },
    planPurchase: {
      subject: {
        type: String,
        default: "Plan Purchase Confirmation - AiAgenticCRM",
        maxlength: 200
      },
      body: {
        type: String,
        default: `
          <h2>Plan Purchase Confirmation</h2>
          <p>Hi {{userName}},</p>
          <p>Thank you for upgrading your AiAgenticCRM plan!</p>
          <p><strong>Plan Details:</strong></p>
          <ul>
            <li>Plan: {{planName}}</li>
            <li>Amount: {{amount}}</li>
            <li>Next Billing: {{nextBillingDate}}</li>
          </ul>
          <p>Your new features are now active. Enjoy the enhanced capabilities!</p>
          <p>Best regards,<br>The AiAgenticCRM Team</p>
        `,
        maxlength: 5000
      },
      isActive: {
        type: Boolean,
        default: true
      }
    },
    passwordReset: {
      subject: {
        type: String,
        default: "Password Reset Request - AiAgenticCRM",
        maxlength: 200
      },
      body: {
        type: String,
        default: `
          <h2>Password Reset Request</h2>
          <p>Hi {{userName}},</p>
          <p>We received a request to reset your password. Click the link below to create a new password:</p>
          <p><a href="{{resetLink}}" style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
          <p>Best regards,<br>The AiAgenticCRM Team</p>
        `,
        maxlength: 5000
      },
      isActive: {
        type: Boolean,
        default: true
      }
    },
    accountApproved: {
      subject: {
        type: String,
        default: "Account Approved - AiAgenticCRM",
        maxlength: 200
      },
      body: {
        type: String,
        default: `
          <h2>Account Approved!</h2>
          <p>Hi {{userName}},</p>
          <p>Great news! Your AiAgenticCRM account has been approved.</p>
          <p>You can now log in and start using all the features:</p>
          <ul>
            <li>WhatsApp integration</li>
            <li>AI-powered responses</li>
            <li>Lead management</li>
            <li>Analytics dashboard</li>
          </ul>
          <p>Welcome aboard!</p>
          <p>Best regards,<br>The AiAgenticCRM Team</p>
        `,
        maxlength: 5000
      },
      isActive: {
        type: Boolean,
        default: true
      }
    },
    accountBlocked: {
      subject: {
        type: String,
        default: "Account Status Update - AiAgenticCRM",
        maxlength: 200
      },
      body: {
        type: String,
        default: `
          <h2>Account Status Update</h2>
          <p>Hi {{userName}},</p>
          <p>Your AiAgenticCRM account has been temporarily suspended due to policy violations.</p>
          <p>Reason: {{reason}}</p>
          <p>If you believe this is an error, please contact our support team.</p>
          <p>Best regards,<br>The AiAgenticCRM Team</p>
        `,
        maxlength: 5000
      },
      isActive: {
        type: Boolean,
        default: true
      }
    },
    usageLimit: {
      subject: {
        type: String,
        default: "Usage Limit Reached - AiAgenticCRM",
        maxlength: 200
      },
      body: {
        type: String,
        default: `
          <h2>Usage Limit Reached</h2>
          <p>Hi {{userName}},</p>
          <p>You've reached your monthly usage limit for {{feature}}.</p>
          <p>Current usage: {{currentUsage}} / {{limit}}</p>
          <p>To continue using this feature, please upgrade your plan or wait until next month's reset.</p>
          <p>Best regards,<br>The AiAgenticCRM Team</p>
        `,
        maxlength: 5000
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Email preferences
  preferences: {
    sendWelcomeEmail: {
      type: Boolean,
      default: true
    },
    sendPlanPurchaseEmail: {
      type: Boolean,
      default: true
    },
    sendAccountApprovalEmail: {
      type: Boolean,
      default: true
    },
    sendUsageLimitEmail: {
      type: Boolean,
      default: true
    },
    sendMonthlyReport: {
      type: Boolean,
      default: false
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

module.exports = mongoose.model("EmailSettings", emailSettingsSchema);
