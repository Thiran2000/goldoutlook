// Fill these in from Firebase: Project settings, General, "Your apps", Web app.
// Both values are safe to publish. The Firestore rules in firebase/firestore.rules protect the data.
window.GOLD_CONFIG = {
  FIREBASE_API_KEY: "AIzaSyDKHn6hHaO3re8N9Gkgu134QBGdCJvUHdE",     // "apiKey"
  FIREBASE_PROJECT_ID: "gold-outlook",  // "projectId"
  // Live feed (free Cloudflare Worker, see worker/README.md). Leave "" to use the GitHub data files only.
  LIVE_URL: "https://gold-live.thiranperera29.workers.dev/",
  LIVE_EVERY_SECONDS: 10                 // how often an open page asks for new prices (minimum 5)
};
