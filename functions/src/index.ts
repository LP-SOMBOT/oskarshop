import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * @fileOverview Previous OTP logic removed.
 * Moving to Next.js API Routes for reliability in current environment.
 */

export const helloWorld = functions.https.onRequest((request, response) => {
  response.send("Oskar Shop Functions are live.");
});