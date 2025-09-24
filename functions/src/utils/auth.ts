export interface AuthContext {
  auth: {
    uid: string
    token: {
      email?: string
      email_verified?: boolean
      admin?: boolean
    }
  } | null
}

export interface AuthValidationResult {
  isValid: boolean
  uid?: string
  error?: string
}

export interface AdminValidationResult {
  isAdmin: boolean
  uid?: string
  error?: string
}

export function validateAuthentication(context: AuthContext): AuthValidationResult {
  if (!context.auth) {
    return {
      isValid: false,
      error: 'unauthenticated'
    }
  }

  if (!context.auth.token.email_verified) {
    return {
      isValid: false,
      error: 'email-not-verified'
    }
  }

  return {
    isValid: true,
    uid: context.auth.uid
  }
}

export function validateAdminAccess(context: AuthContext): AdminValidationResult {
  const authResult = validateAuthentication(context)
  
  if (!authResult.isValid) {
    return {
      isAdmin: false,
      error: authResult.error
    }
  }

  if (!context.auth?.token.admin) {
    return {
      isAdmin: false,
      error: 'insufficient-permissions'
    }
  }

  return {
    isAdmin: true,
    uid: context.auth.uid
  }
}