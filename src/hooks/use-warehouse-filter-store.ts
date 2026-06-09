import { create } from 'zustand';

interface WarehouseFilterStore {
  warehouseFilter: string; // 'all' or warehouse id
  setWarehouseFilter: (id: string) => void;
}

export const useWarehouseFilterStore = create<WarehouseFilterStore>((set) => ({
  warehouseFilter: 'all',
  setWarehouseFilter: (id) => set({ warehouseFilter: id }),
}));
