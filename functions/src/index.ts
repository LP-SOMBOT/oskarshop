import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * @fileOverview CLEAN REBUILD: 6-Digit Email OTP System.
 * Zero-dependency dispatch using native global fetch() to bypass SMTP blocks.
 * Aggressive error exposure for production debugging.
 */

const RESEND_API_KEY = "re_hgGKiQfD_NkgJ24f5kqvyDsx76NatW5jA";

export const sendEmailOTP = functions.https.onCall(async (data, context) => {
    const { email } = data;
    if (!email) {
        throw new functions.https.HttpsError('invalid-argument', 'Email address is missing.');
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

        // 3. Dispatch via Native HTTP Fetch (Resend API)
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "Oskar Shop Support <onboarding@resend.dev>",
                to: [email],
                subject: "Oskar Shop Security Code",
                html: `
                    <div style="background-color: #0f172a; padding: 40px; font-family: sans-serif; color: #f8fafc; text-align: center; border-radius: 24px; border: 1px solid #1e293b;">
                        <h2 style="color: #0ea5e9; font-size: 26px; font-weight: 800; margin-bottom: 10px;">Oskar Shop Password Verification</h2>
                        <p style="color: #94a3b8; font-size: 16px; margin-bottom: 30px;">Use the code below to complete your password reset request.</p>
                        <div style="background-color: #1e293b; padding: 30px; border-radius: 16px; display: inline-block; border: 2px solid #0ea5e9; box-shadow: 0 0 20px rgba(14, 165, 233, 0.2);">
                            <span style="font-size: 32px; font-weight: 900; letter-spacing: 12px; color: #38bdf8; font-family: monospace;">${otp}</span>
                        </div>
                        <p style="color: #64748b; font-size: 11px; margin-top: 30px; text-transform: uppercase; letter-spacing: 1px;">
                            This code will expire in 10 minutes.
                        </p>
                    </div>
                `
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Resend API Failure: ${response.status} - ${errorText}`);
        }
        
        return { success: true };
    } catch (error: any) {
        console.error("FATAL OTP ERROR:", error);
        throw new functions.https.HttpsError('internal', error.message || 'Unknown network error.');
    }
});

export const resetPasswordWithOtp = functions.https.onCall(async (data, context) => {
    const { email, otp, newPassword } = data;
    
    if (!email || !otp || !newPassword) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing mandatory verification data.');
    }

    const sanitizedEmail = email.replace(/\./g, '_');
    const otpRef = admin.database().ref(`email_otps/${sanitizedEmail}`);
    const snap = await otpRef.get();

    if (!snap.exists()) {
        throw new functions.https.HttpsError('not-found', 'Session expired. Please request a new code.');
    }

    const storedData = snap.val();
    if (storedData.otp !== otp || Date.now() > storedData.expiresAt) {
        throw new functions.https.HttpsError('permission-denied', 'Invalid or expired 6-digit code.');
    }

    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(userRecord.uid, { password: newPassword });
        await otpRef.remove();
        return { success: true };
    } catch (err: any) {
        throw new functions.https.HttpsError('internal', `Auth Update Failed: ${err.message}`);
    }
});
