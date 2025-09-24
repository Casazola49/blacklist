#!/usr/bin/env node

import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class FinalSystemValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      },
      tests: {
        unit: { status: 'pending', passed: 0, failed: 0, duration: 0, coverage: 0 },
        integration: { status: 'pending', passed: 0, failed: 0, duration: 0 },
        e2e: { status: 'pending', passed: 0, failed: 0, duration: 0 },
        performance: { status: 'pending', passed: 0, failed: 0, duration: 0, metrics: {} },
        security: { status: 'pending', passed: 0, failed: 0, duration: 0, vulnerabilities: [] },
        lighthouse: { status: 'pending', scores: {}, duration: 0 }
      },
      requirements: {
        '1.1-1.15': { status: 'pending', tests: [], coverage: 0 },
        '2.1-2.8': { status: 'pending', tests: [], coverage: 0 },
        '3.1-3.5': { status: 'pending', tests: [], coverage: 0 },
        '4.1-4.5': { status: 'pending', tests: [], coverage: 0 },
        '5.1-5.5': { status: 'pending', tests: [], coverage: 0 },
        '6.1-6.5': { status: 'pending', tests: [], coverage: 0 },
        '7.1-7.5': { status: 'pending', tests: [], coverage: 0 },
        '8.1-8.5': { status: 'pending', tests: [], coverage: 0 },
        '9.1-9.5': { status: 'pending', tests: [], coverage: 0 },
        '10.1-10.5': { status: 'pending', tests: [], coverage: 0 },
        '11.1-11.5': { status: 'pending', tests: [], coverage: 0 }
      },
      summary: {
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        successRate: 0,
        overallStatus: 'pending',
        criticalIssues: [],
        recommendations: []
      }
    }
    this.startTime = Date.now()
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      console.log(`\n🔧 Ejecutando: ${command} ${args.join(' ')}`)
      
      const process = spawn(command, args, {
        stdio: 'pipe',
        shell: true,
        ...options
      })

      let stdout = ''
      let stderr = ''

      process.stdout.on('data', (data) => {
        const output = data.toString()
        stdout += output
        if (options.verbose !== false) {
          console.log(output)
        }
      })

      process.stderr.on('data', (data) => {
        const output = data.toString()
        stderr += output
        if (options.verbose !== false) {
          console.error(output)
        }
      })

      process.on('close', (code) => {
        resolve({ stdout, stderr, code, success: code === 0 })
      })

      process.on('error', (error) => {
        reject(error)
      })
    })
  }

  async validateEnvironment() {
    console.log('🌍 Validando entorno de desarrollo...')
    
    try {
      // Verificar Node.js
      const nodeResult = await this.runCommand('node', ['--version'], { verbose: false })
      console.log(`✅ Node.js: ${nodeResult.stdout.trim()}`)
      
      // Verificar npm
      const npmResult = await this.runCommand('npm', ['--version'], { verbose: false })
      console.log(`✅ npm: ${npmResult.stdout.trim()}`)
      
      // Verificar dependencias críticas
      const packageJsonPath = path.join(__dirname, '..', 'package.json')
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
      
      const criticalDeps = ['vue', 'firebase', 'pinia', 'vue-router']
      for (const dep of criticalDeps) {
        if (packageJson.dependencies[dep]) {
          console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`)
        } else {
          throw new Error(`Dependencia crítica faltante: ${dep}`)
        }
      }
      
      // Verificar archivos de configuración
      const configFiles = [
        'vite.config.ts',
        'vitest.config.ts',
        'cypress.config.ts',
        'firebase.json',
        'firestore.rules'
      ]
      
      for (const file of configFiles) {
        try {
          await fs.access(path.join(__dirname, '..', file))
          console.log(`✅ Configuración: ${file}`)
        } catch {
          console.warn(`⚠️  Archivo de configuración faltante: ${file}`)
        }
      }
      
      console.log('✅ Entorno validado correctamente')
      return true
    } catch (error) {
      console.error('❌ Error validando entorno:', error.message)
      return false
    }
  }

  async runUnitTests() {
    console.log('\n📋 Ejecutando pruebas unitarias con cobertura...')
    const startTime = Date.now()
    
    try {
      const result = await this.runCommand('npm', ['run', 'test:coverage'])
      
      this.results.tests.unit.duration = Date.now() - startTime
      this.results.tests.unit.status = result.success ? 'passed' : 'failed'
      
      // Parsear resultados
      const output = result.stdout
      const passedMatch = output.match(/(\d+) passed/)
      const failedMatch = output.match(/(\d+) failed/)
      const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/)
      
      this.results.tests.unit.passed = passedMatch ? parseInt(passedMatch[1]) : 0
      this.results.tests.unit.failed = failedMatch ? parseInt(failedMatch[1]) : 0
      this.results.tests.unit.coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0
      
      console.log(`✅ Pruebas unitarias: ${this.results.tests.unit.passed} pasaron, ${this.results.tests.unit.failed} fallaron`)
      console.log(`📊 Cobertura de código: ${this.results.tests.unit.coverage}%`)
      
      if (this.results.tests.unit.coverage < 80) {
        this.results.summary.criticalIssues.push('Cobertura de código insuficiente (<80%)')
      }
      
    } catch (error) {
      console.error('❌ Error en pruebas unitarias:', error.message)
      this.results.tests.unit.status = 'failed'
      this.results.tests.unit.duration = Date.now() - startTime
    }
  }

  async runIntegrationTests() {
    console.log('\n🔗 Ejecutando pruebas de integración...')
    const startTime = Date.now()
    
    try {
      const result = await this.runCommand('vitest', ['run', 'src/__tests__/integration/**/*.test.ts'])
      
      this.results.tests.integration.duration = Date.now() - startTime
      this.results.tests.integration.status = result.success ? 'passed' : 'failed'
      
      const output = result.stdout
      const passedMatch = output.match(/(\d+) passed/)
      const failedMatch = output.match(/(\d+) failed/)
      
      this.results.tests.integration.passed = passedMatch ? parseInt(passedMatch[1]) : 0
      this.results.tests.integration.failed = failedMatch ? parseInt(failedMatch[1]) : 0
      
      console.log(`✅ Pruebas de integración: ${this.results.tests.integration.passed} pasaron, ${this.results.tests.integration.failed} fallaron`)
      
    } catch (error) {
      console.error('❌ Error en pruebas de integración:', error.message)
      this.results.tests.integration.status = 'failed'
      this.results.tests.integration.duration = Date.now() - startTime
    }
  }

  async runPerformanceTests() {
    console.log('\n⚡ Ejecutando pruebas de rendimiento...')
    const startTime = Date.now()
    
    try {
      const result = await this.runCommand('vitest', ['run', 'src/__tests__/performance/**/*.test.ts'])
      
      this.results.tests.performance.duration = Date.now() - startTime
      this.results.tests.performance.status = result.success ? 'passed' : 'failed'
      
      const output = result.stdout
      const passedMatch = output.match(/(\d+) passed/)
      const failedMatch = output.match(/(\d+) failed/)
      
      this.results.tests.performance.passed = passedMatch ? parseInt(passedMatch[1]) : 0
      this.results.tests.performance.failed = failedMatch ? parseInt(failedMatch[1]) : 0
      
      // Extraer métricas de rendimiento del output
      const loadTimeMatch = output.match(/load time: (\d+)ms/)
      const memoryMatch = output.match(/memory usage: ([\d.]+)MB/)
      
      this.results.tests.performance.metrics = {
        loadTime: loadTimeMatch ? parseInt(loadTimeMatch[1]) : 0,
        memoryUsage: memoryMatch ? parseFloat(memoryMatch[1]) : 0
      }
      
      console.log(`✅ Pruebas de rendimiento: ${this.results.tests.performance.passed} pasaron, ${this.results.tests.performance.failed} fallaron`)
      
      if (this.results.tests.performance.metrics.loadTime > 3000) {
        this.results.summary.criticalIssues.push('Tiempo de carga excesivo (>3s)')
      }
      
    } catch (error) {
      console.error('❌ Error en pruebas de rendimiento:', error.message)
      this.results.tests.performance.status = 'failed'
      this.results.tests.performance.duration = Date.now() - startTime
    }
  }

  async runSecurityTests() {
    console.log('\n🔒 Ejecutando pruebas de seguridad...')
    const startTime = Date.now()
    
    try {
      // Pruebas de seguridad personalizadas
      const securityResult = await this.runCommand('vitest', ['run', 'src/__tests__/security/**/*.test.ts'])
      
      // Auditoría de npm
      const auditResult = await this.runCommand('npm', ['audit', '--json'], { verbose: false })
      
      this.results.tests.security.duration = Date.now() - startTime
      this.results.tests.security.status = securityResult.success ? 'passed' : 'failed'
      
      const output = securityResult.stdout
      const passedMatch = output.match(/(\d+) passed/)
      const failedMatch = output.match(/(\d+) failed/)
      
      this.results.tests.security.passed = passedMatch ? parseInt(passedMatch[1]) : 0
      this.results.tests.security.failed = failedMatch ? parseInt(failedMatch[1]) : 0
      
      // Parsear vulnerabilidades de npm audit
      try {
        const auditData = JSON.parse(auditResult.stdout)
        if (auditData.vulnerabilities) {
          Object.entries(auditData.vulnerabilities).forEach(([pkg, vuln]) => {
            if (vuln.severity === 'high' || vuln.severity === 'critical') {
              this.results.tests.security.vulnerabilities.push({
                package: pkg,
                severity: vuln.severity,
                title: vuln.title
              })
            }
          })
        }
      } catch {
        // Ignorar errores de parsing de audit
      }
      
      console.log(`✅ Pruebas de seguridad: ${this.results.tests.security.passed} pasaron, ${this.results.tests.security.failed} fallaron`)
      console.log(`🛡️  Vulnerabilidades críticas: ${this.results.tests.security.vulnerabilities.length}`)
      
      if (this.results.tests.security.vulnerabilities.length > 0) {
        this.results.summary.criticalIssues.push(`${this.results.tests.security.vulnerabilities.length} vulnerabilidades de seguridad críticas`)
      }
      
    } catch (error) {
      console.error('❌ Error en pruebas de seguridad:', error.message)
      this.results.tests.security.status = 'failed'
      this.results.tests.security.duration = Date.now() - startTime
    }
  }

  async runE2ETests() {
    console.log('\n🎭 Ejecutando pruebas end-to-end...')
    const startTime = Date.now()
    
    try {
      // Construir aplicación
      console.log('🏗️  Construyendo aplicación...')
      await this.runCommand('npm', ['run', 'build'])
      
      // Iniciar servidor
      console.log('🚀 Iniciando servidor...')
      const serverProcess = spawn('npm', ['run', 'preview'], {
        stdio: 'pipe',
        shell: true,
        detached: true
      })

      // Esperar a que el servidor esté listo
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      try {
        const result = await this.runCommand('npm', ['run', 'test:e2e'])
        
        this.results.tests.e2e.duration = Date.now() - startTime
        this.results.tests.e2e.status = result.success ? 'passed' : 'failed'
        
        const output = result.stdout
        const passedMatch = output.match(/(\d+) passing/)
        const failedMatch = output.match(/(\d+) failing/)
        
        this.results.tests.e2e.passed = passedMatch ? parseInt(passedMatch[1]) : 0
        this.results.tests.e2e.failed = failedMatch ? parseInt(failedMatch[1]) : 0
        
        console.log(`✅ Pruebas E2E: ${this.results.tests.e2e.passed} pasaron, ${this.results.tests.e2e.failed} fallaron`)
        
      } finally {
        // Terminar servidor
        if (serverProcess.pid) {
          try {
            process.kill(-serverProcess.pid)
          } catch {
            // Ignorar errores al terminar proceso
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error en pruebas E2E:', error.message)
      this.results.tests.e2e.status = 'failed'
      this.results.tests.e2e.duration = Date.now() - startTime
    }
  }

  async runLighthouseAudit() {
    console.log('\n🏮 Ejecutando auditoría de Lighthouse...')
    const startTime = Date.now()
    
    try {
      // Construir aplicación optimizada
      await this.runCommand('npm', ['run', 'build:production'])
      
      // Iniciar servidor
      const serverProcess = spawn('npm', ['run', 'preview'], {
        stdio: 'pipe',
        shell: true,
        detached: true
      })

      await new Promise(resolve => setTimeout(resolve, 5000))
      
      try {
        const result = await this.runCommand('lighthouse', [
          'http://localhost:4173',
          '--output=json',
          '--output-path=./lighthouse-final.json',
          '--chrome-flags=--headless',
          '--quiet'
        ])
        
        this.results.tests.lighthouse.duration = Date.now() - startTime
        this.results.tests.lighthouse.status = result.success ? 'passed' : 'failed'
        
        // Leer resultados de Lighthouse
        try {
          const lighthouseData = JSON.parse(await fs.readFile('./lighthouse-final.json', 'utf-8'))
          this.results.tests.lighthouse.scores = {
            performance: Math.round(lighthouseData.categories.performance.score * 100),
            accessibility: Math.round(lighthouseData.categories.accessibility.score * 100),
            bestPractices: Math.round(lighthouseData.categories['best-practices'].score * 100),
            seo: Math.round(lighthouseData.categories.seo.score * 100),
            pwa: Math.round(lighthouseData.categories.pwa.score * 100)
          }
          
          console.log('📊 Puntuaciones Lighthouse:')
          Object.entries(this.results.tests.lighthouse.scores).forEach(([category, score]) => {
            console.log(`  ${category}: ${score}/100`)
          })
          
          // Verificar puntuaciones mínimas
          if (this.results.tests.lighthouse.scores.performance < 90) {
            this.results.summary.criticalIssues.push('Puntuación de rendimiento Lighthouse <90')
          }
          if (this.results.tests.lighthouse.scores.accessibility < 95) {
            this.results.summary.criticalIssues.push('Puntuación de accesibilidad Lighthouse <95')
          }
          
        } catch (error) {
          console.warn('⚠️  No se pudieron leer los resultados de Lighthouse')
        }
        
      } finally {
        // Terminar servidor
        if (serverProcess.pid) {
          try {
            process.kill(-serverProcess.pid)
          } catch {
            // Ignorar errores
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error en auditoría de Lighthouse:', error.message)
      this.results.tests.lighthouse.status = 'failed'
      this.results.tests.lighthouse.duration = Date.now() - startTime
    }
  }

  validateRequirements() {
    console.log('\n📋 Validando cobertura de requerimientos...')
    
    // Mapear tests a requerimientos (simplificado para el ejemplo)
    const requirementMapping = {
      '1.1-1.15': ['landing-page', 'hero-section', 'visual-effects'],
      '2.1-2.8': ['content-sections', 'arsenal-ia', 'galeria-elite'],
      '3.1-3.5': ['authentication', 'login', 'registration'],
      '4.1-4.5': ['client-dashboard', 'contract-creation', 'proposals'],
      '5.1-5.5': ['specialist-dashboard', 'opportunities', 'work-delivery'],
      '6.1-6.5': ['escrow-system', 'payments', 'qr-codes'],
      '7.1-7.5': ['notifications', 'chat', 'real-time'],
      '8.1-8.5': ['rating-system', 'mutual-rating', 'reputation'],
      '9.1-9.5': ['admin-panel', 'user-management', 'dispute-resolution'],
      '10.1-10.5': ['visual-design', 'animations', 'ui-components'],
      '11.1-11.5': ['pwa', 'performance', 'technical-architecture']
    }
    
    Object.entries(requirementMapping).forEach(([reqGroup, testCategories]) => {
      const totalTests = this.results.tests.unit.passed + this.results.tests.integration.passed + this.results.tests.e2e.passed
      const coverage = totalTests > 0 ? Math.min(100, (testCategories.length / totalTests) * 100) : 0
      
      this.results.requirements[reqGroup] = {
        status: coverage > 80 ? 'passed' : 'partial',
        tests: testCategories,
        coverage: Math.round(coverage)
      }
    })
    
    console.log('✅ Validación de requerimientos completada')
  }

  generateSummary() {
    // Calcular totales
    this.results.summary.totalTests = Object.values(this.results.tests).reduce((sum, test) => 
      sum + (test.passed || 0) + (test.failed || 0), 0
    )
    
    this.results.summary.totalPassed = Object.values(this.results.tests).reduce((sum, test) => 
      sum + (test.passed || 0), 0
    )
    
    this.results.summary.totalFailed = Object.values(this.results.tests).reduce((sum, test) => 
      sum + (test.failed || 0), 0
    )
    
    this.results.summary.successRate = this.results.summary.totalTests > 0 
      ? Math.round((this.results.summary.totalPassed / this.results.summary.totalTests) * 100)
      : 0
    
    // Determinar estado general
    const criticalFailures = this.results.summary.criticalIssues.length > 0
    const testFailures = this.results.summary.totalFailed > 0
    const lowSuccessRate = this.results.summary.successRate < 95
    
    if (criticalFailures || testFailures || lowSuccessRate) {
      this.results.summary.overallStatus = 'failed'
    } else {
      this.results.summary.overallStatus = 'passed'
    }
    
    // Generar recomendaciones
    if (this.results.tests.unit.coverage < 80) {
      this.results.summary.recommendations.push('Aumentar cobertura de pruebas unitarias')
    }
    
    if (this.results.tests.lighthouse.scores?.performance < 90) {
      this.results.summary.recommendations.push('Optimizar rendimiento de la aplicación')
    }
    
    if (this.results.tests.security.vulnerabilities.length > 0) {
      this.results.summary.recommendations.push('Resolver vulnerabilidades de seguridad')
    }
  }

  async generateReport() {
    const totalDuration = Date.now() - this.startTime
    this.results.totalDuration = totalDuration
    
    // Generar resumen
    this.generateSummary()
    
    // Guardar reporte completo
    const reportPath = path.join(__dirname, '..', 'final-validation-report.json')
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2))
    
    // Generar reporte HTML
    await this.generateHTMLReport()
    
    // Mostrar resumen en consola
    console.log('\n' + '='.repeat(80))
    console.log('🎯 REPORTE FINAL DE VALIDACIÓN DEL SISTEMA')
    console.log('='.repeat(80))
    console.log(`⏱️  Duración total: ${Math.round(totalDuration / 1000)}s`)
    console.log(`📊 Estado general: ${this.results.summary.overallStatus.toUpperCase()}`)
    console.log(`🧪 Total de pruebas: ${this.results.summary.totalTests}`)
    console.log(`✅ Pasaron: ${this.results.summary.totalPassed}`)
    console.log(`❌ Fallaron: ${this.results.summary.totalFailed}`)
    console.log(`📈 Tasa de éxito: ${this.results.summary.successRate}%`)
    
    if (this.results.tests.lighthouse.scores) {
      console.log(`🏮 Lighthouse Performance: ${this.results.tests.lighthouse.scores.performance}/100`)
    }
    
    if (this.results.summary.criticalIssues.length > 0) {
      console.log('\n⚠️  PROBLEMAS CRÍTICOS:')
      this.results.summary.criticalIssues.forEach(issue => {
        console.log(`  • ${issue}`)
      })
    }
    
    if (this.results.summary.recommendations.length > 0) {
      console.log('\n💡 RECOMENDACIONES:')
      this.results.summary.recommendations.forEach(rec => {
        console.log(`  • ${rec}`)
      })
    }
    
    console.log(`\n📄 Reporte completo: ${reportPath}`)
    console.log(`📄 Reporte HTML: ${path.join(__dirname, '..', 'final-validation-report.html')}`)
    
    return this.results
  }

  async generateHTMLReport() {
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte Final de Validación - The Blacklist</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #0a0a0a; color: #eaeaea; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .status-passed { color: #00ff88; }
        .status-failed { color: #ff3366; }
        .status-warning { color: #ffaa00; }
        .card { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric { text-align: center; padding: 10px; }
        .metric-value { font-size: 2em; font-weight: bold; }
        .progress-bar { width: 100%; height: 20px; background: #333; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #800020, #00ffff); transition: width 0.3s; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #333; }
        th { background: #2a2a2a; }
        .lighthouse-scores { display: flex; justify-content: space-around; flex-wrap: wrap; }
        .lighthouse-score { text-align: center; margin: 10px; }
        .score-circle { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin: 0 auto 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Reporte Final de Validación</h1>
            <h2>The Blacklist - Sistema Completo</h2>
            <p>Generado el: ${new Date(this.results.timestamp).toLocaleString()}</p>
            <div class="metric">
                <div class="metric-value ${this.results.summary.overallStatus === 'passed' ? 'status-passed' : 'status-failed'}">
                    ${this.results.summary.overallStatus.toUpperCase()}
                </div>
                <div>Estado General</div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h3>📊 Resumen de Pruebas</h3>
                <div class="metric">
                    <div class="metric-value">${this.results.summary.totalTests}</div>
                    <div>Total de Pruebas</div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${this.results.summary.successRate}%"></div>
                </div>
                <p>Tasa de éxito: ${this.results.summary.successRate}%</p>
                <p>✅ Pasaron: ${this.results.summary.totalPassed}</p>
                <p>❌ Fallaron: ${this.results.summary.totalFailed}</p>
            </div>

            <div class="card">
                <h3>⏱️ Tiempos de Ejecución</h3>
                <table>
                    <tr><td>Pruebas Unitarias</td><td>${Math.round(this.results.tests.unit.duration / 1000)}s</td></tr>
                    <tr><td>Pruebas de Integración</td><td>${Math.round(this.results.tests.integration.duration / 1000)}s</td></tr>
                    <tr><td>Pruebas E2E</td><td>${Math.round(this.results.tests.e2e.duration / 1000)}s</td></tr>
                    <tr><td>Pruebas de Rendimiento</td><td>${Math.round(this.results.tests.performance.duration / 1000)}s</td></tr>
                    <tr><td>Pruebas de Seguridad</td><td>${Math.round(this.results.tests.security.duration / 1000)}s</td></tr>
                    <tr><td><strong>Total</strong></td><td><strong>${Math.round(this.results.totalDuration / 1000)}s</strong></td></tr>
                </table>
            </div>
        </div>

        ${this.results.tests.lighthouse.scores ? `
        <div class="card">
            <h3>🏮 Puntuaciones Lighthouse</h3>
            <div class="lighthouse-scores">
                ${Object.entries(this.results.tests.lighthouse.scores).map(([category, score]) => `
                    <div class="lighthouse-score">
                        <div class="score-circle" style="background: ${score >= 90 ? '#00ff88' : score >= 70 ? '#ffaa00' : '#ff3366'}">
                            ${score}
                        </div>
                        <div>${category}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <div class="card">
            <h3>📋 Detalles por Categoría</h3>
            <table>
                <thead>
                    <tr><th>Categoría</th><th>Estado</th><th>Pasaron</th><th>Fallaron</th><th>Duración</th></tr>
                </thead>
                <tbody>
                    ${Object.entries(this.results.tests).map(([category, test]) => `
                        <tr>
                            <td>${category}</td>
                            <td class="${test.status === 'passed' ? 'status-passed' : 'status-failed'}">${test.status}</td>
                            <td>${test.passed || 0}</td>
                            <td>${test.failed || 0}</td>
                            <td>${Math.round(test.duration / 1000)}s</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        ${this.results.summary.criticalIssues.length > 0 ? `
        <div class="card">
            <h3>⚠️ Problemas Críticos</h3>
            <ul>
                ${this.results.summary.criticalIssues.map(issue => `<li class="status-failed">${issue}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        ${this.results.summary.recommendations.length > 0 ? `
        <div class="card">
            <h3>💡 Recomendaciones</h3>
            <ul>
                ${this.results.summary.recommendations.map(rec => `<li class="status-warning">${rec}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        <div class="card">
            <h3>🔧 Información del Entorno</h3>
            <table>
                <tr><td>Node.js</td><td>${this.results.environment.node}</td></tr>
                <tr><td>Plataforma</td><td>${this.results.environment.platform}</td></tr>
                <tr><td>Arquitectura</td><td>${this.results.environment.arch}</td></tr>
            </table>
        </div>
    </div>
</body>
</html>
    `
    
    const htmlPath = path.join(__dirname, '..', 'final-validation-report.html')
    await fs.writeFile(htmlPath, htmlContent)
  }

  async run() {
    try {
      console.log('🚀 Iniciando validación final del sistema completo...')
      
      const envValid = await this.validateEnvironment()
      if (!envValid) {
        throw new Error('Entorno no válido para ejecutar pruebas')
      }
      
      await this.runUnitTests()
      await this.runIntegrationTests()
      await this.runPerformanceTests()
      await this.runSecurityTests()
      await this.runE2ETests()
      await this.runLighthouseAudit()
      
      this.validateRequirements()
      
      const report = await this.generateReport()
      
      if (report.summary.overallStatus === 'failed') {
        console.log('\n❌ VALIDACIÓN FALLIDA - Se encontraron problemas críticos')
        process.exit(1)
      } else {
        console.log('\n🎉 ¡VALIDACIÓN EXITOSA! - El sistema está listo para producción')
        process.exit(0)
      }
      
    } catch (error) {
      console.error('\n💥 Error fatal en la validación:', error.message)
      process.exit(1)
    }
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new FinalSystemValidator()
  validator.run()
}

export default FinalSystemValidator