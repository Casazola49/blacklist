#!/usr/bin/env node

import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class IntegrationTestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, duration: 0 },
      integration: { passed: 0, failed: 0, duration: 0 },
      e2e: { passed: 0, failed: 0, duration: 0 },
      performance: { passed: 0, failed: 0, duration: 0 },
      security: { passed: 0, failed: 0, duration: 0 },
      lighthouse: { score: 0, duration: 0 }
    }
    this.startTime = Date.now()
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      console.log(`\n🚀 Ejecutando: ${command} ${args.join(' ')}`)
      
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
        console.log(output)
      })

      process.stderr.on('data', (data) => {
        const output = data.toString()
        stderr += output
        console.error(output)
      })

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code })
        } else {
          reject(new Error(`Comando falló con código ${code}: ${stderr}`))
        }
      })

      process.on('error', (error) => {
        reject(error)
      })
    })
  }

  async checkPrerequisites() {
    console.log('🔍 Verificando prerequisitos...')
    
    try {
      // Verificar que Node.js esté instalado
      await this.runCommand('node', ['--version'])
      
      // Verificar que npm esté instalado
      await this.runCommand('npm', ['--version'])
      
      // Verificar que las dependencias estén instaladas
      const packageJsonPath = path.join(__dirname, '..', 'package.json')
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
      
      console.log(`📦 Proyecto: ${packageJson.name} v${packageJson.version}`)
      
      // Verificar que Firebase esté configurado
      const firebaseConfigPath = path.join(__dirname, '..', 'firebase.json')
      try {
        await fs.access(firebaseConfigPath)
        console.log('✅ Configuración de Firebase encontrada')
      } catch {
        console.warn('⚠️  Configuración de Firebase no encontrada')
      }

      console.log('✅ Prerequisitos verificados')
    } catch (error) {
      console.error('❌ Error verificando prerequisitos:', error.message)
      throw error
    }
  }

  async runUnitTests() {
    console.log('\n📋 Ejecutando pruebas unitarias...')
    const startTime = Date.now()
    
    try {
      const result = await this.runCommand('npm', ['run', 'test:unit'])
      
      // Parsear resultados de Vitest
      const output = result.stdout
      const passedMatch = output.match(/(\d+) passed/)
      const failedMatch = output.match(/(\d+) failed/)
      
      this.results.unit.passed = passedMatch ? parseInt(passedMatch[1]) : 0
      this.results.unit.failed = failedMatch ? parseInt(failedMatch[1]) : 0
      this.results.unit.duration = Date.now() - startTime
      
      console.log(`✅ Pruebas unitarias completadas: ${this.results.unit.passed} pasaron, ${this.results.unit.failed} fallaron`)
    } catch (error) {
      console.error('❌ Error en pruebas unitarias:', error.message)
      this.results.unit.failed = 1
      this.results.unit.duration = Date.now() - startTime
    }
  }

  async runIntegrationTests() {
    console.log('\n🔗 Ejecutando pruebas de integración...')
    const startTime = Date.now()
    
    try {
      const result = await this.runCommand('npm', ['run', 'test:integration'])
      
      const output = result.stdout
      const passedMatch = output.match(/(\d+) passed/)
      const failedMatch = output.match(/(\d+) failed/)
      
      this.results.integration.passed = passedMatch ? parseInt(passedMatch[1]) : 0
      this.results.integration.failed = failedMatch ? parseInt(failedMatch[1]) : 0
      this.results.integration.duration = Date.now() - startTime
      
      console.log(`✅ Pruebas de integración completadas: ${this.results.integration.passed} pasaron, ${this.results.integration.failed} fallaron`)
    } catch (error) {
      console.error('❌ Error en pruebas de integración:', error.message)
      this.results.integration.failed = 1
      this.results.integration.duration = Date.now() - startTime
    }
  }

  async runPerformanceTests() {
    console.log('\n⚡ Ejecutando pruebas de rendimiento...')
    const startTime = Date.now()
    
    try {
      const result = await this.runCommand('npm', ['run', 'test:performance'])
      
      const output = result.stdout
      const passedMatch = output.match(/(\d+) passed/)
      const failedMatch = output.match(/(\d+) failed/)
      
      this.results.performance.passed = passedMatch ? parseInt(passedMatch[1]) : 0
      this.results.performance.failed = failedMatch ? parseInt(failedMatch[1]) : 0
      this.results.performance.duration = Date.now() - startTime
      
      console.log(`✅ Pruebas de rendimiento completadas: ${this.results.performance.passed} pasaron, ${this.results.performance.failed} fallaron`)
    } catch (error) {
      console.error('❌ Error en pruebas de rendimiento:', error.message)
      this.results.performance.failed = 1
      this.results.performance.duration = Date.now() - startTime
    }
  }

  async runSecurityTests() {
    console.log('\n🔒 Ejecutando pruebas de seguridad...')
    const startTime = Date.now()
    
    try {
      const result = await this.runCommand('npm', ['run', 'test:security'])
      
      const output = result.stdout
      const passedMatch = output.match(/(\d+) passed/)
      const failedMatch = output.match(/(\d+) failed/)
      
      this.results.security.passed = passedMatch ? parseInt(passedMatch[1]) : 0
      this.results.security.failed = failedMatch ? parseInt(failedMatch[1]) : 0
      this.results.security.duration = Date.now() - startTime
      
      console.log(`✅ Pruebas de seguridad completadas: ${this.results.security.passed} pasaron, ${this.results.security.failed} fallaron`)
    } catch (error) {
      console.error('❌ Error en pruebas de seguridad:', error.message)
      this.results.security.failed = 1
      this.results.security.duration = Date.now() - startTime
    }
  }

  async runE2ETests() {
    console.log('\n🎭 Ejecutando pruebas end-to-end...')
    const startTime = Date.now()
    
    try {
      // Primero construir la aplicación
      console.log('🏗️  Construyendo aplicación para E2E...')
      await this.runCommand('npm', ['run', 'build'])
      
      // Iniciar servidor de preview
      console.log('🚀 Iniciando servidor de preview...')
      const serverProcess = spawn('npm', ['run', 'preview'], {
        stdio: 'pipe',
        shell: true,
        detached: true
      })

      // Esperar a que el servidor esté listo
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      try {
        const result = await this.runCommand('npm', ['run', 'test:e2e'])
        
        const output = result.stdout
        const passedMatch = output.match(/(\d+) passing/)
        const failedMatch = output.match(/(\d+) failing/)
        
        this.results.e2e.passed = passedMatch ? parseInt(passedMatch[1]) : 0
        this.results.e2e.failed = failedMatch ? parseInt(failedMatch[1]) : 0
        this.results.e2e.duration = Date.now() - startTime
        
        console.log(`✅ Pruebas E2E completadas: ${this.results.e2e.passed} pasaron, ${this.results.e2e.failed} fallaron`)
      } finally {
        // Terminar servidor
        if (serverProcess.pid) {
          process.kill(-serverProcess.pid)
        }
      }
    } catch (error) {
      console.error('❌ Error en pruebas E2E:', error.message)
      this.results.e2e.failed = 1
      this.results.e2e.duration = Date.now() - startTime
    }
  }

  async runLighthouseAudit() {
    console.log('\n🏮 Ejecutando auditoría de Lighthouse...')
    const startTime = Date.now()
    
    try {
      // Construir y servir la aplicación
      await this.runCommand('npm', ['run', 'build'])
      
      const serverProcess = spawn('npm', ['run', 'preview'], {
        stdio: 'pipe',
        shell: true,
        detached: true
      })

      // Esperar a que el servidor esté listo
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      try {
        const result = await this.runCommand('npm', ['run', 'lighthouse:ci'])
        
        // Leer el archivo de resultados de Lighthouse
        const lighthouseResultPath = path.join(__dirname, '..', 'lighthouse-ci.json')
        try {
          const lighthouseData = JSON.parse(await fs.readFile(lighthouseResultPath, 'utf-8'))
          this.results.lighthouse.score = Math.round(lighthouseData.categories.performance.score * 100)
        } catch {
          this.results.lighthouse.score = 0
        }
        
        this.results.lighthouse.duration = Date.now() - startTime
        
        console.log(`✅ Auditoría de Lighthouse completada: Puntuación ${this.results.lighthouse.score}/100`)
      } finally {
        // Terminar servidor
        if (serverProcess.pid) {
          process.kill(-serverProcess.pid)
        }
      }
    } catch (error) {
      console.error('❌ Error en auditoría de Lighthouse:', error.message)
      this.results.lighthouse.score = 0
      this.results.lighthouse.duration = Date.now() - startTime
    }
  }

  async generateReport() {
    const totalDuration = Date.now() - this.startTime
    const totalTests = Object.values(this.results).reduce((sum, result) => 
      sum + (result.passed || 0) + (result.failed || 0), 0
    )
    const totalPassed = Object.values(this.results).reduce((sum, result) => 
      sum + (result.passed || 0), 0
    )
    const totalFailed = Object.values(this.results).reduce((sum, result) => 
      sum + (result.failed || 0), 0
    )

    const report = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      summary: {
        total: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        successRate: totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0
      },
      details: this.results,
      status: totalFailed === 0 ? 'PASSED' : 'FAILED'
    }

    // Guardar reporte en archivo
    const reportPath = path.join(__dirname, '..', 'integration-test-report.json')
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))

    // Mostrar resumen en consola
    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMEN DE PRUEBAS DE INTEGRACIÓN')
    console.log('='.repeat(60))
    console.log(`⏱️  Duración total: ${Math.round(totalDuration / 1000)}s`)
    console.log(`📋 Total de pruebas: ${totalTests}`)
    console.log(`✅ Pasaron: ${totalPassed}`)
    console.log(`❌ Fallaron: ${totalFailed}`)
    console.log(`📈 Tasa de éxito: ${report.summary.successRate}%`)
    console.log(`🏮 Puntuación Lighthouse: ${this.results.lighthouse.score}/100`)
    
    console.log('\n📋 Detalles por categoría:')
    Object.entries(this.results).forEach(([category, result]) => {
      if (category === 'lighthouse') {
        console.log(`  ${category}: ${result.score}/100 (${Math.round(result.duration / 1000)}s)`)
      } else {
        const total = result.passed + result.failed
        console.log(`  ${category}: ${result.passed}/${total} (${Math.round(result.duration / 1000)}s)`)
      }
    })

    console.log(`\n📄 Reporte completo guardado en: ${reportPath}`)
    console.log(`\n🎯 Estado final: ${report.status}`)
    
    return report
  }

  async run() {
    try {
      console.log('🚀 Iniciando suite completa de pruebas de integración...')
      
      await this.checkPrerequisites()
      await this.runUnitTests()
      await this.runIntegrationTests()
      await this.runPerformanceTests()
      await this.runSecurityTests()
      await this.runE2ETests()
      await this.runLighthouseAudit()
      
      const report = await this.generateReport()
      
      // Salir con código de error si hay fallos
      if (report.status === 'FAILED') {
        process.exit(1)
      }
      
      console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!')
      
    } catch (error) {
      console.error('\n💥 Error fatal en la suite de pruebas:', error.message)
      process.exit(1)
    }
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new IntegrationTestRunner()
  runner.run()
}

export default IntegrationTestRunner