import { execSync } from 'child_process'

export interface LighthouseResult {
  lhr: {
    categories: {
      performance: { score: number }
      accessibility: { score: number }
      'best-practices': { score: number }
      seo: { score: number }
      pwa: { score: number }
    }
    audits: {
      [key: string]: {
        score: number
        numericValue?: number
        displayValue?: string
        details?: any
      }
    }
    configSettings?: {
      emulatedFormFactor?: string
    }
  }
}

export interface PerformanceThresholds {
  performance: number
  accessibility: number
  'best-practices': number
  seo: number
  pwa: number
}

export interface ValidationResult {
  passed: boolean
  failures: string[]
  scores: Record<string, number>
}

export async function runLighthouseAudit(url: string): Promise<LighthouseResult> {
  try {
    const command = `lighthouse ${url} --output json --chrome-flags="--headless" --quiet`
    const output = execSync(command, { encoding: 'utf8' })
    return JSON.parse(output)
  } catch (error) {
    throw new Error(`Lighthouse audit failed: ${error}`)
  }
}

export function validatePerformanceThresholds(
  result: LighthouseResult,
  thresholds: PerformanceThresholds = {
    performance: 90,
    accessibility: 95,
    'best-practices': 90,
    seo: 90,
    pwa: 90
  }
): ValidationResult {
  const failures: string[] = []
  const scores: Record<string, number> = {}

  // Check category scores
  Object.entries(thresholds).forEach(([category, threshold]) => {
    const score = result.lhr.categories[category as keyof typeof result.lhr.categories]?.score * 100
    scores[category] = score

    if (score < threshold) {
      failures.push(`${category}-score`)
    }
  })

  // Check Core Web Vitals
  const lcp = result.lhr.audits['largest-contentful-paint']?.numericValue
  if (lcp && lcp > 2500) {
    failures.push('lcp-threshold')
  }

  const fid = result.lhr.audits['first-input-delay']?.numericValue
  if (fid && fid > 100) {
    failures.push('fid-threshold')
  }

  const cls = result.lhr.audits['cumulative-layout-shift']?.numericValue
  if (cls && cls > 0.1) {
    failures.push('cls-threshold')
  }

  return {
    passed: failures.length === 0,
    failures,
    scores
  }
}

export async function validatePWARequirements(url: string) {
  const result = await runLighthouseAudit(url)
  const pwaAudits = result.lhr.audits

  return {
    isPWA: result.lhr.categories.pwa.score > 0.9,
    hasManifest: pwaAudits['installable-manifest']?.score === 1,
    hasServiceWorker: pwaAudits['service-worker']?.score === 1,
    worksOffline: pwaAudits['works-offline']?.score === 1,
    isInstallable: pwaAudits['installable-manifest']?.details?.items?.[0]?.hasStartUrl === true
  }
}

export async function validateAccessibility(url: string) {
  const result = await runLighthouseAudit(url)
  const a11yScore = result.lhr.categories.accessibility.score

  const criticalIssues = Object.entries(result.lhr.audits)
    .filter(([key, audit]) => 
      key.includes('color-contrast') || 
      key.includes('heading-order') || 
      key.includes('alt-text')
    )
    .filter(([, audit]) => audit.score < 1)
    .map(([key]) => key)

  return {
    score: a11yScore,
    criticalIssues,
    wcagCompliant: a11yScore > 0.95 && criticalIssues.length === 0
  }
}

export async function validateSEO(url: string) {
  const result = await runLighthouseAudit(url)
  const seoAudits = result.lhr.audits

  return {
    score: result.lhr.categories.seo.score,
    hasTitle: seoAudits['document-title']?.score === 1,
    hasMetaDescription: seoAudits['meta-description']?.score === 1,
    isCrawlable: seoAudits['is-crawlable']?.score === 1
  }
}

export async function validateBestPractices(url: string) {
  const result = await runLighthouseAudit(url)
  const bestPracticesAudits = result.lhr.audits

  return {
    score: result.lhr.categories['best-practices'].score,
    usesHTTPS: bestPracticesAudits['uses-https']?.score === 1,
    noVulnerableLibraries: bestPracticesAudits['no-vulnerable-libraries']?.score === 1,
    followsSecurityBestPractices: bestPracticesAudits['uses-https']?.score === 1 && 
                                  bestPracticesAudits['no-vulnerable-libraries']?.score === 1
  }
}

export async function checkPerformanceBudget(url: string, budget: {
  totalSize: number
  scriptSize: number
  stylesheetSize: number
  imageSize: number
  fontSize: number
}) {
  const result = await runLighthouseAudit(url)
  const resourceSummary = result.lhr.audits['resource-summary']?.details?.items || []

  const sizes = resourceSummary.reduce((acc: any, item: any) => {
    acc[item.resourceType] = item.transferSize
    return acc
  }, {})

  const totalSize = Object.values(sizes).reduce((sum: number, size: number) => sum + size, 0)
  const violations: string[] = []

  if (totalSize > budget.totalSize) violations.push('total-size')
  if (sizes.script > budget.scriptSize) violations.push('script-size')
  if (sizes.stylesheet > budget.stylesheetSize) violations.push('stylesheet-size')
  if (sizes.image > budget.imageSize) violations.push('image-size')
  if (sizes.font > budget.fontSize) violations.push('font-size')

  return {
    withinBudget: violations.length === 0,
    violations,
    totalSize,
    scriptSize: sizes.script || 0,
    stylesheetSize: sizes.stylesheet || 0,
    imageSize: sizes.image || 0,
    fontSize: sizes.font || 0
  }
}

export async function runMobileAudit(url: string): Promise<LighthouseResult> {
  try {
    const command = `lighthouse ${url} --output json --chrome-flags="--headless" --emulated-form-factor=mobile --quiet`
    const output = execSync(command, { encoding: 'utf8' })
    return JSON.parse(output)
  } catch (error) {
    throw new Error(`Mobile Lighthouse audit failed: ${error}`)
  }
}

export async function runLighthouseCICheck(config: {
  url: string
  thresholds: PerformanceThresholds
  budget: {
    totalSize: number
    scriptSize: number
  }
}) {
  const result = await runLighthouseAudit(config.url)
  const validation = validatePerformanceThresholds(result, config.thresholds)
  const budgetCheck = await checkPerformanceBudget(config.url, {
    ...config.budget,
    stylesheetSize: 50000,
    imageSize: 200000,
    fontSize: 100000
  })

  return {
    passed: validation.passed && budgetCheck.withinBudget,
    scores: validation.scores,
    budgetPassed: budgetCheck.withinBudget,
    violations: [...validation.failures, ...budgetCheck.violations]
  }
}

export async function runComprehensivePWAAudit(url: string) {
  console.log('🔍 Running comprehensive PWA audit...')
  
  const [
    desktopResult,
    mobileResult,
    pwaValidation,
    accessibilityValidation,
    seoValidation,
    bestPracticesValidation
  ] = await Promise.all([
    runLighthouseAudit(url),
    runMobileAudit(url),
    validatePWARequirements(url),
    validateAccessibility(url),
    validateSEO(url),
    validateBestPractices(url)
  ])

  const budgetCheck = await checkPerformanceBudget(url, {
    totalSize: 500000, // 500KB
    scriptSize: 200000, // 200KB
    stylesheetSize: 50000, // 50KB
    imageSize: 300000, // 300KB
    fontSize: 100000 // 100KB
  })

  const report = {
    timestamp: new Date().toISOString(),
    url,
    desktop: {
      performance: desktopResult.lhr.categories.performance.score * 100,
      accessibility: desktopResult.lhr.categories.accessibility.score * 100,
      bestPractices: desktopResult.lhr.categories['best-practices'].score * 100,
      seo: desktopResult.lhr.categories.seo.score * 100,
      pwa: desktopResult.lhr.categories.pwa.score * 100
    },
    mobile: {
      performance: mobileResult.lhr.categories.performance.score * 100,
      accessibility: mobileResult.lhr.categories.accessibility.score * 100,
      bestPractices: mobileResult.lhr.categories['best-practices'].score * 100,
      seo: mobileResult.lhr.categories.seo.score * 100,
      pwa: mobileResult.lhr.categories.pwa.score * 100
    },
    pwa: pwaValidation,
    accessibility: accessibilityValidation,
    seo: seoValidation,
    bestPractices: bestPracticesValidation,
    budget: budgetCheck,
    coreWebVitals: {
      lcp: desktopResult.lhr.audits['largest-contentful-paint']?.numericValue,
      fid: desktopResult.lhr.audits['first-input-delay']?.numericValue,
      cls: desktopResult.lhr.audits['cumulative-layout-shift']?.numericValue,
      fcp: desktopResult.lhr.audits['first-contentful-paint']?.numericValue,
      ttfb: desktopResult.lhr.audits['server-response-time']?.numericValue
    },
    recommendations: generateOptimizationRecommendations(desktopResult, mobileResult, budgetCheck)
  }

  console.log('✅ PWA audit completed')
  return report
}

function generateOptimizationRecommendations(
  desktopResult: LighthouseResult,
  mobileResult: LighthouseResult,
  budgetCheck: any
) {
  const recommendations: string[] = []

  // Performance recommendations
  if (desktopResult.lhr.categories.performance.score < 0.9) {
    recommendations.push('Optimize performance: Consider code splitting, image optimization, and reducing bundle size')
  }

  if (mobileResult.lhr.categories.performance.score < 0.9) {
    recommendations.push('Optimize mobile performance: Focus on mobile-specific optimizations')
  }

  // Core Web Vitals recommendations
  const lcp = desktopResult.lhr.audits['largest-contentful-paint']?.numericValue
  if (lcp && lcp > 2500) {
    recommendations.push('Improve LCP: Optimize images, preload critical resources, reduce server response time')
  }

  const cls = desktopResult.lhr.audits['cumulative-layout-shift']?.numericValue
  if (cls && cls > 0.1) {
    recommendations.push('Improve CLS: Set explicit dimensions for images, reserve space for dynamic content')
  }

  // Budget recommendations
  if (!budgetCheck.withinBudget) {
    if (budgetCheck.violations.includes('total-size')) {
      recommendations.push('Reduce total bundle size: Enable tree shaking, remove unused dependencies')
    }
    if (budgetCheck.violations.includes('script-size')) {
      recommendations.push('Reduce JavaScript size: Implement code splitting, lazy loading')
    }
    if (budgetCheck.violations.includes('image-size')) {
      recommendations.push('Optimize images: Use modern formats (WebP, AVIF), implement responsive images')
    }
  }

  // Accessibility recommendations
  if (desktopResult.lhr.categories.accessibility.score < 0.95) {
    recommendations.push('Improve accessibility: Fix color contrast, add alt text, ensure proper heading structure')
  }

  return recommendations
}