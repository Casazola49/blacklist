#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

class EnvironmentValidator {
  constructor() {
    this.requiredVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
      'VITE_APP_NAME',
      'VITE_APP_VERSION',
      'VITE_APP_ENVIRONMENT'
    ];

    this.optionalVars = [
      'VITE_FIREBASE_MEASUREMENT_ID',
      'VITE_APP_DEBUG',
      'VITE_APP_LOG_LEVEL',
      'VITE_API_BASE_URL',
      'VITE_API_TIMEOUT',
      'VITE_FEATURE_ANALYTICS',
      'VITE_FEATURE_ERROR_REPORTING',
      'VITE_FEATURE_PERFORMANCE_MONITORING',
      'VITE_FEATURE_MAINTENANCE_MODE',
      'VITE_ENABLE_DEVTOOLS',
      'VITE_STRICT_CSP'
    ];

    this.environments = ['development', 'staging', 'production'];
  }

  log(message) {
    console.log(`🔍 ${message}`);
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

  loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const vars = {};

    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          vars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });

    return vars;
  }

  validateEnvironment(envName) {
    this.log(`Validating ${envName} environment...`);

    const envFile = envName === 'development' ? '.env.example' : `.env.${envName}`;
    const envVars = this.loadEnvFile(envFile);

    if (!envVars) {
      this.error(`Environment file ${envFile} not found`);
      return false;
    }

    let isValid = true;
    const missing = [];
    const invalid = [];

    // Check required variables
    this.requiredVars.forEach(varName => {
      if (!envVars[varName]) {
        missing.push(varName);
        isValid = false;
      } else if (envVars[varName].includes('your_') || envVars[varName].includes('_here')) {
        invalid.push(varName);
        isValid = false;
      }
    });

    // Check Firebase configuration
    if (envVars.VITE_FIREBASE_PROJECT_ID && envVars.VITE_FIREBASE_AUTH_DOMAIN) {
      const projectId = envVars.VITE_FIREBASE_PROJECT_ID;
      const expectedDomain = `${projectId}.firebaseapp.com`;
      
      if (envVars.VITE_FIREBASE_AUTH_DOMAIN !== expectedDomain) {
        this.warn(`Auth domain mismatch. Expected: ${expectedDomain}, Got: ${envVars.VITE_FIREBASE_AUTH_DOMAIN}`);
      }
    }

    // Check environment-specific values
    if (envVars.VITE_APP_ENVIRONMENT !== envName) {
      this.warn(`Environment mismatch. Expected: ${envName}, Got: ${envVars.VITE_APP_ENVIRONMENT}`);
    }

    // Validate boolean values
    const booleanVars = [
      'VITE_APP_DEBUG',
      'VITE_FEATURE_ANALYTICS',
      'VITE_FEATURE_ERROR_REPORTING',
      'VITE_FEATURE_PERFORMANCE_MONITORING',
      'VITE_FEATURE_MAINTENANCE_MODE',
      'VITE_ENABLE_DEVTOOLS',
      'VITE_STRICT_CSP'
    ];

    booleanVars.forEach(varName => {
      if (envVars[varName] && !['true', 'false'].includes(envVars[varName])) {
        this.warn(`${varName} should be 'true' or 'false', got: ${envVars[varName]}`);
      }
    });

    // Validate numeric values
    if (envVars.VITE_API_TIMEOUT && isNaN(parseInt(envVars.VITE_API_TIMEOUT))) {
      this.warn(`VITE_API_TIMEOUT should be a number, got: ${envVars.VITE_API_TIMEOUT}`);
    }

    // Report results
    if (missing.length > 0) {
      this.error(`Missing required variables in ${envFile}:`);
      missing.forEach(varName => console.log(`  - ${varName}`));
    }

    if (invalid.length > 0) {
      this.error(`Invalid placeholder values in ${envFile}:`);
      invalid.forEach(varName => console.log(`  - ${varName}: ${envVars[varName]}`));
    }

    if (isValid) {
      this.success(`${envName} environment configuration is valid`);
    }

    return isValid;
  }

  generateEnvTemplate() {
    this.log('Generating environment template...');

    const template = `# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Application Configuration
VITE_APP_NAME="The Blacklist"
VITE_APP_VERSION="1.0.0"
VITE_APP_ENVIRONMENT="development"
VITE_APP_DEBUG="true"
VITE_APP_LOG_LEVEL="debug"

# API Configuration
VITE_API_BASE_URL="http://localhost:5001"
VITE_API_TIMEOUT="10000"

# Feature Flags
VITE_FEATURE_ANALYTICS="false"
VITE_FEATURE_ERROR_REPORTING="false"
VITE_FEATURE_PERFORMANCE_MONITORING="false"
VITE_FEATURE_MAINTENANCE_MODE="false"

# Security
VITE_ENABLE_DEVTOOLS="true"
VITE_STRICT_CSP="false"

# Build Configuration
VITE_BUILD_ANALYZE="false"
VITE_BUILD_SOURCEMAP="true"

# Monitoring
VITE_SENTRY_DSN=""
VITE_ANALYTICS_ID=""
`;

    fs.writeFileSync('.env.template', template);
    this.success('Environment template generated: .env.template');
  }

  validateAll() {
    this.log('Starting environment validation...');

    let allValid = true;

    this.environments.forEach(env => {
      const isValid = this.validateEnvironment(env);
      if (!isValid) {
        allValid = false;
      }
      console.log(''); // Add spacing
    });

    if (allValid) {
      this.success('All environment configurations are valid! 🎉');
    } else {
      this.error('Some environment configurations have issues');
      process.exit(1);
    }

    return allValid;
  }

  checkSecrets() {
    this.log('Checking for exposed secrets...');

    const sensitivePatterns = [
      /AIza[0-9A-Za-z-_]{35}/g, // Google API keys
      /sk_live_[0-9a-zA-Z]{24}/g, // Stripe live keys
      /sk_test_[0-9a-zA-Z]{24}/g, // Stripe test keys
      /[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com/g, // OAuth client IDs
    ];

    const files = ['.env', '.env.local', '.env.development', '.env.staging', '.env.production'];
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        sensitivePatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            this.warn(`Potential secret found in ${file}: ${matches[0].substring(0, 10)}...`);
          }
        });
      }
    });

    this.success('Secret check completed');
  }
}

// CLI interface
const command = process.argv[2];
const validator = new EnvironmentValidator();

switch (command) {
  case 'validate':
    validator.validateAll();
    break;
  case 'template':
    validator.generateEnvTemplate();
    break;
  case 'secrets':
    validator.checkSecrets();
    break;
  default:
    console.log('Usage: node scripts/validate-env.js <command>');
    console.log('Commands:');
    console.log('  validate  - Validate all environment files');
    console.log('  template  - Generate environment template');
    console.log('  secrets   - Check for exposed secrets');
    break;
}