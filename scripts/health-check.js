#!/usr/bin/env node

import https from 'https';
import fs from 'fs';

const PRODUCTION_URL = 'https://the-blacklist-879f1.web.app';
const STAGING_URL = 'https://the-blacklist-879f1--staging.web.app';

class HealthChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      checks: [],
      overall: 'unknown'
    };
  }

  async checkEndpoint(name, url, expectedStatus = 200) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      https.get(url, (res) => {
        const responseTime = Date.now() - startTime;
        const check = {
          name,
          url,
          status: res.statusCode === expectedStatus ? 'pass' : 'fail',
          responseTime,
          statusCode: res.statusCode,
          expectedStatus
        };
        
        this.results.checks.push(check);
        console.log(`✓ ${name}: ${check.status} (${responseTime}ms)`);
        resolve(check);
      }).on('error', (err) => {
        const responseTime = Date.now() - startTime;
        const check = {
          name,
          url,
          status: 'fail',
          responseTime,
          error: err.message
        };
        
        this.results.checks.push(check);
        console.log(`✗ ${name}: ${check.status} - ${err.message}`);
        resolve(check);
      });
    });
  }

  async checkServiceWorker(baseUrl) {
    const swUrl = `${baseUrl}/service-worker.js`;
    return this.checkEndpoint('Service Worker', swUrl, 200);
  }

  async checkManifest(baseUrl) {
    const manifestUrl = `${baseUrl}/manifest.json`;
    return this.checkEndpoint('PWA Manifest', manifestUrl, 200);
  }

  async checkAPI(baseUrl) {
    // This would check API endpoints if we had them
    // For now, just check if the main page loads
    return this.checkEndpoint('Main Page', baseUrl, 200);
  }

  async checkSSL(baseUrl) {
    const url = baseUrl.replace('http://', 'https://');
    return this.checkEndpoint('SSL Certificate', url, 200);
  }

  async checkHeaders(baseUrl) {
    return new Promise((resolve) => {
      https.get(baseUrl, (res) => {
        const securityHeaders = [
          'x-content-type-options',
          'x-frame-options',
          'x-xss-protection',
          'referrer-policy'
        ];

        const missingHeaders = securityHeaders.filter(header => !res.headers[header]);
        
        const check = {
          name: 'Security Headers',
          url: baseUrl,
          status: missingHeaders.length === 0 ? 'pass' : 'fail',
          missingHeaders,
          presentHeaders: securityHeaders.filter(header => res.headers[header])
        };

        this.results.checks.push(check);
        
        if (check.status === 'pass') {
          console.log(`✓ Security Headers: pass`);
        } else {
          console.log(`✗ Security Headers: fail - Missing: ${missingHeaders.join(', ')}`);
        }
        
        resolve(check);
      }).on('error', (err) => {
        const check = {
          name: 'Security Headers',
          url: baseUrl,
          status: 'fail',
          error: err.message
        };
        
        this.results.checks.push(check);
        console.log(`✗ Security Headers: fail - ${err.message}`);
        resolve(check);
      });
    });
  }

  async runAllChecks(environment = 'production') {
    const baseUrl = environment === 'production' ? PRODUCTION_URL : STAGING_URL;
    
    console.log(`\n🔍 Running health checks for ${environment} environment...`);
    console.log(`Base URL: ${baseUrl}\n`);

    const checks = [
      this.checkAPI(baseUrl),
      this.checkServiceWorker(baseUrl),
      this.checkManifest(baseUrl),
      this.checkSSL(baseUrl),
      this.checkHeaders(baseUrl)
    ];

    await Promise.all(checks);

    // Determine overall status
    const failedChecks = this.results.checks.filter(check => check.status === 'fail');
    this.results.overall = failedChecks.length === 0 ? 'healthy' : 'unhealthy';

    console.log(`\n📊 Overall Status: ${this.results.overall.toUpperCase()}`);
    console.log(`Total Checks: ${this.results.checks.length}`);
    console.log(`Passed: ${this.results.checks.length - failedChecks.length}`);
    console.log(`Failed: ${failedChecks.length}`);

    if (failedChecks.length > 0) {
      console.log('\n❌ Failed Checks:');
      failedChecks.forEach(check => {
        console.log(`  - ${check.name}: ${check.error || 'Check failed'}`);
      });
    }

    // Save results to file
    fs.writeFileSync('health-check-results.json', JSON.stringify(this.results, null, 2));
    console.log('\n📄 Results saved to health-check-results.json');

    // Exit with error code if unhealthy
    if (this.results.overall === 'unhealthy') {
      process.exit(1);
    }
  }
}

// Run health checks
const environment = process.argv[2] || 'production';
const healthChecker = new HealthChecker();
healthChecker.runAllChecks(environment).catch(console.error);