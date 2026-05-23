import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * @fileOverview Refactored OTP System using EmailJS frontend dispatch.
 * Functions handle only generation, storage, and verification.
 */

export const generateOtp = functions.https.onCall(async (data, context) => {
    const { email } = data;
    if (!email) {
        throw new functions.https.HttpsError('invalid-argument', 'Email address is missing.');
    }

    try {
        // 1. Verify user exists in /users/
        const userRef = admin.database().ref('users');
        const userSnapshot = await userRef.orderByChild('email').equalTo(email).get();

        if (!userSnapshot.exists()) {
            return { success: false, message: "No account found with that email." };
        }

        // 2. Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const sanitizedEmail = email.replace(/\./g, ',');
        const expiresAt = Date.now() + 600000; // 10 minutes

        // 3. Write to Realtime Database
        await admin.database().ref(`otp_codes/${sanitizedEmail}`).set({
            otp: otpCode,
            expiresAt,
            used: false
        });

        return { 
            success: true, 
            otp: otpCode, 
            message: "OTP generated." 
        };
    } catch (error: any) {
        console.error("OTP Generation Error:", error);
        throw new functions.https.HttpsError('internal', error.message || 'Internal server error.');
    }
});

export const verifyOtpAndResetPassword = functions.https.onCall(async (data, context) => {
    const { email, otp, newPassword } = data;
    
    if (!email || !otp || !newPassword) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing mandatory verification data.');
    }

    try {
        const sanitizedEmail = email.replace(/\./g, ',');
        const otpRef = admin.database().ref(`otp_codes/${sanitizedEmail}`);
        const snap = await otpRef.get();

        if (!snap.exists()) {
            return { success: false, message: "No OTP request found. Please request a new code." };
        }

        const storedData = snap.val();
        
        if (storedData.used === true) {
            return { success: false, message: "This code has already been used." };
        }

        if (storedData.otp !== otp) {
            return { success: false, message: "Incorrect code. Please try again." };
        }

        if (Date.now() > storedData.expiresAt) {
            return { success: false, message: "This code has expired. Please request a new one." };
        }

        // Find UID
        const userRef = admin.database().ref('users');
        const userSnapshot = await userRef.orderByChild('email').equalTo(email).get();
        
        if (!userSnapshot.exists()) {
            return { success: false, message: "User account no longer exists." };
        }

        const uid = Object.keys(userSnapshot.val())[0];

        // Update Auth Password
        await admin.auth().updateUser(uid, { password: newPassword });

        // Mark OTP as used
        await otpRef.update({ used: true });

        return { success: true, message: "Password updated successfully." };
    } catch (err: any) {
        console.error("OTP Verification Error:", err);
        throw new functions.https.HttpsError('internal', `Auth Update Failed: ${err.message}`);
    }
});
