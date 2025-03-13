// test/composables/useValidation.spec.ts
import { describe, it, expect } from 'vitest'
import { useValidation } from '../../composables/useValidation'

describe('useValidation', () => {
  // Common test data
  const validTowerData = `tower_id,latitude,longitude,height,status
T-001,42.3601,-71.0589,100,active
T-002,40.7128,-74.0060,120,inactive
T-003,37.7749,-122.4194,80,maintenance`;

  const invalidTowerData = `tower_id,latitude,longitude,height,status
T-001,200,-71.0589,100,active
T-002,40.7128,-74.0060,-120,inactive
T-003,,,-122.4194,80,unknown`;

  describe('validateTowerData', () => {
    it('should validate correct tower data', async () => {
      const { validateFile } = useValidation();
      const result = await validateFile(validTowerData, { dataType: 'tower' });
      
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should identify errors in invalid tower data', async () => {
      const { validateFile } = useValidation();
      const result = await validateFile(invalidTowerData, { dataType: 'tower' });
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Verify we caught the latitude error
      expect(result.errors.some(e => 
        e.column === 'latitude' && 
        e.message.includes('between -90 and 90')
      )).toBe(true);
      
      // Verify we caught the negative height error
      expect(result.errors.some(e => 
        e.column === 'height' && 
        e.message.includes('positive')
      )).toBe(true);
    });
  });
});