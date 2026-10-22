const nodemailer = require("nodemailer");

let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Sends a 6-digit verification code to the target email.
 * If SMTP credentials are not configured in .env, prints the OTP to the console
 * and provides devMode fallback so testing is seamless.
 */
async function sendVerificationEmail(toEmail, otp) {
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"Paper Trading Academy" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `${otp} is your Paper Trading App Verification Code`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; borderRadius: 12px;">
            <h2 style="color: #0f62fe; margin-bottom: 8px;">Verify Your Email</h2>
            <p style="color: #4a5568; font-size: 14px; line-height: 20px;">
              Thank you for registering on <strong>Paper Trading App</strong>. Please use the following 6-digit one-time password (OTP) to complete your account registration:
            </p>
            <div style="background-color: #f0fdf4; border: 2px dashed #16a34a; padding: 16px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #16a34a;">${otp}</span>
            </div>
            <p style="color: #718096; font-size: 12px;">
              This code will expire in <strong>10 minutes</strong>. If you did not request this registration, you can safely ignore this email.
            </p>
          </div>
        `,
      });
      console.log(`[EMAIL] Real OTP email sent to ${toEmail}. Message ID: ${info.messageId}`);
      return { sent: true, devMode: false };
    } catch (err) {
      console.error(`[EMAIL ERROR] Failed to send email via SMTP: ${err.message}`);
      // Fallback to dev log
    }
  }

  // Fallback when SMTP is not configured or fails
  console.log("=========================================");
  console.log(`[EMAIL DEV MODE] Target: ${toEmail}`);
  console.log(`[EMAIL DEV MODE] Verification OTP: >>> ${otp} <<<`);
  console.log("=========================================");

  return { sent: true, devMode: true, devOtp: otp };
}

module.exports = { sendVerificationEmail };
