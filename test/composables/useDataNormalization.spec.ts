// test/composables/useDataNormalization.spec.ts
import { describe, it, expect } from 'vitest'
import { useDataNormalization } from '../../composables/useDataNormalization'

describe('useDataNormalization', () => {
  describe('normalizeTowerData', () => {
    it('should normalize tower status values', () => {
      const { normalizeTowerData } = useDataNormalization()
      
      const rawData = [
        { tower_id: 'T-001', status: 'active' },
        { tower_id: 'T-002', status: 'INACTIVE' },
        { tower_id: 'T-003', status: 'in-use' },
        { tower_id: 'T-004', status: 'Maintenance' },
        { tower_id: 'T-005', status: 'unknown' }
      ]
      
      const normalizedData = normalizeTowerData(rawData)
      
      expect(normalizedData[0].status).toBe('active')
      expect(normalizedData[1].status).toBe('inactive')
      expect(normalizedData[2].status).toBe('active') // 'in-use' maps to 'active'
      expect(normalizedData[3].status).toBe('maintenance')
      expect(normalizedData[4].status).toBe('active') // Unknown defaults to active
    })

    it('should normalize numeric values', () => {
      const { normalizeTowerData } = useDataNormalization()
      
      const rawData = [
        { tower_id: 'T-001', height: '100' },
        { tower_id: 'T-002', height: '120.5' },
        { tower_id: 'T-003', height: '$150' }, // With currency symbol
        { tower_id: 'T-004', height: '200m' }, // With unit
        { tower_id: 'T-005', height: 250 }     // Already numeric
      ]
      
      const normalizedData = normalizeTowerData(rawData)
      
      expect(normalizedData[0].height).toBe(100)
      expect(normalizedData[1].height).toBe(120.5)
      expect(normalizedData[2].height).toBe(150)
      expect(normalizedData[3].height).toBe(200)
      expect(normalizedData[4].height).toBe(250)
    })
  })
})