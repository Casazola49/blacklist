/**
 * QR Code Generator Service
 * Generates QR codes for payments and other purposes
 */

export interface QRCodeData {
  amount: number
  contractId: string
  reference: string
  expirationDate: Date
}

export class QRGenerator {
  /**
   * Generate QR code data for payment
   */
  static generatePaymentQR(data: QRCodeData): string {
    const payload = {
      type: 'payment',
      amount: data.amount,
      contractId: data.contractId,
      reference: data.reference,
      expires: data.expirationDate.getTime(),
      timestamp: Date.now()
    }

    // In a real implementation, this would generate an actual QR code
    // For now, we'll create a base64 encoded JSON string
    return btoa(JSON.stringify(payload))
  }

  /**
   * Generate visual QR pattern for display
   * This creates a pseudo-random pattern based on the data
   */
  static generateQRPattern(data: string, size: number = 16): boolean[][] {
    const pattern: boolean[][] = []
    const seed = this.hashString(data)
    
    for (let i = 0; i < size; i++) {
      pattern[i] = []
      for (let j = 0; j < size; j++) {
        // Create pseudo-random pattern based on position and seed
        const value = (seed + i * size + j) * 9301 + 49297
        pattern[i][j] = (value % 233280) / 233280 > 0.5
      }
    }

    // Add finder patterns (corners)
    this.addFinderPattern(pattern, 0, 0, size)
    this.addFinderPattern(pattern, 0, size - 7, size)
    this.addFinderPattern(pattern, size - 7, 0, size)

    return pattern
  }

  /**
   * Add QR finder pattern (the squares in corners)
   */
  private static addFinderPattern(pattern: boolean[][], startX: number, startY: number, size: number) {
    if (startX + 7 > size || startY + 7 > size) return

    // Outer border
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6) {
          pattern[startX + i][startY + j] = true
        } else if (i >= 2 && i <= 4 && j >= 2 && j <= 4) {
          pattern[startX + i][startY + j] = true
        } else {
          pattern[startX + i][startY + j] = false
        }
      }
    }
  }

  /**
   * Simple string hash function
   */
  private static hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Validate QR code data
   */
  static validateQRCode(qrCode: string): QRCodeData | null {
    try {
      const payload = JSON.parse(atob(qrCode))
      
      if (payload.type !== 'payment') return null
      if (!payload.amount || !payload.contractId || !payload.reference) return null
      if (payload.expires < Date.now()) return null

      return {
        amount: payload.amount,
        contractId: payload.contractId,
        reference: payload.reference,
        expirationDate: new Date(payload.expires)
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Generate payment URL for mobile apps
   */
  static generatePaymentURL(data: QRCodeData): string {
    const params = new URLSearchParams({
      amount: data.amount.toString(),
      contract: data.contractId,
      ref: data.reference,
      expires: data.expirationDate.getTime().toString()
    })

    return `theblacklist://payment?${params.toString()}`
  }

  /**
   * Generate bank transfer information
   */
  static generateBankTransferInfo(data: QRCodeData): {
    accountNumber: string
    routingNumber: string
    reference: string
    amount: number
    memo: string
  } {
    return {
      accountNumber: '1234567890', // Mock account
      routingNumber: '021000021', // Mock routing
      reference: data.reference,
      amount: data.amount,
      memo: `Contrato ${data.contractId.slice(0, 8)}`
    }
  }
}