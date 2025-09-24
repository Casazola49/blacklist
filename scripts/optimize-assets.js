#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class AssetOptimizer {
  constructor() {
    this.distPath = path.join(process.cwd(), 'dist');
    this.stats = {
      originalSize: 0,
      optimizedSize: 0,
      filesProcessed: 0,
      compressionRatio: 0
    };
  }

  log(message) {
    console.log(`🔧 ${message}`);
  }

  success(message) {
    console.log(`✅ ${message}`);
  }

  error(message) {
    console.error(`❌ ${message}`);
  }

  getFileSize(filePath) {
    try {
      return fs.statSync(filePath).size;
    } catch (error) {
      return 0;
    }
  }

  getAllFiles(dir, extension) {
    const files = [];
    
    function traverse(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (item.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    }
    
    traverse(dir);
    return files;
  }

  optimizeImages() {
    this.log('Optimizing images...');
    
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
    const imageFiles = [];
    
    imageExtensions.forEach(ext => {
      imageFiles.push(...this.getAllFiles(this.distPath, ext));
    });

    if (imageFiles.length === 0) {
      this.log('No images found to optimize');
      return;
    }

    imageFiles.forEach(file => {
      const originalSize = this.getFileSize(file);
      this.stats.originalSize += originalSize;
      
      try {
        // For SVG files, minify them
        if (file.endsWith('.svg')) {
          this.optimizeSVG(file);
        }
        
        const optimizedSize = this.getFileSize(file);
        this.stats.optimizedSize += optimizedSize;
        this.stats.filesProcessed++;
        
        const savings = originalSize - optimizedSize;
        if (savings > 0) {
          this.log(`Optimized ${path.basename(file)}: ${this.formatBytes(savings)} saved`);
        }
      } catch (error) {
        this.error(`Failed to optimize ${file}: ${error.message}`);
      }
    });
  }

  optimizeSVG(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Remove comments
      content = content.replace(/<!--[\s\S]*?-->/g, '');
      
      // Remove unnecessary whitespace
      content = content.replace(/>\s+</g, '><');
      
      // Remove empty attributes
      content = content.replace(/\s+[a-zA-Z-]+=""/g, '');
      
      fs.writeFileSync(filePath, content);
    } catch (error) {
      this.error(`Failed to optimize SVG ${filePath}: ${error.message}`);
    }
  }

  optimizeCSS() {
    this.log('Optimizing CSS files...');
    
    const cssFiles = this.getAllFiles(this.distPath, '.css');
    
    cssFiles.forEach(file => {
      const originalSize = this.getFileSize(file);
      this.stats.originalSize += originalSize;
      
      try {
        let content = fs.readFileSync(file, 'utf8');
        
        // Remove comments
        content = content.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Remove unnecessary whitespace
        content = content.replace(/\s+/g, ' ').trim();
        
        // Remove trailing semicolons before closing braces
        content = content.replace(/;\s*}/g, '}');
        
        fs.writeFileSync(file, content);
        
        const optimizedSize = this.getFileSize(file);
        this.stats.optimizedSize += optimizedSize;
        this.stats.filesProcessed++;
        
        const savings = originalSize - optimizedSize;
        if (savings > 0) {
          this.log(`Optimized ${path.basename(file)}: ${this.formatBytes(savings)} saved`);
        }
      } catch (error) {
        this.error(`Failed to optimize CSS ${file}: ${error.message}`);
      }
    });
  }

  optimizeJS() {
    this.log('JavaScript files are already optimized by Vite');
    
    // Count JS files for stats
    const jsFiles = this.getAllFiles(this.distPath, '.js');
    jsFiles.forEach(file => {
      const size = this.getFileSize(file);
      this.stats.originalSize += size;
      this.stats.optimizedSize += size;
      this.stats.filesProcessed++;
    });
  }

  generateGzipFiles() {
    this.log('Generating gzip compressed files...');
    
    const compressibleExtensions = ['.js', '.css', '.html', '.json', '.svg'];
    const files = [];
    
    compressibleExtensions.forEach(ext => {
      files.push(...this.getAllFiles(this.distPath, ext));
    });

    files.forEach(file => {
      try {
        // Only compress files larger than 1KB
        if (this.getFileSize(file) > 1024) {
          execSync(`gzip -9 -c "${file}" > "${file}.gz"`, { stdio: 'pipe' });
          this.log(`Generated gzip for ${path.basename(file)}`);
        }
      } catch (error) {
        // Gzip might not be available on all systems
        this.log(`Skipping gzip for ${path.basename(file)} (gzip not available)`);
      }
    });
  }

  generateManifest() {
    this.log('Generating asset manifest...');
    
    const manifest = {
      timestamp: new Date().toISOString(),
      build: process.env.GITHUB_RUN_NUMBER || 'local',
      assets: {},
      stats: this.stats
    };

    const allFiles = this.getAllFiles(this.distPath, '');
    
    allFiles.forEach(file => {
      const relativePath = path.relative(this.distPath, file);
      const stats = fs.statSync(file);
      
      manifest.assets[relativePath] = {
        size: stats.size,
        modified: stats.mtime.toISOString(),
        hash: this.generateFileHash(file)
      };
    });

    fs.writeFileSync(
      path.join(this.distPath, 'asset-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
  }

  generateFileHash(filePath) {
    try {
      import crypto from 'crypto';
      const content = fs.readFileSync(filePath);
      return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
    } catch (error) {
      return 'unknown';
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async optimize() {
    if (!fs.existsSync(this.distPath)) {
      this.error('Dist directory not found. Run build first.');
      process.exit(1);
    }

    this.log('Starting asset optimization...');

    this.optimizeImages();
    this.optimizeCSS();
    this.optimizeJS();
    this.generateGzipFiles();
    this.generateManifest();

    // Calculate compression ratio
    if (this.stats.originalSize > 0) {
      this.stats.compressionRatio = ((this.stats.originalSize - this.stats.optimizedSize) / this.stats.originalSize * 100);
    }

    this.success('Asset optimization completed!');
    console.log(`\n📊 Optimization Stats:`);
    console.log(`Files processed: ${this.stats.filesProcessed}`);
    console.log(`Original size: ${this.formatBytes(this.stats.originalSize)}`);
    console.log(`Optimized size: ${this.formatBytes(this.stats.optimizedSize)}`);
    console.log(`Space saved: ${this.formatBytes(this.stats.originalSize - this.stats.optimizedSize)}`);
    console.log(`Compression ratio: ${this.stats.compressionRatio.toFixed(2)}%`);
  }
}

// Run optimization
const optimizer = new AssetOptimizer();
optimizer.optimize().catch(console.error);