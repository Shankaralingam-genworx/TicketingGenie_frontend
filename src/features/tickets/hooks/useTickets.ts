import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { loadMyTickets, loadTicketById, clearSelected } from '../slices/ticketSlice';

export function useMyTickets() {
  const dispatch = useAppDispatch();
  const { list, listLoading, error } = useAppSelector((s) => s.tickets);

  useEffect(() => { dispatch(loadMyTickets()); }, [dispatch]);

  const refresh = () => dispatch(loadMyTickets());
  return { tickets: list, loading: listLoading, error, refresh };
}

export function useTicketDetail(id: number | null) {
  const dispatch = useAppDispatch();
  const { selected, detailLoading, error } = useAppSelector((s) => s.tickets);

  useEffect(() => {
    if (id != null) dispatch(loadTicketById(id));
    return () => { dispatch(clearSelected()); };
  }, [dispatch, id]);

  return { ticket: selected, loading: detailLoading, error };
}
