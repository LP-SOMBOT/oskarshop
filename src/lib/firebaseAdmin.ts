import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';

/**
 * Firebase Admin SDK initialization for server-side logic (API Routes).
 * Hardcoded with user-provided Service Account for immediate reliability.
 */

const SERVICE_ACCOUNT = {
  projectId: "connectnexus-a9acf",
  clientEmail: "firebase-adminsdk-fbsvc@connectnexus-a9acf.iam.gserviceaccount.com",
  // Ensure the private key handles internal newlines correctly
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDjRJ4B9b8tYT8s\nztwxONXmIsBIkUlTRjMIzN4KKj+/QAQeLPlpjFavU6UrOymUBNdqdthMCybLVZjr\nunjAIFbgF5vyPobh7VLNxTgha+rthxFz2zP+9OEWme7//sKAIYzFW6lf+tkdrh3s\nuWl8aQqEWO/WzSmLOK1HHHu1kySJjAYTQUq4Eki/ExpLMPkcdHF/TM0OYl5dz2M1\nyfMAHboEyHekM6FYATu0EYEQCUyuGrQpMnVxx7L0S1mOYJD6fnuvEsYe7YA+c90A\nts7wg5KOqhRDDTTk9d2HIdOARoZQUyOoevsAZQoZMgU8htQy/P5XnOHWrGCVtk5N\nDPG5sQJXAgMBAAECggEAXto+GjJPSqjaPaDOfMqsV4Msfn0IvfVACo26pEJy3abh\nsRhzNi6o5T8DYhIsrccBg0E70C0dUWMV0li+2e0FZTzlTMr076ll1FTaMvTAFce4\nLIMR5fidUxoHCpfw5JpcDujNPa5L3JvViH3v/Uk35vnZi+yPyLfsdg/4v9U8PB1H\n4/hHNDzW1udXmcCGMM0Vrtjzq6SeDtMj7ztthl+VehyaeaL9hXLjQb/YpiQpss0k\nSkEqYamQGz9BqYz5oaiJ8Rphw5bu0NLFt6tBjQomQDU81uJoiSe94T0sCPQ0i/RV\nJo717703n+Ii64G3hJbl/BG2Tjd0Je7GTaW83d4lwQKBgQD4XymckrDx8o//9ixX\nfd3tF1Hx6Uq1NUC9I4amEK1tzdc7eqUUykkLjPvDp9H007s4E8kAaqzIuoIXeFPv\nJxcl5KT6n+Ja5o07ktsXil4RMFIMVRNkobQUJQkpVm0knNQy8V9KaolrIKrp4/zP\nvz+pSDCTKiZzSvSmREJ4O22BlwKBgQDqP4aQFXWtE0HeWioe2TKsJXeDI3rc2a9D\nb1oIJqvnXJuoU03kwZDtun9Z3wPyuLa7LPNzAfxyrANOKVLSB5IcXsLhp5dAK1v1\nUSdQY0yl2jWimGzHdH0qlZOerHvfeqrZMkZ/zYogULVj7jT6iHdtUeB7DmxwKzFn\nc4dP6xMdQQKBgQDFC+qdd5u+OCyaa5m+R/N7mBbBD87feMJFzBuVQIH3LWlmnOS/\nW8Ubztwm28usqxZLZRcAp6ExFxcCu8oLYD3zKDTjSVlxuJuv+dCsGnCKvoU5l31t\nRwTxPnjIPPMWKv4G9IwfI+ql/SLbsK7vutEs4kL3Xmdm7L6v8lOxw6QbPQKBgQCv\nQ+afqZ7JZ44yGs5HFIWobcQU95f25F0RHKCFVsHqMs04TVQLo5SXeqHMkWN32SLH\nu2NPmp3TAsbaVWrlQMretTwk8GrnlUmRrC25JQL1WOYmiNtjBNKd6Rpxb2ajmDl6\nlvZOq2/8q8Z8RX+YMEEDJ27JQ8p4xqiJWdRVRHKhwQKBgQCCWCsrV7XJ2uFS4AZT\ny9sYNOLp/WLWbwpDec8ESzUgaChsASSb4Z4/QOkGa26kp/Ebw7RjnHY58udVPJrp\n8IERNy1W13DGYEOS2qJyQahyMOT4uwbHfDLv4gG/aExA8+dy0/yI3ZJZ8x08md3+\njyw5uQcAr3Ef1VPyKpUlITsrgQ==\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
};

const DATABASE_URL = "https://connectnexus-a9acf-default-rtdb.firebaseio.com";

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
