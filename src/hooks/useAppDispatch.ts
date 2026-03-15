import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/app/store';
import type { RootState } from '@/app/rootReducer';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);
