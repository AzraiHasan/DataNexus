// composables/useDataImport.ts
import { ref } from 'vue'
import type { ValidationResult } from '~/types/validation'

interface ImportOptions {
  skipDuplicates?: boolean;
  batchSize?: number;
  onProgress?: (progress: number) => void;
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  failed: number;
  error?: string;
}

interface ImportProgress {
  total: number;
  processed: number;
  percentage: number;
}

// Database types
interface Tower {
  id?: string;
  company_id: string;
  tower_id: string;
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  type?: string | null;
  height?: number | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface Profile {
  id: string;
  company_id: string;
}

export const useDataImport = () => {
  const supabase = useSupabaseClient();
  const loading = ref(false);
  const progress = ref<ImportProgress>({
    total: 0,
    processed: 0,
    percentage: 0
  });
  const error = ref<string | null>(null);
 
  // Import tower data into the database
const importTowerData = async (
  data: any[],
  options: ImportOptions = { skipDuplicates: true, batchSize: 50 }
): Promise<ImportResult> => {
  loading.value = true;
  error.value = null;
  let imported = 0, skipped = 0, failed = 0;
  
  try {
    // Use data normalization to standardize values
    const { normalizeTowerData } = useDataNormalization();
    const normalizedData = normalizeTowerData(data);
    
    // Get user's company ID
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userData.user?.id)
      .single();
      
    if (profileError) throw profileError;
    
    const companyId = (profileData as Profile).company_id;
    if (!companyId) throw new Error('No company associated with user');
    
    // Set up progress tracking
    progress.value = {
      total: normalizedData.length,
      processed: 0,
      percentage: 0
    };
    
    // Process data in batches
    const batchSize = options.batchSize || 50;
    for (let i = 0; i < normalizedData.length; i += batchSize) {
      const batch = normalizedData.slice(i, i + batchSize);
      
      // Check for duplicates if needed
      let batchToImport = batch;
      if (options.skipDuplicates) {
        // Extract tower_ids from batch
        const towerIds = batch.map(item => item.tower_id);
        
        // Check for existing tower_ids
        const { data: existingTowers } = await supabase
          .from('towers')
          .select('tower_id')
          .eq('company_id', companyId)
          .in('tower_id', towerIds);
          
        const existingIds = new Set((existingTowers || []).map((t: any) => t.tower_id));
        
        // Filter out duplicates
        batchToImport = batch.filter(item => !existingIds.has(item.tower_id));
        skipped += (batch.length - batchToImport.length);
      }
      
      // Skip empty batches
      if (batchToImport.length === 0) {
        progress.value.processed += batch.length;
        progress.value.percentage = Math.round((progress.value.processed / progress.value.total) * 100);
        if (options.onProgress) options.onProgress(progress.value.percentage);
        continue;
      }
      
      // Prepare records for insertion
      const towersToInsert: Tower[] = batchToImport.map(tower => ({
        company_id: companyId,
        tower_id: tower.tower_id,
        name: tower.name || null,
        latitude: tower.latitude || null,
        longitude: tower.longitude || null,
        type: tower.type || null,
        height: tower.height || null,
        status: tower.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      // Insert batch
      const { data: insertedData, error: insertError } = await supabase
        .from('towers')
        .insert(towersToInsert as any);
        
      if (insertError) throw insertError;
      
      // Count as imported
      imported += towersToInsert.length;
      
      // Update progress
      progress.value.processed += batch.length;
      progress.value.percentage = Math.round((progress.value.processed / progress.value.total) * 100);
      if (options.onProgress) options.onProgress(progress.value.percentage);
    }
    
    return {
      success: true,
      imported,
      skipped,
      failed
    };
  } catch (err: any) {
    console.error('Error importing tower data:', err);
    error.value = err.message;
    
    return {
      success: false,
      imported,
      skipped,
      failed,
      error: err.message
    };
  } finally {
    loading.value = false;
  }
};
  
  // Stub implementations for other data types (to be implemented later)
  const importContractData = async (data: any[], options: ImportOptions = {}): Promise<ImportResult> => {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      failed: 0,
      error: 'Not implemented yet'
    };
  };
  
  const importLandlordData = async (data: any[], options: ImportOptions = {}): Promise<ImportResult> => {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      failed: 0,
      error: 'Not implemented yet'
    };
  };
  
  const importPaymentData = async (data: any[], options: ImportOptions = {}): Promise<ImportResult> => {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      failed: 0,
      error: 'Not implemented yet'
    };
  };
  
  return {
    loading,
    progress,
    error,
    importTowerData,
    importContractData,
    importLandlordData,
    importPaymentData
  };
};