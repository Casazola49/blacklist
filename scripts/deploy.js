#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ENVIRONMENTS = {
  staging: {
    target: 'staging',
    envFile: '.env.staging'
  },
  production: {
    target: 'production',
    envFile: '.env.production'
  }
};

class Deployer {
  constructor(environment) {
    this.environment = environment;
    this.config = ENVIRONMENTS[environment];
    
    if (!this.config) {
      throw new Error(`Invalid environment: ${environment}. Valid options: ${Object.keys(ENVIRONMENTS).join(', ')}`);
    }
  }

  log(message) {
    console.log(`🚀 [${this.environment.toUpperCase()}] ${message}`);
  }

  error(message) {
    console.error(`❌ [${this.environment.toUpperCase()}] ${message}`);
  }

  success(message) {
    console.log(`✅ [${this.environment.toUpperCase()}] ${message}`);
  }

  exec(command, options = {}) {
    this.log(`Executing: ${command}`);
    try {
      return execSync(command, { 
        stdio: 'inherit',
        encoding: 'utf8',
        ...options 
      });
    } catch (error) {
      this.error(`Command failed: ${command}`);
      throw error;
    }
  }

  checkPrerequisites() {
    this.log('Checking prerequisites...');
    
    // Check if environment file exists
    if (!fs.existsSync(this.config.envFile)) {
      throw new Error(`Environment file ${this.config.envFile} not found`);
    }

    // Check if Firebase CLI is installed
    try {
      this.exec('firebase --version', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Firebase CLI not found. Install with: npm install -g firebase-tools');
    }

    // Check if user is logged in
    try {
      this.exec('firebase projects:list', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Not logged in to Firebase. Run: firebase login');
    }

    this.success('Prerequisites check passed');
  }

  runTests() {
    this.log('Running tests...');
    
    try {
      this.exec('npm run test:unit');
      this.exec('npm run test:integration');
      this.exec('npm run test:security');
      this.success('All tests passed');
    } catch (error) {
      this.error('Tests failed');
      throw error;
    }
  }

  buildApplication() {
    this.log('Building application...');
    
    try {
      // Copy environment file
      fs.copyFileSync(this.config.envFile, '.env.local');
      
      // Build for the specific environment
      this.exec(`npm run build:${this.environment}`);
      
      // Clean up
      if (fs.existsSync('.env.local')) {
        fs.unlinkSync('.env.local');
      }
      
      this.success('Build completed');
    } catch (error) {
      this.error('Build failed');
      throw error;
    }
  }

  deployHosting() {
    this.log('Deploying to Firebase Hosting...');
    
    try {
      this.exec(`firebase deploy --only hosting:${this.config.target}`);
      this.success('Hosting deployment completed');
    } catch (error) {
      this.error('Hosting deployment failed');
      throw error;
    }
  }

  deployFunctions() {
    this.log('Deploying Cloud Functions...');
    
    try {
      this.exec('firebase deploy --only functions');
      this.success('Functions deployment completed');
    } catch (error) {
      this.error('Functions deployment failed');
      throw error;
    }
  }

  deployFirestore() {
    this.log('Deploying Firestore rules and indexes...');
    
    try {
      this.exec('firebase deploy --only firestore');
      this.success('Firestore deployment completed');
    } catch (error) {
      this.error('Firestore deployment failed');
      throw error;
    }
  }

  runHealthCheck() {
    this.log('Running post-deployment health check...');
    
    try {
      // Wait a bit for deployment to propagate
      setTimeout(() => {
        this.exec(`node scripts/health-check.js ${this.environment}`);
        this.success('Health check passed');
      }, 5000);
    } catch (error) {
      this.error('Health check failed');
      throw error;
    }
  }

  async deploy(options = {}) {
    const {
      skipTests = false,
      skipFunctions = false,
      skipFirestore = false,
      skipHealthCheck = false
    } = options;

    try {
      this.log(`Starting deployment to ${this.environment}...`);
      
      this.checkPrerequisites();
      
      if (!skipTests) {
        this.runTests();
      }
      
      this.buildApplication();
      this.deployHosting();
      
      if (!skipFunctions) {
        this.deployFunctions();
      }
      
      if (!skipFirestore) {
        this.deployFirestore();
      }
      
      if (!skipHealthCheck) {
        this.runHealthCheck();
      }
      
      this.success(`Deployment to ${this.environment} completed successfully! 🎉`);
      
      // Show deployment URL
      const url = this.environment === 'production' 
        ? 'https://the-blacklist-879f1.web.app'
        : 'https://the-blacklist-879f1--staging.web.app';
      
      console.log(`\n🌐 Application URL: ${url}`);
      
    } catch (error) {
      this.error(`Deployment failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// CLI interface
const args = process.argv.slice(2);
const environment = args[0];
const options = {};

// Parse options
args.slice(1).forEach(arg => {
  if (arg === '--skip-tests') options.skipTests = true;
  if (arg === '--skip-functions') options.skipFunctions = true;
  if (arg === '--skip-firestore') options.skipFirestore = true;
  if (arg === '--skip-health-check') options.skipHealthCheck = true;
});

if (!environment) {
  console.error('Usage: node scripts/deploy.js <environment> [options]');
  console.error('Environments: staging, production');
  console.error('Options: --skip-tests, --skip-functions, --skip-firestore, --skip-health-check');
  process.exit(1);
}

const deployer = new Deployer(environment);
deployer.deploy(options);