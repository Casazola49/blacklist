#!/usr/bin/env node

import https from 'https';
import fs from 'fs';

class ProductionMonitor {
  constructor() {
    this.baseUrl = 'https://the-blacklist-879f1.web.app';
    this.metrics = {
      timestamp: new Date().toISOString(),
      uptime: null,
      performance: {},
      errors: [],
      alerts: []
    };
  }

  log(message) {
    console.log(`📊 ${message}`);
  }

  success(message) {
    console.log(`✅ ${message}`);
  }

  error(message) {
    console.error(`❌ ${message}`);
  }

  warn(message) {
    console.warn(`⚠️  ${message}`);
  }

  async checkUptime() {
    this.log('Checking application uptime...');
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      https.get(this.baseUrl, (res) => {
        const responseTime = Date.now() - startTime;
        
        this.metrics.uptime = {
          status: res.statusCode === 200 ? 'up' : 'down',
          responseTime,
          statusCode: res.statusCode,
          timestamp: new Date().toISOString()
        };

        if (res.statusCode === 200) {
          this.success(`Application is UP (${responseTime}ms)`);
        } else {
          this.error(`Application returned status ${res.statusCode}`);
          this.metrics.alerts.push({
            type: 'uptime',
            message: `Application returned status ${res.statusCode}`,
            severity: 'high'
          });
        }

        resolve(this.metrics.uptime);
      }).on('error', (err) => {
        const responseTime = Date.now() - startTime;
        
        this.metrics.uptime = {
          status: 'down',
          responseTime,
          error: err.message,
          timestamp: new Date().toISOString()
        };

        this.error(`Application is DOWN: ${err.message}`);
        this.metrics.alerts.push({
          type: 'uptime',
          message: `Application is DOWN: ${err.message}`,
          severity: 'critical'
        });

        resolve(this.metrics.uptime);
      });
    });
  }

  async runLighthouseAudit() {
    this.log('Running Lighthouse performance audit...');
    
    try {
      import { execSync } from 'child_process';
      
      const command = `lighthouse ${this.baseUrl} --output json --output-path ./lighthouse-production-monitor.json --chrome-flags='--headless' --quiet`;
      execSync(command, { stdio: 'pipe' });
      
      const lighthouseData = JSON.parse(fs.readFileSync('./lighthouse-production-monitor.json', 'utf8'));
      
      this.metrics.performance = {
        performance: Math.round(lighthouseData.lhr.categories.performance.score * 100),
        accessibility: Math.round(lighthouseData.lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(lighthouseData.lhr.categories['best-practices'].score * 100),
        seo: Math.round(lighthouseData.lhr.categories.seo.score * 100),
        pwa: Math.round(lighthouseData.lhr.categories.pwa.score * 100),
        metrics: {
          fcp: lighthouseData.lhr.audits['first-contentful-paint'].numericValue,
          lcp: lighthouseData.lhr.audits['largest-contentful-paint'].numericValue,
          cls: lighthouseData.lhr.audits['cumulative-layout-shift'].numericValue,
          tbt: lighthouseData.lhr.audits['total-blocking-time'].numericValue,
          si: lighthouseData.lhr.audits['speed-index'].numericValue
        }
      };

      // Check for performance issues
      if (this.metrics.performance.performance < 90) {
        this.warn(`Performance score is below 90: ${this.metrics.performance.performance}`);
        this.metrics.alerts.push({
          type: 'performance',
          message: `Performance score is below 90: ${this.metrics.performance.performance}`,
          severity: 'medium'
        });
      }

      if (this.metrics.performance.metrics.lcp > 2500) {
        this.warn(`LCP is above 2.5s: ${Math.round(this.metrics.performance.metrics.lcp)}ms`);
        this.metrics.alerts.push({
          type: 'performance',
          message: `LCP is above 2.5s: ${Math.round(this.metrics.performance.metrics.lcp)}ms`,
          severity: 'medium'
        });
      }

      if (this.metrics.performance.metrics.cls > 0.1) {
        this.warn(`CLS is above 0.1: ${this.metrics.performance.metrics.cls}`);
        this.metrics.alerts.push({
          type: 'performance',
          message: `CLS is above 0.1: ${this.metrics.performance.metrics.cls}`,
          severity: 'medium'
        });
      }

      this.success('Lighthouse audit completed');
      
      // Clean up
      if (fs.existsSync('./lighthouse-production-monitor.json')) {
        fs.unlinkSync('./lighthouse-production-monitor.json');
      }
      
    } catch (error) {
      this.error(`Lighthouse audit failed: ${error.message}`);
      this.metrics.errors.push({
        type: 'lighthouse',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async checkCriticalPaths() {
    this.log('Checking critical application paths...');
    
    const criticalPaths = [
      '/',
      '/manifest.json',
      '/service-worker.js'
    ];

    const results = [];

    for (const path of criticalPaths) {
      const url = `${this.baseUrl}${path}`;
      
      try {
        const result = await this.checkPath(url);
        results.push({ path, ...result });
        
        if (result.status !== 200) {
          this.warn(`Critical path ${path} returned status ${result.status}`);
          this.metrics.alerts.push({
            type: 'critical-path',
            message: `Critical path ${path} returned status ${result.status}`,
            severity: 'high'
          });
        }
      } catch (error) {
        this.error(`Failed to check path ${path}: ${error.message}`);
        results.push({ path, error: error.message });
        this.metrics.alerts.push({
          type: 'critical-path',
          message: `Failed to check path ${path}: ${error.message}`,
          severity: 'high'
        });
      }
    }

    this.metrics.criticalPaths = results;
    this.success('Critical paths check completed');
  }

  async checkPath(url) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      https.get(url, (res) => {
        const responseTime = Date.now() - startTime;
        resolve({
          status: res.statusCode,
          responseTime,
          headers: res.headers
        });
      }).on('error', reject);
    });
  }

  generateReport() {
    this.log('Generating monitoring report...');
    
    const report = {
      ...this.metrics,
      summary: {
        status: this.metrics.alerts.length === 0 ? 'healthy' : 'issues',
        totalAlerts: this.metrics.alerts.length,
        criticalAlerts: this.metrics.alerts.filter(a => a.severity === 'critical').length,
        highAlerts: this.metrics.alerts.filter(a => a.severity === 'high').length,
        mediumAlerts: this.metrics.alerts.filter(a => a.severity === 'medium').length
      }
    };

    // Save report
    const reportPath = `production-monitor-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Print summary
    console.log('\n📊 Production Monitoring Summary:');
    console.log(`Status: ${report.summary.status.toUpperCase()}`);
    console.log(`Total Alerts: ${report.summary.totalAlerts}`);
    
    if (report.summary.criticalAlerts > 0) {
      console.log(`🚨 Critical Alerts: ${report.summary.criticalAlerts}`);
    }
    
    if (report.summary.highAlerts > 0) {
      console.log(`⚠️  High Priority Alerts: ${report.summary.highAlerts}`);
    }
    
    if (report.summary.mediumAlerts > 0) {
      console.log(`📝 Medium Priority Alerts: ${report.summary.mediumAlerts}`);
    }

    if (this.metrics.uptime) {
      console.log(`\n🌐 Uptime: ${this.metrics.uptime.status.toUpperCase()} (${this.metrics.uptime.responseTime}ms)`);
    }

    if (this.metrics.performance.performance) {
      console.log(`\n⚡ Performance Scores:`);
      console.log(`  Performance: ${this.metrics.performance.performance}/100`);
      console.log(`  Accessibility: ${this.metrics.performance.accessibility}/100`);
      console.log(`  Best Practices: ${this.metrics.performance.bestPractices}/100`);
      console.log(`  SEO: ${this.metrics.performance.seo}/100`);
      console.log(`  PWA: ${this.metrics.performance.pwa}/100`);
    }

    console.log(`\n📄 Full report saved to: ${reportPath}`);

    return report;
  }

  async monitor() {
    this.log('Starting production monitoring...');

    await this.checkUptime();
    await this.runLighthouseAudit();
    await this.checkCriticalPaths();

    const report = this.generateReport();

    // Exit with error code if there are critical issues
    if (report.summary.criticalAlerts > 0) {
      process.exit(1);
    }

    return report;
  }
}

// Run monitoring
const monitor = new ProductionMonitor();
monitor.monitor().catch(console.error);