#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

class DeploymentReporter {
  constructor(environment) {
    this.environment = environment;
    this.report = {
      timestamp: new Date().toISOString(),
      environment,
      buildNumber: process.env.GITHUB_RUN_NUMBER || 'local',
      commitSha: process.env.GITHUB_SHA || 'unknown',
      branch: process.env.GITHUB_REF_NAME || 'unknown',
      status: 'unknown',
      metrics: {},
      healthCheck: null,
      lighthouse: null,
      errors: []
    };
  }

  loadHealthCheckResults() {
    try {
      if (fs.existsSync('health-check-results.json')) {
        const data = fs.readFileSync('health-check-results.json', 'utf8');
        this.report.healthCheck = JSON.parse(data);
        this.report.status = this.report.healthCheck.overall === 'healthy' ? 'success' : 'warning';
      }
    } catch (error) {
      this.report.errors.push(`Failed to load health check results: ${error.message}`);
    }
  }

  loadLighthouseResults() {
    try {
      const lighthouseFile = `lighthouse-${this.environment}.json`;
      if (fs.existsSync(lighthouseFile)) {
        const data = fs.readFileSync(lighthouseFile, 'utf8');
        const lighthouse = JSON.parse(data);
        
        this.report.lighthouse = {
          performance: lighthouse.lhr?.categories?.performance?.score * 100 || 0,
          accessibility: lighthouse.lhr?.categories?.accessibility?.score * 100 || 0,
          bestPractices: lighthouse.lhr?.categories?.['best-practices']?.score * 100 || 0,
          seo: lighthouse.lhr?.categories?.seo?.score * 100 || 0,
          pwa: lighthouse.lhr?.categories?.pwa?.score * 100 || 0
        };

        // Extract key metrics
        const audits = lighthouse.lhr?.audits || {};
        this.report.metrics = {
          firstContentfulPaint: audits['first-contentful-paint']?.numericValue || 0,
          largestContentfulPaint: audits['largest-contentful-paint']?.numericValue || 0,
          cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue || 0,
          totalBlockingTime: audits['total-blocking-time']?.numericValue || 0,
          speedIndex: audits['speed-index']?.numericValue || 0
        };
      }
    } catch (error) {
      this.report.errors.push(`Failed to load Lighthouse results: ${error.message}`);
    }
  }

  generateSummary() {
    const summary = {
      deployment: {
        environment: this.environment,
        status: this.report.status,
        timestamp: this.report.timestamp,
        build: this.report.buildNumber,
        commit: this.report.commitSha?.substring(0, 7) || 'unknown'
      },
      performance: {},
      health: {}
    };

    // Performance summary
    if (this.report.lighthouse) {
      summary.performance = {
        overall: Math.round((
          this.report.lighthouse.performance +
          this.report.lighthouse.accessibility +
          this.report.lighthouse.bestPractices +
          this.report.lighthouse.seo +
          this.report.lighthouse.pwa
        ) / 5),
        scores: this.report.lighthouse,
        coreWebVitals: {
          fcp: Math.round(this.report.metrics.firstContentfulPaint || 0),
          lcp: Math.round(this.report.metrics.largestContentfulPaint || 0),
          cls: Math.round((this.report.metrics.cumulativeLayoutShift || 0) * 1000) / 1000,
          tbt: Math.round(this.report.metrics.totalBlockingTime || 0)
        }
      };
    }

    // Health summary
    if (this.report.healthCheck) {
      const checks = this.report.healthCheck.checks || [];
      summary.health = {
        overall: this.report.healthCheck.overall,
        totalChecks: checks.length,
        passed: checks.filter(c => c.status === 'pass').length,
        failed: checks.filter(c => c.status === 'fail').length,
        averageResponseTime: checks.length > 0 
          ? Math.round(checks.reduce((sum, c) => sum + (c.responseTime || 0), 0) / checks.length)
          : 0
      };
    }

    return summary;
  }

  generateReport() {
    console.log(`📊 Generating deployment report for ${this.environment}...`);

    this.loadHealthCheckResults();
    this.loadLighthouseResults();

    const summary = this.generateSummary();

    // Save full report
    fs.writeFileSync('deployment-report.json', JSON.stringify(this.report, null, 2));

    // Save summary
    fs.writeFileSync('deployment-summary.json', JSON.stringify(summary, null, 2));

    // Print summary to console
    console.log('\n📈 Deployment Summary:');
    console.log(`Environment: ${summary.deployment.environment}`);
    console.log(`Status: ${summary.deployment.status}`);
    console.log(`Build: ${summary.deployment.build}`);
    console.log(`Commit: ${summary.deployment.commit}`);

    if (summary.performance.overall) {
      console.log(`\n⚡ Performance Score: ${summary.performance.overall}/100`);
      console.log(`  Performance: ${summary.performance.scores.performance}/100`);
      console.log(`  Accessibility: ${summary.performance.scores.accessibility}/100`);
      console.log(`  Best Practices: ${summary.performance.scores.bestPractices}/100`);
      console.log(`  SEO: ${summary.performance.scores.seo}/100`);
      console.log(`  PWA: ${summary.performance.scores.pwa}/100`);
    }

    if (summary.health.overall) {
      console.log(`\n🏥 Health Check: ${summary.health.overall}`);
      console.log(`  Checks: ${summary.health.passed}/${summary.health.totalChecks} passed`);
      console.log(`  Avg Response Time: ${summary.health.averageResponseTime}ms`);
    }

    if (this.report.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      this.report.errors.forEach(error => console.log(`  - ${error}`));
    }

    console.log('\n📄 Full report saved to deployment-report.json');
    console.log('📄 Summary saved to deployment-summary.json');

    return this.report;
  }
}

// CLI interface
const environment = process.argv[2] || 'production';
const reporter = new DeploymentReporter(environment);

try {
  reporter.generateReport();
} catch (error) {
  console.error('❌ Failed to generate deployment report:', error.message);
  process.exit(1);
}