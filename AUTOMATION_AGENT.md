# 🤖 Booking App Automation Agent

The Automation Agent provides AI-powered automation for your booking system, including daily summaries, follow-up emails, and bulk rescheduling capabilities.

## Features

### 📊 Daily Summary
- Generates comprehensive daily booking reports
- Tracks revenue, booking counts, and coach performance
- Sends email summaries to admin users
- Includes upcoming bookings and new client insights

### 📧 Follow-Up Emails
- AI-generated follow-up emails for completed bookings
- Smart email types based on client history:
  - **Feedback requests** for first-time clients
  - **Upsell offers** for high-value clients
  - **Rebooking reminders** for regular clients
- Customizable timing (default: 1 day after completion)

### 🔄 Bulk Reschedule
- Automatically reschedule multiple bookings when a coach is unavailable
- Finds optimal replacement time slots
- Sends personalized notifications to affected clients
- Transaction-safe operations with rollback on failures

## Quick Start

### 1. Environment Setup

Copy the environment template and configure your credentials:

```bash
cp .env.automation.example .env.local
# Edit .env.local with your configuration
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `EMAIL_PROVIDER` - Either `sendgrid` or `gmail`
- `SENDGRID_API_KEY` or `GMAIL_EMAIL` + `GMAIL_PASSWORD`

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Automation Commands

#### Daily Summary
```bash
# Send today's summary
npm run automation daily-summary

# Send summary for specific date
npm run automation daily-summary 2025-01-15
```

#### Follow-Up Emails
```bash
# Send follow-ups for bookings completed 1 day ago
npm run automation follow-up

# Send follow-ups for bookings completed 3 days ago
npm run automation follow-up 3
```

#### Bulk Reschedule
```bash
# Reschedule all bookings for a coach between dates
npm run automation bulk-reschedule <coachId> <startDate> <endDate> <newStartDate> <newEndDate>

# Example: Reschedule coach user123's bookings from Jan 20-22 to Jan 25-27
npm run automation bulk-reschedule user123 2025-01-20 2025-01-22 2025-01-25 2025-01-27
```

## Advanced Usage

### Direct Node.js Execution

You can also run the automation scripts directly:

```bash
node scripts/automation-agent.js daily-summary
node scripts/automation-agent.js follow-up 2
```

### Programmatic Usage

Import and use the automation functions in your own code:

```typescript
import { 
  sendDailySummary, 
  generateFollowUpEmails, 
  bulkReschedule 
} from './src/lib/automationScripts'

// Send daily summary
await sendDailySummary('2025-01-15')

// Generate follow-up emails
await generateFollowUpEmails(1)

// Bulk reschedule
await bulkReschedule(
  'coach123',
  { start: '2025-01-20', end: '2025-01-22' },
  [{ start: '2025-01-25T09:00:00Z', end: '2025-01-27T17:00:00Z' }]
)
```

## Automation Schedule Recommendations

### Cron Jobs

Set up these automation commands to run automatically:

```bash
# Daily summary at 8 AM
0 8 * * * cd /path/to/booking-app && npm run automation daily-summary

# Follow-up emails at 10 AM (for bookings completed yesterday)
0 10 * * * cd /path/to/booking-app && npm run automation follow-up 1

# Weekly follow-up emails on Mondays at 9 AM (for bookings completed 7 days ago)
0 9 * * 1 cd /path/to/booking-app && npm run automation follow-up 7
```

### GitHub Actions

Create `.github/workflows/automation.yml`:

```yaml
name: Booking Automation
on:
  schedule:
    - cron: '0 8 * * *'  # Daily at 8 AM UTC
  workflow_dispatch:

jobs:
  daily-summary:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run automation daily-summary
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          EMAIL_PROVIDER: ${{ secrets.EMAIL_PROVIDER }}
          SENDGRID_API_KEY: ${{ secrets.SENDGRID_API_KEY }}
```

## Email Templates

The automation agent uses professional, branded email templates for all communications:

### Daily Summary Email
- Executive dashboard-style layout
- Key metrics with visual indicators
- Coach performance breakdown
- Upcoming bookings preview

### Follow-Up Emails
- **Feedback Request**: Clean, friendly design asking for reviews
- **Upsell Offer**: Premium package highlights with benefits
- **Rebooking Reminder**: Welcoming tone encouraging return visits

### Reschedule Notifications
- Clear before/after time comparison
- Apologetic but professional tone
- Contact information for concerns

## Database Requirements

The automation agent expects these additional columns (add via migration):

```sql
-- Add follow-up tracking
ALTER TABLE bookings ADD COLUMN follow_up_sent TIMESTAMP NULL;

-- Add notification preferences (optional)
ALTER TABLE users ADD COLUMN email_notifications BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN daily_summary BOOLEAN DEFAULT false;
```

## Monitoring and Logging

All automation activities are logged with timestamps and status:

```
📊 Generating daily summary for 2025-01-15...
✅ Daily summary generated: 23 bookings, $1,840 revenue
📧 Daily summary sent to admin@company.com
🚀 Running automation command: follow-up
📧 Follow-up email sent to client@email.com for feedback
⏰ Command completed successfully at: 2025-01-15T10:30:00.000Z
```

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check your email provider credentials
   - Verify FROM_EMAIL is properly configured
   - Ensure email provider APIs are accessible

2. **Database connection errors**
   - Verify Supabase credentials in `.env.local`
   - Check RLS policies allow service access
   - Ensure database schema matches expected structure

3. **TypeScript compilation errors**
   - The script automatically installs `ts-node` if missing
   - Ensure `tsconfig.json` is properly configured
   - Check for any missing dependencies

### Debug Mode

Run with debug information:

```bash
NODE_ENV=development npm run automation daily-summary
```

This will show full error stack traces and additional logging.

## Integration with Gemini CLI

You can also integrate these commands with Google's Gemini CLI or other AI assistants:

```bash
# Create a Gemini CLI function
gemini function create booking-automation \
  --description "Run booking system automation" \
  --command "cd /path/to/booking-app && npm run automation"
```

## Security Considerations

- Store sensitive credentials in environment variables, never in code
- Use service keys with minimal required permissions
- Enable email provider security features (2FA, API key restrictions)
- Monitor automation logs for suspicious activity
- Set up alerts for failed automation runs

## Contributing

To extend the automation agent:

1. Add new functions to `src/lib/automationScripts.ts`
2. Update the CLI runner in `scripts/automation-agent.js`
3. Add new npm scripts to `package.json`
4. Update this documentation

The automation system is designed to be modular and extensible for your specific business needs.