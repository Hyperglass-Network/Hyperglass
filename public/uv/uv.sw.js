importScripts('/uv/uv.bundle.js');
importScripts('/uv/uv.config.js');

const uv = new UVServiceWorker();

const STREAM_CONFIG = {
    chunkSize: 32384,
    compressionThreshold: 1024,
    maxBufferSize: 655360,
    streamableTypes: [
        'text/html',
        'text/css',
        'application/javascript',
        'text/javascript',
        'application/json',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm',
        'audio/mpeg',
        'audio/wav'
    ]
};

class StreamProcessor {
    constructor() {
        this.activeStreams = new Map();
    }

    async processStreamingResponse(response, url) {
        const contentType = response.headers.get('content-type') || '';
        const contentLength = parseInt(response.headers.get('content-length') || '0');
        
        if (contentLength > 0 && contentLength < STREAM_CONFIG.compressionThreshold) {
            return response;
        }

        const isStreamable = STREAM_CONFIG.streamableTypes.some(type => 
            contentType.toLowerCase().includes(type)
        );

        if (!isStreamable) {
            return response;
        }

        const readable = new ReadableStream({
            start: (controller) => {
                this.streamResponse(response, controller, url, contentType);
            }
        });

        const headers = new Headers(response.headers);
        headers.delete('content-length');
        headers.set('cache-control', 'no-cache, no-store, must-revalidate');
        headers.set('pragma', 'no-cache');
        headers.set('expires', '0');
        
        headers.set('x-progressive-loading', 'true');
        headers.set('x-stream-processed', 'true');

        return new Response(readable, {
            status: response.status,
            statusText: response.statusText,
            headers: headers
        });
    }

    async streamResponse(response, controller, url, contentType) {
        const reader = response.body.getReader();
        let totalBytes = 0;
        let buffer = new Uint8Array(0);

        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    if (buffer.length > 0) {
                        controller.enqueue(buffer);
                    }
                    controller.close();
                    break;
                }

                totalBytes += value.length;
                
                const newBuffer = new Uint8Array(buffer.length + value.length);
                newBuffer.set(buffer);
                newBuffer.set(value, buffer.length);
                buffer = newBuffer;

                while (buffer.length >= STREAM_CONFIG.chunkSize) {
                    const chunk = buffer.slice(0, STREAM_CONFIG.chunkSize);
                    buffer = buffer.slice(STREAM_CONFIG.chunkSize);
                    
                    const processedChunk = await this.processChunk(chunk, contentType, url);
                    controller.enqueue(processedChunk);
                    
                    await new Promise(resolve => setTimeout(resolve, 5));
                }
            }
        } catch (error) {
            console.error('Stream processing error:', error);
            controller.error(error);
        }
    }

    async processChunk(chunk, contentType, url) {
        if (contentType.includes('text/html')) {
            return this.processHTMLChunk(chunk);
        } else if (contentType.includes('text/css')) {
            return this.processCSSChunk(chunk);
        } else if (contentType.includes('javascript')) {
            return this.processJSChunk(chunk);
        }

        return chunk;
    }

    processHTMLChunk(chunk) {
        try {
            let html = new TextDecoder().decode(chunk);
            if (html.includes('<head>') || html.includes('<body>')) {
                const progressiveCSS = `
                <style>
                    body { opacity: 0; transition: opacity 0.3s ease; }
                    body.progressive-loaded { opacity: 1; }
                    .progressive-fade { opacity: 0; transform: translateY(10px); transition: all 0.4s ease; }
                    .progressive-fade.visible { opacity: 1; transform: translateY(0); }
                    img { transition: opacity 0.3s ease; }
                    img[data-src] { opacity: 0.3; }
                    img:not([data-src]) { opacity: 1; }
                </style>
                <script>
                (function() {
                    function initProgressiveLoading() {
                        // Fade in body
                        document.body.classList.add('progressive-loaded');
                        
                        // Progressive element visibility
                        const observer = new IntersectionObserver((entries) => {
                            entries.forEach(entry => {
                                if (entry.isIntersecting) {
                                    entry.target.classList.add('visible');
                                    observer.unobserve(entry.target);
                                }
                            });
                        }, { threshold: 0.1, rootMargin: '50px' });
                        
                        // Apply to elements as they're added
                        const mutationObserver = new MutationObserver((mutations) => {
                            mutations.forEach(mutation => {
                                mutation.addedNodes.forEach(node => {
                                    if (node.nodeType === 1 && node.offsetHeight > 30) {
                                        node.classList.add('progressive-fade');
                                        observer.observe(node);
                                    }
                                });
                            });
                        });
                        
                        // Start observing
                        mutationObserver.observe(document.body, {
                            childList: true,
                            subtree: true
                        });
                        
                        // Apply to existing elements
                        document.querySelectorAll('*').forEach(el => {
                            if (el.offsetHeight > 30) {
                                el.classList.add('progressive-fade');
                                observer.observe(el);
                            }
                        });
                    }
                    
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', initProgressiveLoading);
                    } else {
                        initProgressiveLoading();
                    }
                })();
                </script>
                `;
                
                if (html.includes('<head>')) {
                    html = html.replace('<head>', '<head>' + progressiveCSS);
                }
            }
            
            html = html.replace(/<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi, 
                '<img$1data-src="$2" src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'1\' height=\'1\'%3E%3C/svg%3E"$3 onload="if(this.dataset.src){this.src=this.dataset.src;delete this.dataset.src;}">'
            );
            
            return new TextEncoder().encode(html);
        } catch (error) {
            console.error('HTML chunk processing error:', error);
            return chunk;
        }
    }

    processCSSChunk(chunk) {
        try {
            let css = new TextDecoder().decode(chunk);
            
            css += `
            /* Progressive loading enhancements */
            * { 
                animation-fill-mode: both !important; 
            }
            `;
            
            return new TextEncoder().encode(css);
        } catch (error) {
            return chunk;
        }
    }

    processJSChunk(chunk) {
        try {
            let js = new TextDecoder().decode(chunk);
            if (js.trim().length > 100) {
                js = `
                (function() {
                    try {
                        ${js}
                    } catch (e) {
                        console.warn('Progressive JS execution error:', e);
                    }
                })();
                `;
            }
            
            return new TextEncoder().encode(js);
        } catch (error) {
            return chunk;
        }
    }
}

const streamProcessor = new StreamProcessor();

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    if (!url.pathname.startsWith(__uv$config.prefix)) {
        return;
    }

    event.respondWith(
        (async () => {
            try {
                const response = await uv.fetch(event);
                
                const streamedResponse = await streamProcessor.processStreamingResponse(response, url);
                
                return streamedResponse;
            } catch (error) {
                console.error('Service worker fetch error:', error);
                return new Response('Service worker error: ' + error.message, { 
                    status: 500,
                    headers: { 'content-type': 'text/plain' }
                });
            }
        })()
    );
});

self.addEventListener('install', (event) => {
    console.log('UV Service Worker installing with progressive loading...');
    
    event.waitUntil(
        caches.open('uv-progressive-v1').then(cache => {
            return cache.addAll([
                '/uv/uv.bundle.js',
                '/uv/uv.config.js',
                '/uv/uv.handler.js',
                '/uv/uv.client.js'
            ]).catch(error => {
                console.warn('Cache preload failed:', error);
            });
        })
    );
    
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('UV Service Worker activated with progressive loading');
    
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== 'uv-progressive-v1' && cacheName.startsWith('uv-')) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'GET_PROGRESSIVE_STATUS') {
        event.ports[0].postMessage({
            progressive: true,
            version: 'progressive-v1',
            activeStreams: streamProcessor.activeStreams.size
        });
    }
});

self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('UV Service Worker with Progressive Loading initialized');