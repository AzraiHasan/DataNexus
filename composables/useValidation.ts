// composables/useValidation.ts
import type { ValidationError, ValidationResult } from '~/types/validation'
// Import PapaParse properly with type definition
import Papa from 'papaparse';

interface ValidationOptions {
  dataType: 'tower' | 'contract' | 'landlord' | 'payment';
  fileType?: 'csv' | 'xlsx' | 'xls';
}

export const useValidation = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Validate file contents
  const validateFile = async (
    fileContent: string, 
    options: ValidationOptions
  ): Promise<ValidationResult> => {
    loading.value = true;
    error.value = null;
    
    try {
      // Choose validation strategy based on dataType
      switch (options.dataType) {
        case 'tower':
          return validateTowerData(fileContent);
        case 'contract':
          return validateContractData(fileContent);
        case 'landlord':
          return validateLandlordData(fileContent);
        case 'payment':
          return validatePaymentData(fileContent);
        default:
          throw new Error(`Unsupported data type: ${options.dataType}`);
      }
    } catch (err: any) {
      error.value = err.message;
      return {
        valid: false,
        errors: [{
          row: 0,
          column: '',
          message: err.message,
          severity: 'critical'
        }]
      };
    } finally {
      loading.value = false;
    }
  };
  
  // Enhanced validateTowerData function
const validateTowerData = (fileContent: string): ValidationResult => {
  const errors: ValidationError[] = [];
  let validRowCount = 0;
  
  // Parse CSV content
  const parsedData = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  
  // Extract headers and data rows
  const headers = parsedData.meta.fields || [];
  const rows = parsedData.data as any[];
  
  // Check for required columns
  const requiredColumns = ['tower_id', 'latitude', 'longitude'];
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  
  if (missingColumns.length > 0) {
    errors.push({
      row: 0,
      column: '',
      message: `Missing required columns: ${missingColumns.join(', ')}`,
      severity: 'critical'
    });
  }
  
  // Validate each row
  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 because row 1 is headers, and we're 0-indexed
    let rowValid = true;
    
    // Validate tower_id (required, alphanumeric)
    if (!row.tower_id) {
      errors.push({
        row: rowNum,
        column: 'tower_id',
        message: 'Tower ID is required',
        severity: 'critical'
      });
      rowValid = false;
    } else if (!/^[a-zA-Z0-9-_]+$/.test(row.tower_id)) {
      errors.push({
        row: rowNum,
        column: 'tower_id',
        message: 'Tower ID must contain only alphanumeric characters, hyphens, and underscores',
        severity: 'major'
      });
      rowValid = false;
    }
    
    // Validate latitude (between -90 and 90)
    if (row.latitude !== undefined && row.latitude !== null) {
      const lat = Number(row.latitude);
      if (isNaN(lat)) {
        errors.push({
          row: rowNum,
          column: 'latitude',
          message: 'Latitude must be a number',
          severity: 'major'
        });
        rowValid = false;
      } else if (lat < -90 || lat > 90) {
        errors.push({
          row: rowNum,
          column: 'latitude',
          message: 'Latitude must be between -90 and 90',
          severity: 'major'
        });
        rowValid = false;
      }
    }
    
    // Validate longitude (between -180 and 180)
    if (row.longitude !== undefined && row.longitude !== null) {
      const lng = Number(row.longitude);
      if (isNaN(lng)) {
        errors.push({
          row: rowNum,
          column: 'longitude',
          message: 'Longitude must be a number',
          severity: 'major'
        });
        rowValid = false;
      } else if (lng < -180 || lng > 180) {
        errors.push({
          row: rowNum,
          column: 'longitude',
          message: 'Longitude must be between -180 and 180',
          severity: 'major'
        });
        rowValid = false;
      }
    }
    
    // Validate height (positive number if present)
    if (row.height !== undefined && row.height !== null && row.height !== '') {
      const height = Number(row.height);
      if (isNaN(height)) {
        errors.push({
          row: rowNum,
          column: 'height',
          message: 'Height must be a number',
          severity: 'major'
        });
        rowValid = false;
      } else if (height <= 0) {
        errors.push({
          row: rowNum,
          column: 'height',
          message: 'Height must be a positive number',
          severity: 'major'
        });
        rowValid = false;
      }
    }
    
    // Validate status (enum values if present)
    if (row.status && typeof row.status === 'string') {
      const validStatuses = ['active', 'inactive', 'maintenance', 'planned'];
      if (!validStatuses.includes(row.status.toLowerCase())) {
        errors.push({
          row: rowNum,
          column: 'status',
          message: `Status must be one of: ${validStatuses.join(', ')}`,
          severity: 'minor'
        });
        rowValid = false;
      }
    }
    
    if (rowValid) {
      validRowCount++;
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    summary: {
      total: rows.length,
      valid: validRowCount,
      invalid: rows.length - validRowCount
    }
  };
};
  
  // These are basic stub implementations - we'll expand them later
  const validateContractData = (fileContent: string): ValidationResult => {
  const errors: ValidationError[] = [];
  let validRowCount = 0;
  
  // Parse CSV content
  const parsedData = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  
  // Extract headers and data rows
  const headers = parsedData.meta.fields || [];
  const rows = parsedData.data as any[];
  
  // Check for required columns
  const requiredColumns = ['contract_id', 'start_date', 'end_date', 'monthly_rate'];
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  
  if (missingColumns.length > 0) {
    errors.push({
      row: 0,
      column: '',
      message: `Missing required columns: ${missingColumns.join(', ')}`,
      severity: 'critical'
    });
  }
  
  // Validate each row
  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 because row 1 is headers, and we're 0-indexed
    let rowValid = true;
    
    // Validate contract_id (required)
    if (!row.contract_id) {
      errors.push({
        row: rowNum,
        column: 'contract_id',
        message: 'Contract ID is required',
        severity: 'critical'
      });
      rowValid = false;
    }
    
    // Validate dates (start_date must be before end_date)
    if (row.start_date && row.end_date) {
      const startDate = new Date(row.start_date);
      const endDate = new Date(row.end_date);
      
      if (isNaN(startDate.getTime())) {
        errors.push({
          row: rowNum,
          column: 'start_date',
          message: 'Start date is invalid',
          severity: 'major'
        });
        rowValid = false;
      }
      
      if (isNaN(endDate.getTime())) {
        errors.push({
          row: rowNum,
          column: 'end_date',
          message: 'End date is invalid',
          severity: 'major'
        });
        rowValid = false;
      }
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate >= endDate) {
        errors.push({
          row: rowNum,
          column: 'end_date',
          message: 'End date must be after start date',
          severity: 'major'
        });
        rowValid = false;
      }
    }
    
    // Validate monthly_rate (must be positive)
    if (row.monthly_rate !== undefined && row.monthly_rate !== null) {
      const rate = Number(row.monthly_rate);
      if (isNaN(rate)) {
        errors.push({
          row: rowNum,
          column: 'monthly_rate',
          message: 'Monthly rate must be a number',
          severity: 'major'
        });
        rowValid = false;
      } else if (rate <= 0) {
        errors.push({
          row: rowNum,
          column: 'monthly_rate',
          message: 'Monthly rate must be positive',
          severity: 'major'
        });
        rowValid = false;
      }
    }
    
    // Validate status (enum values if present)
    if (row.status && typeof row.status === 'string') {
      const validStatuses = ['active', 'expired', 'pending', 'terminated'];
      if (!validStatuses.includes(row.status.toLowerCase())) {
        errors.push({
          row: rowNum,
          column: 'status',
          message: `Status must be one of: ${validStatuses.join(', ')}`,
          severity: 'minor'
        });
        rowValid = false;
      }
    }
    
    // Validate currency if present
    if (row.currency && typeof row.currency === 'string') {
      // Simple currency validation - check if it's a 3-letter code
      if (!/^[A-Z]{3}$/.test(row.currency.toUpperCase())) {
        errors.push({
          row: rowNum,
          column: 'currency',
          message: 'Currency should be a 3-letter code (e.g., USD)',
          severity: 'minor'
        });
        // This is not critical, so we don't set rowValid = false
      }
    }
    
    if (rowValid) {
      validRowCount++;
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    summary: {
      total: rows.length,
      valid: validRowCount,
      invalid: rows.length - validRowCount
    }
  };
};
  
  const validateLandlordData = (fileContent: string): ValidationResult => {
  const errors: ValidationError[] = [];
  let validRowCount = 0;
  
  // Parse CSV content
  const parsedData = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  
  // Extract headers and data rows
  const headers = parsedData.meta.fields || [];
  const rows = parsedData.data as any[];
  
  // Check for required columns
  const requiredColumns = ['landlord_id', 'name'];
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  
  if (missingColumns.length > 0) {
    errors.push({
      row: 0,
      column: '',
      message: `Missing required columns: ${missingColumns.join(', ')}`,
      severity: 'critical'
    });
  }
  
  // Check if at least one contact method is present in headers
  const hasContactColumns = ['email', 'phone'].some(col => headers.includes(col));
  if (!hasContactColumns) {
    errors.push({
      row: 0,
      column: '',
      message: 'At least one contact method (email or phone) column must be included',
      severity: 'major'
    });
  }
  
  // Validate each row
  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 because row 1 is headers, and we're 0-indexed
    let rowValid = true;
    
    // Validate landlord_id (required)
    if (!row.landlord_id) {
      errors.push({
        row: rowNum,
        column: 'landlord_id',
        message: 'Landlord ID is required',
        severity: 'critical'
      });
      rowValid = false;
    }
    
    // Validate name (required)
    if (!row.name) {
      errors.push({
        row: rowNum,
        column: 'name',
        message: 'Landlord name is required',
        severity: 'critical'
      });
      rowValid = false;
    }
    
    // Validate contact information (must have either email or phone)
    const hasEmail = row.email && row.email.toString().trim() !== '';
    const hasPhone = row.phone && row.phone.toString().trim() !== '';
    
    if (!hasEmail && !hasPhone) {
      errors.push({
        row: rowNum,
        column: 'email/phone',
        message: 'At least one contact method (email or phone) must be provided',
        severity: 'major'
      });
      rowValid = false;
    }
    
    // Validate email format if present
    if (hasEmail && !/^\S+@\S+\.\S+$/.test(row.email.toString())) {
      errors.push({
        row: rowNum,
        column: 'email',
        message: 'Email format is invalid',
        severity: 'minor'
      });
      // Not critical enough to invalidate the row
    }
    
    // Validate phone format if present (simple check)
    if (hasPhone && !/^[0-9+\-() .]+$/.test(row.phone.toString())) {
      errors.push({
        row: rowNum,
        column: 'phone',
        message: 'Phone number format is invalid',
        severity: 'minor'
      });
      // Not critical enough to invalidate the row
    }
    
    if (rowValid) {
      validRowCount++;
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    summary: {
      total: rows.length,
      valid: validRowCount,
      invalid: rows.length - validRowCount
    }
  };
};
  
  const validatePaymentData = (fileContent: string): ValidationResult => {
  const errors: ValidationError[] = [];
  let validRowCount = 0;
  
  // Parse CSV content
  const parsedData = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  
  // Extract headers and data rows
  const headers = parsedData.meta.fields || [];
  const rows = parsedData.data as any[];
  
  // Check for required columns
  const requiredColumns = ['contract_id', 'payment_date', 'amount', 'status'];
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  
  if (missingColumns.length > 0) {
    errors.push({
      row: 0,
      column: '',
      message: `Missing required columns: ${missingColumns.join(', ')}`,
      severity: 'critical'
    });
  }
  
  // Get current date for validation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Validate each row
  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 because row 1 is headers, and we're 0-indexed
    let rowValid = true;
    
    // Validate contract_id (required)
    if (!row.contract_id) {
      errors.push({
        row: rowNum,
        column: 'contract_id',
        message: 'Contract ID is required',
        severity: 'critical'
      });
      rowValid = false;
    }
    
    // Validate payment_date (not in future)
    if (row.payment_date) {
      const paymentDate = new Date(row.payment_date);
      
      if (isNaN(paymentDate.getTime())) {
        errors.push({
          row: rowNum,
          column: 'payment_date',
          message: 'Payment date is invalid',
          severity: 'major'
        });
        rowValid = false;
      } else if (paymentDate > today) {
        errors.push({
          row: rowNum,
          column: 'payment_date',
          message: 'Payment date cannot be in the future',
          severity: 'major'
        });
        rowValid = false;
      }
    } else {
      errors.push({
        row: rowNum,
        column: 'payment_date',
        message: 'Payment date is required',
        severity: 'critical'
      });
      rowValid = false;
    }
    
    // Validate amount (must be positive)
    if (row.amount !== undefined && row.amount !== null) {
      const amount = Number(row.amount);
      if (isNaN(amount)) {
        errors.push({
          row: rowNum,
          column: 'amount',
          message: 'Amount must be a number',
          severity: 'major'
        });
        rowValid = false;
      } else if (amount <= 0) {
        errors.push({
          row: rowNum,
          column: 'amount',
          message: 'Amount must be positive',
          severity: 'major'
        });
        rowValid = false;
      }
    } else {
      errors.push({
        row: rowNum,
        column: 'amount',
        message: 'Amount is required',
        severity: 'critical'
      });
      rowValid = false;
    }
    
    // Validate status (enum values)
    if (row.status && typeof row.status === 'string') {
      const validStatuses = ['scheduled', 'processed', 'failed', 'cancelled'];
      if (!validStatuses.includes(row.status.toLowerCase())) {
        errors.push({
          row: rowNum,
          column: 'status',
          message: `Status must be one of: ${validStatuses.join(', ')}`,
          severity: 'major'
        });
        rowValid = false;
      }
    } else {
      errors.push({
        row: rowNum,
        column: 'status',
        message: 'Status is required',
        severity: 'critical'
      });
      rowValid = false;
    }
    
    if (rowValid) {
      validRowCount++;
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    summary: {
      total: rows.length,
      valid: validRowCount,
      invalid: rows.length - validRowCount
    }
  };
};
  
  return {
    loading,
    error,
    validateFile
  };
};