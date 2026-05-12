import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helpers que mimicam a API que o app usa
export const db = {
  // Restaurantes
  async listRestaurants() {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(rowToRestaurant);
  },
  async saveRestaurant(r) {
    const row = restaurantToRow(r);
    const { error } = await supabase.from('restaurants').upsert(row);
    if (error) throw error;
  },
  async deleteRestaurant(id) {
    const { error } = await supabase.from('restaurants').delete().eq('id', id);
    if (error) throw error;
  },

  // Wishlist
  async listWishlist() {
    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(rowToSimple);
  },
  async saveWishlist(item) {
    const { error } = await supabase.from('wishlist').upsert(simpleToRow(item));
    if (error) throw error;
  },
  async deleteWishlist(id) {
    const { error } = await supabase.from('wishlist').delete().eq('id', id);
    if (error) throw error;
  },

  // Schedule
  async listSchedule() {
    const { data, error } = await supabase
      .from('schedule')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(rowToSimple);
  },
  async saveSchedule(item) {
    const { error } = await supabase.from('schedule').upsert(simpleToRow(item));
    if (error) throw error;
  },
  async deleteSchedule(id) {
    const { error } = await supabase.from('schedule').delete().eq('id', id);
    if (error) throw error;
  },

  // Appointments
  async listAppointments() {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true });
    if (error) throw error;
    return data.map(rowToAppointment);
  },
  async saveAppointment(item) {
    const { error } = await supabase.from('appointments').upsert(appointmentToRow(item));
    if (error) throw error;
  },
  async deleteAppointment(id) {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw error;
  },

  // Meta (custom options)
  async getMeta(key) {
    const { data, error } = await supabase.from('meta').select('*').eq('key', key).maybeSingle();
    if (error) throw error;
    return data?.value || null;
  },
  async setMeta(key, value) {
    const { error } = await supabase.from('meta').upsert({ key, value });
    if (error) throw error;
  },
};

// Converters: row (snake_case do DB) <-> objeto (camelCase do JS)
function rowToRestaurant(row) {
  return {
    id: row.id,
    name: row.name,
    tipo: row.tipo || [],
    comida: row.comida || '',
    bairro: row.bairro || '',
    preco: row.preco || '',
    rating: row.rating || 0,
    estilo: row.estilo || [],
    ocasiao: row.ocasiao || [],
    kid: row.kid || false,
    pet: row.pet || false,
    pedido: row.pedido || '',
    comentarios: row.comentarios || '',
    website: row.website || '',
    data: row.data || '',
    posted: row.posted || false,
    postLink: row.post_link || '',
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}
function restaurantToRow(r) {
  return {
    id: r.id,
    name: r.name,
    tipo: r.tipo,
    comida: r.comida,
    bairro: r.bairro,
    preco: r.preco,
    rating: r.rating,
    estilo: r.estilo,
    ocasiao: r.ocasiao,
    kid: r.kid,
    pet: r.pet,
    pedido: r.pedido,
    comentarios: r.comentarios,
    website: r.website,
    data: r.data || null,
    posted: r.posted,
    post_link: r.postLink,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}
function rowToSimple(row) {
  return { id: row.id, name: row.name, note: row.note || '', createdAt: Number(row.created_at) };
}
function simpleToRow(item) {
  return { id: item.id, name: item.name, note: item.note, created_at: item.createdAt };
}
function rowToAppointment(row) {
  return { id: row.id, name: row.name, date: row.date, note: row.note || '', createdAt: Number(row.created_at) };
}
function appointmentToRow(item) {
  return { id: item.id, name: item.name, date: item.date, note: item.note, created_at: item.createdAt };
}
