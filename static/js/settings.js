document.addEventListener('DOMContentLoaded', function() {
    const closePToggle = document.getElementById('close-p-toggle');
    const savedCloseP = localStorage.getItem('close-p');
    closePToggle.checked = savedCloseP === 'true';
    closePToggle.addEventListener('change', function() {
        localStorage.setItem('close-p', this.checked);
        setTimeout(() => {
            location.reload();
        }, 250);
    });

    const abcloakToggle = document.getElementById('abcloak-toggle');
    const savedAbcloak = localStorage.getItem('abcloak');
    abcloakToggle.checked = savedAbcloak === 'true';
    abcloakToggle.addEventListener('change', function() {
        localStorage.setItem('abcloak', this.checked);
        applyAboutBlankCloakingSetting();
    });

    const savedBg = localStorage.getItem('bg');
    if (savedBg) {
        document.getElementById('bg-url').value = savedBg;
    }

    const savedEngine = localStorage.getItem('engine');
    if (savedEngine) {
        document.getElementById('search-engine').value = savedEngine;
    }

    const savedProxy = localStorage.getItem('proxy');
    if (savedProxy) {
        document.getElementById('proxy-select').value = savedProxy;
    }

    const savedWisp = localStorage.getItem('wisp');
    if (savedWisp) {
        const wispSelect = document.getElementById('wisp-select');
        const customWispInput = document.getElementById('custom-wisp');
        const isCustom = !['wisp1', 'wisp2', 'wisp3'].includes(savedWisp);
        if (isCustom) {
            wispSelect.value = 'custom';
            customWispInput.value = savedWisp;
        } else {
            wispSelect.value = savedWisp;
        }
    }

});

let currentAppSlot = null;
let currentAppType = null;

document.addEventListener('DOMContentLoaded', function() {
    const modalHTML = `
        <div class="app-config-modal" id="app-config-modal">
            <div class="app-config-content">
                <h3 id="modal-title">Configure App</h3>
                <input type="text" id="app-name-input" class="styled-input" placeholder="App Name (e.g., GitHub)">
                <input type="text" id="app-url-input" class="styled-input" placeholder="App URL (e.g., github.com)">
                <input type="text" id="app-icon-input" class="styled-input" placeholder="Icon URL (optional)">
                <div class="logo-preview">
                    <img id="icon-preview" src="images/hive.svg" alt="Icon Preview">
                </div>
                <div class="app-config-buttons">
                    <button class="styled-button" onclick="saveAppConfig()">Save</button>
                    <button class="styled-button" onclick="removeAppConfig()">Remove</button>
                    <button class="styled-button" onclick="closeAppModal()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    initializeAppSlots();
    loadSavedApps();
    document.getElementById('app-icon-input').addEventListener('input', updateIconPreview);
    document.getElementById('app-url-input').addEventListener('input', autoGenerateIcon);
});

function initializeAppSlots() {
    document.querySelectorAll('.quick-apps-container .app-slot').forEach(slot => {
        slot.addEventListener('click', () => openAppModal(slot, 'quick'));
    });

    document.querySelectorAll('.sidebar-apps-container .app-slot').forEach(slot => {
        slot.addEventListener('click', () => openAppModal(slot, 'sidebar'));
    });
}

function openAppModal(slot, type) {
    currentAppSlot = slot;
    currentAppType = type;
    
    const modal = document.getElementById('app-config-modal');
    const slotIndex = slot.dataset.slot;
    const savedApp = getSavedApp(type, slotIndex);
    
    document.getElementById('modal-title').textContent = `Configure ${type === 'quick' ? 'Quick' : 'Sidebar'} App`;
    
    const iconInput = document.getElementById('app-icon-input');
    if (type === 'quick') {
        iconInput.placeholder = 'Icon URL (required)';
    } else {
        iconInput.placeholder = 'Icon URL (optional)';
    }
    
    if (savedApp) {
        document.getElementById('app-name-input').value = savedApp.name;
        document.getElementById('app-url-input').value = savedApp.url;
        document.getElementById('app-icon-input').value = savedApp.icon || '';
        document.getElementById('icon-preview').src = savedApp.icon || 'images/hive.svg';
    } else {
        document.getElementById('app-name-input').value = '';
        document.getElementById('app-url-input').value = '';
        document.getElementById('app-icon-input').value = '';
        document.getElementById('icon-preview').src = 'images/hive.svg';
    }
    
    modal.style.display = 'flex';
}

function closeAppModal() {
    document.getElementById('app-config-modal').style.display = 'none';
    currentAppSlot = null;
    currentAppType = null;
}

function saveAppConfig() {
    const name = document.getElementById('app-name-input').value.trim();
    const url = document.getElementById('app-url-input').value.trim();
    const icon = document.getElementById('app-icon-input').value.trim();
    
    if (!name || !url) {
        alert('Please fill in both name and URL');
        return;
    }
    
    if (currentAppType === 'quick' && !icon) {
        alert('Icon URL is required for Quick Apps');
        return;
    }
    
    const slotIndex = currentAppSlot.dataset.slot;
    const appData = { 
        name, 
        url, 
        icon: icon || (currentAppType === 'sidebar' ? generateIconUrl(url) : '')
    };
    
    const storageKey = currentAppType === 'quick' ? 'quickApps' : 'sidebarApps';
    const savedApps = JSON.parse(localStorage.getItem(storageKey) || '{}');
    savedApps[slotIndex] = appData;
    localStorage.setItem(storageKey, JSON.stringify(savedApps));
    updateAppSlot(currentAppSlot, appData);
    if (currentAppType === 'quick') {
        updateNavbarIcon(slotIndex, appData);
    }
    if (currentAppType === 'sidebar') {
        updateSidebarApp(slotIndex, appData);
    }
    
    closeAppModal();
}

function removeAppConfig() {
    const slotIndex = currentAppSlot.dataset.slot;
    const storageKey = currentAppType === 'quick' ? 'quickApps' : 'sidebarApps';
    const savedApps = JSON.parse(localStorage.getItem(storageKey) || '{}');
    delete savedApps[slotIndex];
    localStorage.setItem(storageKey, JSON.stringify(savedApps));
    updateAppSlot(currentAppSlot, null);
    if (currentAppType === 'quick') {
        updateNavbarIcon(slotIndex, null);
    } else {
        updateSidebarApp(slotIndex, null);
    }
    
    closeAppModal();
}

function updateAppSlot(slot, appData) {
    const icon = slot.querySelector('.quick-app-icon, .sidebar-app-icon');
    const name = slot.querySelector('.quick-app-name, .sidebar-app-name');
    
    if (appData) {
        icon.src = appData.icon;
        icon.alt = appData.name;
        name.textContent = appData.name;
    } else {
        icon.src = 'images/hive.svg';
        icon.alt = 'Empty';
        name.textContent = 'Empty';
    }
}

function getSavedApp(type, slotIndex) {
    const storageKey = type === 'quick' ? 'quickApps' : 'sidebarApps';
    const savedApps = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return savedApps[slotIndex];
}

function loadSavedApps() {
    const quickApps = JSON.parse(localStorage.getItem('quickApps') || '{}');
    document.querySelectorAll('.quick-apps-container .app-slot').forEach(slot => {
        const slotIndex = slot.dataset.slot;
        const appData = quickApps[slotIndex];
        updateAppSlot(slot, appData);
        if (appData) updateNavbarIcon(slotIndex, appData);
    });
    
    const sidebarApps = JSON.parse(localStorage.getItem('sidebarApps') || '{}');
    document.querySelectorAll('.sidebar-apps-container .app-slot').forEach(slot => {
        const slotIndex = slot.dataset.slot;
        const appData = sidebarApps[slotIndex];
        updateAppSlot(slot, appData);
        if (appData) updateSidebarApp(slotIndex, appData);
    });
}

function updateNavbarIcon(slotIndex, appData) {
    // edit this later
    const iconContainers = document.querySelectorAll('.special-icons .icons');
    if (iconContainers[slotIndex]) {
        if (appData) {
            iconContainers[slotIndex].src = appData.icon;
            iconContainers[slotIndex].alt = appData.name;
            iconContainers[slotIndex].setAttribute('data-url', appData.url);
            iconContainers[slotIndex].setAttribute('data-query', appData.name);
        } else {
            iconContainers[slotIndex].src = 'images/hive.svg';
            iconContainers[slotIndex].alt = 'Empty';
            iconContainers[slotIndex].removeAttribute('data-url');
            iconContainers[slotIndex].removeAttribute('data-query');
        }
    }
}

function updateSidebarApp(slotIndex, appData) {
    const sidebarLinks = document.querySelectorAll('.sidebar-section .a-icons');
    if (sidebarLinks[slotIndex]) {
        const img = sidebarLinks[slotIndex].querySelector('img');
        const span = sidebarLinks[slotIndex].querySelector('span');
        
        if (appData) {
            img.src = appData.icon;
            img.alt = appData.name;
            span.textContent = appData.name;
            sidebarLinks[slotIndex].setAttribute('data-url', appData.url);
        } else {
            img.src = 'images/hive.svg';
            img.alt = 'Empty';
            span.textContent = 'Empty';
            sidebarLinks[slotIndex].removeAttribute('data-url');
        }
    }
}

let iconGenerationTimeout = null;
let iconPreviewTimeout = null;

function updateIconPreview() {
    if (iconPreviewTimeout) {
        clearTimeout(iconPreviewTimeout);
    }
    
    iconPreviewTimeout = setTimeout(() => {
        const iconUrl = document.getElementById('app-icon-input').value.trim();
        const preview = document.getElementById('icon-preview');
        
        if (iconUrl) {
            preview.src = iconUrl;
        } else {
            const url = document.getElementById('app-url-input').value.trim();
            if (url) {
                const domain = url.replace(/^https?:\/\//, '').split('/')[0];
                tryFaviconSources(domain, preview);
            } else {
                preview.src = 'images/hive.svg';
            }
        }
    }, 400);
}

function autoGenerateIcon() {
    if (iconGenerationTimeout) {
        clearTimeout(iconGenerationTimeout);
    }
    
    iconGenerationTimeout = setTimeout(() => {
        const url = document.getElementById('app-url-input').value.trim();
        const iconInput = document.getElementById('app-icon-input');
        const nameInput = document.getElementById('app-name-input');
        
        if (url) {
            const domain = url.replace(/^https?:\/\//, '').split('/')[0];
            iconInput.value = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
            updateIconPreview();
            
            if (!nameInput.value.trim()) {
                fetchWebsiteTitle(url, (title) => {
                    nameInput.value = title;
                });
            }
        } else {
            iconInput.value = '';
            if (!nameInput.value.trim()) {
                nameInput.value = '';
            }
            updateIconPreview();
        }
    }, 300);
}

function generateIconUrl(url) {
    const domain = url.replace(/^https?:\/\//, '').split('/')[0];
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

function tryFaviconSources(domain, imgElement) {
    const faviconSources = [
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        `https://${domain}/favicon.ico`,
        `https://api.faviconkit.com/${domain}/64`,
        'images/hive.svg'
    ];
    
    let currentIndex = 0;
    
    function tryNext() {
        if (currentIndex >= faviconSources.length - 1) {
            imgElement.src = faviconSources[faviconSources.length - 1];
            return;
        }
        
        const testImg = new Image();
        testImg.onload = function() {
            imgElement.src = faviconSources[currentIndex];
        };
        testImg.onerror = function() {
            currentIndex++;
            tryNext();
        };
        testImg.src = faviconSources[currentIndex];
    }
    
    tryNext();
}

function fetchWebsiteTitle(url, callback) {
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}`;
    
    fetch(proxyUrl)
        .then(response => response.json())
        .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, 'text/html');
            const title = doc.querySelector('title');
            if (title && title.textContent.trim()) {
                callback(title.textContent.trim());
            } else {
                const domain = url.replace(/^https?:\/\//, '').split('/')[0];
                callback(domain.charAt(0).toUpperCase() + domain.slice(1));
            }
        })
        .catch(() => {
            const domain = url.replace(/^https?:\/\//, '').split('/')[0];
            callback(domain.charAt(0).toUpperCase() + domain.slice(1));
        });
}



// previous panic key code from elsewhere
// function applyPanicKeySetting() {
//     const panicKey = localStorage.getItem('panicKey');
//     const panicUrl = localStorage.getItem('panicUrl');

//     if (panicKey && panicUrl) {
//         document.removeEventListener('keydown', panicKeyHandler);
//         window.panicKeyHandler = function(e) {
//             if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
//                 return;
//             }

//             if (e.key === panicKey || e.key === panicKey.toLowerCase() || e.key === panicKey.toUpperCase()) {
//                 e.preventDefault();
//                 window.location.href = panicUrl;
//             }
//         };
//         document.addEventListener('keydown', window.panicKeyHandler);
//     }
// }