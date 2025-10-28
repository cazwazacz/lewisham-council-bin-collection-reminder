# Refuse Mailer

Automated bin collection reminder service that scrapes Lewisham council collection dates and sends email notifications.

## Prerequisites

- Node.js (v14 or higher)
- Chrome/Chromium browser
- ChromeDriver

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Edit `.env` with your credentials:
   - `FROM_EMAIL`: Your Gmail address
   - `PASSWORD`: Your Gmail app password (not your regular password)
   - `TO_EMAILS`: JSON array of recipient emails
   - `POSTCODE`: Your postcode that will be used to search for your address
   - `ADDRESS`: String that will be used to select your address from list of returned addresses

Note: It will help for you to go through the journey manually on [the council website](https://lewisham.gov.uk/myservices/recycling-and-rubbish/your-bins/collection) to validate your `POSTCODE` and `ADDRESS` inputs.

## Gmail App Password

To use Gmail SMTP, you need to generate an app password:

1. Go to your Google Account settings
2. Enable 2-factor authentication if not already enabled
3. Go to Security > 2-Step Verification > App passwords
4. Generate a new app password for "Mail"
5. Use this 16-character password in your `.env` file

## Usage

Run the script:
```bash
npm start
```

Or with environment variables directly:
```bash
FROM_EMAIL=your@gmail.com PASSWORD=xxxx TO_EMAILS='["recipient@example.com"]' POSTCODE='SW1A 0AA' ADDRESS='Big Ben, Elizabeth Tower, Houses of Parliament, Westminster, London SW1A 0AA, England' npm start
```

## Scheduling

To run this script on a schedule, you can use cron:

```bash
# Run every Monday at 8 AM
0 8 * * 1 cd /home/deploy/refuse-mailer && npm start
```

## Log File

The script logs to `log.txt` in the project directory. Update the `LOG_FILE` constant in `index.js` if you want a different location.

## Note: potential memory leak issues

If you kill the program manually when it's running (by using `Ctrl+C` for example) it will leave zombie Chrome processes running. If you do this many times, lots of RAM will be used and you will notice subsequent Chrome processes being very slow. In future, we should handle this more gracefully, but for now you can find the processes by running:
```
ps aux --sort=-%mem | head
```
And killing them with
```
pkill -f chrome
```

## License

ISC
