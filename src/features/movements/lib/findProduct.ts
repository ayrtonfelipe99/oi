import { supabase } from '@/integrations/supabase/client';

export interface ProductHit {
  id: string;
  name: string;
  sku: string | null;
  item_number: string | null;
  ca_number: string | null;
  current_stock: number | null;
  warehouse_id: string;
  category_type: 'epi' | 'tool' | string | null;
  category_name: string | null;
}

const SELECT =
  'id, name, sku, item_number, current_stock, warehouse_id, ca_number, categories(type, name)';

const normalize = (v: string) =>
  v.trim().toUpperCase().replace(/[\s.\-_/]/g, '');

const inferKind = (row: any): 'epi' | 'tool' => {
  const t = row.categories?.type;
  if (t === 'tool') return 'tool';
  return 'epi'; // epi, epc, or unset → treat as EPI bucket
};

const toHit = (row: any): ProductHit => ({
  id: row.id,
  name: row.name,
  sku: row.sku,
  item_number: row.item_number,
  ca_number: row.ca_number,
  current_stock: row.current_stock,
  warehouse_id: row.warehouse_id,
  category_type: row.categories?.type ?? null,
  category_name: row.categories?.name ?? null,
});

const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export interface FindResult {
  hit: ProductHit | null;
  matched: ProductHit[]; // all matches across kinds
  matchedKind: 'epi' | 'tool' | null;
  wrongKind: boolean; // true if found but in different bucket than requested
  tried: string;
}

/**
 * Cascading product lookup. Searches ALL products (regardless of kind) and
 * returns whether the best match belongs to the requested kind or not, so
 * the UI can offer a "switch mode" hint instead of pretending the code
 * doesn't exist.
 */
export const findProductByCode = async (
  rawCode: string,
  kind: 'epi' | 'tool',
  warehouseId?: string,
): Promise<FindResult> => {
  const code = rawCode.trim();
  if (!code) return { hit: null, matched: [], matchedKind: null, wrongKind: false, tried: '' };
  const norm = normalize(code);

  const withWarehouse = <T extends { warehouse_id: string }>(rows: T[]) =>
    warehouseId ? rows.filter((r) => r.warehouse_id === warehouseId) : rows;

  // PostgREST .or() filters interpret `,` and `()` as syntax. Escape the
  // user-provided code before interpolation to avoid broken queries on
  // GS1 barcodes or codes containing commas/parens.
  const safe = code.replace(/[,()]/g, ' ').trim();

  const collect = async (): Promise<ProductHit[]> => {
    // 1. exact across the 3 code columns — three parallel .eq() queries
    //    sidestep .or() string-injection entirely.
    const [sku, item, ca] = await Promise.all([
      supabase.from('products').select(SELECT).eq('sku', code).limit(10),
      supabase.from('products').select(SELECT).eq('item_number', code).limit(10),
      supabase.from('products').select(SELECT).eq('ca_number', code).limit(10),
    ]);
    const exact = [...(sku.data || []), ...(item.data || []), ...(ca.data || [])];
    if (exact.length) {
      const hits = withWarehouse(exact.map(toHit));
      if (hits.length) return hits;
    }

    // 2. UUID
    if (isUuid(code)) {
      const { data: byId } = await supabase
        .from('products')
        .select(SELECT)
        .eq('id', code)
        .maybeSingle();
      if (byId) {
        const hit = toHit(byId);
        if (!warehouseId || hit.warehouse_id === warehouseId) return [hit];
      }
    }

    if (!safe) return [];

    // 3. prefix on sku / item_number / ca_number — escaped value
    const { data: prefix } = await supabase
      .from('products')
      .select(SELECT)
      .or(
        `sku.ilike.${safe}%,item_number.ilike.${safe}%,ca_number.ilike.${safe}%`
      )
      .limit(20);
    if (prefix && prefix.length) {
      const hits = withWarehouse(prefix.map(toHit));
      if (hits.length) return hits;
    }

    // 4. normalized comparison fallback — só roda quando o código tem ao
    //    menos 3 caracteres, para evitar matches absurdamente amplos.
    if (safe.length < 3) return [];
    const seed = safe.slice(0, 3);
    const { data: maybe } = await supabase
      .from('products')
      .select(SELECT)
      .or(`sku.ilike.%${seed}%,item_number.ilike.%${seed}%`)
      .limit(100);
    return withWarehouse(
      (maybe || [])
        .filter((r) =>
          ([r.sku, r.item_number, r.ca_number].filter(Boolean) as string[]).some(
            (v) => normalize(v) === norm
          )
        )
        .map(toHit)
    );
  };


  const matched = await collect();
  // Strict filter: only consider products that belong to the requested kind.
  // EPIs and Ferramentas can share codes, so we never cross buckets here.
  const sameKind = matched.filter((m) => inferKind(m) === kind);
  if (sameKind.length === 0) {
    const wrongKind = matched.length > 0;
    return {
      hit: null,
      matched,
      matchedKind: wrongKind ? inferKind(matched[0]) : null,
      wrongKind,
      tried: code,
    };
  }
  return {
    hit: sameKind[0],
    matched: sameKind,
    matchedKind: kind,
    wrongKind: false,
    tried: code,
  };
};

/**
 * Live suggestions: searches by name OR partial code within the selected kind.
 * EPIs and Ferramentas are kept strictly separated.
 */
export const searchProductsByName = async (
  term: string,
  kind: 'epi' | 'tool',
  warehouseId?: string,
): Promise<ProductHit[]> => {
  const q = term.trim();
  if (!q) return [];
  const like = `%${q}%`;
  let query = supabase
    .from('products')
    .select(SELECT)
    .or(
      `name.ilike.${like},sku.ilike.${like},item_number.ilike.${like},ca_number.ilike.${like}`
    )
    .limit(50);
  if (warehouseId) query = query.eq('warehouse_id', warehouseId);
  const { data } = await query;
  const rows = (data || []).map(toHit);
  // strict: only the selected kind
  return rows.filter((r) => inferKind(r) === kind).slice(0, 30);
};


export const productKind = inferKind;

export interface StaffHit {
  id: string;
  full_name: string;
  registration_number: string;
  role: string | null;
}

export const searchStaff = async (term: string): Promise<StaffHit[]> => {
  const q = term.trim();
  if (!q) return [];
  const like = `%${q}%`;
  const { data } = await supabase
    .from('staff')
    .select('id, full_name, registration_number, role')
    .or(`full_name.ilike.${like},registration_number.ilike.${like}`)
    .limit(5);
  return (data as StaffHit[]) ?? [];
};

