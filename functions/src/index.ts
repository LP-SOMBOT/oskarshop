
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * @fileOverview Refactored Firebase Cloud Functions for Oskar Shop.
 * Switched from Nodemailer to Resend Email API to bypass Firebase SMTP blocks.
 * 
 * 1. sendEmailOTP: Callable function to generate, save, and send a 6-digit code via Resend HTTP API.
 * 2. resetPasswordWithOtp: Verifies the code and updates the user password via Admin SDK.
 */

/**
 * CALLABLE: sendEmailOTP
 * Handles OTP generation, RTDB logging, and Resend API dispatch via HTTPS POST.
 */
export const sendEmailOTP = functions.https.onCall(async (data, context) => {
    const { email } = data;
    if (!email) {
        throw new functions.https.HttpsError('invalid-argument', 'Email address is required.');
    }

    try {
        // 1. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const sanitizedEmail = email.replace(/\./g, '_');
        const expiresAt = Date.now() + 600000; // 10 minutes

        // 2. Save to Database (Keeping structure intact under /email_otps/)
        await admin.database().ref(`email_otps/${sanitizedEmail}`).set({
            otp,
            email,
            expiresAt
        });

        // 3. INTEGRATE RESEND API (HTTP fetch)
        // Node.js 18+ provides built-in fetch. 
        const resendApiKey = "re_hgGKiQfD_NkgJ24f5kqvyDsx76NatW5jA";
        
        const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "OskarShop <onboarding@resend.dev>",
                to: [email],
                subject: `${otp} is your OskarShop verification code`,
                html: `
                    <div style="background-color: #f8fafc; padding: 40px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; text-align: center; border-radius: 24px; border: 1px solid #e2e8f0;">
                        <h2 style="color: #0ea5e9; font-size: 26px; font-weight: 800; margin-bottom: 10px;">OskarShop Security Verification</h2>
                        <p style="color: #64748b; font-size: 16px; margin-bottom: 30px;">Use the code below to complete your password reset request.</p>
                        
                        <div style="background-color: #ffffff; padding: 30px; border-radius: 16px; display: inline-block; border: 2px solid #0ea5e9; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            <span style="font-size: 32px; font-weight: 900; letter-spacing: 12px; color: #0ea5e9; font-family: monospace;">${otp}</span>
                        </div>
                        
                        <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; line-height: 1.5;">
                            This code will expire in exactly <b>10 minutes</b>.<br>
                            If you did not request this code, please ignore this email.
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                        <p style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;">OskarShop Premium Game Services</p>
                    </div>
                `
            })
        });

        if (!resendResponse.ok) {
            const errorPayload = await resendResponse.json();
            throw new Error(`Resend API Failure: ${JSON.stringify(errorPayload)}`);
        }
        
        return { success: true };
    } catch (error: any) {
        console.error("OTP Dispatch Failure:", error);
        
        // Ensure explicit error messages reach the frontend for debugging
        if (error instanceof functions.https.HttpsError) throw error;
        
        throw new functions.https.HttpsError(
            'internal', 
            error.message || 'API Dispatch Failed: Check Resend API Key or Network.'
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
