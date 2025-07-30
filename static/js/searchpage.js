document.addEventListener('DOMContentLoaded', function () {
    const urlBar = document.querySelector('.searching');
    const refreshButton = document.getElementById('refresh');
    const backButton = document.getElementById('back');
    const forwardButton = document.getElementById('forward');
    const chatButton = document.getElementById('chat');
    const frame = document.getElementById('uv-frame');
    const loader = document.getElementById('loader');
    
    let history = [];
    let currentHistoryIndex = -1;

    if (window.location.pathname.includes('search.html')) {
        const currentUrl = sessionStorage.getItem('uvOriginalQuery');
        if (currentUrl && urlBar) {
            urlBar.value = currentUrl;
            history.push(currentUrl);
            currentHistoryIndex = 0;
        }
    }

    const storedHistory = sessionStorage.getItem("history");
    if (storedHistory) {
        sessionStorage.removeItem("history");
        
        if (urlBar) {
            urlBar.value = storedHistory;
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
                urlBar.value = storedHistory;
            }

            navigateToUrl();
        }
    });

    function navigateToUrl() {
        let url = urlBar.value.trim();
        
        if (!url) return;

        if (history[currentHistoryIndex] !== url) {
            history = history.slice(0, currentHistoryIndex + 1);
            history.push(url);
            currentHistoryIndex = history.length - 1;
        }

        let processedUrl = url;
        if (!url.includes('.') && !url.startsWith('http')) {
            const searchEngine = sessionStorage.getItem("searchEngine") || "google";
            processedUrl = `https://${searchEngine}.com/search?q=${encodeURIComponent(url)}`;
        } else if (!/^https?:\/\//i.test(url)) {
            processedUrl = 'https://' + url;
        }

        if (frame) {
            loader.style.display = 'block';
            frame.style.display = 'none';
            
            try {
                frame.src = __uv$config.prefix + __uv$config.encodeUrl(processedUrl);
                
                frame.onload = () => {
                    loader.style.display = 'none';
                    frame.style.display = 'block';
                    
                    sessionStorage.setItem('uvUrl', processedUrl);
                    sessionStorage.setItem('uvOriginalQuery', url);
                };
                
                frame.onerror = () => {
                    loader.style.display = 'none';
                    console.error('Frame failed to load');
                };
                
            } catch (error) {
                console.error('Navigation error:', error);
                loader.style.display = 'none';
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
            }, 50);
            
            frame.onload = () => {
                loader.style.display = 'none';
                frame.style.display = 'block';
            };
        }
    }

    function goBack() {
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            const previousUrl = history[currentHistoryIndex];
            
            if (urlBar) {
                urlBar.value = previousUrl;
            }
            
            let processedUrl = previousUrl;
            if (!previousUrl.includes('.') && !previousUrl.startsWith('http')) {
                const searchEngine = sessionStorage.getItem("searchEngine") || "google";
                processedUrl = `https://${searchEngine}.com/search?q=${encodeURIComponent(previousUrl)}`;
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
                    sessionStorage.setItem('uvOriginalQuery', previousUrl);
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
                const searchEngine = sessionStorage.getItem("searchEngine") || "google";
                processedUrl = `https://${searchEngine}.com/search?q=${encodeURIComponent(nextUrl)}`;
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
                    sessionStorage.setItem('uvOriginalQuery', nextUrl);
                };
            }
        }
    }
    
    function goToChat() {
        window.location.href = 'chat.html';
    }

    function updateButtonStates() {
        if (backButton) {
            backButton.disabled = currentHistoryIndex <= 0;
            backButton.style.opacity = currentHistoryIndex <= 0 ? '0.5' : '1';
        }
        
        if (forwardButton) {
            forwardButton.disabled = currentHistoryIndex >= history.length - 1;
            forwardButton.style.opacity = currentHistoryIndex >= history.length - 1 ? '0.5' : '1';
        }
    }

    if (refreshButton) {
        refreshButton.addEventListener('click', refreshPage);
    }
    
    if (backButton) {
        backButton.addEventListener('click', () => {
            goBack();
            updateButtonStates();
        });
    }
    
    if (forwardButton) {
        forwardButton.addEventListener('click', () => {
            goForward();
            updateButtonStates();
        });
    }
    
    if (chatButton) {
        chatButton.addEventListener('click', goToChat);
    }

    if (urlBar) {
        urlBar.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                navigateToUrl();
                updateButtonStates();
            }
        });
    }

    if (frame) {
        frame.addEventListener('load', () => {
            console.log('Iframe loaded successfully');
        });
    }

    updateButtonStates();
});