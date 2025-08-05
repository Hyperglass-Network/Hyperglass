function normalizeFullUrl(rawUrl) {
    if (!/^https?:\/\//i.test(rawUrl)) {
        rawUrl = 'https://' + rawUrl;
    } else {
        rawUrl = rawUrl.replace(/^http:\/\//i, 'https://');
    }
    return rawUrl;
}

function normalizeUrl(rawUrl) {
    const fullUrl = normalizeFullUrl(rawUrl);

    try {
        const parsed = new URL(fullUrl);
        let normalized = parsed.hostname + parsed.pathname;

        if (normalized.endsWith('/') && parsed.pathname !== '/') {
            normalized = normalized.slice(0, -1);
        }

        return normalized;
    } catch (e) {
        console.warn('Invalid URL in normalizeUrl:', rawUrl);
        return rawUrl.trim();
    }
}

function decodeUltravioletUrl(encoded) {
    try {
        if (Ultraviolet?.codec?.xor?.decode) return Ultraviolet.codec.xor.decode(encoded);
    } catch { console.log("gurtyo skibidi rizzler ur so sigma for using hyperglass"); }
    try {
        if (Ultraviolet?.codec?.base64?.decode) return Ultraviolet.codec.base64.decode(encoded);
    } catch { console.log("gurtyo skibidi rizzler ur so sigma for using hyperglass"); }
    try {
        if (Ultraviolet?.codec?.plain?.decode) return Ultraviolet.codec.plain.decode(encoded);
    } catch { console.log("gurtyo skibidi rizzler ur so sigma for using hyperglass"); }
    try {
        return decodeURIComponent(encoded);
    } catch { console.log("gurtyo skibidi rizzler ur so sigma for using hyperglass"); }

    return null;
}

function updateUrlBarSmart() {
    if (!frame || !urlBar || isUserCurrentlyTyping) return;

    try {
        let iframeSrc = frame.contentWindow?.location?.href || frame.src;
        if (!iframeSrc || !iframeSrc.includes('service/')) return;

        const match = iframeSrc.match(/\/service\/(.+)/);
        if (!match) return;

        let encodedPart = match[1];
        let decodedUrl = decodeUltravioletUrl(encodedPart);

        if (decodedUrl && decodedUrl !== urlBar.value) {
            const currentNormalized = normalizeUrl(urlBar.value || '');
            const newNormalized = normalizeUrl(decodedUrl);
            
            if (newNormalized !== currentNormalized) {
                urlBar.value = decodedUrl;
                sessionStorage.setItem('uvUrl', decodedUrl);
                sessionStorage.setItem('currentUrl', decodedUrl);
                
                const currentHistoryNormalized = normalizeUrl(history[currentHistoryIndex] || '');
                if (newNormalized !== currentHistoryNormalized) {
                    history = history.slice(0, currentHistoryIndex + 1);
                    history.push(decodedUrl);
                    currentHistoryIndex = history.length - 1;
                    updateButtonStates();
                }
            }
        }
    } catch (e) {
        console.warn('Error in updateUrlBarSmart:', e);
    }
}

function navigateToUrl() {
    let url = urlBar.value.trim();
    if (!url) return;
    let processedUrl;
    if (!url.includes('.') && !url.startsWith('http')) {
        const searchEngine = localStorage.getItem("engine") || "https://duckduckgo.com";
        processedUrl = `${searchEngine}/search?q=${encodeURIComponent(url)}`;
    } else {
        processedUrl = normalizeFullUrl(url);
    }

    if (frame) {
        loader.style.display = 'block';
        frame.style.display = 'none';

        try {
            frame.src = __uv$config.prefix + __uv$config.encodeUrl(processedUrl);
            
            setTimeout(() => {
                if (loader.style.display !== 'none') {
                    loader.style.display = 'none';
                    frame.style.display = 'block';
                }
            }, 1000);

            frame.onload = () => {
                loader.style.display = 'none';
                frame.style.display = 'block';

                const normalized = normalizeUrl(processedUrl);
                const currentNormalized = normalizeUrl(history[currentHistoryIndex] || '');

                if (normalized !== currentNormalized) {
                    history = history.slice(0, currentHistoryIndex + 1);
                    history.push(processedUrl);
                    currentHistoryIndex = history.length - 1;
                }

                updateButtonStates();
            };

            frame.onerror = () => {
                loader.style.display = 'none';
                console.error('Frame failed to load');
                showError('Failed to load the page. Please try again.');
            };

        } catch (error) {
            console.error('Navigation error:', error);
            loader.style.display = 'none';
            showError('Navigation error occurred.');
        }
    }
}

function refreshPage() {
    if (frame && frame.src) {
        loader.style.display = 'block';
        frame.style.display = 'none';
        
        const currentSrc = frame.src;
        frame.src = '';
        setTimeout(() => {
            frame.src = currentSrc;
            frame.onload = () => {
                loader.style.display = 'none';
                frame.style.display = 'block';
            };
        }, 100);
    }
}

function goBack() {
    if (currentHistoryIndex > 0) {
        currentHistoryIndex--;
        const previousUrl = history[currentHistoryIndex];
        
        if (urlBar) {
            urlBar.value = normalizeFullUrl(previousUrl);
        }
        
        let processedUrl = previousUrl;
        if (!previousUrl.includes('.') && !previousUrl.startsWith('http')) {
            const searchEngine = localStorage.getItem("engine") || "https://duckduckgo.com";
            processedUrl = `${searchEngine}/search?q=${encodeURIComponent(previousUrl)}`;
        } else if (!/^https?:\/\//i.test(previousUrl)) {
            processedUrl = 'https://' + previousUrl;
        }
        
        if (frame) {
            loader.style.display = 'block';
            frame.style.display = 'none';
            
            frame.src = __uv$config.prefix + __uv$config.encodeUrl(processedUrl);
            
            frame.onload = () => {
                loader.style.display = 'none';
                frame.style.display = 'block';
                
                sessionStorage.setItem('uvUrl', processedUrl);
                sessionStorage.setItem('currentUrl', processedUrl);
                sessionStorage.setItem('uvOriginalQuery', previousUrl);
                updateButtonStates();
            };
        }
    }
}

function goForward() {
    if (currentHistoryIndex < history.length - 1) {
        currentHistoryIndex++;
        const nextUrl = history[currentHistoryIndex];
        
        if (urlBar) {
            urlBar.value = nextUrl;
        }
        
        let processedUrl = nextUrl;
        if (!nextUrl.includes('.') && !nextUrl.startsWith('http')) {
            const searchEngine = localStorage.getItem("engine") || "https://duckduckgo.com";
            processedUrl = `${searchEngine}/search?q=${encodeURIComponent(nextUrl)}`;
        } else if (!/^https?:\/\//i.test(nextUrl)) {
            processedUrl = 'https://' + nextUrl;
        }
        
        if (frame) {
            loader.style.display = 'block';
            frame.style.display = 'none';
            
            frame.src = __uv$config.prefix + __uv$config.encodeUrl(processedUrl);
            
            frame.onload = () => {
                loader.style.display = 'none';
                frame.style.display = 'block';
                
                sessionStorage.setItem('uvUrl', processedUrl);
                sessionStorage.setItem('currentUrl', processedUrl);
                updateButtonStates();
            };
        }
    }
}

function goToChat() {
    window.location.href = 'chat.html';
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    if (errorMessage && errorText) {
        errorText.textContent = message;
        errorMessage.style.display = 'block';
    }
}

function updateButtonStates() {
    if (backButton) {
        const canGoBack = currentHistoryIndex > 0;
        backButton.disabled = !canGoBack;
        backButton.style.opacity = canGoBack ? '1' : '0.5';
        backButton.style.cursor = canGoBack ? 'pointer' : 'not-allowed';
    }
    
    if (forwardButton) {
        const canGoForward = currentHistoryIndex < history.length - 1;
        forwardButton.disabled = !canGoForward;
        forwardButton.style.opacity = canGoForward ? '1' : '0.5';
        forwardButton.style.cursor = canGoForward ? 'pointer' : 'not-allowed';
    }
}

function monitorIframeUrl() {
    setInterval(updateUrlBarSmart, 500);
}

let urlBar, frame, loader, backButton, forwardButton, refreshButton, chatButton;
let history = [];
let currentHistoryIndex = -1;
let isUserCurrentlyTyping = false;
let typingTimeout;

document.addEventListener('DOMContentLoaded', function () {
    urlBar = document.querySelector('.searching');
    refreshButton = document.getElementById('refresh');
    backButton = document.getElementById('back');
    forwardButton = document.getElementById('forward');
    chatButton = document.getElementById('chat');
    frame = document.getElementById('uv-frame');
    loader = document.getElementById('loader');
    
    if (window.location.pathname.includes('search.html')) {
        const currentUrl = sessionStorage.getItem('uvUrl');
        if (currentUrl && urlBar) {
            urlBar.value = normalizeFullUrl(currentUrl);

            if (history.length === 0) {
                history.push(currentUrl);
                currentHistoryIndex = 0;
            }
        }
        monitorIframeUrl();
    }

    const storedHistory = sessionStorage.getItem("history");
    if (storedHistory) {
        sessionStorage.removeItem("history");
        
        if (urlBar) {
            urlBar.value = normalizeFullUrl(storedHistory);
        }

        setTimeout(() => {
            navigateToUrl();
        }, 300);
    }

    document.addEventListener("performSearch", function () {
        const storedHistory = sessionStorage.getItem("history");
        if (storedHistory) {
            sessionStorage.removeItem("history");

            if (urlBar) {
                urlBar.value = normalizeFullUrl(storedHistory);
            }

            navigateToUrl();
        }
    });

    if (refreshButton) {
        refreshButton.addEventListener('click', refreshPage);
    }
    
    if (backButton) {
        backButton.addEventListener('click', () => {
            goBack();
        });
    }
    
    if (forwardButton) {
        forwardButton.addEventListener('click', () => {
            goForward();
        });
    }
    
    if (chatButton) {
        chatButton.addEventListener('click', goToChat);
    }

    if (urlBar) {
        urlBar.addEventListener('input', () => {
            isUserCurrentlyTyping = true;
            
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }
            
            typingTimeout = setTimeout(() => {
                isUserCurrentlyTyping = false;
            }, 1500);
        });

        urlBar.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                isUserCurrentlyTyping = false;
                navigateToUrl();
            }
        });

        urlBar.addEventListener('blur', () => {
            setTimeout(() => {
                isUserCurrentlyTyping = false;
            }, 100);
        });

        urlBar.addEventListener('focus', () => {
            isUserCurrentlyTyping = true;
        });
    }

    if (frame) {
        frame.addEventListener('load', () => {
            console.log('Iframe loaded successfully');
        });
    } 
});