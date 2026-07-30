import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Trigger to send FCM push notification when a new user notification is created in RTDB.
 * Handles background delivery for order updates, status changes, etc.
 */
export const onNotificationCreated = functions.database.ref('/notifications/{uid}/{notifId}')
    .onCreate(async (snapshot, context) => {
        const uid = context.params.uid;
        const notifData = snapshot.val();
        if (!notifData) return null;

        // Fetch user's FCM token from profile
        const userSnap = await admin.database().ref(`users/${uid}/fcmToken`).get();
        const fcmToken = userSnap.val();
        
        if (!fcmToken) {
          console.log(`No FCM token found for user: ${uid}`);
          return null;
        }

        // Standard FCM notification structure required for background display
        const message = {
            token: fcmToken,
            notification: {
                title: notifData.title || 'Oskar Shop',
                body: notifData.body || '',
            },
            data: {
                linkTo: notifData.linkTo || '',
            },
            webpush: {
                notification: {
                    icon: 'https://placehold.co/192x192/0EA5E9/FFFFFF/png?text=O',
                    badge: 'https://placehold.co/192x192/0EA5E9/FFFFFF/png?text=O',
                    vibrate: [200, 100, 200],
                },
                fcm_options: {
                    link: notifData.linkTo || '/'
                }
            }
        };

        try {
          return await admin.messaging().send(message);
        } catch (error) {
          console.error(`Error sending push notification to user ${uid}:`, error);
          return null;
        }
    });

/**
 * Trigger to send FCM push notifications to all admins when a new admin alert is created.
 */
export const onAdminNotificationCreated = functions.database.ref('/adminNotifications/{notifId}')
    .onCreate(async (snapshot) => {
        const notifData = snapshot.val();
        if (!notifData) return null;

        // Fetch all users to find admins with valid FCM tokens
        const usersSnap = await admin.database().ref('users').get();
        const users = usersSnap.val() || {};
        
        const tokens: string[] = [];
        Object.values(users).forEach((u: any) => {
            if (u.role === 'admin' && u.fcmToken) {
                tokens.push(u.fcmToken);
            }
        });

        if (tokens.length === 0) return null;

        const messages = tokens.map(token => ({
            token,
            notification: {
                title: notifData.title || 'Admin Alert',
                body: notifData.body || '',
            },
            webpush: {
                notification: {
                    icon: 'https://placehold.co/192x192/0EA5E9/FFFFFF/png?text=O',
                    badge: 'https://placehold.co/192x192/0EA5E9/FFFFFF/png?text=O',
                    vibrate: [200, 100, 200],
                },
                fcm_options: {
                    link: '/admin'
                }
            }
        }));

        try {
          // Use sendEach for efficient bulk delivery
          return await admin.messaging().sendEach(messages);
        } catch (error) {
          console.error("Error sending bulk admin notifications:", error);
          return null;
        }
    });

export const helloWorld = functions.https.onRequest((request, response) => {
  response.send("Oskar Shop Functions are live.");
});