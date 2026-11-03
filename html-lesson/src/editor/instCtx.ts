import { createContext, useContext } from 'react';

/** Какой экземпляр слайда сейчас рисуется: копии слайда получают отдельное состояние заданий */
export const SlideInstCtx = createContext<{ id: string; base: string | null } | null>(null);
export const useSlideInst = () => useContext(SlideInstCtx);
