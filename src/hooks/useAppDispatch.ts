/**
 * hooks/useAppDispatch.ts
 * Typed Redux dispatch and selector hooks.
 */

import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { AppDispatch } from '@/app/store';
import type { RootState } from '@/app/rootReducer';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
