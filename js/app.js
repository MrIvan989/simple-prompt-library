// ═══════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════
let prompts = JSON.parse(localStorage.getItem('myPrompts')) || [];
let currentId = null; // null = creating, value = editing
let tempRating = 0;
let tempFavorite = false;
let currentCategory = 'All';
let searchQuery = '';

// ═══════════════════════════════════════════════════════════════
// THEME MANAGEMENT
// ═══════════════════════════════════════════════════════════════
// Theme toggle
function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}

// Sidebar toggle (mobile)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('-translate-x-full');
}

// Navigation group toggle
function toggleNavGroup(groupId) {
    const items = document.getElementById(groupId + '-items');
    const chevron = document.getElementById(groupId + '-chevron');

    items.classList.toggle('hidden');
    chevron.classList.toggle('expanded');
}

// Close sidebar on click outside (mobile)
document.addEventListener('click', function (event) {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menuBtn');

    if (window.innerWidth < 768) {
        if (!sidebar.contains(event.target) && !menuBtn.contains(event.target)) {
            sidebar.classList.add('-translate-x-full');
        }
    }
});

// Handle responsive sidebar
window.addEventListener('resize', function () {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth >= 768) {
        sidebar.classList.remove('-translate-x-full');
    } else {
        sidebar.classList.add('-translate-x-full');
    }
});

// ═══════════════════════════════════════════════════════════════
// PROMPT RENDERING
// ═══════════════════════════════════════════════════════════════
function renderPrompts() {
    const grid = document.getElementById('promptGrid');
    const emptyState = document.getElementById('emptyState');

    if (!grid) return;

    // Filter prompts
    let filtered = prompts;

    // Apply category filter
    if (currentCategory !== 'All') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }

    // Apply search filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(query) ||
            p.text.toLowerCase().includes(query)
        );
    }

    // Sort: favorites first, then by date
    filtered.sort((a, b) => {
        if (a.favorite === b.favorite) {
            return b.updatedAt - a.updatedAt;
        }
        return a.favorite ? -1 : 1;
    });

    // Clear grid (keep create card)
    grid.innerHTML = '';

    // Add create card
    const createCard = document.createElement('div');
    createCard.className = 'create-card bg-transparent p-4 flex flex-col items-center justify-center min-h-[180px] cursor-pointer';
    createCard.onclick = () => openModal();
    createCard.innerHTML = `
        <svg class="w-6 h-6 text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Create Prompt</span>
    `;
    grid.appendChild(createCard);

    // Add prompt cards
    filtered.forEach(p => {
        // Random flip direction
        const flipDirections = ['flip-rtl', 'flip-ltr', 'flip-ttb', 'flip-btt'];
        const randomFlip = flipDirections[Math.floor(Math.random() * flipDirections.length)];

        // Create flip card container
        const flipContainer = document.createElement('div');
        flipContainer.className = `flip-card-container cursor-pointer ${randomFlip}`;
        flipContainer.onclick = () => openModal(p.id);

        // Get rating indicator
        const ratingDot = getRatingIndicator(p.rating);
        const favoriteIcon = getFavoriteIcon(p.favorite);

        // Generate star rating HTML for back card
        const rating = p.rating || 0;
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHtml += `<svg class="star-filled" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
            } else {
                starsHtml += `<svg class="star-empty" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
            }
        }

        // Truncate prompt details to 200 characters
        const truncatedDetails = p.text.length > 200 ? p.text.substring(0, 200) + '...' : p.text;

        flipContainer.innerHTML = `
            <div class="flip-card-inner">
                <!-- Front Face -->
                <div class="flip-card-front skill-card relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-4 py-8 shadow-card flex flex-col items-center min-h-[200px] group">
                    ${ratingDot}
                    <button class="menu-btn absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-400 dark:hover:text-gray-300" onclick="event.stopPropagation(); openModal('${p.id}')">
                    </button>
                    <div class="w-20 h-20 rounded-full mb-3 flex items-center justify-center" style="background: ${getIllustrationGradient(p.category)};">
                        ${getCategoryIcon(p.category)}
                    </div>
                    <div class="flex items-center gap-1 mb-1">
                        <h3 class="text-sm font-medium text-center text-gray-900 dark:text-gray-50 line-clamp-2">${p.title}</h3>
                        ${favoriteIcon}
                    </div>
                    <p class="text-xs text-gray-400 dark:text-gray-500 text-center">${p.category}</p>
                </div>
                <!-- Back Face -->
                <div class="flip-card-back bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-card">
                    <div class="back-card-stars">
                        ${starsHtml}
                    </div>
                    <h3 class="back-card-title text-gray-900 dark:text-gray-50">${p.title}</h3>
                    <p class="back-card-category">${p.category}</p>
                    <p class="back-card-details">${truncatedDetails}</p>
                </div>
            </div>
        `;
        grid.appendChild(flipContainer);
    });

    // Toggle empty state
    if (emptyState) {
        if (filtered.length === 0) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
        } else {
            emptyState.classList.add('hidden');
            emptyState.classList.remove('flex');
        }
    }

    // Update template stats
    updateTemplateStats();
}

function getRatingIndicator(rating) {
    if (!rating) return '';

    const colors = {
        5: 'bg-green-500',
        4: 'bg-blue-500',
        3: 'bg-yellow-500',
        2: 'bg-orange-500',
        1: 'bg-red-500'
    };

    const color = colors[rating] || 'bg-gray-400';
    return `<div class="absolute top-3 right-3 w-3 h-3 ${color} rounded-full ring-2 ring-white dark:ring-gray-900" title="${rating} Star${rating !== 1 ? 's' : ''}"></div>`;
}

function getFavoriteIcon(isFavorite) {
    if (!isFavorite) return '';
    return `<svg class="w-4 h-4 text-red-500 fill-current flex-shrink-0" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>`;
}

function getIllustrationGradient(category) {
    const gradients = {
        'Marketing': 'linear-gradient(135deg, #ffeee6 0%, #ffb07b 100%)',
        'Research': 'linear-gradient(135deg, #e6fff0 0%, #7bffb0 100%)',
        'Coding': 'linear-gradient(135deg, #f0e6ff 0%, #b07bff 100%)',
        'Custom GPTs': 'linear-gradient(135deg, #e6f0ff 0%, #7bb0ff 100%)',
        'Google GEMs': 'linear-gradient(135deg, #fff8e6 0%, #fcd34d 100%)',
        'Creative Writing': 'linear-gradient(135deg, #ffe6e6 0%, #ff7b7b 100%)',
        'Notes': 'linear-gradient(135deg, #e6fff0 0%, #7bffb0 100%)',
        'Fun': 'linear-gradient(135deg, #ffeee6 0%, #ff7bb0 100%)',
        'Employment': 'linear-gradient(135deg, #e6f0ff 0%, #7bb0ff 100%)',
        'Other': 'linear-gradient(135deg, #f0e6ff 0%, #b07bff 100%)'
    };
    return gradients[category] || gradients['Other'];
}

function getCategoryIcon(category) {
    const lowerCategory = category.toLowerCase();

    // Marketing - chart with arrow pointing up and to the right
    if (lowerCategory.includes('marketing')) {
        return `<svg class="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
        </svg>`;
    }

    // Research - magnifying glass outline
    if (lowerCategory.includes('research')) {
        return `<svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>`;
    }

    // Coding - </>
    if (lowerCategory.includes('coding')) {
        return `<svg class="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
        </svg>`;
    }

    // Custom GPTs - OpenAI logo
    if (lowerCategory.includes('custom gpts')) {
        return `<svg class="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
        </svg>`;
    }

    // Google GEMs - shiny ruby/gem
    if (lowerCategory.includes('google gems')) {
        return `<svg class="w-10 h-10 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 9l10 13 10-13-10-7zm0 2.5L18.5 9H5.5L12 4.5zM4.5 10h15l-7.5 9.5L4.5 10z"/>
        </svg>`;
    }

    // Creative Writing - paper with pencil
    if (lowerCategory.includes('creative writing')) {
        return `<svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>`;
    }

    // Notes - book with pen
    if (lowerCategory.includes('notes')) {
        return `<svg class="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>`;
    }

    // Fun - mischievous winking face
    if (lowerCategory.includes('fun')) {
        return `<svg class="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke-width="2"/>
            <path stroke-linecap="round" stroke-width="2" d="M8 9v.01"/>
            <path stroke-linecap="round" stroke-width="2" d="M15 9l1.5 1.5"/>
            <path stroke-linecap="round" stroke-width="2" d="M16.5 9l-1.5 1.5"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14s1.5 2 4 2 4-2 4-2"/>
        </svg>`;
    }

    // Employment - person with shovel
    if (lowerCategory.includes('employment')) {
        return `<svg class="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="7" r="3" stroke-width="2"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13c-4 0-6 2-6 4v1h12v-1c0-2-2-4-6-4z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l3 8M20 8l-3 8M17 12h3"/>
        </svg>`;
    }

    // Other - two question marks
    if (lowerCategory.includes('other')) {
        return `<svg class="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01"/>
            <circle cx="12" cy="12" r="10" stroke-width="2"/>
        </svg>`;
    }

    // Default fallback - lightning bolt
    return `<svg class="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
    </svg>`;
}

function updateTemplateStats() {
    const totalElement = document.getElementById('totalPromptsCount');
    if (totalElement) {
        totalElement.innerText = `You have ${prompts.length} prompt${prompts.length !== 1 ? 's' : ''} in your library`;
    }

    // Find most used category
    if (prompts.length > 0) {
        const categoryCounts = {};
        prompts.forEach(p => {
            categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
        });
        const favoriteCategory = Object.keys(categoryCounts).reduce((a, b) =>
            categoryCounts[a] > categoryCounts[b] ? a : b, 'None');

        const favCatElement = document.getElementById('favoriteCategoryText');
        if (favCatElement) {
            favCatElement.innerText = `Your favorite category is ${favoriteCategory}`;
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// MODAL MANAGEMENT
// ═══════════════════════════════════════════════════════════════
function openModal(id = null) {
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    const btnDelete = document.getElementById('btnDelete');

    currentId = id;
    overlay.classList.remove('hidden');

    // Trigger reflow
    void overlay.offsetWidth;

    overlay.classList.remove('opacity-0');
    content.classList.remove('scale-95', 'opacity-0');
    content.classList.add('scale-100', 'opacity-100');

    if (id) {
        // Edit mode
        const p = prompts.find(prompt => prompt.id === id);
        if (p) {
            document.getElementById('inputTitle').value = p.title;
            document.getElementById('inputText').value = p.text;
            document.getElementById('inputCategory').value = p.category;
            tempRating = p.rating || 0;
            tempFavorite = p.favorite || false;
            btnDelete.classList.remove('hidden');
        }
    } else {
        // Create mode
        document.getElementById('inputTitle').value = '';
        document.getElementById('inputText').value = '';
        document.getElementById('inputCategory').value = 'Marketing';
        tempRating = 0;
        tempFavorite = false;
        btnDelete.classList.add('hidden');
    }

    updateStarUI();
    updateFavoriteUI();
}

function closeModal(event) {
    // If triggered by overlay click, check if it's the actual overlay
    if (event && event.target !== event.currentTarget) return;

    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');

    overlay.classList.add('opacity-0');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300);
}

// ═══════════════════════════════════════════════════════════════
// STAR RATING
// ═══════════════════════════════════════════════════════════════
function setupStars() {
    const container = document.getElementById('starContainer');
    container.innerHTML = '';

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'cursor-pointer text-3xl select-none transition-colors';
        star.innerText = '★';
        star.onclick = () => {
            tempRating = i;
            updateStarUI();
        };
        container.appendChild(star);
    }
    updateStarUI();
}

function updateStarUI() {
    const stars = document.getElementById('starContainer').children;
    for (let i = 0; i < 5; i++) {
        if (i < tempRating) {
            stars[i].classList.add('text-yellow-400');
            stars[i].classList.remove('text-gray-300', 'dark:text-gray-600');
        } else {
            stars[i].classList.add('text-gray-300', 'dark:text-gray-600');
            stars[i].classList.remove('text-yellow-400');
        }
    }
}

function toggleModalFavorite() {
    tempFavorite = !tempFavorite;
    updateFavoriteUI();
}

function updateFavoriteUI() {
    const btn = document.getElementById('btnFavorite');
    if (tempFavorite) {
        btn.classList.add('text-red-500');
        btn.classList.remove('text-gray-400');
    } else {
        btn.classList.add('text-gray-400');
        btn.classList.remove('text-red-500');
    }
}

// ═══════════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════
function savePrompt() {
    const title = document.getElementById('inputTitle').value.trim();
    const text = document.getElementById('inputText').value.trim();
    const category = document.getElementById('inputCategory').value;

    if (!title) {
        showToast("Please enter a title", "error");
        return;
    }

    const promptData = {
        id: currentId || Date.now().toString(),
        title,
        text,
        category,
        rating: tempRating,
        favorite: tempFavorite,
        updatedAt: Date.now()
    };

    if (currentId) {
        // Update existing
        const index = prompts.findIndex(p => p.id === currentId);
        prompts[index] = promptData;
    } else {
        // Create new
        prompts.unshift(promptData);
    }

    localStorage.setItem('myPrompts', JSON.stringify(prompts));
    closeModal();
    renderPrompts();
    showToast("Prompt saved successfully!", "success");
}

function deleteCurrentPrompt() {
    if (!currentId || !confirm("Are you sure you want to delete this prompt?")) return;

    prompts = prompts.filter(p => p.id !== currentId);
    localStorage.setItem('myPrompts', JSON.stringify(prompts));
    closeModal();
    renderPrompts();
    showToast("Prompt deleted", "success");
}

function copyToClipboard() {
    const text = document.getElementById('inputText').value;
    navigator.clipboard.writeText(text).then(() => {
        showToast("Copied to clipboard!", "success");
    });
}

// ═══════════════════════════════════════════════════════════════
// FILTERING & SEARCH
// ═══════════════════════════════════════════════════════════════
function handleCategoryChange(category) {
    currentCategory = category;
    renderPrompts();

    // Update active state on sidebar buttons
    const categoryButtons = document.querySelectorAll('#library-items button');
    categoryButtons.forEach(btn => {
        if (btn.textContent.trim() === category || (category === 'All' && btn.textContent.trim() === 'All Categories')) {
            btn.classList.add('bg-primary-50', 'dark:bg-primary-950', 'text-primary-600', 'dark:text-primary-400');
        } else {
            btn.classList.remove('bg-primary-50', 'dark:bg-primary-950', 'text-primary-600', 'dark:text-primary-400');
        }
    });
}

function handleSearch(query) {
    searchQuery = query;
    renderPrompts();
}

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════
function exportPrompts() {
    if (prompts.length === 0) {
        showToast("No prompts to export", "error");
        return;
    }

    // CSV escaping helper
    const escapeCSV = (str) => {
        if (str === null || str === undefined) return '';
        str = str.toString();
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    };

    // Create CSV content
    const headers = ['Title', 'Category', 'Rating', 'Favorite Status', 'Prompt Details'];
    let csvContent = headers.map(h => escapeCSV(h)).join(',') + '\n';

    prompts.forEach(prompt => {
        const row = [
            prompt.title,
            prompt.category,
            prompt.rating || 0,
            prompt.favorite ? 'Yes' : 'No',
            prompt.text
        ];
        csvContent += row.map(cell => escapeCSV(cell)).join(',') + '\n';
    });

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${month}-${day}-${year}`;

    link.setAttribute('href', url);
    link.setAttribute('download', `prompt-library-${dateStr}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Prompts exported successfully!", "success");
}

// ═══════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════
function showToast(message, type = "success") {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const msg = document.getElementById('toastMsg');

    msg.innerText = message;

    // Update icon and color based on type
    if (type === "error") {
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>';
        toast.classList.add('bg-red-500', 'text-white');
        toast.classList.remove('bg-gray-900', 'dark:bg-gray-100', 'dark:text-gray-900');
    } else {
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>';
        toast.classList.remove('bg-red-500');
        toast.classList.add('bg-gray-900', 'dark:bg-gray-100', 'text-white', 'dark:text-gray-900');
    }

    // Show toast
    toast.classList.remove('translate-y-20');
    toast.classList.add('translate-y-0');

    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('translate-y-0');
        toast.classList.add('translate-y-20');
    }, 3000);
}

// ═══════════════════════════════════════════════════════════════
// USER PROFILE MANAGEMENT
// ═══════════════════════════════════════════════════════════════
function saveUserName() {
    const nameElement = document.getElementById('userName');
    const newName = nameElement.innerText.trim() || "YOUR NAME";

    // Prevent empty display
    if (nameElement.innerText.trim() === "") {
        nameElement.innerText = newName;
    }

    localStorage.setItem('userName', newName);
    updateProfileUI();
}

function handleNameKey(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        event.target.blur();
    } else if (event.key === 'Escape') {
        event.target.innerText = localStorage.getItem('userName') || "YOUR NAME";
        event.target.blur();
    }
}

function updateProfileUI() {
    const name = localStorage.getItem('userName') || "YOUR NAME";
    const nameElement = document.getElementById('userName');
    const initialsElement = document.getElementById('userInitials');

    if (nameElement) nameElement.innerText = name;

    if (initialsElement) {
        const parts = name.split(/\s+/).filter(p => p.length > 0);
        let initials = "";

        if (parts.length >= 2) {
            initials = parts[0][0] + parts[parts.length - 1][0];
        } else if (parts.length === 1) {
            initials = parts[0].substring(0, 2);
        } else {
            initials = "UN";
        }

        initialsElement.innerText = initials.toUpperCase();
    }
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    // Load prompts from localStorage
    prompts = JSON.parse(localStorage.getItem('myPrompts')) || [];

    // Setup star rating UI
    setupStars();

    // Initial render
    renderPrompts();

    // Update user profile
    updateProfileUI();

    // Apply saved theme
    if (localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
});
