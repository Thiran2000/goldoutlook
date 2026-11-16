# Gold Outlook LK

A free public website for Sri Lanka: gold price now (22K sovereign, 24K and 22K per gram, world price, dollar rate), price by any weight, a forecast range with a past test, a buying guide with a shop-price check, price alerts, and a Learn section. English, Sinhala and Tamil.

## Files

- `index.html` is the whole site.
- `data/latest.json` is the live price file. The site reads it every minute and shows its age in seconds.
- `data/prices.csv` is the daily history used for the forecast.
- `data/dealer.json` is optional. Put `{"dealer_22k_sovereign_lkr": 330000}` in it to show a Colombo dealer reference price on the page.
- `scripts/update_data.py` builds the data files. `--latest` writes `latest.json`; no flag writes `prices.csv`.
- `.github/workflows/update-latest.yml` runs every 5 minutes. `update-data.yml` runs daily.

## Put it online for free (GitHub Pages)

1. Create a GitHub repository and upload this whole folder.
2. Settings, then Pages: publish from the `main` branch, root folder.
3. Open the Actions tab and run "Update gold data" once, then "Update latest price" once. Check both logs.
4. After that, both refresh by themselves.

## Be clear with your users about "live"

GitHub's fastest schedule is every 5 minutes and runs can start late, so the price is near-live, not per-second. The page shows the exact age of the data, turns the dot amber after 15 minutes, and says "Delayed". For true per-second prices later, replace `fetch_spot()` in the updater with a paid streaming feed and a small server.

## Things to check before launch

- The updater was tested with mock data only. Its free gold and exchange-rate sources could not be reached from the workspace that built it. Run the workflows and read the logs. If a source fails, the script keeps the old file and the page shows the data as delayed.
- Sinhala and Tamil text needs a review by native speakers.
- The Colombo shop price depends on each dealer. The site shows a value worked out from the world price, plus a tool to compare a shop's price with it.
- Alerts work only while the page is open in the browser.

## Shop prices (Firebase)

- `shop.html` is the jeweller portal. A shop creates an account with email and password, registers its name, city and phone, and waits for approval. Once approved it posts its 22K sovereign price (and optionally a buy-back price and a 24K per-gram price). A price more than 25% away from the world-price value asks the shop to confirm it.
- `index.html` shows approved shops' prices, hides prices older than 24 hours, and flags prices far from the world-price value.
- The floating "Ask a question" bot answers from the numbers on the page. It does not use AI and cannot invent prices.
- `firebase/firestore.rules` is the security rules file. It lets anyone read approved shops only, lets a shop change only its own price fields once approved, and does not let any shop approve itself.

### Set up Firebase (free Spark plan is enough)

1. Go to the Firebase console and create a project.
2. Build, Authentication, Sign-in method: turn on Email/Password.
3. Build, Firestore Database: create a database (production mode).
4. Firestore, Rules tab: paste the contents of `firebase/firestore.rules` and Publish.
5. Project settings, General, "Your apps": add a Web app. Copy `apiKey` and `projectId` into `config.js`.
6. Upload the whole folder to GitHub Pages (see above).

### Approve a shop

Firebase console, Firestore Database, collection `shops`, open the shop's document, set `approved` to `true` (boolean). Set it back to `false` to hide a shop. Shops cannot change this themselves.

### Before you launch

- Test once with a test shop: sign up, register, approve it in the console, post a price, and check it appears on the main page. The security rules were written but not run in an emulator, because the workspace that built them has no internet access.
- A shop's name, city and phone are public once approved. Say so on your sign-up page.
- Firebase's free plan has daily limits. A small site will not reach them.

`optional-supabase-version/` holds an earlier version of the shop portal that used Supabase. It is not used. `optional-ai-chat/` holds an untested bot service that calls an AI model. It was written for Supabase and is not connected.
