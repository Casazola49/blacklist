/**
 * Sistema de Feature Flags para v2.0
 * Permite habilitar/deshabilitar funcionalidades de forma dinámica
 */

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  environment?: 'development' | 'staging' | 'production' | 'all';
  rolloutPercentage?: number;
}

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Seguridad Avanzada
  TWO_FACTOR_AUTH: {
    key: 'two_factor_auth',
    enabled: false,
    description: 'Autenticación de dos factores',
    environment: 'development'
  },
  
  BIOMETRIC_AUTH: {
    key: 'biometric_auth',
    enabled: false,
    description: 'Autenticación biométrica',
    environment: 'development'
  },

  // Sistema de Pagos
  CRYPTO_PAYMENTS: {
    key: 'crypto_payments',
    enabled: false,
    description: 'Pagos con criptomonedas',
    environment: 'development'
  },

  RECURRING_PAYMENTS: {
    key: 'recurring_payments',
    enabled: false,
    description: 'Pagos recurrentes',
    environment: 'development'
  },

  // Inteligencia Artificial
  AI_CHATBOT: {
    key: 'ai_chatbot',
    enabled: false,
    description: 'Chatbot con IA',
    environment: 'development'
  },

  AI_RECOMMENDATIONS: {
    key: 'ai_recommendations',
    enabled: false,
    description: 'Recomendaciones inteligentes',
    environment: 'development'
  },

  // UI/UX Mejoradas
  DARK_MODE_V2: {
    key: 'dark_mode_v2',
    enabled: true,
    description: 'Modo oscuro mejorado',
    environment: 'all'
  },

  ANIMATIONS_V2: {
    key: 'animations_v2',
    enabled: true,
    description: 'Animaciones mejoradas',
    environment: 'all'
  },

  // Performance
  LAZY_LOADING_V2: {
    key: 'lazy_loading_v2',
    enabled: true,
    description: 'Lazy loading optimizado',
    environment: 'all'
  },

  // Analytics
  ADVANCED_ANALYTICS: {
    key: 'advanced_analytics',
    enabled: false,
    description: 'Analytics avanzados',
    environment: 'staging'
  }
};

class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();
  private environment: string;

  constructor() {
    this.environment = import.meta.env.MODE || 'development';
    this.initializeFlags();
  }

  private initializeFlags(): void {
    Object.values(FEATURE_FLAGS).forEach(flag => {
      this.flags.set(flag.key, flag);
    });
  }

  /**
   * Verifica si una feature flag está habilitada
   */
  isEnabled(flagKey: string): boolean {
    const flag = this.flags.get(flagKey);
    
    if (!flag) {
      console.warn(`Feature flag '${flagKey}' not found`);
      return false;
    }

    // Verificar entorno
    if (flag.environment && flag.environment !== 'all' && flag.environment !== this.environment) {
      return false;
    }

    // Verificar rollout percentage
    if (flag.rolloutPercentage && flag.rolloutPercentage < 100) {
      const userHash = this.getUserHash();
      return (userHash % 100) < flag.rolloutPercentage;
    }

    return flag.enabled;
  }

  /**
   * Habilita una feature flag
   */
  enable(flagKey: string): void {
    const flag = this.flags.get(flagKey);
    if (flag) {
      flag.enabled = true;
      this.flags.set(flagKey, flag);
    }
  }

  /**
   * Deshabilita una feature flag
   */
  disable(flagKey: string): void {
    const flag = this.flags.get(flagKey);
    if (flag) {
      flag.enabled = false;
      this.flags.set(flagKey, flag);
    }
  }

  /**
   * Obtiene todas las flags disponibles
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Obtiene flags habilitadas para el entorno actual
   */
  getEnabledFlags(): FeatureFlag[] {
    return this.getAllFlags().filter(flag => this.isEnabled(flag.key));
  }

  /**
   * Genera un hash simple del usuario para rollout percentage
   */
  private getUserHash(): number {
    const userId = localStorage.getItem('userId') || 'anonymous';
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagService();

// Composable para usar en componentes Vue
export function useFeatureFlags() {
  return {
    isEnabled: (flagKey: string) => featureFlags.isEnabled(flagKey),
    enable: (flagKey: string) => featureFlags.enable(flagKey),
    disable: (flagKey: string) => featureFlags.disable(flagKey),
    getAllFlags: () => featureFlags.getAllFlags(),
    getEnabledFlags: () => featureFlags.getEnabledFlags()
  };
}