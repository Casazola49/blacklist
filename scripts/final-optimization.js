#!/usr/bin/env node

/**
 * Final Optimization Script
 * Comprehensive optimization and polishing for The Blacklist PWA
 */

import { execSync, spawn } from 'child_process'
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

class FinalOptimizer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      optimizations: [],
      metrics: {},
      recommendations: [],
      summary: {}
    }
  }

  async runFullOptimization() {
    console.log('🚀 Starting final optimization process...')
    
    try {
      // 1. Clean and prepare
      await this.cleanAndPrepare()
      
      // 2. Optimize assets
      await this.optimizeAssets()
      
      // 3. Optimize bundle
      await this.optimizeBundle()
      
      // 4. Optimize animations
      await this.optimizeAnimations()
      
      // 5. Run comprehensive audit
      await this.runComprehensiveAudit()
      
      // 6. Generate analytics setup
      await this.setupAnalytics()
      
      // 7. Optimize PWA configuration
      await this.optimizePWA()
      
      // 8. Final validation
      await this.finalValidation()
      
      // 9. Generate reports
      await this.generateReports()
      
      console.log('✅ Final optimization completed successfully!')
      
    } catch (error) {
      console.error('❌ Optimization failed:', error.message)
      process.exit(1)
    }
  }

  async cleanAndPrepare() {
    console.log('🧹 Cleaning and preparing...')
    
    // Clean dist directory
    execSync('npm run clean:dist', { cwd: rootDir, stdio: 'pipe' })
    
    // Validate environment
    execSync('npm run env:validate', { cwd: rootDir, stdio: 'pipe' })
    
    this.results.optimizations.push('Cleaned build directory and validated environment')
  }

  async optimizeAssets() {
    console.log('🖼️ Optimizing assets...')
    
    try {
      // Run asset optimization
      execSync('npm run optimize:assets', { cwd: rootDir, stdio: 'pipe' })
      
      // Analyze asset sizes
      const publicDir = join(rootDir, 'public')
      const assetSizes = this.analyzeAssetSizes(publicDir)
      
      this.results.metrics.assetSizes = assetSizes
      this.results.optimizations.push('Optimized images and assets')
      
      // Check for oversized assets
      const oversizedAssets = Object.entries(assetSizes)
        .filter(([, size]) => size > 100000) // > 100KB
        .map(([name]) => name)
      
      if (oversizedAssets.length > 0) {
        this.results.recommendations.push(`Consider further optimization for: ${oversizedAssets.join(', ')}`)
      }
      
    } catch (error) {
      console.warn('⚠️ Asset optimization failed:', error.message)
    }
  }

  analyzeAssetSizes(dir) {
    const sizes = {}
    
    const analyzeDirectory = (currentDir) => {
      const files = readdirSync(currentDir)
      
      files.forEach(file => {
        const filePath = join(currentDir, file)
        const stats = statSync(filePath)
        
        if (stats.isDirectory()) {
          analyzeDirectory(filePath)
        } else {
          const relativePath = filePath.replace(dir + '/', '')
          sizes[relativePath] = stats.size
        }
      })
    }
    
    if (existsSync(dir)) {
      analyzeDirectory(dir)
    }
    
    return sizes
  }

  async optimizeBundle() {
    console.log('📦 Optimizing bundle...')
    
    // Build with optimization
    execSync('npm run build:optimized', { cwd: rootDir, stdio: 'pipe' })
    
    // Analyze bundle
    const distDir = join(rootDir, 'dist')
    const bundleSizes = this.analyzeAssetSizes(distDir)
    
    this.results.metrics.bundleSizes = bundleSizes
    
    // Calculate total sizes by type
    const sizesByType = {
      js: 0,
      css: 0,
      images: 0,
      other: 0
    }
    
    Object.entries(bundleSizes).forEach(([file, size]) => {
      const ext = extname(file).toLowerCase()
      if (['.js', '.mjs'].includes(ext)) {
        sizesByType.js += size
      } else if (ext === '.css') {
        sizesByType.css += size
      } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'].includes(ext)) {
        sizesByType.images += size
      } else {
        sizesByType.other += size
      }
    })
    
    this.results.metrics.sizesByType = sizesByType
    
    // Check budget compliance
    const budgetLimits = {
      js: 200000,      // 200KB
      css: 50000,      // 50KB
      images: 300000,  // 300KB
      total: 500000    // 500KB
    }
    
    const totalSize = Object.values(sizesByType).reduce((a, b) => a + b, 0)
    const budgetCompliance = {
      js: sizesByType.js <= budgetLimits.js,
      css: sizesByType.css <= budgetLimits.css,
      images: sizesByType.images <= budgetLimits.images,
      total: totalSize <= budgetLimits.total
    }
    
    this.results.metrics.budgetCompliance = budgetCompliance
    
    // Add recommendations for budget violations
    Object.entries(budgetCompliance).forEach(([type, compliant]) => {
      if (!compliant) {
        this.results.recommendations.push(`${type} bundle size exceeds budget - consider further optimization`)
      }
    })
    
    this.results.optimizations.push('Optimized and analyzed bundle sizes')
  }

  async optimizeAnimations() {
    console.log('🎨 Optimizing animations...')
    
    // Check animation files
    const animationFiles = [
      'src/composables/useAnimations.ts',
      'src/composables/useGlobalAnimations.ts',
      'src/components/ui/AnimationShowcase.vue',
      'src/assets/css/main.css'
    ]
    
    let animationOptimizations = 0
    
    animationFiles.forEach(file => {
      const filePath = join(rootDir, file)
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf8')
        
        // Check for performance optimizations
        const hasGPUAcceleration = content.includes('translateZ(0)') || content.includes('will-change')
        const hasReducedMotion = content.includes('prefers-reduced-motion')
        const hasPerformanceChecks = content.includes('performance') || content.includes('fps')
        
        if (hasGPUAcceleration) animationOptimizations++
        if (hasReducedMotion) animationOptimizations++
        if (hasPerformanceChecks) animationOptimizations++
      }
    })
    
    this.results.metrics.animationOptimizations = animationOptimizations
    this.results.optimizations.push(`Animation optimizations: ${animationOptimizations} features implemented`)
    
    if (animationOptimizations < 6) {
      this.results.recommendations.push('Consider implementing additional animation performance optimizations')
    }
  }

  async runComprehensiveAudit() {
    console.log('🔍 Running comprehensive audit...')
    
    try {
      // Start preview server
      const serverProcess = spawn('npm', ['run', 'preview'], {
        cwd: rootDir,
        stdio: 'pipe'
      })
      
      // Wait for server to start
      await this.waitForServer('http://localhost:4173')
      
      // Run Lighthouse audit
      const lighthouseResult = await this.runLighthouseAudit()
      this.results.metrics.lighthouse = lighthouseResult
      
      // Stop server
      serverProcess.kill()
      
      this.results.optimizations.push('Completed comprehensive Lighthouse audit')
      
    } catch (error) {
      console.warn('⚠️ Audit failed:', error.message)
      this.results.recommendations.push('Manual audit recommended - automated audit failed')
    }
  }

  async waitForServer(url, timeout = 30000) {
    const start = Date.now()
    
    while (Date.now() - start < timeout) {
      try {
        const response = await fetch(url)
        if (response.ok) {
          return
        }
      } catch (error) {
        // Server not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    throw new Error('Server failed to start within timeout')
  }

  async runLighthouseAudit() {
    const url = 'http://localhost:4173'
    
    try {
      const command = `lighthouse ${url} --output json --chrome-flags="--headless" --quiet`
      const output = execSync(command, { encoding: 'utf8' })
      const result = JSON.parse(output)
      
      return {
        performance: Math.round(result.lhr.categories.performance.score * 100),
        accessibility: Math.round(result.lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(result.lhr.categories['best-practices'].score * 100),
        seo: Math.round(result.lhr.categories.seo.score * 100),
        pwa: Math.round(result.lhr.categories.pwa.score * 100),
        lcp: result.lhr.audits['largest-contentful-paint']?.numericValue,
        cls: result.lhr.audits['cumulative-layout-shift']?.numericValue,
        fcp: result.lhr.audits['first-contentful-paint']?.numericValue
      }
    } catch (error) {
      throw new Error(`Lighthouse audit failed: ${error.message}`)
    }
  }

  async setupAnalytics() {
    console.log('📊 Setting up analytics...')
    
    // Check analytics configuration
    const analyticsFile = join(rootDir, 'src/services/analytics.ts')
    
    if (existsSync(analyticsFile)) {
      const content = readFileSync(analyticsFile, 'utf8')
      
      const hasFirebaseAnalytics = content.includes('firebase/analytics')
      const hasPerformanceTracking = content.includes('web-vitals')
      const hasUserTracking = content.includes('trackEvent')
      const hasErrorTracking = content.includes('trackError')
      
      const analyticsFeatures = [
        hasFirebaseAnalytics,
        hasPerformanceTracking,
        hasUserTracking,
        hasErrorTracking
      ].filter(Boolean).length
      
      this.results.metrics.analyticsFeatures = analyticsFeatures
      this.results.optimizations.push(`Analytics setup: ${analyticsFeatures}/4 features configured`)
      
      if (analyticsFeatures < 4) {
        this.results.recommendations.push('Complete analytics implementation for better insights')
      }
    } else {
      this.results.recommendations.push('Analytics service not found - consider implementing user tracking')
    }
  }

  async optimizePWA() {
    console.log('📱 Optimizing PWA configuration...')
    
    // Check PWA files
    const pwaFiles = {
      manifest: join(rootDir, 'public/manifest.json'),
      serviceWorker: join(rootDir, 'public/sw.js'),
      icons: [
        join(rootDir, 'public/icon-192x192.png'),
        join(rootDir, 'public/icon-512x512.png')
      ]
    }
    
    let pwaScore = 0
    
    // Check manifest
    if (existsSync(pwaFiles.manifest)) {
      const manifest = JSON.parse(readFileSync(pwaFiles.manifest, 'utf8'))
      
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'theme_color', 'background_color', 'icons']
      const hasAllFields = requiredFields.every(field => manifest[field])
      
      if (hasAllFields) pwaScore += 25
      if (manifest.icons && manifest.icons.length >= 2) pwaScore += 25
    }
    
    // Check service worker
    if (existsSync(pwaFiles.serviceWorker)) {
      pwaScore += 25
    }
    
    // Check icons
    const existingIcons = pwaFiles.icons.filter(icon => existsSync(icon))
    if (existingIcons.length >= 2) {
      pwaScore += 25
    }
    
    this.results.metrics.pwaScore = pwaScore
    this.results.optimizations.push(`PWA configuration: ${pwaScore}/100 score`)
    
    if (pwaScore < 100) {
      this.results.recommendations.push('Complete PWA setup for full installability')
    }
  }

  async finalValidation() {
    console.log('✅ Running final validation...')
    
    // Run tests
    try {
      execSync('npm run test:run', { cwd: rootDir, stdio: 'pipe' })
      this.results.optimizations.push('All tests passed')
    } catch (error) {
      this.results.recommendations.push('Some tests failed - review test results')
    }
    
    // Check TypeScript compilation
    try {
      execSync('npm run type-check', { cwd: rootDir, stdio: 'pipe' })
      this.results.optimizations.push('TypeScript compilation successful')
    } catch (error) {
      this.results.recommendations.push('TypeScript errors found - fix before deployment')
    }
    
    // Validate build output
    const distDir = join(rootDir, 'dist')
    if (existsSync(distDir)) {
      const files = readdirSync(distDir)
      const hasIndex = files.includes('index.html')
      const hasAssets = files.some(file => file.startsWith('assets') || file.includes('.js') || file.includes('.css'))
      
      if (hasIndex && hasAssets) {
        this.results.optimizations.push('Build output validated')
      } else {
        this.results.recommendations.push('Build output incomplete - check build process')
      }
    }
  }

  async generateReports() {
    console.log('📄 Generating optimization reports...')
    
    // Calculate overall score
    const scores = {
      bundle: this.results.metrics.budgetCompliance ? 
        Object.values(this.results.metrics.budgetCompliance).filter(Boolean).length * 25 : 0,
      lighthouse: this.results.metrics.lighthouse ? 
        (this.results.metrics.lighthouse.performance + 
         this.results.metrics.lighthouse.accessibility + 
         this.results.metrics.lighthouse.bestPractices + 
         this.results.metrics.lighthouse.seo + 
         this.results.metrics.lighthouse.pwa) / 5 : 0,
      pwa: this.results.metrics.pwaScore || 0,
      animations: (this.results.metrics.animationOptimizations || 0) * 16.67, // Max 6 features
      analytics: (this.results.metrics.analyticsFeatures || 0) * 25 // Max 4 features
    }
    
    const overallScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length
    
    this.results.summary = {
      overallScore: Math.round(overallScore),
      scores,
      totalOptimizations: this.results.optimizations.length,
      totalRecommendations: this.results.recommendations.length,
      readyForProduction: overallScore >= 80 && this.results.recommendations.length <= 3
    }
    
    // Save detailed JSON report
    const jsonReport = JSON.stringify(this.results, null, 2)
    writeFileSync(join(rootDir, 'optimization-report.json'), jsonReport)
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport()
    writeFileSync(join(rootDir, 'optimization-report.html'), htmlReport)
    
    // Print console summary
    this.printConsoleSummary()
    
    console.log('📄 Reports generated:')
    console.log('  • optimization-report.html')
    console.log('  • optimization-report.json')
  }

  generateHTMLReport() {
    const { summary, metrics, optimizations, recommendations } = this.results
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Blacklist - Final Optimization Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #0a0a0a; color: #eaeaea; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { color: #800020; font-size: 2.5em; margin-bottom: 10px; }
        .score-circle { width: 120px; height: 120px; border-radius: 50%; margin: 20px auto; display: flex; align-items: center; justify-content: center; font-size: 2em; font-weight: bold; }
        .score-excellent { background: linear-gradient(135deg, #00ff88 0%, #00cc66 100%); color: #000; }
        .score-good { background: linear-gradient(135deg, #00ffff 0%, #0099cc 100%); color: #000; }
        .score-fair { background: linear-gradient(135deg, #ffaa00 0%, #cc8800 100%); color: #000; }
        .score-poor { background: linear-gradient(135deg, #ff3366 0%, #cc0033 100%); color: #fff; }
        .section { background: #1a1a1a; padding: 30px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #333; }
        .section h2 { color: #800020; border-bottom: 2px solid #800020; padding-bottom: 10px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .metric { background: #2a2a2a; padding: 20px; border-radius: 6px; text-align: center; }
        .metric h3 { color: #00ffff; margin: 0 0 10px 0; }
        .metric .value { font-size: 1.5em; font-weight: bold; }
        .optimizations, .recommendations { list-style: none; padding: 0; }
        .optimization, .recommendation { background: #2a2a2a; padding: 15px; margin-bottom: 10px; border-radius: 6px; border-left: 4px solid; }
        .optimization { border-left-color: #00ff88; }
        .recommendation { border-left-color: #ffaa00; }
        .status { text-align: center; padding: 20px; border-radius: 8px; font-size: 1.2em; font-weight: bold; }
        .status.ready { background: linear-gradient(135deg, #00ff88 0%, #00cc66 100%); color: #000; }
        .status.not-ready { background: linear-gradient(135deg, #ffaa00 0%, #cc8800 100%); color: #000; }
        .timestamp { text-align: center; color: #888; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>The Blacklist - Final Optimization Report</h1>
            <div class="score-circle ${summary.overallScore >= 90 ? 'score-excellent' : summary.overallScore >= 70 ? 'score-good' : summary.overallScore >= 50 ? 'score-fair' : 'score-poor'}">
                ${summary.overallScore}/100
            </div>
        </div>
        
        <div class="status ${summary.readyForProduction ? 'ready' : 'not-ready'}">
            ${summary.readyForProduction ? '🚀 Ready for Production!' : '⚠️ Needs Additional Work'}
        </div>
        
        <div class="section">
            <h2>📊 Performance Metrics</h2>
            <div class="metrics">
                <div class="metric">
                    <h3>Bundle Score</h3>
                    <div class="value">${summary.scores.bundle}/100</div>
                </div>
                <div class="metric">
                    <h3>Lighthouse Score</h3>
                    <div class="value">${Math.round(summary.scores.lighthouse)}/100</div>
                </div>
                <div class="metric">
                    <h3>PWA Score</h3>
                    <div class="value">${summary.scores.pwa}/100</div>
                </div>
                <div class="metric">
                    <h3>Animation Score</h3>
                    <div class="value">${Math.round(summary.scores.animations)}/100</div>
                </div>
                <div class="metric">
                    <h3>Analytics Score</h3>
                    <div class="value">${summary.scores.analytics}/100</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>✅ Optimizations Applied (${optimizations.length})</h2>
            <ul class="optimizations">
                ${optimizations.map(opt => `<li class="optimization">${opt}</li>`).join('')}
            </ul>
        </div>
        
        ${recommendations.length > 0 ? `
        <div class="section">
            <h2>💡 Recommendations (${recommendations.length})</h2>
            <ul class="recommendations">
                ${recommendations.map(rec => `<li class="recommendation">${rec}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        
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
    console.log('🎯 FINAL OPTIMIZATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`Overall Score: ${this.results.summary.overallScore}/100`)
    console.log(`Optimizations Applied: ${this.results.summary.totalOptimizations}`)
    console.log(`Recommendations: ${this.results.summary.totalRecommendations}`)
    console.log(`Production Ready: ${this.results.summary.readyForProduction ? 'Yes' : 'No'}`)
    
    if (this.results.metrics.lighthouse) {
      console.log('\n📊 LIGHTHOUSE SCORES')
      console.log(`Performance: ${this.results.metrics.lighthouse.performance}`)
      console.log(`Accessibility: ${this.results.metrics.lighthouse.accessibility}`)
      console.log(`Best Practices: ${this.results.metrics.lighthouse.bestPractices}`)
      console.log(`SEO: ${this.results.metrics.lighthouse.seo}`)
      console.log(`PWA: ${this.results.metrics.lighthouse.pwa}`)
    }
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 TOP RECOMMENDATIONS')
      this.results.recommendations.slice(0, 5).forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`)
      })
    }
    
    console.log('\n' + '='.repeat(60))
  }
}

// CLI interface
const optimizer = new FinalOptimizer()

optimizer.runFullOptimization().catch(error => {
  console.error('❌ Final optimization failed:', error)
  process.exit(1)
})