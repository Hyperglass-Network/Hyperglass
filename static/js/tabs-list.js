class TabManager {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.nextTabId = 1;
        this.defaultUrl = 'duckduckgo.com';
        
        this.init();
    }
    
    init() {
        this.loadTabsFromStorage();
        this.setupEventListeners();
        
        if (this.tabs.length === 0) {
            this.createNewTab(this.defaultUrl);
        }
        
        this.renderTabs();
        if (this.activeTabId) {
            this.switchToTab(this.activeTabId);
        }
    }
    
    setupEventListeners() {
        document.getElementById('add-tab-btn').addEventListener('click', () => {
            this.createNewTab(this.defaultUrl);
        });
        
        document.getElementById('tabs-list').addEventListener('click', (e) => {
            const tabItem = e.target.closest('.tab-item');
            if (!tabItem) return;
            
            const tabId = parseInt(tabItem.dataset.tabId);
            
            if (e.target.classList.contains('tab-close')) {
                e.stopPropagation();
                this.closeTab(tabId);
            } else {
                this.switchToTab(tabId);
            }
        });
        
        const originalSetItem = sessionStorage.setItem;
        sessionStorage.setItem = (key, value) => {
            originalSetItem.call(sessionStorage, key, value);
            if (key === 'uvUrl' && this.activeTabId) {
                this.updateTabUrl(this.activeTabId, value);
            }
        };
    }
    
    createNewTab(url) {
        const tab = {
            id: this.nextTabId++,
            title: this.getTitleFromUrl(url),
            url: url
        };
        
        this.tabs.push(tab);
        this.activeTabId = tab.id;
        this.saveTabsToStorage();
        this.renderTabs();
        this.switchToTab(tab.id);
        
        return tab.id;
    }
    
    closeTab(tabId) {
        const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex === -1) return;
        
        this.tabs.splice(tabIndex, 1);
        
        if (this.activeTabId === tabId) {
            if (this.tabs.length > 0) {
                const newActiveIndex = Math.min(tabIndex, this.tabs.length - 1);
                this.activeTabId = this.tabs[newActiveIndex].id;
                this.switchToTab(this.activeTabId);
            } else {
                this.createNewTab(this.defaultUrl);
                return;
            }
        }
        
        this.saveTabsToStorage();
        this.renderTabs();
    }
    
    switchToTab(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return;
        
        this.activeTabId = tabId;
        this.saveTabsToStorage();
        this.renderTabs();

        sessionStorage.setItem('uvUrl', tab.url);
        const frame = document.getElementById('uv-frame');
        if (frame && window.__uv$config) {
            frame.src = __uv$config.prefix + __uv$config.encodeUrl(tab.url);
        }
    }
    
    updateTabUrl(tabId, newUrl) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return;
        
        tab.url = newUrl;
        tab.title = this.getTitleFromUrl(newUrl);
        this.saveTabsToStorage();
        this.renderTabs();
    }
    
    updateTabTitle(tabId, newTitle) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return;
        
        tab.title = newTitle;
        this.saveTabsToStorage();
        this.renderTabs();
    }
    
    renderTabs() {
        const tabsList = document.getElementById('tabs-list');
        tabsList.innerHTML = '';
        
        this.tabs.forEach(tab => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="tab-item ${tab.id === this.activeTabId ? 'active' : ''}" data-tab-id="${tab.id}">
                    <span class="tab-title">${tab.title}</span>
                    <button class="tab-close">×</button>
                </div>
            `;
            tabsList.appendChild(li);
        });
    }
    
    getTitleFromUrl(url) {
        try {
            let cleanUrl = url.replace(/^https?:\/\//, '');
            let domain = cleanUrl.split('/')[0];
            return domain.charAt(0).toUpperCase() + domain.slice(1);
        } catch {
            return url;
        }
    }
    
    saveTabsToStorage() {
        sessionStorage.setItem('tabs', JSON.stringify(this.tabs));
        sessionStorage.setItem('activeTabId', this.activeTabId);
    }
    
    loadTabsFromStorage() {
        const savedTabs = sessionStorage.getItem('tabs');
        const savedActiveId = sessionStorage.getItem('activeTabId');
        
        if (savedTabs) {
            this.tabs = JSON.parse(savedTabs);
            this.nextTabId = Math.max(...this.tabs.map(t => t.id), 0) + 1;
        }
        
        if (savedActiveId) {
            this.activeTabId = parseInt(savedActiveId);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.tabManager = new TabManager();
});