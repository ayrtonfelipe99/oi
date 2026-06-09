import { create } from 'zustand';

interface ServiceOrderStore {
  selectedSoId: string;
  setSelectedSoId: (id: string) => void;
}

export const useServiceOrderStore = create<ServiceOrderStore>((set) => ({
  selectedSoId: '',
  setSelectedSoId: (id) => set({ selectedSoId: id }),
}));
