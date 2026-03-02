# Goodreader 📚

A premium, mobile-first web application designed to act as a companion to your Goodreads account. 

Because Goodreads officially deprecated their public API in 2020, this application uses a unique workaround: it fetches your public Goodreads RSS feeds through a lightweight PHP proxy to bypass browser restrictions, providing a seamless, read-only view of your library with several advanced, community-driven features!

## ✨ Features

- **Modern Mobile UI**: A dark-mode, glassmorphic design that feels like a native app.
- **Library Sync**: View your "Read", "Currently Reading", and "Want to Read" shelves via your Goodreads Profile ID.

### Advanced Companion Features
1. **AI Recommendations**: Any book you rate 4+ stars gains a "Find Similar" button. Clicking this searches the free OpenLibrary API to find similar authors and titles to recommend.
2. **Bookshelf OCR Scanner**: Out at a bookstore? Tap the "Scanner" tab to take a photo of a physical bookshelf. The app uses `Tesseract.js` to read the text in the image completely offline in your browser and fuzzy-matches it against your Goodreads "Want to Read" list to highlight any matches!
3. **Local Library & CSV Export**: When you find a recommended book or scan a match, you can save it to your local "Want to Read" list. Since Goodreads removed API write access, you can export these local saves as a CSV file to easily upload into the [Goodreads Import Tool](https://www.goodreads.com/review/import).

## 🚀 Getting Started

To run this application, you will need a basic web server running PHP (to handle the RSS proxy).

### Local Development
1. Clone this repository: `git clone git@github.com:mqcarpenter/goodreader.git`
2. Navigate to the project folder: `cd goodreader`
3. Start the built-in PHP server: `php -S localhost:8000`
4. Open your browser to `http://localhost:8000`

### Live Deployment
Simply upload the core files to any standard web hosting environment that supports PHP:
- `index.html`
- `style.css`
- `app.js`
- `proxy.php`

## 🛠️ Built With
- **Frontend**: HTML5, Vanilla JavaScript, CSS3
- **Proxy**: PHP 8+
- **APIs/Libraries**: [OpenLibrary Search API](https://openlibrary.org/dev/docs/api/search), [Tesseract.js](https://tesseract.projectnaptha.com/)

---
*Disclaimer: This project is not affiliated with, funded, or in any way associated with Goodreads LLC.*
