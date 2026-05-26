import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';

/**
 * Firebase Admin SDK initialization for server-side logic (API Routes).
 * Hardcoded with user-provided Service Account for immediate reliability.
 */

const SERVICE_ACCOUNT = {
  projectId: "oskarshop-631c5",
  clientEmail: "firebase-adminsdk-fbsvc@oskarshop-631c5.iam.gserviceaccount.com",
  // Ensure the private key handles internal newlines correctly
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC5gGOZG7t7emhz\nRygHOHB/je4vdXOLbThCw5WEU8QN0KvfcvI1ZziouzrpO2jQHB1msEOg0l6ABjfo\n8uR4Y99v4/PM4SCknKrirCg7MA3/LCtzKPLtBPAzsNcWkwffCcDW6BeCdXSd2LvI\npYQPvWu9BujW1NutAzQWm52mVf9ZA5/DK0nMw8MubmfUpVc34/kWhSgk0D+6rhnd\nRPszlOTZLiNP2v6FfyIvGBRKoYj3iV8E3bza0g8JByLel78vqOAKUUjshH8rjkuh\nKpG62/xmHKvYxayUTDCMdcM5FG5ZM+24ijR0B5QI7LWqNDCcr5RS77wm03e+9A7j\nqfk6m8K3AgMBAAECggEAAxehUWmVcAMD37wVbj1iHrY6fL8L/IyHDhHdmbWdxI8w\ndkqfwAUm/CUW39F2N1XopZAVqIYpPiAcaX03EsyzalWV+FneZfAYpyuwhgAQk6rk\nVIifuBTHfk0Z4M31qSGr/ckjrzCPD5yP0NH1iB+jvqRxWDd3LASsJx5T+/ReC9lM\n2gX1t0D19OEp4+ggYJj5QXKou5exAvp4ulWdOd8Bny53fYT0IIzRost5uxeGgLIw\nbrshCfjGY1SJ7a4k1XIYr4vKsuSSGJe64nVP8i3hz9zME0r+VLKyCGLyFjPRO7kx\nr3sFMAfkeq91Id4Nvgk6oaoviEhiSpTWPHQREUGIcQKBgQDakGblQJuE4A6YiGB0\n2o9QRyzt7bJ1867SU+3+RJ/cJPe3uL3QTW2OXNN1r6jZfVWGb0UKJbRwCAbpFS0p\nLniKlgceMNQxGIt/MY7I/GOHvkRRgg42Q1sM4mE0sAVV+85KU0aTyPIjEFVjL53y\naig7Zz/PzYQ70gn+TWKuGTlcUQKBgQDZRkKjS+kpIxz2w+NWp4eK1bD+hUgPNwIp\nAKXw/H5ZnoRLBbp+03BRexKzy8SkpYH2mL7UbTi371OVtT9Zhx8ygabI+fS6/0BQ\nbxf/sfl0ITMrGeSoarYnCvqNkDp12dcwpw+vazYglFCZSTfIx5DqWBr2qqPO2vVa\n6syAmRnUhwKBgCixfhbtAoeo187ahWr8TnaZ6emaugFwD3qlmcgfqsvoLh8MzHp+\nEAnTiqN8wylLRqMzEF2lS4UYWYEIKlJijpru+ABNAxTpBv/1kCono7hgWoP6fP7p\nZ4hslcCjjTrHGU+JVbiqTzrsDZncAcJitX7p6F2eXCJvJuEsM1VK6P0hAoGBANHp\nQ3AoYrbPqafuULDjYdwL39fGRHwOlROwAKH2Dsvejck9W5Q0Cott7/+smerHy+vG\nXnc0nlt16Lb2SKHiHY3aHJyGgJ45BJWw/uqVs38ypBC8D2F210yZGr+x3AkH0RK8\nFDdRyRVotQWi6zYbODJvtH0jFuc+O1T/C1wijgX5AoGBALYTYew/692jLi9ol6wS\nXTfpOknJLX6cUJ6fzi8ZHNI+72nAOZ2KLPGZ+bgl0Ij0JKkr7VqP0KttX/975ffk\n7exGzuni5Xl3OaBFN9NYSIb4BlOsDPSCwqYYKCGRBnPi0e3XcLnHawJ++qBqwaLF\nmWuY3Wipy+xmmtDtncXGIftf\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
};

const DATABASE_URL = "https://oskarshop-631c5-default-rtdb.firebaseio.com";

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(SERVICE_ACCOUNT),
      databaseURL: DATABASE_URL,
    });
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

export const adminDb = getDatabase();
export const adminAuth = getAuth();
export const isFirebaseAdminAvailable = true;
