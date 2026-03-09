import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { loadMyTickets, loadTicketById, clearSelected } from '../features/tickets';

/** Load + expose the current user's ticket list. */
export function useMyTickets() {
  const dispatch = useAppDispatch();
  const { list, listLoading, error } = useAppSelector((s) => s.tickets);

  useEffect(() => {
    dispatch(loadMyTickets());
  }, [dispatch]);

  const refresh = () => dispatch(loadMyTickets());

  return { tickets: list, loading: listLoading, error, refresh };
}

/** Load + expose a single ticket by id. Clears on unmount. */
export function useTicketDetail(id: number | null) {
  const dispatch = useAppDispatch();
  const { selected, detailLoading, error } = useAppSelector((s) => s.tickets);

  useEffect(() => {
    if (id != null) dispatch(loadTicketById(id));
    return () => { dispatch(clearSelected()); };
  }, [dispatch, id]);

  return { ticket: selected, loading: detailLoading, error };
}