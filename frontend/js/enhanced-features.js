// Enhanced features and interactions for the Research Paper Finder

class EnhancedFeatures {
    constructor() {
        this.initializeFeatures();
    }

    initializeFeatures() {
        this.setupKeyboardShortcuts();
        this.setupDragAndDrop();
        this.setupAdvancedSearch();
        this.setupPaperManagement();
        this.setupAnalytics();
        this.setupOfflineSupport();
    }

    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Global shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'k':
                        e.preventDefault();
                        this.focusSearch();
                        break;
                    case '/':
                        e.preventDefault();
                        this.toggleChatMode();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveCurrentSearch();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.focusFilters();
                        break;
                    case 't':
                        e.preventDefault();
                        this.toggleTheme();
                        break;
                }
            }

            // Escape key
            if (e.key === 'Escape') {
                this.closeModals();
            }

            // Arrow keys for navigation
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                this.navigatePapers(e.key);
            }
        });
    }

    focusSearch() {
        const searchInput = document.getElementById('queryInput');
        const chatInput = document.getElementById('chatInput');
        
        if (currentMode === 'chat' && chatInput) {
            chatInput.focus();
        } else if (searchInput) {
            searchInput.focus();
        }
    }

    toggleChatMode() {
        if (currentMode === 'search') {
            switchToChat();
        } else {
            switchToSearch();
        }
    }

    saveCurrentSearch() {
        const query = document.getElementById('queryInput').value.trim();
        if (query) {
            addToSearchHistory(query);
            showNotification('Search saved to history!', 'success');
        }
    }

    focusFilters() {
        const sortFilter = document.getElementById('sortFilter');
        if (sortFilter) {
            sortFilter.focus();
        }
    }

    navigatePapers(direction) {
        const papers = document.querySelectorAll('.paper-card');
        const currentIndex = Array.from(papers).findIndex(paper => 
            paper === document.activeElement || paper.contains(document.activeElement)
        );

        let nextIndex;
        if (direction === 'ArrowDown') {
            nextIndex = currentIndex < papers.length - 1 ? currentIndex + 1 : 0;
        } else {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : papers.length - 1;
        }

        if (papers[nextIndex]) {
            papers[nextIndex].focus();
            papers[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Drag and drop functionality
    setupDragAndDrop() {
        const dropZone = document.querySelector('.search-section');
        
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                
                const files = Array.from(e.dataTransfer.files);
                this.handleDroppedFiles(files);
            });
        }
    }

    handleDroppedFiles(files) {
        files.forEach(file => {
            if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    const query = this.extractQueryFromText(content);
                    if (query) {
                        document.getElementById('queryInput').value = query;
                        handleSearch();
                    }
                };
                reader.readAsText(file);
            }
        });
    }

    extractQueryFromText(text) {
        // Simple extraction of potential research queries
        const lines = text.split('\n').filter(line => line.trim().length > 10);
        return lines[0] || null;
    }

    // Advanced search features
    setupAdvancedSearch() {
        this.setupSearchSuggestions();
        this.setupSearchHistory();
        this.setupSavedSearches();
    }

    setupSearchSuggestions() {
        const searchInput = document.getElementById('queryInput');
        if (!searchInput) return;

        let suggestionTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(suggestionTimeout);
            const query = e.target.value.trim();
            
            if (query.length > 2) {
                suggestionTimeout = setTimeout(() => {
                    this.showSearchSuggestions(query);
                }, 300);
            } else {
                this.hideSearchSuggestions();
            }
        });
    }

    showSearchSuggestions(query) {
        const suggestions = this.generateSuggestions(query);
        if (suggestions.length === 0) return;

        let suggestionBox = document.getElementById('suggestionBox');
        if (!suggestionBox) {
            suggestionBox = document.createElement('div');
            suggestionBox.id = 'suggestionBox';
            suggestionBox.className = 'suggestion-box';
            suggestionBox.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-lg);
                z-index: 1000;
                max-height: 200px;
                overflow-y: auto;
            `;
            document.querySelector('.search-input-container').appendChild(suggestionBox);
        }

        suggestionBox.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" style="
                padding: 0.75rem 1rem;
                cursor: pointer;
                border-bottom: 1px solid var(--border-color);
                transition: var(--transition-fast);
            " onclick="this.selectSuggestion('${suggestion}')">
                <i class="fas fa-search" style="margin-right: 0.5rem; color: var(--text-muted);"></i>
                ${suggestion}
            </div>
        `).join('');

        // Add hover effects
        suggestionBox.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.background = 'var(--bg-secondary)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });
        });
    }

    generateSuggestions(query) {
        const commonTerms = [
            'machine learning', 'artificial intelligence', 'deep learning',
            'quantum computing', 'blockchain', 'cybersecurity',
            'data science', 'computer vision', 'natural language processing',
            'robotics', 'biotechnology', 'renewable energy',
            'climate change', 'sustainability', 'healthcare'
        ];

        return commonTerms
            .filter(term => term.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5);
    }

    hideSearchSuggestions() {
        const suggestionBox = document.getElementById('suggestionBox');
        if (suggestionBox) {
            suggestionBox.remove();
        }
    }

    selectSuggestion(suggestion) {
        document.getElementById('queryInput').value = suggestion;
        this.hideSearchSuggestions();
        handleSearch();
    }

    setupSearchHistory() {
        this.renderSearchHistory();
    }

    renderSearchHistory() {
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        if (history.length === 0) return;

        let historyBox = document.getElementById('historyBox');
        if (!historyBox) {
            historyBox = document.createElement('div');
            historyBox.id = 'historyBox';
            historyBox.className = 'history-box';
            historyBox.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-lg);
                z-index: 1000;
                max-height: 200px;
                overflow-y: auto;
            `;
            document.querySelector('.search-input-container').appendChild(historyBox);
        }

        historyBox.innerHTML = `
            <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); font-weight: 600; color: var(--text-secondary);">
                <i class="fas fa-history" style="margin-right: 0.5rem;"></i>
                Recent Searches
            </div>
            ${history.map(item => `
                <div class="history-item" style="
                    padding: 0.75rem 1rem;
                    cursor: pointer;
                    border-bottom: 1px solid var(--border-color);
                    transition: var(--transition-fast);
                " onclick="this.selectHistoryItem('${item}')">
                    <i class="fas fa-clock" style="margin-right: 0.5rem; color: var(--text-muted);"></i>
                    ${item}
                </div>
            `).join('')}
        `;
    }

    selectHistoryItem(item) {
        document.getElementById('queryInput').value = item;
        this.hideSearchSuggestions();
        handleSearch();
    }

    // Paper management
    setupPaperManagement() {
        this.setupPaperBookmarks();
        this.setupPaperExport();
        this.setupPaperSharing();
    }

    setupPaperBookmarks() {
        // Enhanced bookmark functionality
        document.addEventListener('click', (e) => {
            if (e.target.closest('.paper-action[title="Save Paper"]')) {
                const paperCard = e.target.closest('.paper-card');
                const paperData = this.extractPaperData(paperCard);
                this.savePaperToBookmarks(paperData);
            }
        });
    }

    extractPaperData(paperCard) {
        return {
            title: paperCard.querySelector('.paper-title').textContent,
            authors: paperCard.querySelector('.paper-authors').textContent,
            source: paperCard.querySelector('.paper-source').textContent,
            url: paperCard.querySelector('a[href]')?.href || '',
            timestamp: new Date().toISOString()
        };
    }

    savePaperToBookmarks(paperData) {
        const bookmarks = JSON.parse(localStorage.getItem('paperBookmarks') || '[]');
        bookmarks.push(paperData);
        localStorage.setItem('paperBookmarks', JSON.stringify(bookmarks));
        showNotification('Paper bookmarked!', 'success');
    }

    setupPaperExport() {
        // Add export functionality
        const exportButton = document.createElement('button');
        exportButton.className = 'btn btn-secondary';
        exportButton.innerHTML = '<i class="fas fa-download"></i> Export Results';
        exportButton.onclick = () => this.exportResults();
        
        const resultsHeader = document.querySelector('.results-header');
        if (resultsHeader) {
            resultsHeader.appendChild(exportButton);
        }
    }

    exportResults() {
        const papers = Array.from(document.querySelectorAll('.paper-card')).map(card => 
            this.extractPaperData(card)
        );

        const exportData = {
            timestamp: new Date().toISOString(),
            query: document.getElementById('queryInput').value,
            papers: papers
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `research-papers-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showNotification('Results exported!', 'success');
    }

    // Analytics and insights
    setupAnalytics() {
        this.trackUserInteractions();
        this.generateSearchInsights();
    }

    trackUserInteractions() {
        // Track search patterns
        document.addEventListener('click', (e) => {
            if (e.target.closest('.example-chip')) {
                this.trackEvent('example_click', {
                    query: e.target.dataset.query
                });
            }
        });

        // Track paper interactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.paper-action')) {
                const action = e.target.closest('.paper-action').title;
                this.trackEvent('paper_action', { action });
            }
        });
    }

    trackEvent(eventName, data) {
        const analytics = JSON.parse(localStorage.getItem('analytics') || '{}');
        if (!analytics[eventName]) {
            analytics[eventName] = [];
        }
        
        analytics[eventName].push({
            timestamp: new Date().toISOString(),
            data: data
        });

        localStorage.setItem('analytics', JSON.stringify(analytics));
    }

    generateSearchInsights() {
        const analytics = JSON.parse(localStorage.getItem('analytics') || '{}');
        const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        
        if (searchHistory.length > 0) {
            this.showSearchInsights(searchHistory, analytics);
        }
    }

    showSearchInsights(history, analytics) {
        const insights = this.calculateInsights(history, analytics);
        
        // Create insights panel
        const insightsPanel = document.createElement('div');
        insightsPanel.className = 'insights-panel';
        insightsPanel.style.cssText = `
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            padding: 1.5rem;
            margin-bottom: 2rem;
            box-shadow: var(--shadow-md);
        `;

        insightsPanel.innerHTML = `
            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">
                <i class="fas fa-chart-bar" style="margin-right: 0.5rem;"></i>
                Search Insights
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div class="insight-item">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--primary-gradient);">
                        ${insights.totalSearches}
                    </div>
                    <div style="color: var(--text-secondary);">Total Searches</div>
                </div>
                <div class="insight-item">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--success-gradient);">
                        ${insights.avgPapersPerSearch}
                    </div>
                    <div style="color: var(--text-secondary);">Avg Papers/Search</div>
                </div>
                <div class="insight-item">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--accent-gradient);">
                        ${insights.topCategory}
                    </div>
                    <div style="color: var(--text-secondary);">Top Category</div>
                </div>
            </div>
        `;

        const searchSection = document.querySelector('.search-section');
        if (searchSection) {
            searchSection.appendChild(insightsPanel);
        }
    }

    calculateInsights(history, analytics) {
        return {
            totalSearches: history.length,
            avgPapersPerSearch: Math.round(analytics.paper_action?.length / history.length) || 0,
            topCategory: this.getTopCategory(history)
        };
    }

    getTopCategory(history) {
        const categories = {
            'AI/ML': ['machine learning', 'artificial intelligence', 'deep learning'],
            'Computing': ['quantum computing', 'blockchain', 'cybersecurity'],
            'Science': ['biotechnology', 'renewable energy', 'climate change']
        };

        const counts = {};
        history.forEach(query => {
            Object.entries(categories).forEach(([category, keywords]) => {
                if (keywords.some(keyword => query.toLowerCase().includes(keyword))) {
                    counts[category] = (counts[category] || 0) + 1;
                }
            });
        });

        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, 'General');
    }

    // Offline support
    setupOfflineSupport() {
        // Cache search results for offline access
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // Service worker registration failed, continue without offline support
            });
        }

        // Store recent searches for offline access
        this.cacheRecentSearches();
    }

    cacheRecentSearches() {
        const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        // Keep only last 50 searches for offline access
        if (recentSearches.length > 50) {
            recentSearches.splice(0, recentSearches.length - 50);
            localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
        }
    }

    // Utility methods
    closeModals() {
        this.hideSearchSuggestions();
        // Close any open modals or dropdowns
    }

    toggleTheme() {
        // Use existing theme toggle function
        if (typeof toggleTheme === 'function') {
            toggleTheme();
        }
    }
}

// Initialize enhanced features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedFeatures();
});

// Export for global access
window.EnhancedFeatures = EnhancedFeatures;
