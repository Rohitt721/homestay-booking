import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});

export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
    const mailOptions = {
        from: `"HomeStay" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: "Verify Your Email - HomeStay",
        html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 40px 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">HomeStay</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Email Verification</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 40px 32px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Hi there! Use the following code to verify your email address and complete your registration:
          </p>
          
          <!-- OTP Box -->
          <div style="background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
            <p style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px;">Your Verification Code</p>
            <div style="font-size: 36px; font-weight: 800; color: #4f46e5; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</div>
          </div>
          
          <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0 0 8px;">
            ⏱ This code expires in <strong style="color: #374151;">5 minutes</strong>.
          </p>
          <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #f3f4f6;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} HomeStay. All rights reserved.</p>
        </div>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
};
