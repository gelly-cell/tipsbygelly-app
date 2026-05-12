'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/supabase';
import { Plus, Search, Star, X, Trash2, ChevronLeft, ChevronRight, ArrowRight, Check, ExternalLink, Calendar as CalendarIcon, Baby, Dog, Eye, Bookmark, CalendarPlus, Instagram, Edit2, BarChart3, SlidersHorizontal } from 'lucide-react';

const TIPOS_DEFAULT = ['Restaurante', 'Bar', 'Boteco', 'Bar de Drinks', 'Listenning Bar', 'Lanchonete', 'Balada', 'Cafeteria', 'Doceria'];
const COMIDAS_DEFAULT = ['Italiana', 'Brasileira', 'Contemporânea', 'Asiática', 'Francesa', 'Espanhola', 'Carnes', 'Burger', 'Indiana', 'Japonesa', 'Mexicana', 'Árabe', 'Peruana'];
const BAIRROS_DEFAULT = ['Pinheiros', 'Itaim', 'Vila Olímpia', 'Moema', 'Vila Leopoldina', 'Ipiranga', 'Brooklin', 'Aclimação', 'Jardins', 'Vila Madalena', 'Higienópolis', 'Shopping Morumbi'];
const ESTILOS_DEFAULT = ['Menu Fixo', 'Menu Degustação', 'A la Carte', 'Buffet', 'Rodízio', 'Fast Casual', 'Delivery'];
const OCASIOES_DEFAULT = ['Família', 'Casal', 'Amigos', 'Foodies', 'Trabalho', 'Almoço', 'Shopping', 'Aniversário', 'Data especial'];

const PRECOS = ['$', '$$', '$$$', '$$$$', '$$$$$'];
const PRECO_HINTS = ['até R$60/pessoa', 'R$60–120/pessoa', 'R$120–250/pessoa', 'R$250–400/pessoa', 'acima de R$400/pessoa'];

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const QUESTIONS = [
  { key: 'name', label: 'Qual o nome?', type: 'text', placeholder: 'Ex: Trattoria da Nonna' },
  { key: 'tipo', label: 'Que tipo de lugar é?', type: 'multi', source: 'tipos', hint: 'pode marcar mais de um', optional: true },
  { key: 'comida', label: 'Que tipo de comida?', type: 'single', source: 'comidas', optional: true },
  { key: 'bairro', label: 'Em que bairro fica?', type: 'single', source: 'bairros', optional: true },
  { key: 'preco', label: 'Faixa de preço?', type: 'preco', optional: true },
  { key: 'rating', label: 'Sua avaliação?', type: 'rating' },
  { key: 'estilo', label: 'Estilo do serviço?', type: 'multi', source: 'estilos', hint: 'pode marcar mais de um', optional: true },
  { key: 'ocasiao', label: 'Pra que ocasiões combina?', type: 'multi', source: 'ocasioes', hint: 'pode marcar mais de uma', optional: true },
  { key: 'flags', label: 'Mais detalhes?', type: 'flags', optional: true },
  { key: 'pedido', label: 'O que você pediu?', type: 'textarea', placeholder: 'Pratos que valeram a pena…', optional: true },
  { key: 'comentarios', label: 'Comentários?', type: 'textarea', placeholder: 'Ambiente, atendimento, qualquer coisa…', optional: true },
  { key: 'data', label: 'Quando você foi?', type: 'date', optional: true },
  { key: 'posted', label: 'Já postou conteúdo?', type: 'yesno', optional: true },
  { key: 'postLink', label: 'Link do post?', type: 'url', placeholder: 'https://instagram.com/p/…', optional: true, showIf: (d) => d.posted },
  { key: 'website', label: 'Site ou Instagram do lugar?', type: 'url', placeholder: 'https://…', optional: true },
];

const emptyDraft = { name: '', tipo: [], comida: '', bairro: '', preco: '', rating: 0, estilo: [], ocasiao: [], kid: false, pet: false, pedido: '', comentarios: '', website: '', data: '', posted: false, postLink: '' };

export default function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [scheduleList, setScheduleList] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [customOptions, setCustomOptions] = useState({ tipos: [], comidas: [], bairros: [], estilos: [], ocasioes: [] });

  const [view, setView] = useState('home');
  const [listFilter, setListFilter] = useState(null);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [quickAdd, setQuickAdd] = useState(null);
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [rs, wl, sl, ap, co] = await Promise.all([
          db.listRestaurants(),
          db.listWishlist(),
          db.listSchedule(),
          db.listAppointments(),
          db.getMeta('customOptions'),
        ]);
        setRestaurants(rs.sort((a, b) => (b.data || '').localeCompare(a.data || '')));
        setWishlist(wl);
        setScheduleList(sl);
        setAppointments(ap);
        if (co) setCustomOptions(co);
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
      setLoading(false);
    })();
  }, []);

  const getOptions = (source) => {
    const defaults = { tipos: TIPOS_DEFAULT, comidas: COMIDAS_DEFAULT, bairros: BAIRROS_DEFAULT, estilos: ESTILOS_DEFAULT, ocasioes: OCASIOES_DEFAULT }[source] || [];
    const custom = customOptions[source] || [];
    const fields = { tipos: 'tipo', comidas: 'comida', bairros: 'bairro', estilos: 'estilo', ocasioes: 'ocasiao' };
    const used = restaurants.flatMap(r => {
      const v = r[fields[source]];
      return Array.isArray(v) ? v : (v ? [v] : []);
    }).filter(Boolean);
    return [...new Set([...defaults, ...custom, ...used])];
  };

  const addCustomOption = async (source, value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const existing = getOptions(source);
    if (existing.some(o => o.toLowerCase() === trimmed.toLowerCase())) return;
    const newOpts = { ...customOptions, [source]: [...(customOptions[source] || []), trimmed] };
    setCustomOptions(newOpts);
    try { await db.setMeta('customOptions', newOpts); } catch (e) { console.error(e); }
  };

  const quickAddWishlist = async (name, note = '') => {
    const item = { id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: name.trim(), note: note.trim(), createdAt: Date.now() };
    try { await db.saveWishlist(item); setWishlist(prev => [item, ...prev]); } catch (e) { console.error(e); alert('Erro ao salvar'); }
  };
  const quickAddSchedule = async (name, note = '') => {
    const item = { id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: name.trim(), note: note.trim(), createdAt: Date.now() };
    try { await db.saveSchedule(item); setScheduleList(prev => [item, ...prev]); } catch (e) { console.error(e); alert('Erro ao salvar'); }
  };
  const quickAddAppointment = async (name, date, note = '') => {
    const item = { id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: name.trim(), date, note: note.trim(), createdAt: Date.now() };
    try { await db.saveAppointment(item); setAppointments(prev => [...prev, item].sort((a, b) => (a.date || '').localeCompare(b.date || ''))); } catch (e) { console.error(e); alert('Erro ao salvar'); }
  };

  const moveScheduleToAppointment = async (scheduleItem, date) => {
    await quickAddAppointment(scheduleItem.name, date, scheduleItem.note);
    await deleteFromList('schedule', scheduleItem.id);
  };
  const moveWishlistToSchedule = async (wishlistItem) => {
    await quickAddSchedule(wishlistItem.name, wishlistItem.note);
    await deleteFromList('wishlist', wishlistItem.id);
  };

  const deleteFromList = async (listType, id) => {
    const setters = { wishlist: setWishlist, schedule: setScheduleList, appointments: setAppointments };
    const deleters = { wishlist: db.deleteWishlist, schedule: db.deleteSchedule, appointments: db.deleteAppointment };
    try {
      await deleters[listType](id);
      setters[listType](prev => prev.filter(x => x.id !== id));
    } catch (e) { console.error(e); }
  };

  const deleteRestaurant = async (id) => {
    try {
      await db.deleteRestaurant(id);
      setRestaurants(prev => prev.filter(r => r.id !== id));
      setSelected(null); setConfirmDelete(null); setView('home');
    } catch (e) { console.error(e); }
  };

  const startAddRestaurant = (prefilledName = '', sourceListType = null, sourceItemId = null) => {
    setDraft({ ...emptyDraft, name: prefilledName, _sourceListType: sourceListType, _sourceItemId: sourceItemId });
    setStep(0); setEditingId(null); setView('add');
  };
  const startEditRestaurant = (r) => {
    setDraft({ ...emptyDraft, ...r, tipo: r.tipo || [], estilo: r.estilo || [], ocasiao: r.ocasiao || [] });
    setStep(0); setEditingId(r.id); setView('add');
  };

  const advanceFromStep = (s) => {
    let next = s + 1;
    while (next < QUESTIONS.length && QUESTIONS[next].showIf && !QUESTIONS[next].showIf(draft)) next++;
    return next;
  };
  const retreatFromStep = (s) => {
    let prev = s - 1;
    while (prev >= 0 && QUESTIONS[prev].showIf && !QUESTIONS[prev].showIf(draft)) prev--;
    return prev;
  };

  const saveDraft = async () => {
    const sourceListType = draft._sourceListType;
    const sourceItemId = draft._sourceItemId;
    const restaurant = {
      id: editingId || `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: draft.name.trim(),
      tipo: draft.tipo, comida: draft.comida, bairro: draft.bairro.trim(),
      preco: draft.preco, rating: draft.rating, estilo: draft.estilo, ocasiao: draft.ocasiao,
      kid: draft.kid, pet: draft.pet,
      pedido: draft.pedido.trim(), comentarios: draft.comentarios.trim(),
      website: draft.website.trim(), data: draft.data,
      posted: draft.posted || false, postLink: draft.postLink?.trim() || '',
      createdAt: editingId ? (restaurants.find(r => r.id === editingId)?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now(),
    };
    try {
      await db.saveRestaurant(restaurant);
      setRestaurants(prev => {
        const without = prev.filter(r => r.id !== restaurant.id);
        return [restaurant, ...without].sort((a, b) => (b.data || '').localeCompare(a.data || ''));
      });
      if (sourceListType && sourceItemId) await deleteFromList(sourceListType, sourceItemId);
      setView('home'); setDraft(emptyDraft); setEditingId(null);
    } catch (e) { alert('Erro ao salvar.'); console.error(e); }
  };

  const togglePosted = async (r) => {
    const updated = { ...r, posted: !r.posted, updatedAt: Date.now() };
    try {
      await db.saveRestaurant(updated);
      setRestaurants(prev => prev.map(x => x.id === r.id ? updated : x));
      if (selected?.id === r.id) setSelected(updated);
    } catch (e) { console.error(e); }
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  return (
    <div className="app-root">
      <Styles />
      <div className="header-stripe sticky top-0" style={{ zIndex: 30 }}>
        <span>TIPS BY GELLY</span>
        <span>@TIPSBYGELLY</span>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-32 pt-4">
        {view === 'home' && (
          <Home
            restaurants={restaurants} wishlist={wishlist} scheduleList={scheduleList} appointments={appointments}
            onTapRestaurant={(r) => { setSelected(r); setView('detail'); }}
            onOpenList={(target) => setView(target)}
            onQuickAdd={(type) => setQuickAdd(type)}
            onAddRestaurant={() => startAddRestaurant()}
            onMoveWishlistToSchedule={moveWishlistToSchedule}
            onMoveWishlistToVisited={(item) => startAddRestaurant(item.name, 'wishlist', item.id)}
            onScheduleItem={(item) => setScheduleTarget(item)}
            onMoveScheduleToVisited={(item) => startAddRestaurant(item.name, 'schedule', item.id)}
            onMoveAppointmentToVisited={(item) => startAddRestaurant(item.name, 'appointments', item.id)}
            onDeleteFromList={deleteFromList}
            onOpenStats={() => setView('stats')}
          />
        )}
        {view === 'list-wishlist' && <SimpleListView title="Quero conhecer" items={wishlist} onBack={() => setView('home')} onQuickAdd={() => setQuickAdd('wishlist')} onMove={moveWishlistToSchedule} moveLabel="Agendar" moveIcon={Bookmark} onConvert={(item) => startAddRestaurant(item.name, 'wishlist', item.id)} onDelete={(id) => deleteFromList('wishlist', id)} />}
        {view === 'list-schedule' && <SimpleListView title="Agendar" items={scheduleList} onBack={() => setView('home')} onQuickAdd={() => setQuickAdd('schedule')} onMove={(item) => setScheduleTarget(item)} moveLabel="Marcar data" moveIcon={CalendarPlus} onConvert={(item) => startAddRestaurant(item.name, 'schedule', item.id)} onDelete={(id) => deleteFromList('schedule', id)} />}
        {view === 'list-restaurants' && <RestaurantListView restaurants={restaurants} initialFilter={listFilter} onTapRestaurant={(r) => { setSelected(r); setView('detail'); }} onBack={() => { setView('home'); setListFilter(null); }} onAdd={() => startAddRestaurant()} getOptions={getOptions} />}
        {view === 'list-appointments' && <AppointmentsListView appointments={appointments} onBack={() => setView('home')} onAdd={() => setQuickAdd('appointment')} onConvert={(item) => startAddRestaurant(item.name, 'appointments', item.id)} onDelete={(id) => deleteFromList('appointments', id)} />}
        {view === 'stats' && <StatsView restaurants={restaurants} onBack={() => setView('home')} />}
        {view === 'detail' && selected && <DetailView restaurant={selected} onBack={() => { setSelected(null); setView('home'); }} onEdit={() => startEditRestaurant(selected)} onDelete={() => setConfirmDelete(selected.id)} onTogglePosted={() => togglePosted(selected)} />}
        {view === 'add' && <AddFlow draft={draft} setDraft={setDraft} step={step} setStep={setStep} advance={advanceFromStep} retreat={retreatFromStep} onCancel={() => { setView('home'); setDraft(emptyDraft); setEditingId(null); }} onSave={saveDraft} isEditing={!!editingId} getOptions={getOptions} addCustomOption={addCustomOption} />}

        {quickAdd && <QuickAddModal type={quickAdd} onCancel={() => setQuickAdd(null)} onConfirm={(name, extra) => { if (quickAdd === 'wishlist') quickAddWishlist(name, extra?.note); else if (quickAdd === 'schedule') quickAddSchedule(name, extra?.note); else if (quickAdd === 'appointment') quickAddAppointment(name, extra?.date, extra?.note); setQuickAdd(null); }} />}
        {scheduleTarget && <ScheduleModal item={scheduleTarget} onCancel={() => setScheduleTarget(null)} onConfirm={(date) => { moveScheduleToAppointment(scheduleTarget, date); setScheduleTarget(null); }} />}
        {confirmDelete && (
          <div className="fixed inset-0 flex items-center justify-center px-5" style={{ background: 'rgba(26, 26, 26, 0.7)', zIndex: 50 }}>
            <div className="frame-border p-6 max-w-sm w-full">
              <h3 className="display-bold text-2xl mb-2 uppercase">Apagar registro?</h3>
              <p className="gray-warm text-sm mb-5">Essa ação não tem volta.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 input-field text-sm uppercase chip">Cancelar</button>
                <button onClick={() => deleteRestaurant(confirmDelete)} className="flex-1 py-3 charcoal-bg-deep cream text-sm uppercase chip">Apagar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="app-root flex items-center justify-center" style={{ minHeight: '100vh' }}>
      <Styles />
      <div className="display-heavy text-3xl gray-warm">CARREGANDO…</div>
    </div>
  );
}
function ErrorScreen({ error }) {
  return (
    <div className="app-root flex items-center justify-center p-6" style={{ minHeight: '100vh' }}>
      <Styles />
      <div className="frame-border p-6 max-w-md">
        <h2 className="display-heavy text-3xl uppercase mb-3">Erro de conexão</h2>
        <p className="mono text-sm gray-warm mb-3">{error}</p>
        <p className="mono text-xs gray-warm">Verifique a conexão com o Supabase nas variáveis de ambiente.</p>
      </div>
    </div>
  );
}

function Styles() {
  return <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    .app-root { font-family: 'Archivo', sans-serif; background: #DCDACE; color: #1A1A1A; min-height: 100vh; }
    .display-heavy { font-family: 'Archivo Black', sans-serif; letter-spacing: -0.02em; line-height: 0.92; }
    .display-bold { font-family: 'Archivo', sans-serif; font-weight: 800; letter-spacing: -0.01em; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .terracotta { color: #C97B5C; }
    .terracotta-bg { background: #C97B5C; }
    .charcoal { color: #1A1A1A; }
    .charcoal-bg-deep { background: #1A1A1A; }
    .blue-soft-bg { background: #B5C5D3; }
    .gray-warm { color: #6B6B66; }
    .cream { color: #ECEAE0; }
    .cream-bg { background: #ECEAE0; }
    .border-soft { border-color: #B0AEA1; }
    .header-stripe { background: #DCDACE; border-top: 1.5px solid #2D2D2A; border-bottom: 1.5px solid #2D2D2A; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.05em; text-transform: uppercase; color: #2D2D2A; }
    .header-stripe span:first-child { border-right: 1.5px solid #2D2D2A; padding-right: 16px; margin-right: 16px; flex: 1; }
    .frame-border { border: 1.5px solid #2D2D2A; background: #DCDACE; }
    .block-card { background: #ECEAE0; border: 1.5px solid #2D2D2A; transition: all 0.15s ease; }
    .block-card:hover { transform: translateY(-2px); box-shadow: 4px 4px 0 #2D2D2A; }
    .block-card-dark { background: #2D2D2A; color: #ECEAE0; border: 1.5px solid #2D2D2A; transition: all 0.15s ease; }
    .block-card-dark:hover { transform: translateY(-2px); box-shadow: 4px 4px 0 #C97B5C; }
    .block-card-blue { background: #B5C5D3; border: 1.5px solid #2D2D2A; }
    .chip { transition: all 0.15s ease; font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.03em; text-transform: uppercase; }
    .chip:hover { transform: translateY(-1px); }
    .input-field { background: #ECEAE0; border: 1.5px solid #2D2D2A; color: #1A1A1A; font-family: 'Archivo', sans-serif; }
    .input-field:focus { outline: none; box-shadow: 4px 4px 0 #C97B5C; transform: translate(-2px, -2px); }
    .star-fill { color: #C97B5C; }
    .fade-in { animation: fadeIn 0.25s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .cal-day-has-event { position: relative; }
    .cal-day-has-event::after { content: ''; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; background: #C97B5C; border-radius: 50%; }
  `}</style>;
}

// O resto dos componentes está no arquivo components.jsx
// (mesma lógica do app v3 que já testamos)
function Home(props) { return <HomeImpl {...props} />; }
function SimpleListView(props) { return <SimpleListViewImpl {...props} />; }
function RestaurantListView(props) { return <RestaurantListViewImpl {...props} />; }
function AppointmentsListView(props) { return <AppointmentsListViewImpl {...props} />; }
function StatsView(props) { return <StatsViewImpl {...props} />; }
function DetailView(props) { return <DetailViewImpl {...props} />; }
function AddFlow(props) { return <AddFlowImpl {...props} />; }
function QuickAddModal(props) { return <QuickAddModalImpl {...props} />; }
function ScheduleModal(props) { return <ScheduleModalImpl {...props} />; }

// === IMPLEMENTATIONS ===
function HomeImpl({ restaurants, wishlist, scheduleList, appointments, onTapRestaurant, onOpenList, onQuickAdd, onAddRestaurant, onMoveWishlistToSchedule, onMoveWishlistToVisited, onScheduleItem, onMoveScheduleToVisited, onMoveAppointmentToVisited, onDeleteFromList, onOpenStats }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcomingAppointments = useMemo(() => appointments.filter(a => new Date(a.date + 'T12:00:00') >= today), [appointments]);
  const visited = useMemo(() => restaurants.filter(r => !r.posted), [restaurants]);
  const posted = useMemo(() => restaurants.filter(r => r.posted), [restaurants]);
  return (
    <div className="fade-in">
      <div className="frame-border p-6 mb-4">
        <p className="mono text-xs uppercase mb-3" style={{ letterSpacing: '0.1em' }}>Caderno de mesas</p>
        <div className="flex items-end justify-between gap-3">
          <h1 className="display-heavy text-6xl uppercase">Tips by<br/>Gelly</h1>
          <button onClick={onOpenStats} className="block-card p-3 hover:scale-105 transition-transform"><BarChart3 size={20} /></button>
        </div>
        <p className="mono text-xs uppercase gray-warm mt-4" style={{ letterSpacing: '0.1em' }}>{restaurants.length} no acervo · {wishlist.length} wishlist · {scheduleList.length} pra agendar</p>
      </div>
      <BlockHeader title="Próximos agendamentos" count={upcomingAppointments.length} onAdd={() => onQuickAdd('appointment')} onSeeAll={appointments.length > 0 ? () => onOpenList('list-appointments') : null} />
      {upcomingAppointments.length === 0 ? <EmptyBlock text="Sem visitas marcadas" /> : (
        <div className="space-y-2 mb-6">{upcomingAppointments.slice(0, 5).map(a => (
          <div key={a.id} className="block-card flex items-center">
            <div className="charcoal-bg-deep cream w-14 h-14 flex flex-col items-center justify-center shrink-0">
              <span className="mono text-xs uppercase opacity-70">{MESES_SHORT[parseInt(a.date.slice(5, 7)) - 1]}</span>
              <span className="display-heavy text-xl">{a.date.slice(8, 10)}</span>
            </div>
            <div className="flex-1 min-w-0 p-3"><p className="display-bold text-base truncate">{a.name}</p>{a.note && <p className="mono text-xs gray-warm truncate mt-0.5">{a.note}</p>}</div>
            <button onClick={() => onMoveAppointmentToVisited(a)} className="terracotta-bg cream chip px-3 self-stretch hover:opacity-90 flex items-center gap-1"><Check size={12} /><span className="hidden sm:inline">Já fui</span></button>
          </div>
        ))}</div>
      )}
      <BlockHeader title="Calendário" />
      <Calendar appointments={appointments} onTapEvent={() => onOpenList('list-appointments')} />
      <BlockHeader title="Agendar" count={scheduleList.length} onAdd={() => onQuickAdd('schedule')} onSeeAll={scheduleList.length > 5 ? () => onOpenList('list-schedule') : null} />
      {scheduleList.length === 0 ? <EmptyBlock text="Nenhum convite pendente" /> : (
        <div className="space-y-2 mb-6">{scheduleList.slice(0, 5).map(item => (
          <ListItemCard key={item.id} item={item} primaryAction={{ label: 'Marcar data', icon: CalendarPlus, onClick: () => onScheduleItem(item) }} secondaryAction={{ label: 'Já fui', icon: Check, onClick: () => onMoveScheduleToVisited(item) }} onDelete={() => onDeleteFromList('schedule', item.id)} />
        ))}</div>
      )}
      <BlockHeader title="Quero conhecer" count={wishlist.length} onAdd={() => onQuickAdd('wishlist')} onSeeAll={wishlist.length > 5 ? () => onOpenList('list-wishlist') : null} />
      {wishlist.length === 0 ? <EmptyBlock text="Wishlist vazia" /> : (
        <div className="space-y-2 mb-6">{wishlist.slice(0, 5).map(item => (
          <ListItemCard key={item.id} item={item} primaryAction={{ label: 'Agendar', icon: Bookmark, onClick: () => onMoveWishlistToSchedule(item) }} secondaryAction={{ label: 'Já fui', icon: Check, onClick: () => onMoveWishlistToVisited(item) }} onDelete={() => onDeleteFromList('wishlist', item.id)} />
        ))}</div>
      )}
      <BlockHeader title="Visitados" count={visited.length} onAdd={onAddRestaurant} onSeeAll={restaurants.length > 0 ? () => onOpenList('list-restaurants') : null} />
      {visited.length === 0 ? <EmptyBlock text="Nenhum visitado pendente" /> : (
        <div className="space-y-2 mb-6">{visited.slice(0, 5).map(r => <RestaurantRow key={r.id} restaurant={r} onTap={() => onTapRestaurant(r)} />)}</div>
      )}
      <BlockHeader title="Postados" count={posted.length} onSeeAll={posted.length > 0 ? () => onOpenList('list-restaurants') : null} />
      {posted.length === 0 ? <EmptyBlock text="Nenhum post ainda" /> : (
        <div className="space-y-2 mb-10">{posted.slice(0, 5).map(r => <RestaurantRow key={r.id} restaurant={r} onTap={() => onTapRestaurant(r)} />)}</div>
      )}
    </div>
  );
}

function BlockHeader({ title, count, onSeeAll, onAdd }) {
  return (
    <div className="flex items-end justify-between mb-3 mt-2">
      <div className="flex items-baseline gap-3">
        <h2 className="display-heavy text-2xl uppercase">{title}</h2>
        {count !== undefined && <span className="mono text-xs uppercase gray-warm" style={{ letterSpacing: '0.1em' }}>[ {count.toString().padStart(2, '0')} ]</span>}
      </div>
      <div className="flex items-center gap-3">
        {onSeeAll && <button onClick={onSeeAll} className="mono text-xs uppercase terracotta hover:underline" style={{ letterSpacing: '0.05em' }}>ver todos →</button>}
        {onAdd && <button onClick={onAdd} className="charcoal-bg-deep cream w-7 h-7 flex items-center justify-center hover:opacity-90"><Plus size={14} /></button>}
      </div>
    </div>
  );
}

function EmptyBlock({ text }) {
  return <div className="block-card p-4 mb-6 text-center"><p className="mono text-xs uppercase gray-warm" style={{ letterSpacing: '0.05em' }}>{text}</p></div>;
}

function ListItemCard({ item, primaryAction, secondaryAction }) {
  const PrimIcon = primaryAction?.icon;
  const SecIcon = secondaryAction?.icon;
  return (
    <div className="block-card flex items-center">
      <div className="flex-1 p-4 min-w-0"><p className="display-bold text-base truncate">{item.name}</p>{item.note && <p className="mono text-xs gray-warm mt-0.5 truncate">{item.note}</p>}</div>
      <div className="flex items-stretch self-stretch">
        {secondaryAction && <button onClick={secondaryAction.onClick} className="terracotta-bg cream px-3 flex items-center gap-1 chip hover:opacity-90"><SecIcon size={12} /><span className="hidden md:inline">{secondaryAction.label}</span></button>}
        {primaryAction && <button onClick={primaryAction.onClick} className="charcoal-bg-deep cream px-3 flex items-center gap-1 chip hover:opacity-90"><PrimIcon size={12} /><span className="hidden md:inline">{primaryAction.label}</span></button>}
      </div>
    </div>
  );
}

function RestaurantRow({ restaurant: r, onTap }) {
  return (
    <button onClick={onTap} className="block-card w-full p-4 text-left flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5"><p className="display-bold text-base truncate">{r.name}</p>{r.posted && <Instagram size={12} className="terracotta shrink-0" />}</div>
        <p className="mono text-xs uppercase gray-warm" style={{ letterSpacing: '0.05em' }}>{[r.bairro, r.comida].filter(Boolean).join(' · ') || '—'}</p>
      </div>
      <div className="text-right shrink-0 flex items-center gap-3">
        {r.rating > 0 && <div className="flex items-center gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} size={11} className={s <= r.rating ? 'star-fill' : 'gray-warm'} fill={s <= r.rating ? 'currentColor' : 'none'} />)}</div>}
        {r.preco && <span className="display-bold text-sm">{r.preco}</span>}
      </div>
    </button>
  );
}

function Calendar({ appointments, onTapEvent }) {
  const [viewMonth, setViewMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const eventsByDay = useMemo(() => { const map = {}; appointments.forEach(a => { if (!map[a.date]) map[a.date] = []; map[a.date].push(a); }); return map; }, [appointments]);
  const firstDay = new Date(viewMonth.year, viewMonth.month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === viewMonth.year && today.getMonth() === viewMonth.month;
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, dateStr, events: eventsByDay[dateStr] || [], isToday: isCurrentMonth && d === today.getDate() });
  }
  const monthEvents = Object.entries(eventsByDay).filter(([d]) => d.startsWith(`${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, '0')}`)).sort().flatMap(([date, evts]) => evts.map(e => ({ ...e, displayDate: date })));
  return (
    <div className="block-card p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewMonth(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })} className="p-2 hover:opacity-70"><ChevronLeft size={18} /></button>
        <p className="display-bold text-base uppercase">{MESES[viewMonth.month]} {viewMonth.year}</p>
        <button onClick={() => setViewMonth(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })} className="p-2 hover:opacity-70"><ChevronRight size={18} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">{DIAS_SEMANA.map((d, i) => <div key={i} className="mono text-xs uppercase gray-warm text-center" style={{ letterSpacing: '0.1em' }}>{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">{cells.map((cell, i) => (
        <div key={i} className="aspect-square">{cell && (
          <button onClick={() => cell.events.length > 0 && onTapEvent(cell.events[0])} disabled={cell.events.length === 0} className={`w-full h-full flex items-center justify-center text-sm relative ${cell.events.length > 0 ? 'cal-day-has-event cursor-pointer hover:opacity-80' : 'cursor-default'} ${cell.isToday ? 'charcoal-bg-deep cream display-bold' : ''}`} style={cell.events.length > 0 && !cell.isToday ? { background: '#DCDACE', border: '1px solid #2D2D2A' } : {}}>{cell.day}</button>
        )}</div>
      ))}</div>
      {monthEvents.length > 0 && (
        <div className="mt-4 pt-3 border-t border-soft">
          <p className="mono text-xs uppercase gray-warm mb-2" style={{ letterSpacing: '0.1em' }}>Visitas no mês</p>
          {monthEvents.map(e => <div key={e.id} className="flex items-center gap-3 py-1.5"><span className="mono text-xs charcoal display-bold">{e.displayDate.slice(8, 10)}</span><span className="text-sm flex-1">{e.name}</span></div>)}
        </div>
      )}
    </div>
  );
}

function SimpleListViewImpl({ title, items, onBack, onQuickAdd, onMove, moveLabel, moveIcon: MoveIcon, onConvert, onDelete }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => { const q = search.toLowerCase().trim(); if (!q) return items; return items.filter(i => i.name.toLowerCase().includes(q) || (i.note || '').toLowerCase().includes(q)); }, [items, search]);
  return (
    <div className="fade-in">
      <button onClick={onBack} className="flex items-center gap-1 text-sm gray-warm mb-4 mono uppercase" style={{ letterSpacing: '0.05em' }}><ChevronLeft size={16} />Voltar</button>
      <div className="frame-border p-5 mb-4 flex items-end justify-between gap-3">
        <div><p className="mono text-xs uppercase mb-2" style={{ letterSpacing: '0.1em' }}>Lista</p><h1 className="display-heavy text-4xl uppercase">{title}</h1><p className="mono text-xs uppercase gray-warm mt-3" style={{ letterSpacing: '0.1em' }}>{filtered.length} {filtered.length === 1 ? 'item' : 'itens'}</p></div>
        <button onClick={onQuickAdd} className="charcoal-bg-deep cream w-11 h-11 flex items-center justify-center hover:opacity-90 shrink-0" style={{ boxShadow: '3px 3px 0 #C97B5C' }}><Plus size={20} /></button>
      </div>
      <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 gray-warm" size={16} /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="buscar…" className="input-field w-full pl-10 pr-9 py-3 text-sm" />{search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 gray-warm"><X size={16} /></button>}</div>
      <div className="space-y-2">{filtered.length === 0 ? <div className="block-card p-6 text-center"><p className="mono text-xs uppercase gray-warm">Lista vazia</p></div> : filtered.map(item => <ListItemCard key={item.id} item={item} primaryAction={{ label: moveLabel, icon: MoveIcon, onClick: () => onMove(item) }} secondaryAction={{ label: 'Já fui', icon: Check, onClick: () => onConvert(item) }} onDelete={() => onDelete(item.id)} />)}</div>
    </div>
  );
}

function AppointmentsListViewImpl({ appointments, onBack, onAdd, onConvert, onDelete }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = appointments.filter(a => new Date(a.date + 'T12:00:00') >= today);
  const past = appointments.filter(a => new Date(a.date + 'T12:00:00') < today).reverse();
  return (
    <div className="fade-in">
      <button onClick={onBack} className="flex items-center gap-1 text-sm gray-warm mb-4 mono uppercase" style={{ letterSpacing: '0.05em' }}><ChevronLeft size={16} />Voltar</button>
      <div className="frame-border p-5 mb-4 flex items-end justify-between gap-3">
        <div><p className="mono text-xs uppercase mb-2" style={{ letterSpacing: '0.1em' }}>Lista</p><h1 className="display-heavy text-4xl uppercase">Agendamentos</h1><p className="mono text-xs uppercase gray-warm mt-3" style={{ letterSpacing: '0.1em' }}>{appointments.length} no total</p></div>
        <button onClick={onAdd} className="charcoal-bg-deep cream w-11 h-11 flex items-center justify-center hover:opacity-90 shrink-0" style={{ boxShadow: '3px 3px 0 #C97B5C' }}><Plus size={20} /></button>
      </div>
      {upcoming.length > 0 && <><p className="mono text-xs uppercase gray-warm mb-2 mt-2" style={{ letterSpacing: '0.1em' }}>Próximos</p><div className="space-y-2 mb-6">{upcoming.map(a => <AppointmentCard key={a.id} appointment={a} onConvert={() => onConvert(a)} onDelete={() => onDelete(a.id)} />)}</div></>}
      {past.length > 0 && <><p className="mono text-xs uppercase gray-warm mb-2 mt-2" style={{ letterSpacing: '0.1em' }}>Passados</p><div className="space-y-2 mb-6 opacity-60">{past.map(a => <AppointmentCard key={a.id} appointment={a} onConvert={() => onConvert(a)} onDelete={() => onDelete(a.id)} />)}</div></>}
      {appointments.length === 0 && <div className="block-card p-6 text-center"><p className="mono text-xs uppercase gray-warm">Nenhum agendamento</p></div>}
    </div>
  );
}

function AppointmentCard({ appointment: a, onConvert, onDelete }) {
  return (
    <div className="block-card flex items-center">
      <div className="charcoal-bg-deep cream w-14 h-14 flex flex-col items-center justify-center shrink-0"><span className="mono text-xs uppercase opacity-70">{MESES_SHORT[parseInt(a.date.slice(5, 7)) - 1]}</span><span className="display-heavy text-xl">{a.date.slice(8, 10)}</span></div>
      <div className="flex-1 min-w-0 p-3"><p className="display-bold text-base truncate">{a.name}</p>{a.note && <p className="mono text-xs gray-warm truncate mt-0.5">{a.note}</p>}</div>
      <button onClick={onConvert} className="terracotta-bg cream chip px-3 self-stretch hover:opacity-90 flex items-center gap-1"><Check size={12} /><span className="hidden md:inline">Já fui</span></button>
      <button onClick={onDelete} className="px-3 self-stretch hover:opacity-70 gray-warm"><Trash2 size={14} /></button>
    </div>
  );
}

function RestaurantListViewImpl({ restaurants, initialFilter, onTapRestaurant, onBack, onAdd, getOptions }) {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ posted: initialFilter || 'all', tipos: [], comidas: [], bairros: [], precos: [], estilos: [], ocasioes: [], minRating: 0, kid: false, pet: false });
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return restaurants.filter(r => {
      if (q) { const hay = `${r.name} ${r.comida} ${r.bairro} ${r.pedido} ${r.comentarios} ${(r.tipo || []).join(' ')} ${(r.ocasiao || []).join(' ')}`.toLowerCase(); if (!hay.includes(q)) return false; }
      if (filters.posted === 'visited' && r.posted) return false;
      if (filters.posted === 'posted' && !r.posted) return false;
      if (filters.tipos.length && !filters.tipos.some(t => (r.tipo || []).includes(t))) return false;
      if (filters.comidas.length && !filters.comidas.includes(r.comida)) return false;
      if (filters.bairros.length && !filters.bairros.includes(r.bairro)) return false;
      if (filters.precos.length && !filters.precos.includes(r.preco)) return false;
      if (filters.minRating && r.rating < filters.minRating) return false;
      if (filters.estilos.length && !filters.estilos.some(s => (r.estilo || []).includes(s))) return false;
      if (filters.ocasioes.length && !filters.ocasioes.some(o => (r.ocasiao || []).includes(o))) return false;
      if (filters.kid && !r.kid) return false;
      if (filters.pet && !r.pet) return false;
      return true;
    });
  }, [restaurants, search, filters]);
  const activeFilterCount = (filters.posted !== 'all' ? 1 : 0) + filters.tipos.length + filters.comidas.length + filters.bairros.length + filters.precos.length + filters.estilos.length + filters.ocasioes.length + (filters.minRating ? 1 : 0) + (filters.kid ? 1 : 0) + (filters.pet ? 1 : 0);
  return (
    <div className="fade-in">
      <button onClick={onBack} className="flex items-center gap-1 text-sm gray-warm mb-4 mono uppercase" style={{ letterSpacing: '0.05em' }}><ChevronLeft size={16} />Voltar</button>
      <div className="frame-border p-5 mb-4 flex items-end justify-between gap-3">
        <div><p className="mono text-xs uppercase mb-2" style={{ letterSpacing: '0.1em' }}>Acervo</p><h1 className="display-heavy text-4xl uppercase">Restaurantes</h1><p className="mono text-xs uppercase gray-warm mt-3" style={{ letterSpacing: '0.1em' }}>{filtered.length} de {restaurants.length}</p></div>
        <button onClick={onAdd} className="charcoal-bg-deep cream w-11 h-11 flex items-center justify-center hover:opacity-90 shrink-0" style={{ boxShadow: '3px 3px 0 #C97B5C' }}><Plus size={20} /></button>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 gray-warm" size={16} /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="buscar…" className="input-field w-full pl-10 pr-9 py-3 text-sm" />{search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 gray-warm"><X size={16} /></button>}</div>
        <button onClick={() => setShowFilters(!showFilters)} className={`px-4 chip flex items-center gap-2 ${showFilters || activeFilterCount > 0 ? 'charcoal-bg-deep cream' : 'input-field'}`}><SlidersHorizontal size={14} />{activeFilterCount > 0 && <span>{activeFilterCount}</span>}</button>
      </div>
      {showFilters && (
        <div className="block-card p-4 mb-4 fade-in">
          <div className="mb-3"><p className="mono text-xs uppercase gray-warm mb-2" style={{ letterSpacing: '0.1em' }}>Mostrar</p><div className="flex gap-2">{[['all', 'Todos'], ['visited', 'Só visitados'], ['posted', 'Só postados']].map(([k, l]) => <button key={k} onClick={() => setFilters(f => ({ ...f, posted: k }))} className={`chip px-3 py-1.5 ${filters.posted === k ? 'charcoal-bg-deep cream' : 'input-field'}`}>{l}</button>)}</div></div>
          <FilterChipSection title="Cozinha" options={getOptions('comidas').filter(c => restaurants.some(r => r.comida === c))} selected={filters.comidas} onToggle={v => setFilters(f => ({ ...f, comidas: f.comidas.includes(v) ? f.comidas.filter(x => x !== v) : [...f.comidas, v] }))} />
          <FilterChipSection title="Bairro" options={getOptions('bairros').filter(b => restaurants.some(r => r.bairro === b))} selected={filters.bairros} onToggle={v => setFilters(f => ({ ...f, bairros: f.bairros.includes(v) ? f.bairros.filter(x => x !== v) : [...f.bairros, v] }))} />
          <FilterChipSection title="Ocasião" options={getOptions('ocasioes').filter(o => restaurants.some(r => (r.ocasiao || []).includes(o)))} selected={filters.ocasioes} onToggle={v => setFilters(f => ({ ...f, ocasioes: f.ocasioes.includes(v) ? f.ocasioes.filter(x => x !== v) : [...f.ocasioes, v] }))} />
          <div className="mb-3"><p className="mono text-xs uppercase gray-warm mb-2" style={{ letterSpacing: '0.1em' }}>Preço</p><div className="flex gap-2 flex-wrap">{PRECOS.map(p => <button key={p} onClick={() => setFilters(f => ({ ...f, precos: f.precos.includes(p) ? f.precos.filter(x => x !== p) : [...f.precos, p] }))} className={`chip px-3 py-1.5 ${filters.precos.includes(p) ? 'charcoal-bg-deep cream' : 'input-field'}`}>{p}</button>)}</div></div>
          <div className="mb-3"><p className="mono text-xs uppercase gray-warm mb-2" style={{ letterSpacing: '0.1em' }}>Nota mínima</p><div className="flex gap-2">{[0, 3, 4, 5].map(r => <button key={r} onClick={() => setFilters(f => ({ ...f, minRating: r }))} className={`chip px-3 py-1.5 flex items-center gap-1 ${filters.minRating === r ? 'charcoal-bg-deep cream' : 'input-field'}`}>{r === 0 ? 'qualquer' : <>{r}+ <Star size={11} fill="currentColor" /></>}</button>)}</div></div>
          <div className="flex gap-2 flex-wrap"><button onClick={() => setFilters(f => ({ ...f, kid: !f.kid }))} className={`chip px-3 py-1.5 flex items-center gap-1.5 ${filters.kid ? 'charcoal-bg-deep cream' : 'input-field'}`}><Baby size={12} /> com criança</button><button onClick={() => setFilters(f => ({ ...f, pet: !f.pet }))} className={`chip px-3 py-1.5 flex items-center gap-1.5 ${filters.pet ? 'charcoal-bg-deep cream' : 'input-field'}`}><Dog size={12} /> pet friendly</button></div>
        </div>
      )}
      <div className="space-y-2">{filtered.length === 0 ? <div className="block-card p-6 text-center"><p className="mono text-xs uppercase gray-warm">Nada encontrado</p></div> : filtered.map(r => <RestaurantRow key={r.id} restaurant={r} onTap={() => onTapRestaurant(r)} />)}</div>
    </div>
  );
}

function FilterChipSection({ title, options, selected, onToggle }) {
  if (options.length === 0) return null;
  return <div className="mb-3"><p className="mono text-xs uppercase gray-warm mb-2" style={{ letterSpacing: '0.1em' }}>{title}</p><div className="flex gap-2 flex-wrap">{options.map(o => <button key={o} onClick={() => onToggle(o)} className={`chip px-3 py-1.5 ${selected.includes(o) ? 'charcoal-bg-deep cream' : 'input-field'}`}>{o}</button>)}</div></div>;
}

function StatsViewImpl({ restaurants, onBack }) {
  const stats = useMemo(() => {
    const total = restaurants.length;
    const postedCount = restaurants.filter(r => r.posted).length;
    const visitedCount = total - postedCount;
    const rated = restaurants.filter(r => r.rating);
    const avgRating = rated.length ? (rated.reduce((s, r) => s + (r.rating || 0), 0) / rated.length).toFixed(1) : 0;
    const byMonth = {};
    restaurants.forEach(r => { if (!r.data) return; const ym = r.data.slice(0, 7); byMonth[ym] = (byMonth[ym] || 0) + 1; });
    const monthsSorted = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));
    const topCount = (field) => { const counts = {}; restaurants.forEach(r => { const vals = Array.isArray(r[field]) ? r[field] : (r[field] ? [r[field]] : []); vals.forEach(v => { if (v) counts[v] = (counts[v] || 0) + 1; }); }); return Object.entries(counts).sort((a, b) => b[1] - a[1]); };
    return { total, postedCount, visitedCount, avgRating, byMonth: monthsSorted, topCozinhas: topCount('comida').slice(0, 5), topBairros: topCount('bairro').slice(0, 5), topOcasioes: topCount('ocasiao').slice(0, 5), topTipos: topCount('tipo').slice(0, 5), ratings: [5, 4, 3, 2, 1].map(n => ({ n, count: restaurants.filter(r => r.rating === n).length })) };
  }, [restaurants]);
  const maxMonth = Math.max(...stats.byMonth.map(([, c]) => c), 1);
  return (
    <div className="fade-in">
      <button onClick={onBack} className="flex items-center gap-1 text-sm gray-warm mb-4 mono uppercase" style={{ letterSpacing: '0.05em' }}><ChevronLeft size={16} />Voltar</button>
      <div className="frame-border p-5 mb-4"><p className="mono text-xs uppercase mb-2" style={{ letterSpacing: '0.1em' }}>Insights</p><h1 className="display-heavy text-4xl uppercase">Estatísticas</h1></div>
      <div className="grid grid-cols-2 gap-3 mb-4"><StatCard label="Total" value={stats.total} dark /><StatCard label="Nota média" value={stats.avgRating} accent /><StatCard label="Visitados" value={stats.visitedCount} /><StatCard label="Postados" value={stats.postedCount} /></div>
      {stats.byMonth.length > 0 && (
        <div className="block-card p-5 mb-4"><p className="mono text-xs uppercase gray-warm mb-3" style={{ letterSpacing: '0.1em' }}>Visitas por mês</p>
          <div className="space-y-2">{stats.byMonth.map(([ym, count]) => { const [year, month] = ym.split('-'); const label = `${MESES_SHORT[parseInt(month) - 1]}/${year.slice(2)}`; const pct = (count / maxMonth) * 100; return <div key={ym} className="flex items-center gap-3"><span className="mono text-xs uppercase gray-warm w-14">{label}</span><div className="flex-1 h-6 relative" style={{ background: '#DCDACE', border: '1px solid #2D2D2A' }}><div className="h-full terracotta-bg" style={{ width: `${pct}%` }} /></div><span className="mono text-sm display-bold w-6 text-right">{count}</span></div>; })}</div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4"><TopList title="Top cozinhas" data={stats.topCozinhas} /><TopList title="Top bairros" data={stats.topBairros} /><TopList title="Top ocasiões" data={stats.topOcasioes} /><TopList title="Top tipos" data={stats.topTipos} /></div>
      <div className="block-card p-5 mb-4"><p className="mono text-xs uppercase gray-warm mb-3" style={{ letterSpacing: '0.1em' }}>Distribuição de notas</p>{stats.ratings.map(r => { const max = Math.max(...stats.ratings.map(x => x.count), 1); const pct = (r.count / max) * 100; return <div key={r.n} className="flex items-center gap-3 mb-1.5"><span className="flex items-center gap-0.5 w-20">{[1,2,3,4,5].map(s => <Star key={s} size={11} className={s <= r.n ? 'star-fill' : 'gray-warm'} fill={s <= r.n ? 'currentColor' : 'none'} />)}</span><div className="flex-1 h-5 relative" style={{ background: '#DCDACE', border: '1px solid #2D2D2A' }}><div className="h-full" style={{ width: `${pct}%`, background: '#2D2D2A' }} /></div><span className="mono text-sm display-bold w-6 text-right">{r.count}</span></div>; })}</div>
    </div>
  );
}
function StatCard({ label, value, dark, accent }) { return <div className={`p-5 ${dark ? 'block-card-dark' : accent ? 'block-card-blue' : 'block-card'}`}><p className="mono text-xs uppercase opacity-70 mb-2" style={{ letterSpacing: '0.1em' }}>{label}</p><p className="display-heavy text-4xl">{value}</p></div>; }
function TopList({ title, data }) { if (data.length === 0) return null; const max = data[0][1]; return <div className="block-card p-5"><p className="mono text-xs uppercase gray-warm mb-3" style={{ letterSpacing: '0.1em' }}>{title}</p>{data.map(([name, count]) => <div key={name} className="flex items-center gap-3 mb-2"><div className="flex-1 min-w-0"><p className="text-sm truncate display-bold">{name}</p><div className="h-1 mt-1" style={{ background: '#DCDACE' }}><div className="h-full terracotta-bg" style={{ width: `${(count / max) * 100}%` }} /></div></div><span className="mono text-sm display-bold">{count}</span></div>)}</div>; }

function QuickAddModalImpl({ type, onCancel, onConfirm }) {
  const [name, setName] = useState(''); const [note, setNote] = useState(''); const [date, setDate] = useState('');
  const titles = { wishlist: 'Adicionar à Wishlist', schedule: 'Adicionar pra Agendar', appointment: 'Novo Agendamento' };
  const subtitles = { wishlist: 'Lugar que você quer conhecer', schedule: 'Convite recebido, falta marcar', appointment: 'Visita marcada no calendário' };
  const isValid = type === 'appointment' ? (name.trim() && date) : !!name.trim();
  return (
    <div className="fixed inset-0 flex items-center justify-center px-5" style={{ background: 'rgba(26, 26, 26, 0.7)', zIndex: 50 }}>
      <div className="frame-border p-6 max-w-sm w-full">
        <p className="mono text-xs uppercase mb-2" style={{ letterSpacing: '0.1em' }}>{subtitles[type]}</p>
        <h3 className="display-heavy text-2xl uppercase mb-4">{titles[type]}</h3>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="nome do restaurante" className="input-field w-full px-4 py-3 mb-3 display-bold text-base" autoFocus />
        {type === 'appointment' && <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field w-full px-4 py-3 mb-3" />}
        <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="observação (opcional)" className="input-field w-full px-4 py-3 mb-5 text-sm" />
        <div className="flex gap-3"><button onClick={onCancel} className="flex-1 py-3 input-field text-sm uppercase chip">Cancelar</button><button onClick={() => isValid && onConfirm(name, { note, date })} disabled={!isValid} className={`flex-1 py-3 text-sm uppercase chip ${isValid ? 'charcoal-bg-deep cream' : 'opacity-40 input-field cursor-not-allowed'}`}>Adicionar</button></div>
      </div>
    </div>
  );
}

function ScheduleModalImpl({ item, onCancel, onConfirm }) {
  const [date, setDate] = useState('');
  return (
    <div className="fixed inset-0 flex items-center justify-center px-5" style={{ background: 'rgba(26, 26, 26, 0.7)', zIndex: 50 }}>
      <div className="frame-border p-6 max-w-sm w-full">
        <p className="mono text-xs uppercase mb-2" style={{ letterSpacing: '0.1em' }}>Marcar data</p>
        <h3 className="display-heavy text-2xl uppercase mb-4">{item.name}</h3>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field w-full px-4 py-3 mb-5" autoFocus />
        <div className="flex gap-3"><button onClick={onCancel} className="flex-1 py-3 input-field text-sm uppercase chip">Cancelar</button><button onClick={() => date && onConfirm(date)} disabled={!date} className={`flex-1 py-3 text-sm uppercase chip ${date ? 'charcoal-bg-deep cream' : 'opacity-40 input-field cursor-not-allowed'}`}>Confirmar</button></div>
      </div>
    </div>
  );
}

function OptionsPicker({ source, multi, value, onChange, getOptions, addCustomOption }) {
  const [showCustom, setShowCustom] = useState(false); const [customValue, setCustomValue] = useState('');
  const options = getOptions(source);
  const isSelected = (o) => multi ? value.includes(o) : value === o;
  const toggle = (o) => { if (multi) onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o]); else onChange(value === o ? '' : o); };
  const addCustom = async () => { const v = customValue.trim(); if (!v) return; await addCustomOption(source, v); if (multi) onChange([...value, v]); else onChange(v); setCustomValue(''); setShowCustom(false); };
  return (
    <div>
      <div className="flex gap-2 flex-wrap">{options.map(o => <button key={o} onClick={() => toggle(o)} className={`chip px-3 py-2 flex items-center gap-1.5 ${isSelected(o) ? 'charcoal-bg-deep cream' : 'input-field'}`}>{multi && isSelected(o) && <Check size={12} />}{o}</button>)}<button onClick={() => setShowCustom(true)} className="chip px-3 py-2 flex items-center gap-1.5 input-field" style={{ borderStyle: 'dashed' }}><Plus size={12} /> Outro</button></div>
      {showCustom && <div className="mt-3 flex gap-2 fade-in"><input type="text" value={customValue} onChange={e => setCustomValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addCustom(); if (e.key === 'Escape') { setShowCustom(false); setCustomValue(''); } }} placeholder="digite e aperte enter…" className="input-field flex-1 px-4 py-2.5 text-sm" autoFocus /><button onClick={addCustom} disabled={!customValue.trim()} className={`px-4 text-sm chip uppercase ${customValue.trim() ? 'charcoal-bg-deep cream' : 'input-field opacity-50'}`}>Add</button></div>}
    </div>
  );
}

function AddFlowImpl({ draft, setDraft, step, setStep, advance, retreat, onCancel, onSave, isEditing, getOptions, addCustomOption }) {
  const q = QUESTIONS[step];
  const total = QUESTIONS.length;
  const visibleSteps = QUESTIONS.filter(qq => !qq.showIf || qq.showIf(draft));
  const visibleIndex = visibleSteps.findIndex(qq => qq.key === q.key);
  const isLastVisible = () => { let next = step + 1; while (next < total && QUESTIONS[next].showIf && !QUESTIONS[next].showIf(draft)) next++; return next >= total; };
  const canProceed = () => { if (q.optional) return true; const v = draft[q.key]; if (q.type === 'multi' || q.type === 'flags') return true; if (q.type === 'rating') return v > 0; if (q.type === 'yesno') return true; return typeof v === 'string' && v.trim().length > 0; };
  const next = () => { if (isLastVisible()) onSave(); else setStep(advance(step)); };
  const prev = () => { if (step === 0) onCancel(); else { const p = retreat(step); setStep(p < 0 ? 0 : p); } };
  return (
    <div className="fade-in min-h-screen pt-2 pb-32 flex flex-col">
      <div className="flex items-center justify-between mb-6"><button onClick={prev} className="flex items-center gap-1 text-sm gray-warm mono uppercase" style={{ letterSpacing: '0.05em' }}><ChevronLeft size={16} />{step === 0 ? 'Cancelar' : 'Voltar'}</button><p className="mono text-xs uppercase gray-warm" style={{ letterSpacing: '0.1em' }}>{isEditing ? 'editando' : 'novo'} · {visibleIndex + 1}/{visibleSteps.length}</p></div>
      <div className="flex gap-1 mb-8">{visibleSteps.map((vs, i) => <div key={vs.key} className="h-1 flex-1" style={{ background: i <= visibleIndex ? '#2D2D2A' : '#B0AEA1' }} />)}</div>
      <div className="flex-1 fade-in" key={step}>
        <h2 className="display-heavy text-3xl uppercase leading-tight mb-2">{q.label}</h2>
        {q.hint && <p className="mono text-xs uppercase gray-warm mb-6" style={{ letterSpacing: '0.05em' }}>{q.hint}</p>}
        {!q.hint && <div className="mb-6" />}
        {q.type === 'text' && <input type="text" value={draft[q.key]} onChange={e => setDraft(d => ({ ...d, [q.key]: e.target.value }))} placeholder={q.placeholder} className="input-field w-full px-4 py-4 text-lg display-bold" autoFocus />}
        {q.type === 'textarea' && <textarea value={draft[q.key]} onChange={e => setDraft(d => ({ ...d, [q.key]: e.target.value }))} placeholder={q.placeholder} rows={5} className="input-field w-full px-4 py-4 text-base resize-none" autoFocus />}
        {q.type === 'url' && <input type="url" value={draft[q.key]} onChange={e => setDraft(d => ({ ...d, [q.key]: e.target.value }))} placeholder={q.placeholder} className="input-field w-full px-4 py-4 text-base" autoFocus />}
        {q.type === 'date' && <input type="date" value={draft[q.key]} onChange={e => setDraft(d => ({ ...d, [q.key]: e.target.value }))} className="input-field w-full px-4 py-4 text-base" autoFocus />}
        {(q.type === 'multi' || q.type === 'single') && <OptionsPicker source={q.source} multi={q.type === 'multi'} value={draft[q.key]} onChange={(v) => setDraft(d => ({ ...d, [q.key]: v }))} getOptions={getOptions} addCustomOption={addCustomOption} />}
        {q.type === 'preco' && <div className="space-y-2">{PRECOS.map((p, i) => <button key={p} onClick={() => setDraft(d => ({ ...d, preco: p }))} className={`w-full px-5 py-4 flex items-center justify-between chip ${draft.preco === p ? 'charcoal-bg-deep cream' : 'input-field'}`}><span className="display-heavy text-2xl normal-case">{p}</span><span className="mono text-xs">{PRECO_HINTS[i]}</span></button>)}</div>}
        {q.type === 'rating' && <div className="flex gap-2 justify-center py-6">{[1,2,3,4,5].map(s => <button key={s} onClick={() => setDraft(d => ({ ...d, rating: s }))} className="hover:scale-110 transition-transform"><Star size={48} className={s <= draft.rating ? 'star-fill' : 'gray-warm'} fill={s <= draft.rating ? 'currentColor' : 'none'} strokeWidth={1.5} /></button>)}</div>}
        {q.type === 'yesno' && <div className="flex gap-3"><button onClick={() => setDraft(d => ({ ...d, posted: false }))} className={`flex-1 py-5 chip uppercase ${!draft.posted ? 'charcoal-bg-deep cream' : 'input-field'}`}>Ainda não</button><button onClick={() => setDraft(d => ({ ...d, posted: true }))} className={`flex-1 py-5 chip uppercase ${draft.posted ? 'charcoal-bg-deep cream' : 'input-field'}`}>Já postei</button></div>}
        {q.type === 'flags' && <div className="space-y-3"><button onClick={() => setDraft(d => ({ ...d, kid: !d.kid }))} className={`w-full px-5 py-4 flex items-center justify-between chip ${draft.kid ? 'charcoal-bg-deep cream' : 'input-field'}`}><span className="flex items-center gap-3"><Baby size={20} /><span className="display-bold text-base normal-case tracking-normal">Bom pra ir com criança</span></span><span className="text-sm">{draft.kid ? 'sim' : 'não'}</span></button><button onClick={() => setDraft(d => ({ ...d, pet: !d.pet }))} className={`w-full px-5 py-4 flex items-center justify-between chip ${draft.pet ? 'charcoal-bg-deep cream' : 'input-field'}`}><span className="flex items-center gap-3"><Dog size={20} /><span className="display-bold text-base normal-case tracking-normal">Pet friendly</span></span><span className="text-sm">{draft.pet ? 'sim' : 'não'}</span></button></div>}
      </div>
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4" style={{ background: 'linear-gradient(to top, #DCDACE 70%, transparent)', zIndex: 20 }}>
        <div className="max-w-3xl mx-auto flex gap-3">{q.optional && !isLastVisible() && <button onClick={() => setStep(advance(step))} className="flex-1 py-4 input-field text-sm chip uppercase">Pular</button>}<button onClick={next} disabled={!canProceed()} className={`flex-1 py-4 text-sm chip flex items-center justify-center gap-2 uppercase ${canProceed() ? 'charcoal-bg-deep cream' : 'input-field opacity-50 cursor-not-allowed'}`}>{isLastVisible() ? 'Salvar' : 'Continuar'}{!isLastVisible() && <ArrowRight size={14} />}</button></div>
      </div>
    </div>
  );
}

function DetailViewImpl({ restaurant: r, onBack, onEdit, onDelete, onTogglePosted }) {
  const formatDate = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
  return (
    <div className="fade-in pt-2">
      <button onClick={onBack} className="flex items-center gap-1 text-sm gray-warm mb-4 mono uppercase" style={{ letterSpacing: '0.05em' }}><ChevronLeft size={16} />Voltar</button>
      <div className="frame-border p-6 mb-4">
        <div className="flex items-center gap-2 mb-3"><span className="mono text-xs uppercase px-2 py-1 charcoal-bg-deep cream flex items-center gap-1.5" style={{ letterSpacing: '0.05em' }}>{r.posted ? <><Instagram size={11} />Postado</> : <><Eye size={11} />Visitado</>}</span></div>
        <h1 className="display-heavy text-5xl uppercase leading-none mb-3">{r.name}</h1>
        {(r.comida || r.bairro) && <p className="mono text-xs uppercase gray-warm mb-4" style={{ letterSpacing: '0.1em' }}>{[r.comida, r.bairro].filter(Boolean).join(' · ')}</p>}
        <div className="flex items-center gap-4 flex-wrap">{r.rating > 0 && <div className="flex items-center gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} size={18} className={s <= r.rating ? 'star-fill' : 'gray-warm'} fill={s <= r.rating ? 'currentColor' : 'none'} />)}</div>}{r.preco && <span className="display-bold text-lg">{r.preco}</span>}{r.kid && <span className="flex items-center gap-1 text-sm gray-warm"><Baby size={14} />criança</span>}{r.pet && <span className="flex items-center gap-1 text-sm gray-warm"><Dog size={14} />pet</span>}</div>
      </div>
      <button onClick={onTogglePosted} className="block-card w-full p-4 mb-4 flex items-center justify-between chip uppercase"><span className="flex items-center gap-3"><Instagram size={16} /><span className="display-bold text-sm">{r.posted ? 'Marcar como não postado' : 'Marcar como postado'}</span></span><ArrowRight size={16} /></button>
      {r.tipo && r.tipo.length > 0 && <div className="mb-3"><p className="mono text-xs uppercase gray-warm mb-2" style={{ letterSpacing: '0.1em' }}>Tipo</p><div className="flex gap-1.5 flex-wrap">{r.tipo.map(t => <span key={t} className="chip block-card px-3 py-1">{t}</span>)}</div></div>}
      {r.ocasiao && r.ocasiao.length > 0 && <div className="mb-3"><p className="mono text-xs uppercase gray-warm mb-2" style={{ letterSpacing: '0.1em' }}>Ocasiões</p><div className="flex gap-1.5 flex-wrap">{r.ocasiao.map(o => <span key={o} className="chip terracotta-bg cream px-3 py-1">{o}</span>)}</div></div>}
      {r.estilo && r.estilo.length > 0 && <div className="mb-6"><p className="mono text-xs uppercase gray-warm mb-2" style={{ letterSpacing: '0.1em' }}>Estilo</p><div className="flex gap-1.5 flex-wrap">{r.estilo.map(e => <span key={e} className="chip block-card px-3 py-1">{e}</span>)}</div></div>}
      <div className="space-y-3">{r.pedido && <Section title="Pedido">{r.pedido}</Section>}{r.comentarios && <Section title="Comentários">{r.comentarios}</Section>}</div>
      <div className="mt-5 space-y-2">{r.website && <a href={r.website} target="_blank" rel="noopener noreferrer" className="block-card w-full p-4 flex items-center justify-between text-sm"><span className="flex items-center gap-2 mono text-xs uppercase gray-warm" style={{ letterSpacing: '0.1em' }}><ExternalLink size={14} />Site</span><span className="truncate ml-3 max-w-xs">{r.website.replace(/^https?:\/\//, '')}</span></a>}{r.postLink && <a href={r.postLink} target="_blank" rel="noopener noreferrer" className="block-card w-full p-4 flex items-center justify-between text-sm"><span className="flex items-center gap-2 mono text-xs uppercase gray-warm" style={{ letterSpacing: '0.1em' }}><Instagram size={14} />Post</span><span className="truncate ml-3 max-w-xs">{r.postLink.replace(/^https?:\/\//, '')}</span></a>}{r.data && <div className="block-card w-full p-4 flex items-center justify-between text-sm"><span className="flex items-center gap-2 mono text-xs uppercase gray-warm" style={{ letterSpacing: '0.1em' }}><CalendarIcon size={14} />Visitado em</span><span>{formatDate(r.data)}</span></div>}</div>
      <div className="flex gap-3 mt-8"><button onClick={onEdit} className="flex-1 py-3 input-field text-sm chip uppercase flex items-center justify-center gap-2"><Edit2 size={14} /> Editar</button><button onClick={onDelete} className="py-3 px-5 input-field text-sm gray-warm chip flex items-center justify-center"><Trash2 size={14} /></button></div>
    </div>
  );
}

function Section({ title, children }) { return <div className="block-card p-5"><p className="mono text-xs uppercase gray-warm mb-2" style={{ letterSpacing: '0.1em' }}>{title}</p><p className="leading-relaxed whitespace-pre-wrap">{children}</p></div>; }
