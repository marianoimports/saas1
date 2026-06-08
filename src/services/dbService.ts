import { supabase } from '../supabase';

export const getCollectionRef = (_path: string) => {
  return null;
};

export function subscribeToCollection<T>(
  path: string,
  callback: (data: T[]) => void,
  shopId: string
) {
  const cleanShopId = String(shopId).replace(/[^a-zA-Z0-9-_]/g, '');
  if (!cleanShopId || cleanShopId === 'undefined' || cleanShopId !== shopId) {
    console.error('subscribeToCollection: shopId is invalid:', shopId, 'cleaned:', cleanShopId);
    callback([]);
    return () => {};
  }

  let cancelled = false;
  let intervalId: ReturnType<typeof setInterval>;

  const tableName = getTableName(path);

  const fetchData = async () => {
    if (cancelled) return;
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('shop_id', cleanShopId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`Error subscribing to ${path}:`, error);
        return;
      }

      if (!cancelled) {
        const items = (data || []).map(item => ({
          id: item.id,
          ...item,
        })) as (T & { id: string })[];
        callback(items);
      }
    } catch (error) {
      console.error(`Error subscribing to ${path}:`, error);
    }
  };

  fetchData();
  intervalId = setInterval(fetchData, 5000);

  return () => {
    cancelled = true;
    clearInterval(intervalId);
  };
}

export async function addItem(shopId: string, path: string, data: any) {
  if (!shopId || shopId === 'undefined' || shopId === undefined) {
    throw new Error('addItem: shopId is invalid');
  }
  try {
    const tableName = getTableName(path);
    const { data: result, error } = await supabase
      .from(tableName)
      .insert({
        ...data,
        shop_id: shopId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    return result.id;
  } catch (error) {
    console.error('Error adding document: ', error);
    throw error;
  }
}

export async function updateItem(shopId: string, path: string, id: string, data: any) {
  if (!shopId || shopId === 'undefined' || shopId === undefined) {
    throw new Error('updateItem: shopId is invalid');
  }
  try {
    const tableName = getTableName(path);
    const { error } = await supabase
      .from(tableName)
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('shop_id', shopId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating document: ', error);
    throw error;
  }
}

// ==================== SHOPS ====================
export async function addShop(data: any) {
  try {
    const { data: result, error } = await supabase
      .from('shops')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    return result.id;
  } catch (error) {
    console.error('Error adding shop: ', error);
    throw error;
  }
}

export async function updateShop(shopId: string, data: any) {
  try {
    const { error } = await supabase
      .from('shops')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shopId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating shop: ', error);
    throw error;
  }
}

export function subscribeToShops<T>(
  callback: (data: T[]) => void
) {
  let cancelled = false;
  let intervalId: ReturnType<typeof setInterval>;

  const fetchData = async () => {
    if (cancelled) return;
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error subscribing to shops:', error);
        return;
      }
      if (!cancelled) {
        const items = (data || []).map(item => ({
          id: item.id,
          ...item,
        })) as (T & { id: string })[];
        callback(items);
      }
    } catch (error) {
      console.error('Error subscribing to shops:', error);
    }
  };

  fetchData();
  intervalId = setInterval(fetchData, 5000);

  return () => {
    cancelled = true;
    clearInterval(intervalId);
  };
}

export async function getShopsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('shops')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting shops count: ', error);
    return 0;
  }
}

export async function getActiveShopsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('shops')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting active shops count: ', error);
    return 0;
  }
}

// ==================== PLANS ====================
export async function addPlan(data: any) {
  try {
    const { data: result, error } = await supabase
      .from('plans')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    return result.id;
  } catch (error) {
    console.error('Error adding plan: ', error);
    throw error;
  }
}

export async function updatePlan(planId: string, data: any) {
  try {
    const { error } = await supabase
      .from('plans')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating plan: ', error);
    throw error;
  }
}

export function subscribeToPlans<T>(
  callback: (data: T[]) => void
) {
  let cancelled = false;
  let intervalId: ReturnType<typeof setInterval>;

  const fetchData = async () => {
    if (cancelled) return;
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) {
        console.error('Error subscribing to plans:', error);
        return;
      }
      if (!cancelled) {
        const items = (data || []).map(item => ({
          id: item.id,
          ...item,
        })) as (T & { id: string })[];
        callback(items);
      }
    } catch (error) {
      console.error('Error subscribing to plans:', error);
    }
  };

  fetchData();
  intervalId = setInterval(fetchData, 5000);

  return () => {
    cancelled = true;
    clearInterval(intervalId);
  };
}

export async function getPlanById(planId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) throw error;
    if (data) return { id: data.id, ...data };
    return null;
  } catch (error) {
    console.error('Error getting plan: ', error);
    return null;
  }
}

// ==================== STATS ====================
export async function getTotalUsersCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting users count: ', error);
    return 0;
  }
}

// ==================== ADMIN MANAGEMENT ====================
export async function setUserAsAdmin(userId: string) {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        role: 'admin',
        is_admin: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error setting user as admin: ', error);
    throw error;
  }
}

export async function checkIfAdminExists(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (error) throw error;
    return (data || []).length > 0;
  } catch (error) {
    console.error('Error checking admin existence: ', error);
    return false;
  }
}

export async function getMRR(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('monthly_revenue')
      .eq('status', 'active');

    if (error) throw error;
    let mrr = 0;
    (data || []).forEach(shop => {
      mrr += shop.monthly_revenue || 0;
    });
    return mrr;
  } catch (error) {
    console.error('Error calculating MRR: ', error);
    return 0;
  }
}

export async function getNewShopsLast30Days(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count, error } = await supabase
      .from('shops')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting new shops: ', error);
    return 0;
  }
}

// ==================== USER MANAGEMENT ====================
export async function deleteUser(userId: string) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    console.log('User document deleted. Auth deletion requires admin API.');
  } catch (error) {
    console.error('Error deleting user: ', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  } catch (error) {
    console.error('Error sending password reset: ', error);
    throw error;
  }
}

// ==================== STRIPE INTEGRATION (Mock/Setup) ====================
export interface StripeConfig {
  enabled: boolean;
  publishableKey: string;
  webhookSecret: string;
  plans: {
    [key: string]: {
      priceId: string;
      productId: string;
    }
  };
}

export async function getStripeConfig(): Promise<StripeConfig | null> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('data')
      .eq('id', 'stripe')
      .single();

    if (error) throw error;
    if (data) return data.data as StripeConfig;
    return null;
  } catch (error) {
    console.error('Error getting Stripe config: ', error);
    return null;
  }
}

export async function saveStripeConfig(config: Partial<StripeConfig>) {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({
        id: 'stripe',
        data: config,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving Stripe config: ', error);
    throw error;
  }
}

// ==================== APPOINTMENTS ====================
export function subscribeToAppointments<T>(
  shopId: string,
  callback: (data: T[]) => void
) {
  let cancelled = false;
  let intervalId: ReturnType<typeof setInterval>;

  const fetchData = async () => {
    if (cancelled) return;
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('shop_id', shopId)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error subscribing to appointments:', error);
        return;
      }
      if (!cancelled) {
        const items = (data || []).map(item => ({
          id: item.id,
          ...item,
        })) as (T & { id: string })[];
        callback(items);
      }
    } catch (error) {
      console.error('Error subscribing to appointments:', error);
    }
  };

  fetchData();
  intervalId = setInterval(fetchData, 5000);

  return () => {
    cancelled = true;
    clearInterval(intervalId);
  };
}

export async function addAppointment(shopId: string, data: any) {
  try {
    const { data: result, error } = await supabase
      .from('appointments')
      .insert({
        ...data,
        shop_id: shopId,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    return result.id;
  } catch (error) {
    console.error('Error adding appointment: ', error);
    throw error;
  }
}

export async function updateAppointment(shopId: string, appointmentId: string, data: any) {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)
      .eq('shop_id', shopId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating appointment: ', error);
    throw error;
  }
}

// ==================== USER SUBSCRIPTIONS ====================
export function subscribeToUsers<T>(
  callback: (data: T[]) => void
) {
  let cancelled = false;
  let intervalId: ReturnType<typeof setInterval>;

  const fetchData = async () => {
    if (cancelled) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error subscribing to users:', error);
        return;
      }
      if (!cancelled) {
        const items = (data || []).map(item => ({
          id: item.id,
          ...item,
        })) as (T & { id: string })[];
        callback(items);
      }
    } catch (error) {
      console.error('Error subscribing to users:', error);
    }
  };

  fetchData();
  intervalId = setInterval(fetchData, 5000);

  return () => {
    cancelled = true;
    clearInterval(intervalId);
  };
}

export async function createStripeCheckout(planId: string, userId: string, userEmail: string) {
  try {
    const config = await getStripeConfig();
    if (!config?.enabled) {
      throw new Error('Stripe not configured');
    }

    const plan = await getPlanById(planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    const priceId = config.plans?.[planId]?.priceId;
    if (!priceId) {
      throw new Error('Stripe price ID not configured for this plan');
    }

    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        userId,
        userEmail,
        planName: plan.name,
        successUrl: `${window.location.origin}/dashboard?success=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error creating checkout: ', error);
    throw error;
  }
}

// ==================== HELPER ====================
function getTableName(firestorePath: string): string {
  const parts = firestorePath.split('/');
  const collectionName = parts[parts.length - 1];

  const mapping: Record<string, string> = {
    barbers: 'barbers',
    services: 'inventory',
    inventory: 'inventory',
    appointments: 'appointments',
    users: 'users',
    professionals: 'professionals',
    products: 'inventory',
  };

  return mapping[collectionName] || collectionName;
}
