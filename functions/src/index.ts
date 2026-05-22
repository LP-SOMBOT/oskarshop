
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();

/**
 * @fileOverview Firebase Cloud Functions for Oskar Shop.
 * 
 * 1. onOtpCreated: Sends a 6-digit code via Nodemailer when a reset is requested.
 * 2. resetPasswordWithOtp: Verifies the code and updates the user password via Admin SDK.
 */

/**
 * TRIGGER: onOtpCreated
 * Path: /email_otps/{sanitizedEmail}
 * 
 * Refactored to handle dynamic authentication securely. 
 * Initialization of transporter is scoped inside the handler to prevent 
 * stale authentication tokens (530-5.7.0) in the serverless environment.
 */
export const onOtpCreated = functions.database.ref('/email_otps/{sanitizedEmail}')
    .onCreate(async (snapshot, context) => {
        const data = snapshot.val();
        const email = data.email || context.params.sanitizedEmail.replace(/_/g, '.');
        const otp = data.otp;

        try {
            // Fetch credentials dynamically from settings node to avoid hardcoding
            const settingsSnap = await admin.database().ref('settings/emailConfig').get();
            const config = settingsSnap.val();

            if (!config?.gmailAddress || !config?.appPassword) {
                console.error("Critical Failure: SMTP credentials not configured in /settings/emailConfig");
                return null;
            }

            // Lexical transport initialization: Binding credentials to this runtime instance
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: config.gmailAddress,
                    pass: config.appPassword
                }
            });

            const mailOptions = {
                from: `"Oskar Shop Support" <${config.gmailAddress}>`,
                to: email,
                subject: `${otp} is your password reset code`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; border-radius: 20px; background: #ffffff; color: #1e293b; border: 1px solid #f1f5f9;">
                        <h2 style="color: #0EA5E9; font-size: 24px; margin-bottom: 20px;">Security Verification</h2>
                        <p style="font-size: 16px; line-height: 1.6;">You requested to reset your Oskar Shop password. Use the following code to continue:</p>
                        <div style="background: #f0f9ff; padding: 40px; text-align: center; border-radius: 16px; margin: 30px 0;">
                            <span style="font-size: 48px; font-weight: 800; letter-spacing: 12px; color: #0EA5E9;">${otp}</span>
                        </div>
                        <p style="font-size: 13px; color: #94a3b8; text-align: center;">This code expires in 10 minutes. If you did not request this, please secure your account.</p>
                        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                        <p style="font-size: 11px; color: #cbd5e1; text-align: center; text-transform: uppercase; letter-spacing: 1px;">Oskar Shop Premium Game Services</p>
                    </div>
                `
            };

            // Properly awaited dispatch to ensure function doesn't exit early
            await transporter.sendMail(mailOptions);
            console.log(`Success: OTP dispatched to ${email}`);
            return true;
        } catch (error) {
            console.error("Fatal: Nodemailer SMTP dispatch failed:", error);
            return false;
        }
    });

/**
 * CALLABLE: resetPasswordWithOtp
 * Verifies the OTP and applies the new password using the Admin SDK.
 */
export const resetPasswordWithOtp = functions.https.onCall(async (data, context) => {
    const { email, otp, newPassword } = data;
    
    if (!email || !otp || !newPassword) {
        throw new functions.https.HttpsError('invalid-argument', 'All fields are required.');
    }

    const sanitizedEmail = email.replace(/\./g, '_');
    const otpRef = admin.database().ref(`email_otps/${sanitizedEmail}`);
    const snap = await otpRef.get();

    if (!snap.exists()) {
        throw new functions.https.HttpsError('not-found', 'Reset session expired or not found.');
    }

    const storedData = snap.val();
    if (storedData.otp !== otp || Date.now() > storedData.expiresAt) {
        throw new functions.https.HttpsError('permission-denied', 'Invalid or expired OTP code.');
    }

    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(userRecord.uid, { password: newPassword });
        
        // Finalize: Remove OTP node to prevent reuse
        await otpRef.remove();
        
        return { success: true };
    } catch (err: any) {
        throw new functions.https.HttpsError('internal', err.message);
    }
});
