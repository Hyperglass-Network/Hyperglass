self.__uv$config = {
    prefix: "/uv/service/",
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: "/uv/uv.handler.js",
    client: "/uv/uv.client.js",
    bundle: "/uv/uv.bundle.js",
    config: "/uv/uv.config.js",
    sw: "/uv/uv.sw.js",

    progressive: {
        enabled: true,
        chunkSize: 163840, 
        maxBufferSize: 65536, 
        compressionThreshold: 1024, 
        streamDelay: 5, 
        
        streamableTypes: [
            'text/html',
            'text/css', 
            'application/javascript',
            'text/javascript',
            'application/json',
            'text/plain'
        ],
        
        imageLoading: {
            enabled: true,
            placeholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E',
            fadeInDuration: 300
        },
        
        rendering: {
            fadeInBody: true,
            elementFadeIn: true,
            intersectionThreshold: 0.1,
            rootMargin: '50px'
        }
    },
    
    performance: {
        serverPush: true,
        
        preload: {
            css: true,
            fonts: true,
            criticalJs: true
        },
        
        cache: {
            static: '7d',
            dynamic: '1h',
            api: 'no-cache'
        },
        
        compression: {
            level: 6,
            threshold: 1024,
            types: ['text/*', 'application/javascript', 'application/json']
        }
    },
    
    errorHandling: {
        retryAttempts: 3,
        retryDelay: 1000,
        timeoutMs: 30000,
        showProgressOnError: true
    },
    
    debug: {
        enabled: process.env.NODE_ENV === 'development',
        logLevel: 'info',
        performanceMetrics: true
    }
};

self.__uv$progressive = {
    version: '1.0.0',
    
    init: function() {
        if (!this.initialized) {
            this.setupStreamProcessing();
            this.setupImageLazyLoading();
            this.setupProgressiveRendering();
            this.initialized = true;
        }
    },
    
    setupStreamProcessing: function() {
        const originalFetch = self.fetch;
        self.fetch = async function(input, init) {
            const response = await originalFetch(input, init);
            
            if (self.__uv$config.progressive.enabled && response.body) {
                return self.__uv$progressive.processStream(response);
            }
            
            return response;
        };
    },
    
    processStream: function(response) {
        const contentType = response.headers.get('content-type') || '';
        const config = self.__uv$config.progressive;
        
        const shouldStream = config.streamableTypes.some(type => 
            contentType.toLowerCase().includes(type)
        );
        
        if (!shouldStream) {
            return response;
        }
        
        const readable = new ReadableStream({
            start: async (controller) => {
                const reader = response.body.getReader();
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
                        
                        const newBuffer = new Uint8Array(buffer.length + value.length);
                        newBuffer.set(buffer);
                        newBuffer.set(value, buffer.length);
                        buffer = newBuffer;
                        
                        while (buffer.length >= config.chunkSize) {
                            const chunk = buffer.slice(0, config.chunkSize);
                            buffer = buffer.slice(config.chunkSize);
                            
                            controller.enqueue(chunk);
                            
                            if (config.streamDelay > 0) {
                                await new Promise(resolve => setTimeout(resolve, config.streamDelay));
                            }
                        }
                    }
                } catch (error) {
                    controller.error(error);
                }
            }
        });
        
        return new Response(readable, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });
    },
    
    setupImageLazyLoading: function() {
        if (!self.__uv$config.progressive.imageLoading.enabled) return;
        
        this.imageLazyLoadScript = `
            (function() {
                const config = ${JSON.stringify(self.__uv$config.progressive.imageLoading)};
                
                function setupLazyLoading() {
                    const images = document.querySelectorAll('img[data-src]');
                    
                    const imageObserver = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                const img = entry.target;
                                img.src = img.dataset.src;
                                img.style.opacity = '0';
                                img.style.transition = 'opacity ' + config.fadeInDuration + 'ms ease';
                                
                                img.onload = function() {
                                    this.style.opacity = '1';
                                    delete this.dataset.src;
                                };
                                
                                imageObserver.unobserve(img);
                            }
                        });
                    }, { threshold: 0.1, rootMargin: '50px' });
                    
                    images.forEach(img => imageObserver.observe(img));
                }
                
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', setupLazyLoading);
                } else {
                    setupLazyLoading();
                }
            })();
        `;
    },
    
    setupProgressiveRendering: function() {
        const config = self.__uv$config.progressive.rendering;
        if (!config.fadeInBody && !config.elementFadeIn) return;
        
        this.progressiveRenderScript = `
            (function() {
                const config = ${JSON.stringify(config)};
                
                function initProgressiveRendering() {
                    // Body fade-in
                    if (config.fadeInBody) {
                        document.body.style.opacity = '0';
                        document.body.style.transition = 'opacity 0.3s ease';
                        
                        setTimeout(() => {
                            document.body.style.opacity = '1';
                        }, 50);
                    }
                    
                    // Element fade-in
                    if (config.elementFadeIn) {
                        const style = document.createElement('style');
                        style.textContent = \`
                            .progressive-fade {
                                opacity: 0 !important;
                                transform: translateY(10px) !important;
                                transition: all 0.4s ease !important;
                            }
                            .progressive-fade.visible {
                                opacity: 1 !important;
                                transform: translateY(0) !important;
                            }
                        \`;
                        document.head.appendChild(style);
                        
                        const observer = new IntersectionObserver((entries) => {
                            entries.forEach(entry => {
                                if (entry.isIntersecting) {
                                    entry.target.classList.add('visible');
                                    observer.unobserve(entry.target);
                                }
                            });
                        }, { 
                            threshold: config.intersectionThreshold,
                            rootMargin: config.rootMargin
                        });
                        
                        // Apply to existing elements
                        document.querySelectorAll('*').forEach(el => {
                            if (el.offsetHeight > 30 && !el.classList.contains('progressive-fade')) {
                                el.classList.add('progressive-fade');
                                observer.observe(el);
                            }
                        });
                        
                        // Apply to new elements
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
                        
                        mutationObserver.observe(document.body, {
                            childList: true,
                            subtree: true
                        });
                    }
                }
                
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', initProgressiveRendering);
                } else {
                    initProgressiveRendering();
                }
            })();
        `;
    },
    
    monitor: {
        startTime: Date.now(),
        metrics: {
            loadTime: 0,
            streamChunks: 0,
            bytesTransferred: 0,
            errors: 0
        },
        
        recordMetric: function(type, value) {
            if (this.metrics.hasOwnProperty(type)) {
                if (typeof this.metrics[type] === 'number') {
                    this.metrics[type] += value || 1;
                }
            }
        },
        
        getMetrics: function() {
            return {
                ...this.metrics,
                uptime: Date.now() - this.startTime,
                timestamp: new Date().toISOString()
            };
        }
    }
};

if (typeof self !== 'undefined' && self.__uv$config?.progressive?.enabled) {
    self.__uv$progressive.init();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { __uv$config: self.__uv$config, __uv$progressive: self.__uv$progressive };
}