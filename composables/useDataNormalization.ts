// composables/useDataNormalization.ts
interface NormalizedData {
  [key: string]: any[];
}

interface NormalizationOptions {
  dateFormat?: boolean; // Standardize date formats
  numericValues?: boolean; // Normalize numeric values
  textFields?: boolean; // Sanitize and standardize text
  geoData?: boolean; // Normalize geographic coordinates
}

export const useDataNormalization = () => {
  // Normalize tower data
  const normalizeTowerData = (data: any[], options: NormalizationOptions = {
    dateFormat: true,
    numericValues: true,
    textFields: true,
    geoData: true
  }): any[] => {
    return data.map(row => {
      const normalizedRow = { ...row };
      
      // Normalize status text field
      if (options.textFields && normalizedRow.status) {
        normalizedRow.status = normalizeStatus(normalizedRow.status, 'tower');
      }
      
      // Normalize numeric values
      if (options.numericValues) {
        if (normalizedRow.height !== undefined && normalizedRow.height !== null) {
          normalizedRow.height = normalizeNumeric(normalizedRow.height);
        }
      }
      
      // Normalize geographic coordinates
      if (options.geoData) {
        if (normalizedRow.latitude !== undefined && normalizedRow.latitude !== null) {
          normalizedRow.latitude = normalizeCoordinate(normalizedRow.latitude, 'latitude');
        }
        if (normalizedRow.longitude !== undefined && normalizedRow.longitude !== null) {
          normalizedRow.longitude = normalizeCoordinate(normalizedRow.longitude, 'longitude');
        }
      }
      
      return normalizedRow;
    });
  };
  
  // Normalize contract data
  const normalizeContractData = (data: any[], options: NormalizationOptions = {
    dateFormat: true,
    numericValues: true,
    textFields: true
  }): any[] => {
    return data.map(row => {
      const normalizedRow = { ...row };
      
      // Normalize dates
      if (options.dateFormat) {
        if (normalizedRow.start_date) {
          normalizedRow.start_date = normalizeDate(normalizedRow.start_date);
        }
        if (normalizedRow.end_date) {
          normalizedRow.end_date = normalizeDate(normalizedRow.end_date);
        }
      }
      
      // Normalize status text field
      if (options.textFields && normalizedRow.status) {
        normalizedRow.status = normalizeStatus(normalizedRow.status, 'contract');
      }
      
      // Normalize currency
      if (options.textFields && normalizedRow.currency) {
        normalizedRow.currency = normalizedRow.currency.toUpperCase();
      }
      
      // Normalize numeric values
      if (options.numericValues && normalizedRow.monthly_rate !== undefined) {
        normalizedRow.monthly_rate = normalizeNumeric(normalizedRow.monthly_rate);
      }
      
      return normalizedRow;
    });
  };
  
  // Normalize landlord data
  const normalizeLandlordData = (data: any[], options: NormalizationOptions = {
    textFields: true
  }): any[] => {
    return data.map(row => {
      const normalizedRow = { ...row };
      
      // Sanitize text fields
      if (options.textFields) {
        if (normalizedRow.name) {
          normalizedRow.name = sanitizeText(normalizedRow.name);
        }
        if (normalizedRow.contact_name) {
          normalizedRow.contact_name = sanitizeText(normalizedRow.contact_name);
        }
        if (normalizedRow.email) {
          normalizedRow.email = normalizedRow.email.toLowerCase().trim();
        }
        if (normalizedRow.phone) {
          normalizedRow.phone = normalizePhone(normalizedRow.phone);
        }
        if (normalizedRow.address) {
          normalizedRow.address = sanitizeText(normalizedRow.address);
        }
      }
      
      return normalizedRow;
    });
  };
  
  // Normalize payment data
  const normalizePaymentData = (data: any[], options: NormalizationOptions = {
    dateFormat: true,
    numericValues: true,
    textFields: true
  }): any[] => {
    return data.map(row => {
      const normalizedRow = { ...row };
      
      // Normalize dates
      if (options.dateFormat && normalizedRow.payment_date) {
        normalizedRow.payment_date = normalizeDate(normalizedRow.payment_date);
      }
      
      // Normalize status text field
      if (options.textFields && normalizedRow.status) {
        normalizedRow.status = normalizeStatus(normalizedRow.status, 'payment');
      }
      
      // Normalize numeric values
      if (options.numericValues && normalizedRow.amount !== undefined) {
        normalizedRow.amount = normalizeNumeric(normalizedRow.amount);
      }
      
      return normalizedRow;
    });
  };
  
  // Helper functions for normalization
  
  // Standardize date format to YYYY-MM-DD
  const normalizeDate = (dateValue: any): string => {
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return dateValue.toString();
      }
      return date.toISOString().split('T')[0];
    } catch (e) {
      return dateValue.toString();
    }
  };
  
  // Normalize numeric values
  const normalizeNumeric = (value: any): number => {
    if (typeof value === 'string') {
      // Remove non-numeric characters except decimal point
      const numericString = value.replace(/[^0-9.-]/g, '');
      return parseFloat(numericString);
    }
    return Number(value);
  };
  
  // Sanitize text fields
  const sanitizeText = (text: any): string => {
    if (typeof text !== 'string') {
      text = String(text);
    }
    // Trim whitespace and normalize spaces
    return text.trim().replace(/\s+/g, ' ');
  };
  
  // Normalize coordinates to 6 decimal places
  const normalizeCoordinate = (value: any, type: 'latitude' | 'longitude'): number => {
    const num = normalizeNumeric(value);
    // Round to 6 decimal places (approximately 11cm precision)
    return parseFloat(num.toFixed(6));
  };
  
  // Normalize phone number formats (basic implementation)
  const normalizePhone = (phone: any): string => {
    if (typeof phone !== 'string') {
      phone = String(phone);
    }
    // Keep only digits, +, and parentheses
    return phone.replace(/[^\d+() -]/g, '').trim();
  };
  
  // Normalize status values
  const normalizeStatus = (status: any, type: 'tower' | 'contract' | 'payment'): string => {
    if (typeof status !== 'string') {
      status = String(status);
    }
    
    const statusValue = status.toLowerCase().trim();
    
    // Status normalization based on type
    if (type === 'tower') {
      const validStatuses = ['active', 'inactive', 'maintenance', 'planned'];
      const statusMap: Record<string, string> = {
        'active': 'active',
        'inactive': 'inactive',
        'maintenance': 'maintenance',
        'planned': 'planned',
        'in-use': 'active',
        'decommissioned': 'inactive',
        'repair': 'maintenance',
        'future': 'planned'
      };
      
      return statusMap[statusValue] || (validStatuses.includes(statusValue) ? statusValue : 'active');
    } else if (type === 'contract') {
      const validStatuses = ['active', 'expired', 'pending', 'terminated'];
      const statusMap: Record<string, string> = {
        'active': 'active',
        'expired': 'expired',
        'pending': 'pending',
        'terminated': 'terminated',
        'current': 'active',
        'ended': 'expired',
        'drafted': 'pending',
        'cancelled': 'terminated'
      };
      
      return statusMap[statusValue] || (validStatuses.includes(statusValue) ? statusValue : 'active');
    } else if (type === 'payment') {
      const validStatuses = ['scheduled', 'processed', 'failed', 'cancelled'];
      const statusMap: Record<string, string> = {
        'scheduled': 'scheduled',
        'processed': 'processed',
        'failed': 'failed',
        'cancelled': 'cancelled',
        'pending': 'scheduled',
        'completed': 'processed',
        'error': 'failed',
        'rejected': 'failed',
        'cancel': 'cancelled'
      };
      
      return statusMap[statusValue] || (validStatuses.includes(statusValue) ? statusValue : 'scheduled');
    }
    
    return statusValue;
  };
  
  return {
    normalizeTowerData,
    normalizeContractData,
    normalizeLandlordData,
    normalizePaymentData
  };
};