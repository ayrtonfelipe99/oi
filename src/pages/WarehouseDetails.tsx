import React, { useEffect, useState } from 'react';
import { useWarehouseFilterStore } from '@/hooks/use-warehouse-filter-store';
import { useParams, Link, useNavigate } from '@tanstack/react-router';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreVertical, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { 
  Warehouse, 
  MapPin, 
  ArrowLeft, 
  Package, 
  AlertTriangle, 
  Activity,
  History,
  TrendingUp,
  LayoutDashboard,
  HardHat,
  Zap,
  ZapOff,
  Search,
  Settings,
  Info,
  Zap as ZapIcon,
  ClipboardList,
  ArrowUp,
  ArrowDown,
  ArrowRightLeft,
  FileText,
  Clock,
  ArrowRight,
  ShoppingCart,
  ShieldAlert,
  Ban,
  PackageCheck,
  Download
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  
  Legend,
  AreaChart,
  Area
} from 'recharts';


const allCategories = [
  { id: '01', label: '01. Proteção de Cabeça', icon: HardHat, color: 'text-blue-600', bg: 'bg-blue-50', type: 'epi', description: 'Ex: Capacete vermelho, azul, branco, jugular, suspensão...' },
  { id: '02', label: '02. Proteção Visual e Facial', icon: LayoutDashboard, color: 'text-indigo-600', bg: 'bg-indigo-50', type: 'epi', description: 'Ex: Óculos de proteção incolor, fumê, protetor facial, máscara de solda...' },
  { id: '03', label: '03. Proteção Auditiva', icon: LayoutDashboard, color: 'text-cyan-600', bg: 'bg-cyan-50', type: 'epi', description: 'Ex: Protetor tipo plug, abafador de ruídos, protetor de silicone...' },
  { id: '04', label: '04. Proteção Respiratória', icon: LayoutDashboard, color: 'text-emerald-600', bg: 'bg-emerald-50', type: 'epi', description: 'Ex: Máscara PFF1, PFF2, respirador semifacial, filtros químicos...' },
  { id: '05', label: '05. Camisas', icon: LayoutDashboard, color: 'text-orange-600', bg: 'bg-orange-50', type: 'epi', description: 'Ex: Camisa de brim, camisa polo, uniforme operacional, camisa refletiva...' },
  { id: '06', label: '06. Aventais', icon: LayoutDashboard, color: 'text-orange-700', bg: 'bg-orange-100', type: 'epi', description: 'Ex: Avental de raspa, avental de PVC, avental térmico, avental aluminizado...' },
  { id: '07', label: '07. Membros Superiores', icon: LayoutDashboard, color: 'text-amber-600', bg: 'bg-amber-50', type: 'epi', description: 'Ex: Luva de raspa, luva nitrílica, luva de vaqueta, luva de proteção térmica...' },
  { id: '08', label: '08. Calças', icon: LayoutDashboard, color: 'text-lime-700', bg: 'bg-lime-100', type: 'epi', description: 'Ex: Calça de brim, calça cargo, calça térmica, calça impermeável...' },
  { id: '09', label: '09. Botas', icon: LayoutDashboard, color: 'text-lime-600', bg: 'bg-lime-50', type: 'epi', description: 'Ex: Bota de PVC, botina de segurança com biqueira, sapato ocupacional...' },
  { id: '10', label: '10. Proteção Contra Queda', icon: LayoutDashboard, color: 'text-purple-600', bg: 'bg-purple-50', type: 'epi', description: 'Ex: Cinturão de segurança, talabarte, trava-quedas, cordas de segurança...' },
  { id: '11', label: '11. Ferramentas Manuais', icon: LayoutDashboard, color: 'text-slate-600', bg: 'bg-slate-50', type: 'tool', description: 'Ex: Chave de fenda, alicate, martelo, serrote, chave inglesa...' },
  { id: '12', label: '12. Ferramentas Elétricas', icon: ZapIcon, color: 'text-yellow-600', bg: 'bg-yellow-50', type: 'tool', description: 'Ex: Furadeira, parafusadeira, esmerilhadeira, lixadeira, serra circular...' },
  { id: '13', label: '13. Equipamentos Diversos', icon: Package, color: 'text-teal-600', bg: 'bg-teal-50', type: 'tool', description: 'Ex: Cones de sinalização, fitas, cavaletes, lanternas, pilhas...' },
  { id: '14', label: '14. Acessórios P/ Ferramentas', icon: Settings, color: 'text-rose-600', bg: 'bg-rose-50', type: 'tool', description: 'Ex: Brocas, discos de corte, bits, ponteiras, mangueiras pneumáticas, engates...' },
];

const GroupCard = ({ group }: { group: any }) => (
  <Card key={group.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white hover:bg-slate-50 border border-slate-100 w-full h-full">
    <CardContent className="p-4">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-14 h-14 flex items-center justify-center shrink-0 rounded-2xl transition-all duration-300 group-hover:scale-110 shadow-sm",
          group.bg,
          group.color
        )}>
          <group.icon size={28} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter">
                {group.totalItems}
              </span>
              <div className="flex items-center gap-1.5">
                {group.lowStock > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-black animate-pulse">
                    <AlertTriangle size={10} className="mr-1" />
                    {group.lowStock}
                  </Badge>
                )}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-slate-200">
                      <span className="font-bold text-slate-400">!</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 text-[11px] font-medium leading-relaxed bg-slate-900 text-white border-slate-800">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Info size={14} className="text-blue-400" />
                      <span className="font-bold uppercase tracking-wider">{group.label}</span>
                    </div>
                    {group.description}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight mt-1 truncate">
              {group.label}
            </p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const WarehouseDetails = () => {
  const { id } = useParams({ from: '/almoxarifados/$id' });
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeType, setActiveType] = useState<'all' | 'epi' | 'tool'>('all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [damageItem, setDamageItem] = useState<any>(null);
  const [damageQty, setDamageQty] = useState<string>('1');
  const [damageCondition, setDamageCondition] = useState<'recuperavel' | 'descartado'>('recuperavel');
  const [damageReason, setDamageReason] = useState<string>('');
  const [savingDamage, setSavingDamage] = useState(false);
  const queryClient = useQueryClient();
  const { setWarehouseFilter } = useWarehouseFilterStore();

  const openDamageDialog = (item: any) => {
    setDamageItem(item);
    setDamageQty('1');
    setDamageCondition('recuperavel');
    setDamageReason('');
  };

  const submitDamage = async () => {
    if (!damageItem) return;
    const qty = parseInt(damageQty, 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error('Informe uma quantidade válida.');
      return;
    }
    if (qty > (damageItem.current_stock ?? 0)) {
      toast.error('Quantidade maior que o saldo em estoque.');
      return;
    }
    if (!damageReason.trim()) {
      toast.error('Informe o motivo da avaria.');
      return;
    }
    setSavingDamage(true);
    try {
      const { error: insertErr } = await supabase.from('damaged_items').insert({
        product_id: damageItem.id,
        warehouse_id: id,
        quantity: qty,
        condition: damageCondition,
        reason: damageReason.trim().slice(0, 500),
      });
      if (insertErr) throw insertErr;

      const { error: stockErr } = await supabase.rpc('adjust_stock', {
        p_product_id: damageItem.id,
        p_delta: -qty,
      });
      if (stockErr) throw stockErr;

      toast.success('Avaria registrada e estoque atualizado.');
      setDamageItem(null);
      queryClient.invalidateQueries({ queryKey: ['warehouse-inventory', id] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-damaged', id] });
    } catch (e: any) {
      toast.error(e.message || 'Erro ao registrar avaria.');
    } finally {
      setSavingDamage(false);
    }
  };

  // Sincroniza o filtro global da sidebar com o almoxarifado em foco
  useEffect(() => {
    if (id) setWarehouseFilter(id);
  }, [id, setWarehouseFilter]);

  const { data: warehouse, isLoading: isLoadingWarehouse } = useQuery({
    queryKey: ['warehouse', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['warehouse-group-stats', id],
    queryFn: async () => {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*').eq('warehouse_id', id),
        supabase.from('categories').select('*')
      ]);
      
      if (productsRes.error) throw productsRes.error;
      const products = productsRes.data || [];
      const categories = categoriesRes.data || [];
      
      return allCategories.map(cat => {
        const catProducts = products.filter(p => {
          const productNameLower = p.name.toLowerCase();
          
          // Categorization logic based on name if category_id is missing or category not found
          const isEpi = productNameLower.includes('capacete') || 
                        productNameLower.includes('luva') || 
                        productNameLower.includes('óculos') || 
                        productNameLower.includes('bota') || 
                        productNameLower.includes('mascara') || 
                        productNameLower.includes('respirador') ||
                        productNameLower.includes('protetor');
                        
          const isTool = productNameLower.includes('furadeira') || 
                         productNameLower.includes('martelo') || 
                         productNameLower.includes('chave') || 
                         productNameLower.includes('alicate') || 
                         productNameLower.includes('serra') ||
                         productNameLower.includes('esmerilhadeira');

          const productCat = categories.find(c => c.id === p.category_id);
          
          if (productCat?.name) {
            return productCat.name.startsWith(cat.id);
          }
          
          // Fallback logic
          if (cat.type === 'epi' && isEpi) return true;
          if (cat.type === 'tool' && isTool) return true;
          if (cat.id === '13' && !isEpi && !isTool) return true; // Miscellaneous
          
          return false;
        });
        
        const totalItems = catProducts.reduce((acc, p) => acc + (p.current_stock || 0), 0);
        const lowStock = catProducts.filter(p => (p.min_stock || 0) > 0 && (p.current_stock || 0) <= (p.min_stock || 0)).length;
        
        return {
          ...cat,
          totalItems,
          lowStock,
          count: catProducts.length
        };
      });
    }
  });

  const { data: inventory, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['warehouse-inventory', id],
    queryFn: async () => {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*').eq('warehouse_id', id),
        supabase.from('categories').select('*')
      ]);

      if (productsRes.error) throw productsRes.error;
      const products = productsRes.data || [];
      const categories = categoriesRes.data || [];

      return products.map(p => ({
        ...p,
        category: categories.find(c => c.id === p.category_id)
      }));
    }
  });

  const { data: damagedItems, isLoading: isLoadingDamaged } = useQuery({
    queryKey: ['warehouse-damaged', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('damaged_items')
        .select('*')
        .eq('warehouse_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const items = data || [];
      const productIds = Array.from(new Set(items.map((r: any) => r.product_id)));
      if (productIds.length === 0) return [];
      const { data: prods } = await supabase
        .from('products')
        .select('id, name, unit')
        .in('id', productIds);
      const map = new Map((prods || []).map((p: any) => [p.id, p]));
      return items.map((r: any) => ({ ...r, product: map.get(r.product_id) }));
    }
  });


  // Filtragem client-side por nome — sem disparar nova query a cada tecla.
  const filteredInventory = React.useMemo(() => {
    if (!inventory) return inventory;
    const term = searchTerm.trim().toLowerCase();
    if (!term) return inventory;
    return inventory.filter((p: any) => p.name?.toLowerCase().includes(term));
  }, [inventory, searchTerm]);




  const InventoryTable = ({ 
    data, 
    isLoading, 
    title, 
    description,
    statusFilter,
    showTypeFilter = false
  }: { 
    data: any[], 
    isLoading: boolean, 
    title: string, 
    description: string,
    statusFilter?: 'esgotado' | 'compra',
    showTypeFilter?: boolean
  }) => (
    <Card className="border border-slate-100 shadow-sm overflow-hidden bg-white rounded-2xl w-full">
      <CardHeader className="border-b border-slate-50 bg-slate-50/30 p-4 sm:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">{title}</CardTitle>
            <CardDescription className="font-medium text-xs sm:text-sm">{description}</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Filtrar nesta lista..." 
                className="pl-9 bg-slate-50 border-slate-100 focus:bg-white transition-all rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-slate-200">
          <TooltipProvider>
            <Table className="min-w-full">
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-black text-slate-900 uppercase text-[10px] sm:text-xs tracking-widest px-4 sm:px-6 py-4 min-w-[80px]">
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1.5 cursor-help hover:text-blue-600 transition-colors">
                        Item
                        <Info size={12} className="opacity-40" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[200px] text-center bg-slate-900 text-white font-bold p-2">
                        Ordem numérica para um determinado produto.
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell font-black text-slate-900 uppercase text-[10px] sm:text-xs tracking-widest px-2 sm:px-6 py-4 whitespace-nowrap">
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1.5 cursor-help hover:text-blue-600 transition-colors">
                        Código
                        <Info size={12} className="opacity-40" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[200px] text-center bg-slate-900 text-white font-bold p-2">
                        Identificação da classe (formato número e ponto, ex: 01.002).
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="font-black text-slate-900 uppercase text-[10px] sm:text-xs tracking-widest px-2 sm:px-6 py-4 min-w-[120px] sm:min-w-[180px]">Descrição</TableHead>
                  <TableHead className="font-black text-slate-900 uppercase text-[10px] sm:text-xs tracking-widest px-2 sm:px-6 py-4 text-center whitespace-nowrap">Qtd</TableHead>
                  <TableHead className="hidden sm:table-cell font-black text-slate-900 uppercase text-[10px] sm:text-xs tracking-widest px-2 sm:px-6 py-4 text-center whitespace-nowrap">Qtd Mínima</TableHead>
                  <TableHead className="font-black text-slate-900 uppercase text-[10px] sm:text-xs tracking-widest px-2 sm:px-6 py-4 text-right whitespace-nowrap">Status</TableHead>
                  <TableHead className="font-black text-slate-900 uppercase text-[10px] sm:text-xs tracking-widest px-2 sm:px-6 py-4 text-center whitespace-nowrap">Ações</TableHead>

                </TableRow>
              </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="px-6 py-4"><Skeleton className="h-12 w-full rounded-xl" /></TableCell>
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <Package className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">Nenhum produto encontrado</h3>
                    <p className="text-slate-500">Esta lista está vazia no momento.</p>
                  </TableCell>
                </TableRow>
              ) : (
                [...data].sort((a, b) => {
                  const na = parseInt(String(a.item_number ?? '').replace(/\D/g, ''), 10);
                  const nb = parseInt(String(b.item_number ?? '').replace(/\D/g, ''), 10);
                  const va = Number.isFinite(na) ? na : Number.MAX_SAFE_INTEGER;
                  const vb = Number.isFinite(nb) ? nb : Number.MAX_SAFE_INTEGER;
                  return va - vb;
                }).map((item) => (
                  <TableRow 
                    key={item.id} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedProduct(item)}
                  >
                    <TableCell className="px-4 sm:px-6 py-3 sm:py-4">
                      <span className="font-black text-slate-900 tabular-nums bg-slate-100 px-2 py-1 rounded text-sm min-w-[32px] inline-block text-center border border-slate-200">
                        {item.item_number?.replace(/\D/g, '') || '00'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell px-2 sm:px-6 py-3 sm:py-4">
                      <span className="text-xs font-mono font-bold text-slate-600 bg-blue-50/50 px-2 py-1 rounded border border-blue-100 whitespace-nowrap">
                        {item.sku || '00.000'}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 sm:px-6 py-3 sm:py-4">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 text-sm sm:text-base">{item.name}</div>
                      {item.description && (
                        <div className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-2 sm:px-6 py-3 sm:py-4 text-center">
                      <span className={cn(
                        "text-base sm:text-lg font-black tabular-nums",
                        (item.current_stock ?? 0) === 0 ? "text-red-600" : ((item.min_stock || 0) > 0 && (item.current_stock ?? 0) <= (item.min_stock || 0)) ? "text-amber-600" : "text-slate-900"
                      )}>
                        {item.current_stock}
                      </span>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{item.unit || 'UN'}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell px-2 sm:px-6 py-3 sm:py-4 text-center">
                      <span className="text-slate-400 font-bold tabular-nums">{item.min_stock || 0}</span>
                    </TableCell>
                    <TableCell className="px-2 sm:px-6 py-3 sm:py-4 text-right">
                      {statusFilter === 'esgotado' || (item.current_stock ?? 0) === 0 ? (
                        <Badge variant="destructive" className="font-black text-[9px] sm:text-[10px] uppercase px-1.5 sm:px-2 py-1 rounded-md whitespace-nowrap">
                          <Ban size={10} className="mr-0.5 sm:mr-1" />
                          <span className="hidden sm:inline">Esgotado</span>
                          <span className="sm:hidden">Esg.</span>
                        </Badge>
                      ) : ((item.min_stock || 0) > 0 && (item.current_stock ?? 0) <= (item.min_stock || 0)) ? (
                        <Badge className="font-black text-[9px] sm:text-[10px] uppercase px-1.5 sm:px-2 py-1 rounded-md bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 whitespace-nowrap">
                          <ShoppingCart size={10} className="mr-0.5 sm:mr-1" />
                          <span className="hidden sm:inline">Reposição</span>
                          <span className="sm:hidden">Rep.</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-black text-[9px] sm:text-[10px] uppercase px-1.5 sm:px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border-emerald-200 whitespace-nowrap">
                          <PackageCheck size={10} className="mr-0.5 sm:mr-1" />
                          <span>Disponível</span>
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-2 sm:px-6 py-3 sm:py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-slate-100"
                          >
                            <MoreVertical size={16} className="text-slate-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              const isTool = item.category?.type === 'tool';
                              navigate({
                                to: isTool ? '/cadastro-ferramentas' : '/cadastro-epis',
                                search: { restock: item.id } as any,
                              });
                            }}
                            className="gap-2 font-semibold text-emerald-700 focus:text-emerald-800 focus:bg-emerald-50 cursor-pointer"
                          >
                            <RefreshCw size={14} />
                            Repor item
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={(item.current_stock ?? 0) <= 0}
                            onClick={() => openDamageDialog(item)}
                            className="gap-2 font-semibold text-amber-700 focus:text-amber-800 focus:bg-amber-50 cursor-pointer"
                          >
                            <ShieldAlert size={14} />
                            Registrar avaria
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>


                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['warehouse-transactions', id],
    queryFn: async () => {
      const { data: trans, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('warehouse_id', id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      if (!trans) return [];

      const productIds = Array.from(new Set(trans.map(t => t.product_id).filter(Boolean))) as string[];
      const staffIds = Array.from(new Set(trans.map(t => t.staff_id).filter(Boolean))) as string[];

      const [productsRes, staffRes] = await Promise.all([
        supabase.from('products').select('id, name').in('id', productIds),
        supabase.from('staff').select('id, full_name').in('id', staffIds)
      ]);

      const productMap = (productsRes.data || []).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p.name }), {});
      const staffMap = (staffRes.data || []).reduce((acc: any, s: any) => ({ ...acc, [s.id]: s.full_name }), {});

      return trans.map(t => ({
        ...t,
        product_name: t.product_id ? productMap[t.product_id] : `Item Desconhecido`,
        staff_name: t.staff_id ? staffMap[t.staff_id] : 'Sistema'
      }));
    }
  });


  const { data: movementStats } = useQuery({
    queryKey: ['warehouse-movement-stats', id],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7);
      const { data, error } = await supabase
        .from('transactions')
        .select('type, quantity, created_at')
        .eq('warehouse_id', id)
        .gte('created_at', sevenDaysAgo.toISOString());
      
      if (error) throw error;

      const days = Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(new Date(), 6 - i);
        return {
          date: format(date, 'dd/MM'),
          entrada: 0,
          saida: 0
        };
      });

      data?.forEach(t => {
        const day = format(new Date(t.created_at), 'dd/MM');
        const dayData = days.find(d => d.date === day);
        if (dayData) {
          if (t.type === 'in' || t.type === 'entry') dayData.entrada += t.quantity;
          if (t.type === 'out' || t.type === 'exit') dayData.saida += t.quantity;
        }
      });

      return days;
    }
  });


  if (isLoadingWarehouse) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!warehouse) return <div>Almoxarifado não encontrado.</div>;

  return (
    <div className="p-2 sm:p-4 lg:p-8 space-y-4 sm:space-y-8 animate-in fade-in duration-500 bg-slate-50/50 min-h-screen w-full overflow-x-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm sticky top-4 z-20 backdrop-blur-sm bg-white/95">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-slate-100">
            <Link to="/almoxarifados">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 uppercase">
                {warehouse.name}
              </h1>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-3">
                EM OPERAÇÃO
              </Badge>
            </div>
            <p className="text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium text-xs md:text-sm">
              <MapPin size={12} className="text-blue-500" />
              {warehouse.location || 'Localização não informada'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <Button 
              variant={activeType === 'all' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveType('all')}
              className={cn(
                "flex-1 sm:flex-none h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all", 
                activeType === 'all' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              Todos
            </Button>
            <Button 
              variant={activeType === 'epi' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveType('epi')}
              className={cn(
                "flex-1 sm:flex-none h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all", 
                activeType === 'epi' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              <HardHat size={12} className="mr-1.5" />
              EPIs
            </Button>
            <Button 
              variant={activeType === 'tool' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveType('tool')}
              className={cn(
                "flex-1 sm:flex-none h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all", 
                activeType === 'tool' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              <Settings size={12} className="mr-1.5" />
              Ferramentas
            </Button>
          </div>
        </div>
      </div>


      <Tabs defaultValue="disponivel" className="space-y-4 sm:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList className="bg-white border border-slate-200 p-1 h-auto shadow-sm rounded-xl grid grid-cols-5 w-full md:w-auto md:inline-flex md:h-12 gap-1">
            <TabsTrigger value="disponivel" className="rounded-lg px-1 sm:px-6 py-2 sm:py-0 data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold transition-all gap-1 sm:gap-2 flex-col sm:flex-row text-[9px] sm:text-sm">
              <PackageCheck size={16} />
              <span className="hidden sm:inline">Disponível</span>
              <span className="sm:hidden">Disp.</span>
            </TabsTrigger>
            <TabsTrigger value="esgotados" className="rounded-lg px-1 sm:px-6 py-2 sm:py-0 data-[state=active]:bg-red-600 data-[state=active]:text-white font-bold transition-all gap-1 sm:gap-2 flex-col sm:flex-row text-[9px] sm:text-sm">
              <Ban size={16} />
              <span className="hidden sm:inline">Esgotados</span>
              <span className="sm:hidden">Esgot.</span>
            </TabsTrigger>
            <TabsTrigger value="lista-compras" className="rounded-lg px-1 sm:px-6 py-2 sm:py-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold transition-all gap-1 sm:gap-2 flex-col sm:flex-row text-[9px] sm:text-sm">
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">Lista de Compras</span>
              <span className="sm:hidden">Compras</span>
            </TabsTrigger>
            <TabsTrigger value="avariados" className="rounded-lg px-1 sm:px-6 py-2 sm:py-0 data-[state=active]:bg-slate-700 data-[state=active]:text-white font-bold transition-all gap-1 sm:gap-2 flex-col sm:flex-row text-[9px] sm:text-sm">
              <ShieldAlert size={16} />
              <span className="hidden sm:inline">Avariados</span>
              <span className="sm:hidden">Avar.</span>
            </TabsTrigger>
            <TabsTrigger value="historico" className="rounded-lg px-1 sm:px-6 py-2 sm:py-0 data-[state=active]:bg-amber-600 data-[state=active]:text-white font-bold transition-all gap-1 sm:gap-2 flex-col sm:flex-row text-[9px] sm:text-sm">
              <History size={16} />
              <span className="hidden sm:inline">Histórico</span>
              <span className="sm:hidden">Hist.</span>
            </TabsTrigger>
          </TabsList>

        </div>

        <TabsContent value="disponivel" className="space-y-6">
          <InventoryTable 
            data={((filteredInventory ?? inventory)?.filter(item => (item.current_stock ?? 0) > 0) || []).filter(item => {
              if (activeType === 'all') return true;
              
              const productNameLower = item.name.toLowerCase();
              const isEpi = productNameLower.includes('capacete') || 
                            productNameLower.includes('luva') || 
                            productNameLower.includes('óculos') || 
                            productNameLower.includes('bota') || 
                            productNameLower.includes('mascara') || 
                            productNameLower.includes('respirador') ||
                            productNameLower.includes('protetor');
                            
              const isTool = productNameLower.includes('furadeira') || 
                             productNameLower.includes('martelo') || 
                             productNameLower.includes('chave') || 
                             productNameLower.includes('alicate') || 
                             productNameLower.includes('serra') ||
                             productNameLower.includes('esmerilhadeira');

              const catId = item.category?.name?.substring(0, 2);
              const cat = allCategories.find(c => c.id === catId);
              
              if (cat) return cat.type === activeType;
              
              // Fallback
              if (activeType === 'epi') return isEpi;
              if (activeType === 'tool') return isTool;
              
              return false;
            })}
            isLoading={isLoadingInventory} 
            title="Itens Disponíveis"
            description="Todos os produtos com saldo em estoque"
            showTypeFilter={true}
          />
        </TabsContent>

        <TabsContent value="esgotados" className="space-y-6">
          <InventoryTable 
            data={((filteredInventory ?? inventory)?.filter(item => (item.current_stock ?? 0) === 0) || []).filter(item => {
              if (activeType === 'all') return true;
              
              const productNameLower = item.name.toLowerCase();
              const isEpi = productNameLower.includes('capacete') || 
                            productNameLower.includes('luva') || 
                            productNameLower.includes('óculos') || 
                            productNameLower.includes('bota') || 
                            productNameLower.includes('mascara') || 
                            productNameLower.includes('respirador') ||
                            productNameLower.includes('protetor');
                            
              const isTool = productNameLower.includes('furadeira') || 
                             productNameLower.includes('martelo') || 
                             productNameLower.includes('chave') || 
                             productNameLower.includes('alicate') || 
                             productNameLower.includes('serra') ||
                             productNameLower.includes('esmerilhadeira');

              const catId = item.category?.name?.substring(0, 2);
              const cat = allCategories.find(c => c.id === catId);
              
              if (cat) return cat.type === activeType;
              
              // Fallback
              if (activeType === 'epi') return isEpi;
              if (activeType === 'tool') return isTool;
              
              return false;
            })}
            isLoading={isLoadingInventory} 
            title="Itens Esgotados"
            description="Produtos sem saldo no momento"
            statusFilter="esgotado"
            showTypeFilter={true}
          />
        </TabsContent>

        <TabsContent value="lista-compras" className="space-y-6">
          {(() => {
            const purchaseList = ((filteredInventory ?? inventory)?.filter(item => (item.min_stock || 0) > 0 && (item.current_stock ?? 0) <= (item.min_stock || 0)) || []).filter(item => {
              if (activeType === 'all') return true;
              const productNameLower = item.name.toLowerCase();
              const isEpi = ['capacete','luva','óculos','bota','mascara','respirador','protetor'].some(k => productNameLower.includes(k));
              const isTool = ['furadeira','martelo','chave','alicate','serra','esmerilhadeira'].some(k => productNameLower.includes(k));
              const catId = item.category?.name?.substring(0, 2);
              const cat = allCategories.find(c => c.id === catId);
              if (cat) return cat.type === activeType;
              if (activeType === 'epi') return isEpi;
              if (activeType === 'tool') return isTool;
              return false;
            });

            const classify = (item: any): 'epi' | 'tool' => {
              const productNameLower = (item.name || '').toLowerCase();
              const catId = item.category?.name?.substring(0, 2);
              const cat = allCategories.find(c => c.id === catId);
              if (cat) return cat.type as 'epi' | 'tool';
              const isTool = ['furadeira','martelo','chave','alicate','serra','esmerilhadeira'].some(k => productNameLower.includes(k));
              return isTool ? 'tool' : 'epi';
            };

            const handleDownload = async () => {
              if (!purchaseList.length) return;
              const XLSX = await import('xlsx');

              // Buscar última compra de cada produto
              const ids = purchaseList.map(p => p.id);
              const { data: purchases } = await supabase
                .from('product_purchases')
                .select('product_id, quantity, created_at')
                .in('product_id', ids)
                .order('created_at', { ascending: false });
              const lastByProduct = new Map<string, number>();
              (purchases || []).forEach(pu => {
                if (!lastByProduct.has(pu.product_id)) {
                  lastByProduct.set(pu.product_id, Number(pu.quantity) || 0);
                }
              });

              const epis = purchaseList.filter(p => classify(p) === 'epi');
              const tools = purchaseList.filter(p => classify(p) === 'tool');

              const buildSheet = (items: any[], tipoLabel: string) => {
                const header: any[][] = [
                  ['Lista de Compras'],
                  [`Almoxarifado: ${warehouse?.name || '-'}`],
                  [`Data: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`],
                  [`Total de itens: ${items.length}`],
                  [],
                  ['Descrição', 'Tipo', 'Quantidade da última compra'],
                ];
                items.forEach(it => {
                  header.push([it.name, tipoLabel, lastByProduct.get(it.id) ?? 0]);
                });
                const ws = XLSX.utils.aoa_to_sheet(header);
                ws['!cols'] = [{ wch: 50 }, { wch: 15 }, { wch: 28 }];
                return ws;
              };

              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, buildSheet(epis, 'EPI'), 'EPIs');
              XLSX.utils.book_append_sheet(wb, buildSheet(tools, 'Ferramenta'), 'Ferramentas');

              XLSX.writeFile(wb, `lista-compras-${(warehouse?.name || 'almoxarifado').toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
            };


            return (
              <>
                <div className="flex justify-end">
                  <Button
                    onClick={handleDownload}
                    disabled={!purchaseList.length}
                    className="gap-2 font-bold uppercase text-xs sm:text-sm"
                  >
                    <Download size={16} />
                    Baixar lista ({purchaseList.length})
                  </Button>
                </div>
                <InventoryTable
                  data={purchaseList}
                  isLoading={isLoadingInventory}
                  title="Necessidade de Reposição"
                  description="Itens abaixo do estoque mínimo configurado"
                  statusFilter="compra"
                  showTypeFilter={true}
                />
              </>
            );
          })()}
        </TabsContent>

        <TabsContent value="avariados" className="space-y-6">
          <Card className="border border-slate-100 shadow-sm overflow-hidden bg-white rounded-2xl">
            <CardHeader className="border-b border-slate-50 bg-slate-50/30 p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">Itens Avariados</CardTitle>
              <CardDescription className="font-medium text-slate-500">Registros de avarias deste almoxarifado</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingDamaged ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-14 w-full rounded-xl" />))}
                </div>
              ) : !damagedItems || damagedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <ShieldAlert className="h-12 w-12 text-slate-200 mb-4" />
                  <h3 className="text-lg font-bold text-slate-900">Nenhum registro de avarias</h3>
                  <p className="text-slate-500">Não há itens marcados como avariados ou danificados.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {damagedItems.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-semibold">{r.product?.name || '—'}</TableCell>
                        <TableCell>{r.quantity} {r.product?.unit || 'UN'}</TableCell>
                        <TableCell>
                          <Badge variant={r.condition === 'recuperavel' ? 'secondary' : 'destructive'}>
                            {r.condition === 'recuperavel' ? 'Recuperável' : 'Descarte'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[320px] truncate" title={r.reason}>{r.reason}</TableCell>
                        <TableCell>{new Date(r.created_at).toLocaleString('pt-BR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="historico" className="space-y-6">
          <Card className="border border-slate-100 shadow-sm overflow-hidden bg-white rounded-2xl">
            <CardHeader className="border-b border-slate-50 bg-slate-50/30 p-4 sm:p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">Histórico de Movimentações</CardTitle>
                  <CardDescription className="font-medium text-slate-500">Últimos registros de entrada e saída</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="sm:hidden p-4">
                {isLoadingTransactions ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-xl" />
                    ))}
                  </div>
                ) : transactions?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 py-14 text-center">
                    <History className="h-12 w-12 text-slate-200 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">Nenhuma movimentação</h3>
                    <p className="text-slate-500">Não há registros de movimentações para este almoxarifado.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions?.map((t) => (
                      <div key={t.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          {t.type === 'in' || t.type === 'entry' ? (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none font-bold gap-1 uppercase text-[10px] px-2 py-1">
                              <ArrowDown size={12} /> Entrada
                            </Badge>
                          ) : t.type === 'transfer' ? (
                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none font-bold gap-1 uppercase text-[10px] px-2 py-1">
                              <ArrowRightLeft size={12} /> Transf.
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none font-bold gap-1 uppercase text-[10px] px-2 py-1">
                              <ArrowUp size={12} /> Saída
                            </Badge>
                          )}
                          <span className="text-sm font-black tabular-nums text-slate-900">{t.quantity}</span>
                        </div>

                        <div className="mt-3 space-y-2 min-w-0">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Material</p>
                            <p className="text-sm font-bold text-slate-900 break-words">{t.product_name}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Colaborador</p>
                            <p className="text-sm font-medium text-slate-700 break-words">{t.staff_name}</p>
                            {t.registered_by && (
                              <p className="text-[11px] text-slate-500 break-words">Registrado por <span className="font-semibold text-slate-700">{t.registered_by}</span></p>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data</p>
                            <p className="text-xs font-medium text-slate-500">{format(new Date(t.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden sm:block w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                <Table className="min-w-full">
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="font-black text-slate-900 uppercase text-[10px] sm:text-xs tracking-widest px-3 sm:px-6 py-4 min-w-[96px] sm:min-w-[120px]">Operação</TableHead>
                      <TableHead className="font-black text-slate-900 uppercase text-[10px] sm:text-xs tracking-widest px-3 sm:px-6 py-4 min-w-[130px] sm:min-w-[200px]">Material</TableHead>
                      <TableHead className="font-black text-slate-900 uppercase text-[10px] sm:text-xs tracking-widest px-2 sm:px-6 py-4 text-center min-w-[72px]">Quantidade</TableHead>
                      <TableHead className="font-black text-slate-900 uppercase text-[10px] sm:text-xs tracking-widest px-3 sm:px-6 py-4 min-w-[120px] sm:min-w-[150px]">Colaborador</TableHead>
                      <TableHead className="font-black text-slate-900 uppercase text-[10px] sm:text-xs tracking-widest px-3 sm:px-6 py-4 text-right min-w-[112px] sm:min-w-[140px]">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {isLoadingTransactions ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5} className="px-3 sm:px-6 py-4"><Skeleton className="h-10 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : transactions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20">
                        <History className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">Nenhuma movimentação</h3>
                        <p className="text-slate-500">Não há registros de movimentações para este almoxarifado.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions?.map((t) => (
                      <TableRow key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="px-3 sm:px-6 py-4">
                          {t.type === 'in' || t.type === 'entry' ? (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none font-bold gap-1 uppercase text-[9px] sm:text-[10px] w-[72px] sm:w-24 justify-center px-1.5 sm:px-2">
                              <ArrowDown size={12} /> Entrada
                            </Badge>
                          ) : t.type === 'transfer' ? (
                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none font-bold gap-1 uppercase text-[9px] sm:text-[10px] w-[72px] sm:w-24 justify-center px-1.5 sm:px-2">
                              <ArrowRightLeft size={12} /> Transf.
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none font-bold gap-1 uppercase text-[9px] sm:text-[10px] w-[72px] sm:w-24 justify-center px-1.5 sm:px-2">
                              <ArrowUp size={12} /> Saída
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-3 sm:px-6 py-4">
                          <div className="font-bold text-slate-900 text-sm sm:text-base break-words">{t.product_name}</div>
                        </TableCell>
                        <TableCell className="px-2 sm:px-6 py-4 text-center">
                          <span className="font-black text-slate-900 tabular-nums text-sm sm:text-base">{t.quantity}</span>
                        </TableCell>
                        <TableCell className="px-3 sm:px-6 py-4 font-medium text-slate-600">
                          <div className="text-sm sm:text-base break-words">{t.staff_name}</div>
                          {t.registered_by && (
                            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 break-words">Registrado por <span className="font-semibold text-slate-600">{t.registered_by}</span></div>
                          )}
                        </TableCell>
                        <TableCell className="px-3 sm:px-6 py-4 text-right text-slate-500 font-medium text-xs sm:text-sm whitespace-nowrap">
                          {format(new Date(t.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Sheet open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <SheetContent className="sm:max-w-md border-l border-slate-100 p-0">
          {selectedProduct && (
            <div className="flex flex-col h-full bg-white">
              <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                <SheetHeader className="text-left">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedProduct.category?.name?.toLowerCase().includes('epi') ? (
                      <Badge className="bg-blue-600 text-white border-none font-bold px-2 py-0.5 text-[10px] uppercase">EPI</Badge>
                    ) : selectedProduct.category?.name?.toLowerCase().includes('ferramenta') ? (
                      <Badge className="bg-amber-600 text-white border-none font-bold px-2 py-0.5 text-[10px] uppercase">Ferramenta</Badge>
                    ) : (
                      <Badge variant="outline" className="font-bold px-2 py-0.5 text-[10px] uppercase">Geral</Badge>
                    )}
                    <Badge variant="outline" className="font-bold px-2 py-0.5 text-[10px] uppercase border-slate-200">
                      ID: {selectedProduct.id.substring(0, 8)}
                    </Badge>
                  </div>
                  <SheetTitle className="text-2xl font-black text-slate-900 leading-tight">
                    {selectedProduct.name}
                  </SheetTitle>
                  <SheetDescription className="font-bold text-slate-400 uppercase tracking-widest text-[11px] mt-1">
                    {selectedProduct.category?.name || 'Sem Categoria'}
                  </SheetDescription>
                </SheetHeader>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Stock Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Estoque Atual</p>
                    <p className={cn(
                      "text-3xl font-black tabular-nums",
                      (selectedProduct.current_stock ?? 0) === 0 ? "text-red-600" : ((selectedProduct.min_stock || 0) > 0 && (selectedProduct.current_stock ?? 0) <= (selectedProduct.min_stock || 0)) ? "text-amber-600" : "text-slate-900"
                    )}>
                      {selectedProduct.current_stock} <span className="text-sm font-bold text-slate-400">{selectedProduct.unit || 'UN'}</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Estoque Mínimo</p>
                    <p className="text-3xl font-black tabular-nums text-slate-900">
                      {selectedProduct.min_stock || 0} <span className="text-sm font-bold text-slate-400">{selectedProduct.unit || 'UN'}</span>
                    </p>
                  </div>
                </div>

                {/* Main Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Info size={14} className="text-blue-600" />
                    Informações Técnicas
                  </h4>
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="divide-y divide-slate-50">
                      <div className="p-4 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Unidade de Medida</span>
                        <span className="text-sm font-black text-slate-900">{selectedProduct.unit || 'UN'}</span>
                      </div>
                      <div className="p-4 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">SKU / Código</span>
                        <span className="text-sm font-mono font-bold text-slate-900">{selectedProduct.sku || '-'}</span>
                      </div>
                      <div className="p-4 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Marca / Fabricante</span>
                        <span className="text-sm font-black text-slate-900">{selectedProduct.brand || '-'}</span>
                      </div>
                      
                      {selectedProduct.category?.name?.toLowerCase().includes('epi') ? (
                        <>
                          <div className="p-4 flex justify-between items-center bg-blue-50/30">
                            <span className="text-xs font-bold text-blue-700">Número do CA</span>
                            <span className="text-sm font-black text-blue-900">{selectedProduct.ca_number || '-'}</span>
                          </div>
                          <div className="p-4 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500">Vencimento CA</span>
                            <span className="text-sm font-black text-slate-900">
                              {selectedProduct.ca_expiry ? format(new Date(selectedProduct.ca_expiry), "dd/MM/yyyy") : '-'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="p-4 flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500">Nº Patrimônio</span>
                          <span className="text-sm font-black text-slate-900">{selectedProduct.patrimony_number || selectedProduct.ca_number || '-'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} className="text-blue-600" />
                    Descrição do Produto
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[100px]">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {selectedProduct.description || 'Nenhuma descrição detalhada disponível para este produto.'}
                    </p>
                  </div>
                </div>

                {/* Activity Status */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Item Monitorado</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Última Atualização: {selectedProduct.updated_at ? format(new Date(selectedProduct.updated_at), "dd/MM/yy") : '-'}
                  </span>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 mt-auto">
                <Button variant="outline" className="w-full font-black uppercase tracking-widest text-[11px] h-12 rounded-xl" onClick={() => setSelectedProduct(null)}>
                  Fechar Detalhes
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!damageItem} onOpenChange={(open) => !open && !savingDamage && setDamageItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <ShieldAlert size={20} /> Registrar Avaria
            </DialogTitle>
            <DialogDescription>
              {damageItem?.name} · Saldo atual: <b>{damageItem?.current_stock ?? 0} {damageItem?.unit || 'UN'}</b>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="dmg-qty" className="font-bold">Quantidade a baixar para avariados</Label>
              <Input
                id="dmg-qty"
                type="number"
                min={1}
                max={damageItem?.current_stock ?? 1}
                value={damageQty}
                onChange={(e) => setDamageQty(e.target.value)}
              />
              <p className="text-[11px] text-slate-500">Quantas unidades serão movidas do estoque para avariados.</p>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Destino do item avariado</Label>
              <RadioGroup
                value={damageCondition}
                onValueChange={(v) => setDamageCondition(v as 'recuperavel' | 'descartado')}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                <label className="flex items-start gap-2 border border-slate-200 rounded-xl p-3 cursor-pointer hover:bg-slate-50">
                  <RadioGroupItem value="recuperavel" id="dmg-rec" className="mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-slate-900">Recuperável (Manutenção)</div>
                    <div className="text-[11px] text-slate-500">Vai para conserto / reparo</div>
                  </div>
                </label>
                <label className="flex items-start gap-2 border border-slate-200 rounded-xl p-3 cursor-pointer hover:bg-slate-50">
                  <RadioGroupItem value="descartado" id="dmg-desc" className="mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-slate-900">Descarte (Baixa Definitiva)</div>
                    <div className="text-[11px] text-slate-500">Item inutilizado, será descartado</div>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dmg-reason" className="font-bold">Motivo da avaria</Label>
              <Textarea
                id="dmg-reason"
                placeholder="Ex.: Carcaça quebrada após queda; rosca espanada; cabo cortado..."
                value={damageReason}
                onChange={(e) => setDamageReason(e.target.value.slice(0, 500))}
                rows={3}
              />
              <p className="text-[11px] text-slate-500">Descreva o que aconteceu com o item. (máx. 500 caracteres)</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDamageItem(null)} disabled={savingDamage}>
              Cancelar
            </Button>
            <Button onClick={submitDamage} disabled={savingDamage} className="bg-amber-600 hover:bg-amber-700 text-white">
              {savingDamage ? 'Registrando...' : 'Registrar Avaria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WarehouseDetails;