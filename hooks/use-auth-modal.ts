"use client"

import { create } from 'zustand'

type AuthModalStore = {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
  toggleModal: () => void
}

export const useAuthModal = create<AuthModalStore>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
  toggleModal: () => set((state) => ({ isOpen: !state.isOpen })),
}))
