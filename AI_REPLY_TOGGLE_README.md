# AI Reply Toggle Feature

## Overview
This feature adds a toggle button in the leads section to control whether automatic AI replies are sent to specific leads. By default, all leads have AI replies disabled, and users must manually enable them for each lead.

## Features

### 1. Lead-Level AI Reply Control
- Each lead now has an `aiReplyEnabled` field in the database
- Default value is `false` (AI replies are disabled by default)
- Users can toggle this setting individually for each lead

### 2. Toggle Button in Leads Table
- New "AI Reply" column added to the leads table
- Beautiful toggle switch with enabled/disabled states
- Real-time updates when toggling the setting
- Responsive design for mobile devices

### 3. Backend Integration
- AI reply functions now check the `aiReplyEnabled` field before sending messages
- Both `handleIncomingMessage` and the main WhatsApp client message handler respect this setting
- Logs when AI replies are skipped due to disabled setting

## Database Changes

### Lead Model Updates
```javascript
// New field added to Lead schema
aiReplyEnabled: { type: Boolean, default: false }
```

### Migration Script
A migration script (`update-existing-leads.js`) is provided to update existing leads:
```bash
node update-existing-leads.js
```

## Frontend Changes

### LeadsTable Component
- New "AI Reply" column header
- Toggle switch for each lead
- `handleAiReplyToggle` function to update the setting
- Real-time state updates

### CSS Styling
- Custom toggle switch design
- Responsive design for mobile
- Consistent with existing UI theme

## API Changes

### Lead Update Endpoint
The existing lead update endpoint now accepts the `aiReplyEnabled` field:
```javascript
PUT /api/:tenantId/leads/:id
{
  "aiReplyEnabled": true/false
}
```

## Usage

### Enabling AI Replies for a Lead
1. Navigate to the Leads section
2. Find the lead you want to enable AI replies for
3. Click the toggle switch in the "AI Reply" column
4. The toggle will turn green and show "Enabled"

### Disabling AI Replies for a Lead
1. Find the lead with AI replies enabled
2. Click the toggle switch to turn it off
3. The toggle will turn gray and show "Disabled"

## Benefits

1. **Granular Control**: Users can control AI replies on a per-lead basis
2. **Privacy**: Prevents unwanted AI responses to certain contacts
3. **Cost Control**: Helps manage AI conversation usage limits
4. **User Experience**: Clear visual indication of which leads have AI replies enabled

## Technical Implementation

### Backend Logic
```javascript
// Check if AI reply is enabled for this lead
if (!lead.aiReplyEnabled) {
  console.log(`AI reply disabled for lead ${lead.phone}, skipping AI reply`);
  return;
}
```

### Frontend State Management
```javascript
const handleAiReplyToggle = async (lead, enabled) => {
  await updateLead(tenantId, lead._id, { aiReplyEnabled: enabled });
  setLeads((prev) => prev.map(l => 
    l._id === lead._id ? { ...l, aiReplyEnabled: enabled } : l
  ));
};
```

## Security Considerations

- The toggle only affects AI replies, not manual messages
- Users can only modify leads for their own tenant
- All changes are logged for audit purposes

## Future Enhancements

1. **Bulk Operations**: Enable/disable AI replies for multiple leads at once
2. **Template Rules**: Set AI reply preferences based on lead source or stage
3. **Analytics**: Track which leads have AI replies enabled vs. disabled
4. **Automation**: Auto-enable AI replies based on certain conditions

## Troubleshooting

### AI Replies Not Working
1. Check if the lead has `aiReplyEnabled: true`
2. Verify the knowledgebase is configured
3. Check if the conversation limit is reached
4. Ensure WhatsApp client is connected

### Toggle Not Working
1. Check browser console for errors
2. Verify the API endpoint is accessible
3. Check if the lead ID is valid
4. Ensure proper authentication

## Support

For issues or questions about this feature, please check:
1. Backend logs for error messages
2. Frontend console for JavaScript errors
3. Network tab for API request/response issues
