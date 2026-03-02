document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const setupScreen = document.getElementById('setup-screen');
    const mainScreen = document.getElementById('main-screen');
    const userIdInput = document.getElementById('user-id-input');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const booksContainer = document.getElementById('books-container');
    const scannerContainer = document.getElementById('scanner-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cameraInput = document.getElementById('camera-input');
    const ocrStatus = document.getElementById('ocr-status');
    const scannerPreview = document.getElementById('scanner-preview');
    const scannerResults = document.getElementById('scanner-results');

    // State
    const STORAGE_KEY = 'goodreads_user_id';
    let currentShelf = 'read';

    // Initialization
    function init() {
        const storedUserId = localStorage.getItem(STORAGE_KEY);
        if (storedUserId) {
            userIdInput.value = storedUserId;
            showMainScreen();
            fetchBooks(storedUserId, currentShelf);
        } else {
            showSetupScreen();
        }
    }

    // Event Listeners
    saveSettingsBtn.addEventListener('click', () => {
        const userId = userIdInput.value.trim();
        if (userId) {
            localStorage.setItem(STORAGE_KEY, userId);
            showMainScreen();
            fetchBooks(userId, currentShelf);
        } else {
            showError("Please enter a valid User ID");
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY);
        booksContainer.innerHTML = '';
        showSetupScreen();
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active styling
            tabBtns.forEach(b => b.classList.remove('active'));
            const clickedBtn = e.target;
            clickedBtn.classList.add('active');

            // Fetch new data
            currentShelf = clickedBtn.dataset.target;
            const userId = localStorage.getItem(STORAGE_KEY);
            if (currentShelf === 'scanner') {
                booksContainer.classList.add('hidden');
                scannerContainer.classList.remove('hidden');
                loadingSpinner.classList.add('hidden');
                hideError();
            } else {
                booksContainer.classList.remove('hidden');
                scannerContainer.classList.add('hidden');
                if (userId) {
                    fetchBooks(userId, currentShelf);
                }
            }
        });
    });

    // Modal logic
    closeModalBtn.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
    });

    // Delegate Find Similar button clicks
    booksContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('recommend-btn')) {
            e.stopPropagation(); // prevent opening book link
            const title = decodeURIComponent(e.target.dataset.title);
            const author = decodeURIComponent(e.target.dataset.author);
            fetchRecommendations(title, author);
        }
    });

    // Event Listener for OCR scanner
    cameraInput.addEventListener('change', handleImageUpload);

    // UI Functions
    function showSetupScreen() {
        setupScreen.classList.add('active');
        mainScreen.classList.remove('active');
    }

    function showMainScreen() {
        setupScreen.classList.remove('active');
        mainScreen.classList.add('active');
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        booksContainer.innerHTML = '';
        loadingSpinner.classList.add('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';
    }

    function showLoading() {
        loadingSpinner.classList.remove('hidden');
        booksContainer.innerHTML = '';
        hideError();
    }

    function hideLoading() {
        loadingSpinner.classList.add('hidden');
    }

    // Data Fetching
    async function fetchBooks(userId, shelf) {
        showLoading();

        try {
            // Use the local PHP proxy to bypass CORS
            const proxyUrl = `proxy.php?user_id=${encodeURIComponent(userId)}&shelf=${encodeURIComponent(shelf)}`;

            const response = await fetch(proxyUrl);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            const data = await response.json();

            if (data.books && data.books.length > 0) {
                renderBooks(data.books, shelf);
            } else {
                renderEmptyState();
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            showError(`Failed to load library: ${error.message}. Please check your User ID and make sure your profile is public.`);
        } finally {
            hideLoading();
        }
    }

    // Rendering
    function renderBooks(books, shelf) {
        booksContainer.innerHTML = '';

        books.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';

            // Link to the full book page on Goodreads
            card.onclick = () => window.open(book.link, '_blank');

            // Generate Stars HTML
            let starsHtml = '';
            const rating = book.userRating > 0 ? book.userRating : parseInt(book.averageRating);
            for (let i = 1; i <= 5; i++) {
                if (i <= rating) {
                    starsHtml += `<span class="star active">★</span>`;
                } else {
                    starsHtml += `<span class="star">☆</span>`;
                }
            }

            // Cleanup title (sometimes RSS adds HTML entities or "by Author" in the title)
            let cleanTitle = book.title.replace(/(&#39;|&quot;|&amp;)/g, function (m) {
                return { '&#39;': "'", '&quot;': '"', '&amp;': '&' }[m];
            });

            // Fallback image if none provided by RSS
            const imgUrl = book.imageUrl && book.imageUrl.includes('nophoto')
                ? 'https://s.gr-assets.com/assets/nophoto/book/111x148-bcc042a9c91a29c1d680899eff700a03.png'
                : book.imageUrl;

            let metaText = '';
            if (shelf === 'read' && book.readAt) {
                metaText = `Read: ${new Date(book.readAt).toLocaleDateString()}`;
            } else if (book.averageRating) {
                metaText = `Avg Rating: ${book.averageRating}`;
            }

            card.innerHTML = `
                <img src="${imgUrl}" alt="Cover of ${cleanTitle}" class="book-cover" loading="lazy">
                <div class="book-info">
                    <h3 class="book-title" title="${cleanTitle}">${cleanTitle}</h3>
                    <p class="book-author">${book.author}</p>
                    <div class="stars-container">
                        ${starsHtml}
                    </div>
                    <div class="book-meta">${metaText}</div>
                    ${book.userRating >= 4 ? `<button class="secondary-btn recommend-btn" data-title="${encodeURIComponent(cleanTitle)}" data-author="${encodeURIComponent(book.author)}">Find Similar</button>` : ''}
                </div>
            `;

            booksContainer.appendChild(card);
        });
    }

    function renderEmptyState() {
        booksContainer.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                <h2>No books found</h2>
                <p>There are no books on this shelf yet.</p>
            </div>
        `;
    }

    // Recommendations
    async function fetchRecommendations(title, author) {
        modalBody.innerHTML = '<div class="spinner"></div><p style="text-align:center;">Finding similar books...</p>';
        modalOverlay.classList.remove('hidden');
        try {
            // Basic Google Books search for title/author keyword
            const query = encodeURIComponent(`subject:"fiction" AND ("${title}" OR "${author}")`);
            const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=5`);
            const data = await res.json();

            modalBody.innerHTML = '';
            if (data.items && data.items.length > 0) {
                data.items.forEach(item => {
                    if (item.volumeInfo.title.toLowerCase() === title.toLowerCase()) return;

                    const vol = item.volumeInfo;
                    const card = document.createElement('div');
                    card.className = 'book-card';
                    const img = vol.imageLinks ? vol.imageLinks.thumbnail : 'https://s.gr-assets.com/assets/nophoto/book/111x148-bcc042a9c91a29c1d680899eff700a03.png';
                    const authors = vol.authors ? vol.authors.join(', ') : 'Unknown Author';

                    card.innerHTML = `
                        <img src="${img}" class="book-cover">
                        <div class="book-info">
                            <h3 class="book-title">${vol.title}</h3>
                            <p class="book-author">${authors}</p>
                            <button class="secondary-btn" onclick="alert('Added to local Want to Read!')">Want to Read</button>
                        </div>
                    `;
                    modalBody.appendChild(card);
                });
                if (modalBody.innerHTML === '') {
                    modalBody.innerHTML = '<p>No similar books found.</p>';
                }
            } else {
                modalBody.innerHTML = '<p>No similar books found.</p>';
            }
        } catch (e) {
            modalBody.innerHTML = `<p class="error-card">Failed to fetch recommendations.</p>`;
        }
    }

    // OCR Scanner 
    async function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        scannerPreview.src = URL.createObjectURL(file);
        scannerPreview.classList.remove('hidden');
        scannerResults.innerHTML = '';
        ocrStatus.innerHTML = '<span class="text-secondary">Scanning image for text... this may take a moment.</span>';

        try {
            const userId = localStorage.getItem(STORAGE_KEY);
            if (!userId) throw new Error("Please connect Goodreads ID first.");

            // Fetch 'to-read' list
            const proxyUrl = `proxy.php?user_id=${encodeURIComponent(userId)}&shelf=to-read`;
            const res = await fetch(proxyUrl);
            const data = await res.json();
            const toReadBooks = data.books || [];

            // Tesseract logic
            const worker = await Tesseract.createWorker('eng');
            const ret = await worker.recognize(file);
            const text = ret.data.text.toLowerCase();
            await worker.terminate();

            let matchesHtml = '';
            toReadBooks.forEach(book => {
                const title = book.title.toLowerCase();
                const authorParts = book.author.toLowerCase().split(' ');
                const lastName = authorParts[authorParts.length - 1]; // often last name is prominent

                // fuzzy logic match
                if (text.includes(title) || (lastName.length > 3 && text.includes(lastName))) {
                    matchesHtml += `
                        <div class="book-card">
                            <img src="${book.imageUrl}" class="book-cover">
                            <div class="book-info">
                                <h3 class="text-success">Match Found!</h3>
                                <h3 class="book-title">${book.title}</h3>
                                <p class="book-author">${book.author}</p>
                            </div>
                        </div>`;
                }
            });

            if (matchesHtml) {
                ocrStatus.innerHTML = '<span class="text-success">Matches found on your shelf!</span>';
                scannerResults.innerHTML = matchesHtml;
            } else {
                ocrStatus.innerHTML = 'Scan complete. No matches found with your "Want to Read" shelf.';
            }
        } catch (err) {
            ocrStatus.innerHTML = `<span style="color:#ff4c4c">Error during scanning: ${err.message}</span>`;
        }
    }

    // Start App
    init();
});
