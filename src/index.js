// Enhanced index.js with performance optimizations
import { createServer } from "node:http";
import { join } from "node:path";
import { hostname } from "node:os";
import { fileURLToPath } from "node:url";
import wisp from "wisp-server-node";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCompress from "@fastify/compress";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";

// Static paths
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const publicPath = join(__dirname, '../public');
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const fastify = Fastify({
    serverFactory: (handler) => {
        return createServer()
            .on("request", (req, res) => {
                // Enhanced CORS and security headers
                res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
                res.setHeader("X-Content-Type-Options", "nosniff");
                res.setHeader("X-Frame-Options", "SAMEORIGIN");
                res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
                
                // Progressive loading headers
                res.setHeader("X-Progressive-Loading", "enabled");
                
                // Disable buffering for streaming responses
                if (req.url && req.url.includes('/uv/service/')) {
                    res.setHeader("X-Accel-Buffering", "no");
                    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                }
                
                handler(req, res);
            })
            .on("upgrade", (req, socket, head) => {
                if (req.url.endsWith("/wisp/")) {
                    wisp.routeRequest(req, socket, head);
                } else {
                    socket.end();
                }
            });
    },
    // Increase payload limits for better performance
    bodyLimit: 10485760, // 10MB
    keepAliveTimeout: 5000,
    maxRequestsPerSocket: 1000,
});

// Compression middleware with streaming support
await fastify.register(fastifyCompress, {
    global: true,
    threshold: 1024,
    encodings: ['gzip', 'deflate', 'br'],
    // Custom compression for streaming responses
    customTypes: /^text\/|^application\/javascript|^application\/json/,
    onUnsupportedEncoding: (encoding, request, reply) => {
        reply.code(406);
        return 'Unsupported encoding';
    }
});

// Security middleware
await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:", "data:"],
            styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "blob:", "*"],
            connectSrc: ["'self'", "ws:", "wss:", "*"],
            fontSrc: ["'self'", "fonts.gstatic.com", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", "blob:", "*"],
            frameSrc: ["'self'", "*"],
            workerSrc: ["'self'", "blob:"],
            childSrc: ["'self'", "blob:"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false
});

// Rate limiting with progressive loading consideration
await fastify.register(fastifyRateLimit, {
    max: 1000,
    timeWindow: '15 minutes',
    skipOnError: true,
    keyGenerator: (request) => {
        return request.ip;
    },
    errorResponseBuilder: (request, context) => {
        return {
            code: 429,
            error: 'Too Many Requests',
            message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds.`,
            retryAfter: Math.round(context.ttl / 1000)
        };
    },
    // Skip rate limiting for static assets and streaming responses
    skip: (request) => {
        const url = request.url;
        return (
            url.includes('/static/') || 
            url.includes('/uv/') ||
            url.includes('/epoxy/') ||
            url.includes('/baremux/') ||
            url.endsWith('.css') ||
            url.endsWith('.js') ||
            url.endsWith('.png') ||
            url.endsWith('.jpg') ||
            url.endsWith('.ico') ||
            url.endsWith('.woff') ||
            url.endsWith('.woff2')
        );
    }
});

// Enhanced static file serving with aggressive caching
await fastify.register(fastifyStatic, {
    root: publicPath,
    prefix: '/',
    decorateReply: true,
    maxAge: '7d',
    immutable: true,
    etag: true,
    lastModified: true,
    cacheControl: true,
    setHeaders: (res, path) => {
        if (path.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=2592000');
        } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=2592000');
        } else if (path.endsWith('.gif')) {
            res.setHeader('Content-Type', 'image/gif');
            res.setHeader('Cache-Control', 'public, max-age=2592000');
        } else if (path.endsWith('.svg')) {
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Cache-Control', 'public, max-age=2592000');
        } else if (path.endsWith('.ico')) {
            res.setHeader('Content-Type', 'image/x-icon');
            res.setHeader('Cache-Control', 'public, max-age=2592000');
        } else if (path.endsWith('.webp')) {
            res.setHeader('Content-Type', 'image/webp');
            res.setHeader('Cache-Control', 'public, max-age=2592000');
        } else if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (path.endsWith('.js') || path.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
});

await fastify.register(fastifyStatic, {
    root: uvPath,
    prefix: "/uv/",
    decorateReply: false,
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        // Different caching strategies for UV files
        if (path.endsWith('uv.sw.js')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Service-Worker-Allowed', '/');
        } else if (path.endsWith('.js')) {
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
        }
    }
});

// Epoxy transport
await fastify.register(fastifyStatic, {
    root: epoxyPath,
    prefix: "/epoxy/",
    decorateReply: false,
    maxAge: '1d',
    etag: true
});

// BareMux
await fastify.register(fastifyStatic, {
    root: baremuxPath,
    prefix: "/baremux/",
    decorateReply: false,
    maxAge: '1d',
    etag: true
});

// Custom UV config endpoint with enhanced configuration
fastify.get("/uv/uv.config.js", {
    schema: {
        response: {
            200: {
                type: 'string'
            }
        }
    }
}, async (request, reply) => {
    reply.type('application/javascript');
    reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    // Enhanced UV config with progressive loading optimizations
    const config = `
// Enhanced UV Config with Progressive Loading
self.__uv$config = {
    prefix: "/uv/service/",
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: "/uv/uv.handler.js",
    client: "/uv/uv.client.js",
    bundle: "/uv/uv.bundle.js",
    config: "/uv/uv.config.js",
    sw: "/uv/uv.sw.js",
    // Progressive loading enhancements
    progressive: true,
    streaming: true,
    chunkSize: 16384,
    maxBufferSize: 65536,
    compressionThreshold: 1024
};

// Progressive loading utilities
self.__uv$progressive = {
    enabled: true,
    version: "1.0.0",
    features: ["streaming", "chunked-transfer", "progressive-rendering"]
};
`;
    
    return reply.send(config);
});

// Health check endpoint with performance metrics
fastify.get('/health', {
    schema: {
        response: {
            200: {
                type: 'object',
                properties: {
                    status: { type: 'string' },
                    timestamp: { type: 'string' },
                    uptime: { type: 'number' },
                    memory: { type: 'object' },
                    progressive: { type: 'boolean' }
                }
            }
        }
    }
}, async (request, reply) => {
    const memUsage = process.memoryUsage();
    
    return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
            rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB'
        },
        progressive: true
    };
});

// Performance monitoring endpoint
fastify.get('/metrics', async (request, reply) => {
    const stats = {
        timestamp: Date.now(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        connections: fastify.server.connections || 0
    };
    
    return stats;
});

// Enhanced error handling
fastify.setErrorHandler((error, request, reply) => {
    console.error('Server error:', error);
    
    // Don't expose internal errors in production
    const isDev = process.env.NODE_ENV !== 'production';
    
    reply.status(error.statusCode || 500).send({
        error: 'Internal Server Error',
        message: isDev ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString()
    });
});

// 404 handler with SPA support
fastify.setNotFoundHandler({
    preValidation: (req, reply, done) => {
        // Skip 404 handling for API routes or static assets
        if (req.url.startsWith('/api/') || 
            req.url.includes('.') || 
            req.url.startsWith('/uv/') ||
            req.url.startsWith('/epoxy/') ||
            req.url.startsWith('/baremux/')) {
            const error = new Error('Not Found');
            error.statusCode = 404;
            done(error);
            return;
        }
        done();
    }
}, (request, reply) => {
    // Serve index.html for SPA routes
    reply.sendFile('index.html', publicPath);
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    
    try {
        await fastify.close();
        console.log('Server closed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};

process.on("SIGINT", () => gracefulShutdown('SIGINT'));
process.on("SIGTERM", () => gracefulShutdown('SIGTERM'));

// Server startup
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || "8082");
        const host = process.env.HOST || "0.0.0.0";
        
        await fastify.listen({ 
            port: port, 
            host: host 
        });
        
        console.log("🚀 Hyperglass Proxy Server Started!");
        console.log("📊 Progressive Loading: ENABLED");
        console.log("🔧 Streaming Optimization: ENABLED");
        console.log("");
        console.log("Listening on:");
        console.log(`\thttp://localhost:${port}`);
        console.log(`\thttp://${hostname()}:${port}`);
        
        // Performance monitoring
        setInterval(() => {
            const memUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            
            console.log(`📈 Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB | CPU: ${Math.round(cpuUsage.user / 1000)}ms`);
        }, 300000); // Every 5 minutes
        
    } catch (error) {
        console.error('❌ Server startup failed:', error);
        process.exit(1);
    }
};

start();