// test/unit/composables/useValidation.test.ts
import { describe, it, expect } from 'vitest'
import { useValidation } from '../../../composables/useValidation'
import type { ValidationError } from '../../../types/validation'

describe('useValidation', () => {
  // Tower validation test data
  const validTowerData = `tower_id,latitude,longitude,height,status
T-001,42.3601,-71.0589,100,active
T-002,40.7128,-74.0060,120,inactive
T-003,37.7749,-122.4194,80,maintenance`;

  const invalidTowerData = `tower_id,latitude,longitude,height,status
T-001,200,-71.0589,100,active
T-002,40.7128,-74.0060,-120,inactive
T-003,,,-122.4194,80,unknown`;

  // Contract validation test data
  const validContractData = `contract_id,start_date,end_date,monthly_rate,status,currency
C-001,2023-01-01,2025-01-01,1500,active,USD
C-002,2024-01-15,2029-01-15,2000,active,EUR
C-003,2022-06-01,2027-06-01,1800,pending,USD`;

  const invalidContractData = `contract_id,start_date,end_date,monthly_rate,status,currency
C-001,2025-01-01,2023-01-01,1500,active,USD
,2024-01-15,2029-01-15,-2000,invalid,EU
C-003,invalid-date,2027-06-01,0,pending,USD`;

  // Landlord validation test data
  const validLandlordData = `landlord_id,name,email,phone
L-001,John Smith,john.smith@example.com,+1-555-123-4567
L-002,Jane Doe,jane.doe@example.com,+1-555-987-6543
L-003,Robert Johnson,robert@example.com,+1-555-456-7890`;

  const invalidLandlordData = `landlord_id,name,email,phone
L-001,,invalid-email,
L-002,Jane Doe,,
,Robert Johnson,robert@example.com,+1-555-456-7890`;

  // Payment validation test data
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const validPaymentData = `contract_id,payment_date,amount,status
C-001,${formatDate(yesterday)},1500,processed
C-002,2023-12-15,2000,processed
C-003,2024-01-01,1800,scheduled`;

  const invalidPaymentData = `contract_id,payment_date,amount,status
,${formatDate(yesterday)},1500,processed
C-002,${formatDate(tomorrow)},2000,invalid
C-003,2024-01-01,-1800,`;

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
      expect(result.errors.some((e: ValidationError) => 
        e.column === 'latitude' && 
        e.message.includes('between -90 and 90')
      )).toBe(true);
      
      // Verify we caught the negative height error
      expect(result.errors.some((e: ValidationError) => 
        e.column === 'height' && 
        e.message.includes('positive')
      )).toBe(true);
    });
  });

  describe('validateContractData', () => {
    it('should validate correct contract data', async () => {
      const { validateFile } = useValidation();
      const result = await validateFile(validContractData, { dataType: 'contract' });
      
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should identify errors in invalid contract data', async () => {
      const { validateFile } = useValidation();
      const result = await validateFile(invalidContractData, { dataType: 'contract' });
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Verify we caught the date ordering error
      expect(result.errors.some((e: ValidationError) => 
        e.column === 'end_date' && 
        e.message.includes('must be after start date')
      )).toBe(true);
      
      // Verify we caught the negative monthly rate error
      expect(result.errors.some((e: ValidationError) => 
        e.column === 'monthly_rate' && 
        e.message.includes('must be positive')
      )).toBe(true);

      // Verify we caught the invalid status error
      expect(result.errors.some((e: ValidationError) => 
        e.column === 'status' && 
        e.message.includes('must be one of')
      )).toBe(true);

      // Verify we caught the invalid date error
      expect(result.errors.some((e: ValidationError) => 
        e.column === 'start_date' && 
        e.message.includes('invalid')
      )).toBe(true);
    });
  });

  describe('validateLandlordData', () => {
    it('should validate correct landlord data', async () => {
      const { validateFile } = useValidation();
      const result = await validateFile(validLandlordData, { dataType: 'landlord' });
      
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should identify errors in invalid landlord data', async () => {
      const { validateFile } = useValidation();
      const result = await validateFile(invalidLandlordData, { dataType: 'landlord' });
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Verify we caught the missing name error
      expect(result.errors.some((e: ValidationError) => 
        e.column === 'name' && 
        e.message.includes('required')
      )).toBe(true);
      
      // Verify we caught the invalid email error
      expect(result.errors.some((e: ValidationError) => 
        e.column === 'email' && 
        e.message.includes('invalid')
      )).toBe(true);

      // Verify we caught the missing contact methods error
      expect(result.errors.some((e: ValidationError) => 
        (e.column === 'email/phone' || e.column.includes('contact')) && 
        e.message.includes('must be provided')
      )).toBe(true);

      // Verify we caught the missing landlord_id error
      expect(result.errors.some((e: ValidationError) => 
        e.column === 'landlord_id' && 
        e.message.includes('required')
      )).toBe(true);
    });
  });

  describe('validatePaymentData', () => {
    it('should validate correct payment data', async () => {
      const { validateFile } = useValidation();
      const result = await validateFile(validPaymentData, { dataType: 'payment' });
      
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should identify errors in invalid payment data', async () => {
      const { validateFile } = useValidation();
      const result = await validateFile(invalidPaymentData, { dataType: 'payment' });
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Verify we caught the missing contract_id error
      expect(result.errors.some((e: ValidationError) => 
        e.column === 'contract_id' && 
        e.message.includes('required')
      )).toBe(true);
      
      // Verify we caught the future date error
      expect(result.errors.some((e: ValidationError) => 
        e.column === 'payment_date' && 
        e.message.includes('cannot be in the future')
      )).toBe(true);

      // Verify we caught the negative amount error
      expect(result.errors.some((e: ValidationError) => 
        e.column === 'amount' && 
        e.message.includes('must be positive')
      )).toBe(true);

      // Verify we caught the missing status error
      expect(result.errors.some((e: ValidationError) => 
        e.column === 'status' && 
        e.message.includes('required')
      )).toBe(true);
    });
  });
});
