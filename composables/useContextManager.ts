// composables/useContextManager.ts
interface DatabaseProfile {
  id: string;
  company_id: string;
}

interface ConversationContext {
  messages: ContextMessage[];
  dataContext: DataContext;
}

interface ContextMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DataContext {
  towerCount?: number;
  contractCount?: number;
  landlordCount?: number;
  paymentTimeframe?: string;
  schema?: string;
}

const MAX_CONTEXT_MESSAGES = 5;

export const useContextManager = () => {
  const context = ref<ConversationContext>({
    messages: [],
    dataContext: {}
  });
  
  const loadDataContext = async () => {
  const supabase = useSupabaseClient();
  
  try {
    // Get user's company ID
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user?.id) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userData.user.id)
      .single();
      
    const typedProfile = profile as unknown as DatabaseProfile;
    if (!typedProfile?.company_id) return;
    
    const companyId = typedProfile.company_id;
    
    // Fetch counts
    const [towers, contracts, landlords, payments] = await Promise.all([
      supabase.from('towers').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      supabase.from('landlords').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      supabase.from('payments').select('payment_date', { head: false }).eq('company_id', companyId)
        .order('payment_date', { ascending: true })
    ]);
    
    // Update context
    context.value.dataContext = {
      towerCount: towers.count || 0,
      contractCount: contracts.count || 0,
      landlordCount: landlords.count || 0,
      paymentTimeframe: getPaymentTimeframe(payments.data || []),
      schema: getSchemaDescription()
    };
    
  } catch (err) {
    console.error('Error loading data context:', err);
  }
};
  
  const addMessage = (role: 'user' | 'assistant', content: string) => {
    context.value.messages.push({
      role,
      content,
      timestamp: new Date()
    });
    
    // Trim to max length
    if (context.value.messages.length > MAX_CONTEXT_MESSAGES) {
      context.value.messages = context.value.messages.slice(-MAX_CONTEXT_MESSAGES);
    }
  };
  
  const getPaymentTimeframe = (payments: any[]): string => {
    if (!payments.length) return 'No payment data';
    
    const dates = payments
      .map(p => new Date(p.payment_date))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
      
    if (!dates.length) return 'No payment data';
    
    const earliest = dates[0];
    const latest = dates[dates.length - 1];
    
    return `${earliest.toLocaleDateString()} to ${latest.toLocaleDateString()}`;
  };
  
  const getSchemaDescription = (): string => {
    return `
      Tower: id, tower_id, name, latitude, longitude, type, height, status
      Contract: id, contract_id, tower_id, landlord_id, start_date, end_date, monthly_rate, currency, status
      Landlord: id, landlord_id, name, contact_name, email, phone, address
      Payment: id, contract_id, payment_date, amount, status, reference_id
    `;
  };
  
  const buildPrompt = (query: string): string => {
    // Create system prompt with data context
    const dataContextStr = `
      Available data:
      - Towers: ${context.value.dataContext.towerCount || 0} towers
      - Contracts: ${context.value.dataContext.contractCount || 0} contracts
      - Landlords: ${context.value.dataContext.landlordCount || 0} landlords
      - Payments: ${context.value.dataContext.paymentTimeframe || 'No data'}
      
      Simplified schema:
      ${context.value.dataContext.schema || ''}
    `;
    
    // Add conversation history
    const historyStr = context.value.messages.map(msg => 
      `${msg.role.toUpperCase()}: ${msg.content}`
    ).join('\n\n');
    
    // Final prompt with system instructions
    return `
      You are a telecom tower data analyst assistant. Help the user analyze their tower, contract, and payment data.
      Provide concise, actionable insights focused on the telecom infrastructure industry.
      Use clear business language and avoid technical jargon unless necessary.
      
      ${dataContextStr}
      
      ${historyStr ? `Previous conversation:\n${historyStr}\n\n` : ''}
      
      User's question: "${query}"
      
      Provide a clear, concise answer focusing on business insights.
    `;
  };
  
  const clearContext = () => {
    context.value.messages = [];
  };
  
  return {
    context,
    loadDataContext,
    addMessage,
    buildPrompt,
    clearContext
  };
};