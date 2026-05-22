
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();

/**
 * @fileOverview Refactored Firebase Cloud Functions for Oskar Shop.
 * 
 * 1. sendEmailOTP: Callable function to generate, save, and send a 6-digit code.
 *    - Performs dynamic credential lookup from RTDB.
 *    - Uses explicit Google SMTP configuration (Port 465).
 * 2. resetPasswordWithOtp: Verifies the code and updates the user password via Admin SDK.
 */

/**
 * CALLABLE: sendEmailOTP
 * Handles dynamic credential fetching, OTP generation, and branded email dispatch.
 */
export const sendEmailOTP = functions.https.onCall(async (data, context) => {
    const { email } = data;
    if (!email) {
        throw new functions.https.HttpsError('invalid-argument', 'Email address is required.');
    }

    try {
        // 1. DYNAMIC EMAIL SERVICE PROTOCOL: Fetch credentials from RTDB
        // Path aligned with the Admin Dashboard "Email Service Protocol" settings
        const configSnap = await admin.database().ref('admin_settings/email_config').once('value');
        const config = configSnap.val();

        if (!config?.senderEmail || !config?.appPassword) {
            // STOP EXECUTION: Throw explicit error for the frontend UI
            throw new functions.https.HttpsError(
                'failed-precondition', 
                'Configuration Error: Admin has not configured the sender Gmail credentials yet.'
            );
        }

        // 2. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const sanitizedEmail = email.replace(/\./g, '_');
        const expiresAt = Date.now() + 600000; // 10 minutes

        // 3. Save to Database
        await admin.database().ref(`email_otps/${sanitizedEmail}`).set({
            otp,
            email,
            expiresAt
        });

        // 4. LIFECYCLE & ASYNC RESOLUTION: Explicit SMTP Configuration
        // Using Port 465 with Secure: True as the official Google SMTP requirement
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, 
            auth: {
                user: config.senderEmail,
                pass: config.appPassword
            }
        });

        // 5. DEFAULT BRANDED EMAIL SENDER TEMPLATE
        const mailOptions = {
            from: `"Baba Shop Support" <${config.senderEmail}>`,
            to: email,
            subject: `${otp} is your Baba Shop verification code`,
            html: `
                <div style="background-color: #0f172a; padding: 40px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #ffffff; text-align: center; border-radius: 24px;">
                    <h2 style="color: #0ea5e9; font-size: 26px; font-weight: 800; margin-bottom: 10px;">Baba Shop Security Verification</h2>
                    <p style="color: #94a3b8; font-size: 16px; margin-bottom: 30px;">Use the code below to complete your password reset request.</p>
                    
                    <div style="background-color: #1e293b; padding: 30px; border-radius: 16px; display: inline-block; border: 1px solid #334155;">
                        <span style="font-size: 32px; font-weight: 900; letter-spacing: 12px; color: #0ea5e9; font-family: monospace;">${otp}</span>
                    </div>
                    
                    <p style="color: #64748b; font-size: 12px; margin-top: 30px; line-height: 1.5;">
                        This code will expire in exactly <b>10 minutes</b>.<br>
                        If you did not request this code, please ignore this email.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #334155; margin: 30px 0;">
                    <p style="font-size: 10px; color: #475569; text-transform: uppercase; letter-spacing: 2px;">Baba Shop Premium Game Services</p>
                </div>
            `
        };

        // GUARANTEE RESOLUTION: Fully await the SMTP network call
        await transporter.sendMail(mailOptions);
        
        return { success: true };
    } catch (error: any) {
        console.error("OTP Dispatch Failure:", error);
        
        // Ensure explicit error messages reach the frontend for debugging
        if (error instanceof functions.https.HttpsError) throw error;
        
        throw new functions.https.HttpsError(
            'internal', 
            error.message || 'SMTP Dispatch Failed: Please verify Gmail App Password.'
        );
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
