import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { createGzip, createBrotliCompress } from 'node:zlib';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const publicPath = join(__dirname, '../public');

// File types to compress
const compressible = ['.js', '.css', '.html', '.json', '.svg', '.txt', '.xml'];
const minSizeBytes = 1024; // Only compress files larger than 1KB

async function compressFile(filePath, algorithm = 'gzip') {
	const outputExt = algorithm === 'gzip' ? '.gz' : '.br';
	const outputPath = filePath + outputExt;
	
	// Skip if compressed version already exists and is newer
	if (existsSync(outputPath)) {
		const originalStat = await stat(filePath);
		const compressedStat = await stat(outputPath);
		if (compressedStat.mtime > originalStat.mtime) {
			return;
		}
	}
	
	const compressor = algorithm === 'gzip' 
		? createGzip({ level: 9 })
		: createBrotliCompress({ 
			params: {
				[require('zlib').constants.BROTLI_PARAM_QUALITY]: 11,
				[require('zlib').constants.BROTLI_PARAM_SIZE_HINT]: (await stat(filePath)).size
			}
		});
	
	try {
		await pipeline(
			createReadStream(filePath),
			compressor,
			createWriteStream(outputPath)
		);
		
		const originalSize = (await stat(filePath)).size;
		const compressedSize = (await stat(outputPath)).size;
		const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
		
		console.log(`✅ ${algorithm.toUpperCase()}: ${filePath} (${ratio}% smaller)`);
	} catch (error) {
		console.error(`❌ Failed to compress ${filePath}:`, error.message);
	}
}

async function walkDirectory(dir) {
	try {
		const files = await readdir(dir);
		
		for (const file of files) {
			const filePath = join(dir, file);
			const fileStat = await stat(filePath);
			
			if (fileStat.isDirectory()) {
				await walkDirectory(filePath);
			} else if (fileStat.size >= minSizeBytes && compressible.includes(extname(file))) {
				// Compress with both gzip and brotli for maximum performance
				await compressFile(filePath, 'gzip');
				await compressFile(filePath, 'brotli');
			}
		}
	} catch (error) {
		console.error(`Error processing directory ${dir}:`, error.message);
	}
}

async function main() {
	console.log('🚀 Pre-compressing static assets for blazing fast delivery...');
	console.log(`📁 Scanning: ${publicPath}`);
	
	const startTime = Date.now();
	await walkDirectory(publicPath);
	const endTime = Date.now();
	
	console.log(`⚡ Pre-compression completed in ${endTime - startTime}ms`);
	console.log('🔥 Your proxy is now optimized for maximum speed!');
}

main().catch(console.error);