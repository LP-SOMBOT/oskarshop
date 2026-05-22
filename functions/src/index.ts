
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * @fileOverview Refactored Firebase Cloud Functions for Oskar Shop.
 * Uses native fetch to call Resend API (HTTP) to bypass SMTP blocks.
 * 
 * 1. sendEmailOTP: Generates, saves, and sends a 6-digit code via Resend HTTP POST.
 * 2. resetPasswordWithOtp: Verifies the code and updates the user password.
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

        // 2. Save to Database
        await admin.database().ref(`email_otps/${sanitizedEmail}`).set({
            otp,
            email,
            expiresAt
        });

        // 3. Dispatch via Resend API (HTTP POST)
        // Note: Using the provided key directly for execution reliability in this environment.
        const resendApiKey = process.env.RESEND_API_KEY || "re_hgGKiQfD_NkgJ24f5kqvyDsx76NatW5jA";
        
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "OskarShop Support <onboarding@resend.dev>",
                to: [email],
                subject: "Oskar Shop Security Code",
                html: `
                    <div style="background-color: #0f172a; padding: 40px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #f8fafc; text-align: center; border-radius: 24px; border: 1px solid #1e293b;">
                        <h2 style="color: #0ea5e9; font-size: 26px; font-weight: 800; margin-bottom: 10px;">Oskar Shop Password Verification</h2>
                        <p style="color: #94a3b8; font-size: 16px; margin-bottom: 30px;">Use the code below to complete your password reset request.</p>
                        
                        <div style="background-color: #1e293b; padding: 30px; border-radius: 16px; display: inline-block; border: 2px solid #0ea5e9; box-shadow: 0 0 20px rgba(14, 165, 233, 0.2);">
                            <span style="font-size: 32px; font-weight: 900; letter-spacing: 12px; color: #38bdf8; font-family: monospace;">${otp}</span>
                        </div>
                        
                        <p style="color: #64748b; font-size: 12px; margin-top: 30px; line-height: 1.5;">
                            This code will expire in exactly <b>10 minutes</b>.<br>
                            If you did not request this code, please ignore this email.
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #1e293b; margin: 30px 0;">
                        <p style="font-size: 10px; color: #475569; text-transform: uppercase; letter-spacing: 2px;">Oskar Shop Premium Game Services</p>
                    </div>
                `
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Resend API Failure:", errorText);
            throw new functions.https.HttpsError('internal', `Email Service Error: ${response.status} - ${errorText}`);
        }
        
        return { success: true };
    } catch (error: any) {
        console.error("OTP Flow Crash:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError('internal', error.message || 'Network Dispatch Failed.');
    }
});

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
        await otpRef.remove();
        return { success: true };
    } catch (err: any) {
        throw new functions.https.HttpsError('internal', err.message);
    }
});
