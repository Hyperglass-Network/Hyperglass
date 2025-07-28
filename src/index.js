import { createServer } from "node:http";
import { join } from "node:path";
import { hostname } from "node:os";
import { fileURLToPath } from "node:url";
import { cpus } from "node:os";
import cluster from "node:cluster";
import wisp from "wisp-server-node";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCompress from "@fastify/compress";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyHelmet from "@fastify/helmet";
import fastifyEtag from "@fastify/etag";

// Performance monitoring
const startTime = process.hrtime.bigint();

// Static paths
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const publicPath = join(__dirname, '../public');
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

// Cluster setup for multi-core performance
const numCPUs = cpus().length;
const PORT = parseInt(process.env.PORT || "8082");

if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
	console.log(`Primary ${process.pid} is running`);
	console.log(`Starting ${numCPUs} workers for maximum performance...`);
	
	// Fork workers
	for (let i = 0; i < numCPUs; i++) {
		cluster.fork();
	}
	
	cluster.on('exit', (worker, code, signal) => {
		console.log(`Worker ${worker.process.pid} died. Restarting...`);
		cluster.fork();
	});
} else {
	// Worker process
	const fastify = Fastify({
		logger: process.env.NODE_ENV === 'production' ? false : {
			level: 'error'
		},
		trustProxy: true,
		keepAliveTimeout: 30000,
		connectionTimeout: 30000,
		serverFactory: (handler) => {
			const server = createServer({
				// HTTP/1.1 optimizations
				keepAlive: true,
				keepAliveInitialDelay: 0,
				maxHeaderSize: 16384,
			});
			
			return server
				.on("request", (req, res) => {
					// Security headers
					res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
					res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
					res.setHeader("X-Content-Type-Options", "nosniff");
					res.setHeader("Referrer-Policy", "no-referrer");
					res.setHeader("Permissions-Policy", "interest-cohort=()");
					
					// Performance headers
					res.setHeader("X-Frame-Options", "SAMEORIGIN");
					res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
					
					handler(req, res);
				})
				.on("upgrade", (req, socket, head) => {
					// Optimized WebSocket handling
					if (req.url.endsWith("/wisp/")) {
						wisp.routeRequest(req, socket, head);
					} else {
						socket.end();
					}
				})
				.on("connection", (socket) => {
					// TCP optimizations
					socket.setNoDelay(true);
					socket.setKeepAlive(true, 30000);
				});
		},
	});

	// Performance plugins
	await fastify.register(fastifyCompress, {
		encodings: ['gzip', 'deflate', 'br'],
		global: true,
		threshold: 1024,
		zlibOptions: {
			level: 6, // Balanced compression
			windowBits: 15,
		}
	});

	await fastify.register(fastifyEtag, {
		algorithm: 'fnv1a'
	});

	// Security with performance in mind
	await fastify.register(fastifyHelmet, {
		contentSecurityPolicy: false, // Let proxy handle CSP
		hsts: {
			maxAge: 31536000,
			includeSubDomains: true,
			preload: true
		}
	});

	// Rate limiting for DDoS protection
	await fastify.register(fastifyRateLimit, {
		max: 1000,
		timeWindow: '1 minute',
		allowList: ['127.0.0.1', '::1'],
		skipOnError: true,
		keyGenerator: (req) => req.ip
	});

	// Optimized static file serving
	await fastify.register(fastifyStatic, {
		root: publicPath,
		decorateReply: true,
		maxAge: '1y',
		immutable: true,
		etag: true,
		lastModified: true,
		acceptRanges: true,
		cacheControl: true,
		dotfiles: 'deny',
		index: false,
		preCompressed: true, // Serve .gz files if available
	});

	// UV config with caching
	fastify.get("/uv/uv.config.js", {
		schema: {
			response: {
				200: {
					type: 'string'
				}
			}
		}
	}, async (req, reply) => {
		reply.header('Content-Type', 'application/javascript');
		reply.header('Cache-Control', 'public, max-age=86400');
		return reply.sendFile("uv/uv.config.js", publicPath);
	});

	// Optimized UV static files
	await fastify.register(fastifyStatic, {
		root: uvPath,
		prefix: "/uv/",
		decorateReply: false,
		maxAge: '1y',
		immutable: true,
		etag: true,
		preCompressed: true,
	});

	// Epoxy transport optimization
	await fastify.register(fastifyStatic, {
		root: epoxyPath,
		prefix: "/epoxy/",
		decorateReply: false,
		maxAge: '1y',
		immutable: true,
		etag: true,
		preCompressed: true,
	});

	// Bare-mux optimization
	await fastify.register(fastifyStatic, {
		root: baremuxPath,
		prefix: "/baremux/",
		decorateReply: false,
		maxAge: '1y',
		immutable: true,
		etag: true,
		preCompressed: true,
	});

	// Health check endpoint
	fastify.get('/health', async (req, reply) => {
		const uptime = Number(process.hrtime.bigint() - startTime) / 1000000;
		return {
			status: 'ok',
			uptime: `${uptime}ms`,
			worker: process.pid,
			memory: process.memoryUsage(),
			timestamp: Date.now()
		};
	});

	// Optimized 404 handler
	fastify.setNotFoundHandler({
		preHandler: fastify.rateLimit({
			max: 100,
			timeWindow: '1 minute'
		})
	}, async (request, reply) => {
		reply.header('Cache-Control', 'public, max-age=3600');
		return reply.sendFile('index.html', publicPath);
	});

	// Error handler
	fastify.setErrorHandler(async (error, request, reply) => {
		if (reply.statusCode >= 500) {
			console.error('Server error:', error);
		}
		
		reply.status(reply.statusCode || 500);
		return { 
			error: 'Something went wrong',
			timestamp: Date.now()
		};
	});

	// Graceful shutdown
	const signals = ['SIGINT', 'SIGTERM'];
	signals.forEach(signal => {
		process.on(signal, async () => {
			console.log(`${signal} received, shutting down worker ${process.pid}`);
			try {
				await fastify.close();
				process.exit(0);
			} catch (err) {
				console.error('Error during shutdown:', err);
				process.exit(1);
			}
		});
	});

	// Start server
	try {
		await fastify.listen({
			port: PORT,
			host: "0.0.0.0",
		});
		
		const address = fastify.server.address();
		console.log(`⚡ Worker ${process.pid} listening on:`);
		console.log(`\t🌐 http://localhost:${address.port}`);
		console.log(`\t🌐 http://${hostname()}:${address.port}`);
		console.log(`\t🔥 Optimized for blazing fast speeds!`);
		
	} catch (err) {
		console.error('Failed to start server:', err);
		process.exit(1);
	}
}