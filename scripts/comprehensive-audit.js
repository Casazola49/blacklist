#!/usr/bin/env node

/**
 * Comprehensive Performance and PWA Audit Script
 * Runs complete analysis including Lighthouse, bundle analysis, and optimization recommendations
 */

import { execSync, spawn } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// Configuration
const config = {
  urls: {
    local: 'http://localhost:4173',
    staging: 'https://the-blacklist-879f1-staging.web.app',
    production: 'https://the-blacklist-879f1.web.app'
  },
  thresholds: {
    performance: 90,
    accessibility: 95,
    'best-practices': 90,
    seo: 90,
    pwa: 90
  },
  budget: {
    totalSize: 500000, // 500KB
    scriptSize: 200000, // 200KB
    stylesheetSize: 50000, // 50KB
    imageSize: 300000, // 300KB
    fontSize: 100000 // 100KB
  }
}

class ComprehensiveAuditor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      audits: {},
      bundleAnalysis: {},
      recommendations: [],
      summary: {}
    }
  }

  async runFullAudit(environment = 'local') {
    console.log(`🚀 Starting comprehensive audit for ${environment}...`)
    
    try {
      // 1. Build the application
      await this.buildApplication()
      
      // 2. Start preview server if local
      let serverProcess
      if (environment === 'local') {
        serverProcess = await this.startPreviewServer()
        await this.waitForServer(config.urls.local)
      }
      
      // 3. Run Lighthouse audits
      await this.runLighthouseAudits(environment)
      
      // 4. Analyze bundle
      await this.analyzeBundleSize()
      
      // 5. Check PWA requirements
      await this.checkPWARequirements(environment)
      
      // 6. Analyze dependencies
      await this.analyzeDependencies()
      
      // 7. Generate recommendations
      this.generateRecommendations()
      
      // 8. Create reports
      await this.generateReports()
      
      // 9. Cleanup
      if (serverProcess) {
        serverProcess.kill()
      }
      
      console.log('✅ Comprehensive audit completed successfully!')
      
    } catch (error) {
      console.error('❌ Audit failed:', error.message)
      process.exit(1)
    }
  }

  async buildApplication() {
    console.log('📦 Building application...')
    
    try {
      execSync('npm run build:production', {
        cwd: rootDir,
        stdio: 'pipe'
      })
      console.log('✅ Build completed')
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`)
    }
  }

  async startPreviewServer() {
    console.log('🌐 Starting preview server...')
    
    const serverProcess = spawn('npm', ['run', 'preview'], {
      cwd: rootDir,
      stdio: 'pipe'
    })
    
    return serverProcess
  }

  async waitForServer(url, timeout = 30000) {
    const start = Date.now()
    
    while (Date.now() - start < timeout) {
      try {
        const response = await fetch(url)
        if (response.ok) {
          console.log('✅ Server is ready')
          return
        }
      } catch (error) {
        // Server not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    throw new Error('Server failed to start within timeout')
  }

  async runLighthouseAudits(environment) {
    console.log('🔍 Running Lighthouse audits...')
    
    const url = config.urls[environment]
    
    try {
      // Desktop audit
      const desktopCommand = `lighthouse ${url} --output json --chrome-flags="--headless" --form-factor=desktop --quiet`
      const desktopOutput = execSync(desktopCommand, { encoding: 'utf8' })
      const desktopResult = JSON.parse(desktopOutput)
      
      // Mobile audit
      const mobileCommand = `lighthouse ${url} --output json --chrome-flags="--headless" --form-factor=mobile --quiet`
      const mobileOutput = execSync(mobileCommand, { encoding: 'utf8' })
      const mobileResult = JSON.parse(mobileOutput)
      
      this.results.audits.lighthouse = {
        desktop: this.extractLighthouseMetrics(desktopResult),
        mobile: this.extractLighthouseMetrics(mobileResult)
      }
      
      console.log('✅ Lighthouse audits completed')
      
    } catch (error) {
      console.warn('⚠️ Lighthouse audit failed:', error.message)
      this.results.audits.lighthouse = { error: error.message }
    }
  }

  extractLighthouseMetrics(result) {
    return {
      scores: {
        performance: Math.round(result.lhr.categories.performance.score * 100),
        accessibility: Math.round(result.lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(result.lhr.categories['best-practices'].score * 100),
        seo: Math.round(result.lhr.categories.seo.score * 100),
        pwa: Math.round(result.lhr.categories.pwa.score * 100)
      },
      metrics: {
        fcp: result.lhr.audits['first-contentful-paint']?.numericValue,
        lcp: result.lhr.audits['largest-contentful-paint']?.numericValue,
        cls: result.lhr.audits['cumulative-layout-shift']?.numericValue,
        fid: result.lhr.audits['first-input-delay']?.numericValue,
        ttfb: result.lhr.audits['server-response-time']?.numericValue,
        speedIndex: result.lhr.audits['speed-index']?.numericValue,
        totalBlockingTime: result.lhr.audits['total-blocking-time']?.numericValue
      },
      opportunities: result.lhr.audits['unused-javascript']?.details?.items?.length || 0,
      diagnostics: {
        unusedJavaScript: result.lhr.audits['unused-javascript']?.details?.overallSavingsBytes || 0,
        unusedCSS: result.lhr.audits['unused-css-rules']?.details?.overallSavingsBytes || 0,
        unoptimizedImages: result.lhr.audits['uses-optimized-images']?.details?.overallSavingsBytes || 0
      }
    }
  }

  async analyzeBundleSize() {
    console.log('📊 Analyzing bundle size...')
    
    try {
      const distPath = join(rootDir, 'dist')
      const stats = this.calculateDirectorySize(distPath)
      
      this.results.bundleAnalysis = {
        totalSize: stats.totalSize,
        fileCount: stats.fileCount,
        breakdown: stats.breakdown,
        withinBudget: stats.totalSize <= config.budget.totalSize,
        budgetUtilization: (stats.totalSize / config.budget.totalSize * 100).toFixed(1)
      }
      
      console.log(`✅ Bundle analysis completed - Total: ${(stats.totalSize / 1024).toFixed(2)}KB`)
      
    } catch (error) {
      console.warn('⚠️ Bundle analysis failed:', error.message)
      this.results.bundleAnalysis = { error: error.message }
    }
  }

  calculateDirectorySize(dirPath) {
    const fs = require('fs')
    const path = require('path')
    
    let totalSize = 0
    let fileCount = 0
    const breakdown = {
      javascript: 0,
      css: 0,
      images: 0,
      fonts: 0,
      other: 0
    }
    
    const calculateSize = (currentPath) => {
      const stats = fs.statSync(currentPath)
      
      if (stats.isDirectory()) {
        const files = fs.readdirSync(currentPath)
        files.forEach(file => {
          calculateSize(path.join(currentPath, file))
        })
      } else {
        const size = stats.size
        totalSize += size
        fileCount++
        
        const ext = path.extname(currentPath).toLowerCase()
        if (['.js', '.mjs'].includes(ext)) {
          breakdown.javascript += size
        } else if (ext === '.css') {
          breakdown.css += size
        } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'].includes(ext)) {
          breakdown.images += size
        } else if (['.woff', '.woff2', '.ttf', '.eot'].includes(ext)) {
          breakdown.fonts += size
        } else {
          breakdown.other += size
        }
      }
    }
    
    calculateSize(dirPath)
    
    return { totalSize, fileCount, breakdown }
  }

  async checkPWARequirements(environment) {
    console.log('📱 Checking PWA requirements...')
    
    const url = config.urls[environment]
    
    try {
      // Check manifest
      const manifestResponse = await fetch(`${url}/manifest.json`)
      const manifest = await manifestResponse.json()
      
      // Check service worker
      const swResponse = await fetch(`${url}/sw.js`)
      const swExists = swResponse.ok
      
      this.results.audits.pwa = {
        hasManifest: manifestResponse.ok,
        manifestValid: this.validateManifest(manifest),
        hasServiceWorker: swExists,
        isInstallable: manifestResponse.ok && swExists,
        manifest: manifest
      }
      
      console.log('✅ PWA requirements checked')
      
    } catch (error) {
      console.warn('⚠️ PWA check failed:', error.message)
      this.results.audits.pwa = { error: error.message }
    }
  }

  validateManifest(manifest) {
    const required = ['name', 'short_name', 'start_url', 'display', 'theme_color', 'background_color', 'icons']
    const missing = required.filter(field => !manifest[field])
    
    return {
      valid: missing.length === 0,
      missing: missing,
      hasIcons: manifest.icons && manifest.icons.length > 0,
      hasLargeIcon: manifest.icons && manifest.icons.some(icon => 
        icon.sizes && parseInt(icon.sizes.split('x')[0]) >= 512
      )
    }
  }

  async analyzeDependencies() {
    console.log('📦 Analyzing dependencies...')
    
    try {
      const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'))
      
      // Run npm audit
      let auditResult
      try {
        const auditOutput = execSync('npm audit --json', { 
          cwd: rootDir, 
          encoding: 'utf8' 
        })
        auditResult = JSON.parse(auditOutput)
      } catch (error) {
        // npm audit returns non-zero exit code when vulnerabilities found
        if (error.stdout) {
          auditResult = JSON.parse(error.stdout)
        } else {
          throw error
        }
      }
      
      this.results.audits.dependencies = {
        total: Object.keys(packageJson.dependencies || {}).length + 
               Object.keys(packageJson.devDependencies || {}).length,
        production: Object.keys(packageJson.dependencies || {}).length,
        development: Object.keys(packageJson.devDependencies || {}).length,
        vulnerabilities: auditResult.metadata?.vulnerabilities || {},
        outdated: await this.checkOutdatedPackages()
      }
      
      console.log('✅ Dependencies analyzed')
      
    } catch (error) {
      console.warn('⚠️ Dependency analysis failed:', error.message)
      this.results.audits.dependencies = { error: error.message }
    }
  }

  async checkOutdatedPackages() {
    try {
      const outdatedOutput = execSync('npm outdated --json', { 
        cwd: rootDir, 
        encoding: 'utf8' 
      })
      return JSON.parse(outdatedOutput)
    } catch (error) {
      // npm outdated returns non-zero when packages are outdated
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout)
        } catch {
          return {}
        }
      }
      return {}
    }
  }

  generateRecommendations() {
    console.log('💡 Generating recommendations...')
    
    const recommendations = []
    
    // Performance recommendations
    if (this.results.audits.lighthouse?.desktop?.scores?.performance < config.thresholds.performance) {
      recommendations.push({
        category: 'Performance',
        priority: 'High',
        issue: 'Desktop performance score below threshold',
        recommendation: 'Optimize bundle size, implement code splitting, and optimize images',
        impact: 'High'
      })
    }
    
    if (this.results.audits.lighthouse?.mobile?.scores?.performance < config.thresholds.performance) {
      recommendations.push({
        category: 'Performance',
        priority: 'High',
        issue: 'Mobile performance score below threshold',
        recommendation: 'Focus on mobile-specific optimizations, reduce JavaScript execution time',
        impact: 'High'
      })
    }
    
    // Bundle size recommendations
    if (!this.results.bundleAnalysis.withinBudget) {
      recommendations.push({
        category: 'Bundle Size',
        priority: 'Medium',
        issue: `Bundle size exceeds budget (${this.results.bundleAnalysis.budgetUtilization}% of budget used)`,
        recommendation: 'Enable tree shaking, remove unused dependencies, implement lazy loading',
        impact: 'Medium'
      })
    }
    
    // Core Web Vitals recommendations
    const desktop = this.results.audits.lighthouse?.desktop?.metrics
    if (desktop?.lcp > 2500) {
      recommendations.push({
        category: 'Core Web Vitals',
        priority: 'High',
        issue: `LCP is ${(desktop.lcp / 1000).toFixed(2)}s (should be < 2.5s)`,
        recommendation: 'Optimize images, preload critical resources, reduce server response time',
        impact: 'High'
      })
    }
    
    if (desktop?.cls > 0.1) {
      recommendations.push({
        category: 'Core Web Vitals',
        priority: 'Medium',
        issue: `CLS is ${desktop.cls.toFixed(3)} (should be < 0.1)`,
        recommendation: 'Set explicit dimensions for images, reserve space for dynamic content',
        impact: 'Medium'
      })
    }
    
    // Security recommendations
    const vulnerabilities = this.results.audits.dependencies?.vulnerabilities
    if (vulnerabilities && (vulnerabilities.high > 0 || vulnerabilities.critical > 0)) {
      recommendations.push({
        category: 'Security',
        priority: 'Critical',
        issue: `${vulnerabilities.critical || 0} critical and ${vulnerabilities.high || 0} high severity vulnerabilities`,
        recommendation: 'Update vulnerable dependencies immediately',
        impact: 'Critical'
      })
    }
    
    // PWA recommendations
    if (!this.results.audits.pwa?.isInstallable) {
      recommendations.push({
        category: 'PWA',
        priority: 'Medium',
        issue: 'App is not installable',
        recommendation: 'Ensure manifest.json and service worker are properly configured',
        impact: 'Medium'
      })
    }
    
    this.results.recommendations = recommendations
    console.log(`✅ Generated ${recommendations.length} recommendations`)
  }

  async generateReports() {
    console.log('📄 Generating reports...')
    
    // Generate summary
    this.results.summary = {
      overallScore: this.calculateOverallScore(),
      criticalIssues: this.results.recommendations.filter(r => r.priority === 'Critical').length,
      highPriorityIssues: this.results.recommendations.filter(r => r.priority === 'High').length,
      totalRecommendations: this.results.recommendations.length,
      budgetCompliance: this.results.bundleAnalysis.withinBudget,
      pwaReady: this.results.audits.pwa?.isInstallable || false
    }
    
    // Save detailed JSON report
    const jsonReport = JSON.stringify(this.results, null, 2)
    writeFileSync(join(rootDir, 'audit-report.json'), jsonReport)
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport()
    writeFileSync(join(rootDir, 'audit-report.html'), htmlReport)
    
    // Generate console summary
    this.printConsoleSummary()
    
    console.log('✅ Reports generated')
    console.log('📄 Detailed report: audit-report.html')
    console.log('📊 JSON data: audit-report.json')
  }

  calculateOverallScore() {
    const lighthouse = this.results.audits.lighthouse
    if (!lighthouse?.desktop?.scores) return 0
    
    const scores = lighthouse.desktop.scores
    const weights = {
      performance: 0.3,
      accessibility: 0.2,
      bestPractices: 0.2,
      seo: 0.15,
      pwa: 0.15
    }
    
    return Math.round(
      scores.performance * weights.performance +
      scores.accessibility * weights.accessibility +
      scores.bestPractices * weights.bestPractices +
      scores.seo * weights.seo +
      scores.pwa * weights.pwa
    )
  }

  generateHTMLReport() {
    const { summary, audits, bundleAnalysis, recommendations } = this.results
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Blacklist - Audit Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #0a0a0a; color: #eaeaea; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { color: #800020; font-size: 2.5em; margin-bottom: 10px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .metric { background: #1a1a1a; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #333; }
        .metric h3 { margin: 0 0 10px 0; color: #00ffff; }
        .metric .value { font-size: 2em; font-weight: bold; }
        .metric .value.good { color: #00ff88; }
        .metric .value.warning { color: #ffaa00; }
        .metric .value.error { color: #ff3366; }
        .section { background: #1a1a1a; padding: 30px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #333; }
        .section h2 { color: #800020; border-bottom: 2px solid #800020; padding-bottom: 10px; }
        .scores { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        .score { text-align: center; padding: 15px; background: #2a2a2a; border-radius: 6px; }
        .score-value { font-size: 1.5em; font-weight: bold; margin-bottom: 5px; }
        .recommendations { list-style: none; padding: 0; }
        .recommendation { background: #2a2a2a; padding: 20px; margin-bottom: 15px; border-radius: 6px; border-left: 4px solid; }
        .recommendation.critical { border-left-color: #ff3366; }
        .recommendation.high { border-left-color: #ffaa00; }
        .recommendation.medium { border-left-color: #3366ff; }
        .recommendation h4 { margin: 0 0 10px 0; }
        .recommendation .priority { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .priority.critical { background: #ff3366; color: white; }
        .priority.high { background: #ffaa00; color: black; }
        .priority.medium { background: #3366ff; color: white; }
        .timestamp { text-align: center; color: #888; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>The Blacklist - Performance Audit</h1>
            <p>Comprehensive PWA Performance Analysis</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <h3>Overall Score</h3>
                <div class="value ${summary.overallScore >= 90 ? 'good' : summary.overallScore >= 70 ? 'warning' : 'error'}">${summary.overallScore}/100</div>
            </div>
            <div class="metric">
                <h3>Critical Issues</h3>
                <div class="value ${summary.criticalIssues === 0 ? 'good' : 'error'}">${summary.criticalIssues}</div>
            </div>
            <div class="metric">
                <h3>Bundle Size</h3>
                <div class="value ${bundleAnalysis.withinBudget ? 'good' : 'warning'}">${bundleAnalysis.budgetUtilization}%</div>
            </div>
            <div class="metric">
                <h3>PWA Ready</h3>
                <div class="value ${summary.pwaReady ? 'good' : 'warning'}">${summary.pwaReady ? 'Yes' : 'No'}</div>
            </div>
        </div>
        
        ${audits.lighthouse ? `
        <div class="section">
            <h2>Lighthouse Scores</h2>
            <h3>Desktop</h3>
            <div class="scores">
                <div class="score">
                    <div class="score-value ${audits.lighthouse.desktop.scores.performance >= 90 ? 'good' : audits.lighthouse.desktop.scores.performance >= 70 ? 'warning' : 'error'}">${audits.lighthouse.desktop.scores.performance}</div>
                    <div>Performance</div>
                </div>
                <div class="score">
                    <div class="score-value ${audits.lighthouse.desktop.scores.accessibility >= 95 ? 'good' : audits.lighthouse.desktop.scores.accessibility >= 80 ? 'warning' : 'error'}">${audits.lighthouse.desktop.scores.accessibility}</div>
                    <div>Accessibility</div>
                </div>
                <div class="score">
                    <div class="score-value ${audits.lighthouse.desktop.scores.bestPractices >= 90 ? 'good' : audits.lighthouse.desktop.scores.bestPractices >= 70 ? 'warning' : 'error'}">${audits.lighthouse.desktop.scores.bestPractices}</div>
                    <div>Best Practices</div>
                </div>
                <div class="score">
                    <div class="score-value ${audits.lighthouse.desktop.scores.seo >= 90 ? 'good' : audits.lighthouse.desktop.scores.seo >= 70 ? 'warning' : 'error'}">${audits.lighthouse.desktop.scores.seo}</div>
                    <div>SEO</div>
                </div>
                <div class="score">
                    <div class="score-value ${audits.lighthouse.desktop.scores.pwa >= 90 ? 'good' : audits.lighthouse.desktop.scores.pwa >= 70 ? 'warning' : 'error'}">${audits.lighthouse.desktop.scores.pwa}</div>
                    <div>PWA</div>
                </div>
            </div>
            
            <h3>Mobile</h3>
            <div class="scores">
                <div class="score">
                    <div class="score-value ${audits.lighthouse.mobile.scores.performance >= 90 ? 'good' : audits.lighthouse.mobile.scores.performance >= 70 ? 'warning' : 'error'}">${audits.lighthouse.mobile.scores.performance}</div>
                    <div>Performance</div>
                </div>
                <div class="score">
                    <div class="score-value ${audits.lighthouse.mobile.scores.accessibility >= 95 ? 'good' : audits.lighthouse.mobile.scores.accessibility >= 80 ? 'warning' : 'error'}">${audits.lighthouse.mobile.scores.accessibility}</div>
                    <div>Accessibility</div>
                </div>
                <div class="score">
                    <div class="score-value ${audits.lighthouse.mobile.scores.bestPractices >= 90 ? 'good' : audits.lighthouse.mobile.scores.bestPractices >= 70 ? 'warning' : 'error'}">${audits.lighthouse.mobile.scores.bestPractices}</div>
                    <div>Best Practices</div>
                </div>
                <div class="score">
                    <div class="score-value ${audits.lighthouse.mobile.scores.seo >= 90 ? 'good' : audits.lighthouse.mobile.scores.seo >= 70 ? 'warning' : 'error'}">${audits.lighthouse.mobile.scores.seo}</div>
                    <div>SEO</div>
                </div>
                <div class="score">
                    <div class="score-value ${audits.lighthouse.mobile.scores.pwa >= 90 ? 'good' : audits.lighthouse.mobile.scores.pwa >= 70 ? 'warning' : 'error'}">${audits.lighthouse.mobile.scores.pwa}</div>
                    <div>PWA</div>
                </div>
            </div>
        </div>
        ` : ''}
        
        <div class="section">
            <h2>Recommendations</h2>
            <ul class="recommendations">
                ${recommendations.map(rec => `
                    <li class="recommendation ${rec.priority.toLowerCase()}">
                        <h4>${rec.issue} <span class="priority ${rec.priority.toLowerCase()}">${rec.priority}</span></h4>
                        <p><strong>Category:</strong> ${rec.category}</p>
                        <p><strong>Recommendation:</strong> ${rec.recommendation}</p>
                        <p><strong>Impact:</strong> ${rec.impact}</p>
                    </li>
                `).join('')}
            </ul>
        </div>
        
        <div class="timestamp">
            Generated on ${new Date(this.results.timestamp).toLocaleString()}
        </div>
    </div>
</body>
</html>
    `.trim()
  }

  printConsoleSummary() {
    console.log('\n' + '='.repeat(60))
    console.log('🎯 AUDIT SUMMARY')
    console.log('='.repeat(60))
    console.log(`Overall Score: ${this.results.summary.overallScore}/100`)
    console.log(`Critical Issues: ${this.results.summary.criticalIssues}`)
    console.log(`High Priority Issues: ${this.results.summary.highPriorityIssues}`)
    console.log(`Bundle Budget: ${this.results.bundleAnalysis.budgetUtilization}% used`)
    console.log(`PWA Ready: ${this.results.summary.pwaReady ? 'Yes' : 'No'}`)
    
    if (this.results.audits.lighthouse) {
      console.log('\n📊 LIGHTHOUSE SCORES (Desktop/Mobile)')
      console.log(`Performance: ${this.results.audits.lighthouse.desktop.scores.performance}/${this.results.audits.lighthouse.mobile.scores.performance}`)
      console.log(`Accessibility: ${this.results.audits.lighthouse.desktop.scores.accessibility}/${this.results.audits.lighthouse.mobile.scores.accessibility}`)
      console.log(`Best Practices: ${this.results.audits.lighthouse.desktop.scores.bestPractices}/${this.results.audits.lighthouse.mobile.scores.bestPractices}`)
      console.log(`SEO: ${this.results.audits.lighthouse.desktop.scores.seo}/${this.results.audits.lighthouse.mobile.scores.seo}`)
      console.log(`PWA: ${this.results.audits.lighthouse.desktop.scores.pwa}/${this.results.audits.lighthouse.mobile.scores.pwa}`)
    }
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 TOP RECOMMENDATIONS')
      this.results.recommendations
        .filter(r => r.priority === 'Critical' || r.priority === 'High')
        .slice(0, 5)
        .forEach((rec, index) => {
          console.log(`${index + 1}. [${rec.priority}] ${rec.issue}`)
          console.log(`   → ${rec.recommendation}`)
        })
    }
    
    console.log('\n' + '='.repeat(60))
  }
}

// CLI interface
const environment = process.argv[2] || 'local'
const auditor = new ComprehensiveAuditor()

auditor.runFullAudit(environment).catch(error => {
  console.error('❌ Audit failed:', error)
  process.exit(1)
})