require('dotenv').config();
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('node:path');
const { execSync } = require('child_process');

const LOG_FILE = path.join(__dirname, 'log.txt');

// Redirect stderr and stdout to log file
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
process.stderr.write = process.stdout.write = logStream.write.bind(logStream);

function log(msg) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `${timestamp} - ${msg}\n`);
}

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function main() {
  let driver;

  try {
    log('Starting');

    // DNS test
    try {
      const dnsResult = execSync('host smtp.gmail.com').toString();
      log(`DNS test: ${dnsResult}`);
    } catch (e) {
      log(`DNS test failed: ${e.message}`);
    }

    // Setup Chrome options
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1920,1080');
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--disable-gpu');
    options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36');

    // Create driver
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    await driver.get('https://lewisham.gov.uk/myservices/recycling-and-rubbish/your-bins/collection');

    await sleep(2);

    // Decline cookies
    try {
      const declineCookieButton = await driver.findElement(By.css('#CybotCookiebotDialogBodyButtonDecline'));
      await declineCookieButton.click();
    } catch (e) {
      log(`Cookie button not found or couldn't click: ${e.message}`);
    }

    // Find and fill input
    const input = await driver.findElement(By.css('input.form__input.js-address-finder-input'));
    log(`Found input ${input}`);
    await input.sendKeys(process.env.POSTCODE);

    await sleep(2);

    // Click search button
    const button = await driver.findElement(By.css('button.address-finder__button.js-address-finder-step-address'));
    await button.click();
    log('Pressed button');

    await sleep(4);

    // Select address
    const addressSelectElement = await driver.findElement(By.css('select#address-selector'));

    // Wait for options to load (more than just the placeholder)
    await driver.wait(async () => {
      const options = await addressSelectElement.findElements(By.css('option'));
      return options.length > 1;
    }, 10000, 'Address options did not load in time');

    log('Address select populated with options');

    const option = await addressSelectElement.findElement(By.xpath(`//option[text()='${process.env.ADDRESS}']`));
    await option.click();

    await sleep(4);

    // Get collection days
    const result = await driver.findElement(By.css('div.js-find-collection-result'));
    const collectionDays = await result.getText();
    log(collectionDays);

    // Email setup
    const fromEmail = process.env.FROM_EMAIL;
    const password = process.env.PASSWORD;
    const toEmails = JSON.parse(process.env.TO_EMAILS);

    await sleep(3);

    log('Starting to initialize SMTP');

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: fromEmail,
        pass: password
      }
    });

    log('Message initialized');
    log('Starting SMTP');

    // Send emails
    log('Sending emails');
    for (const email of toEmails) {
      const mailOptions = {
        from: `Refuse mailer < ${fromEmail} > `,
        to: email,
        subject: 'Bin collection reminder',
        text: collectionDays
      };

      await transporter.sendMail(mailOptions);
      log(`Email sent to ${email}`);
    }

    log('Finished sending emails');

  } catch (error) {
    log(`Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    if (driver) {
      try {
        await driver.quit();
      } catch (e) {
        log(`Error closing driver: ${e.message}`);
      }
    }
  }
}

main();
