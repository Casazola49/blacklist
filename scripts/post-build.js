#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

class PostBuildProcessor {
  constructor() {
    this.distPath = path.join(process.cwd(), 'dist');
    this.buildInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.VITE_APP_ENVIRONMENT || 'development',
      version: process.env.npm_package_version || '1.0.0',
      buildNumber: process.env.GITHUB_RUN_NUMBER || 'local',
      commitSha: process.env.GITHUB_SHA || 'unknown',
      branch: process.env.GITHUB_REF_NAME || 'unknown'
    };
  }

  log(message) {
    console.log(`🔨 ${message}`);
  }

  success(message) {
    console.log(`✅ ${message}`);
  }

  error(message) {
    console.error(`❌ ${message}`);
  }

  generateBuildInfo() {
    this.log('Generating build information...');
    
    const buildInfoPath = path.join(this.distPath, 'build-info.json');
    fs.writeFileSync(buildInfoPath, JSON.stringify(this.buildInfo, null, 2));
    
    this.success('Build info generated');
  }

  generateRobotsTxt() {
    this.log('Generating robots.txt...');
    
    const isProduction = this.buildInfo.environment === 'production';
    
    const robotsContent = isProduction 
      ? `User-agent: *
Allow: /

Sitemap: https://the-blacklist-879f1.web.app/sitemap.xml`
      : `User-agent: *
Disallow: /`;

    const robotsPath = path.join(this.distPath, 'robots.txt');
    fs.writeFileSync(robotsPath, robotsContent);
    
    this.success(`Robots.txt generated for ${this.buildInfo.environment}`);
  }

  generateSitemap() {
    if (this.buildInfo.environment !== 'production') {
      this.log('Skipping sitemap generation for non-production build');
      return;
    }

    this.log('Generating sitemap.xml...');
    
    const baseUrl = 'https://the-blacklist-879f1.web.app';
    const pages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/auth/login', priority: '0.8', changefreq: 'monthly' },
      { url: '/auth/register', priority: '0.8', changefreq: 'monthly' }
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    const sitemapPath = path.join(this.distPath, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap);
    
    this.success('Sitemap.xml generated');
  }

  validateBuild() {
    this.log('Validating build output...');
    
    const requiredFiles = [
      'index.html',
      'manifest.json',
      'service-worker.js'
    ];

    const missingFiles = requiredFiles.filter(file => 
      !fs.existsSync(path.join(this.distPath, file))
    );

    if (missingFiles.length > 0) {
      this.error(`Missing required files: ${missingFiles.join(', ')}`);
      process.exit(1);
    }

    // Check if index.html contains the app div
    const indexPath = path.join(this.distPath, 'index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    if (!indexContent.includes('<div id="app">')) {
      this.error('index.html does not contain app div');
      process.exit(1);
    }

    // Check if manifest.json is valid JSON
    try {
      const manifestPath = path.join(this.distPath, 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      JSON.parse(manifestContent);
    } catch (error) {
      this.error(`Invalid manifest.json: ${error.message}`);
      process.exit(1);
    }

    this.success('Build validation passed');
  }

  calculateBundleSize() {
    this.log('Calculating bundle sizes...');
    
    const jsFiles = this.getFilesByExtension('.js');
    const cssFiles = this.getFilesByExtension('.css');
    
    const bundleStats = {
      javascript: {
        files: jsFiles.length,
        totalSize: jsFiles.reduce((sum, file) => sum + this.getFileSize(file), 0)
      },
      css: {
        files: cssFiles.length,
        totalSize: cssFiles.reduce((sum, file) => sum + this.getFileSize(file), 0)
      },
      total: 0
    };

    bundleStats.total = bundleStats.javascript.totalSize + bundleStats.css.totalSize;

    // Save bundle stats
    const statsPath = path.join(this.distPath, 'bundle-stats.json');
    fs.writeFileSync(statsPath, JSON.stringify(bundleStats, null, 2));

    console.log(`\n📦 Bundle Stats:`);
    console.log(`JavaScript: ${this.formatBytes(bundleStats.javascript.totalSize)} (${bundleStats.javascript.files} files)`);
    console.log(`CSS: ${this.formatBytes(bundleStats.css.totalSize)} (${bundleStats.css.files} files)`);
    console.log(`Total: ${this.formatBytes(bundleStats.total)}`);

    // Warn if bundle is too large
    const maxBundleSize = 1024 * 1024; // 1MB
    if (bundleStats.total > maxBundleSize) {
      console.warn(`⚠️  Bundle size (${this.formatBytes(bundleStats.total)}) exceeds recommended limit (${this.formatBytes(maxBundleSize)})`);
    }
  }

  getFilesByExtension(extension) {
    const files = [];
    
    function traverse(dir) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (item.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    }
    
    traverse(this.distPath);
    return files;
  }

  getFileSize(filePath) {
    try {
      return fs.statSync(filePath).size;
    } catch (error) {
      return 0;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async process() {
    if (!fs.existsSync(this.distPath)) {
      this.error('Dist directory not found');
      process.exit(1);
    }

    this.log('Starting post-build processing...');

    this.validateBuild();
    this.generateBuildInfo();
    this.generateRobotsTxt();
    this.generateSitemap();
    this.calculateBundleSize();

    this.success('Post-build processing completed!');
    
    console.log(`\n🏗️  Build Summary:`);
    console.log(`Environment: ${this.buildInfo.environment}`);
    console.log(`Version: ${this.buildInfo.version}`);
    console.log(`Build: ${this.buildInfo.buildNumber}`);
    console.log(`Commit: ${this.buildInfo.commitSha.substring(0, 7)}`);
    console.log(`Timestamp: ${this.buildInfo.timestamp}`);
  }
}

// Run post-build processing
const processor = new PostBuildProcessor();
processor.process().catch(console.error);