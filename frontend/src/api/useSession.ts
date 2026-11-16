import { useMeQuery } from './api';
import type { User } from './types';

/**
 * The signed-in user, or undefined. After a failed check (expired session)
 * RTK Query keeps the previous data around, so errors must win over it.
 */
export function useSession(): { user: User | undefined; isLoading: boolean } {
  const { data, isError, isLoading } = useMeQuery();
  return { user: isError ? undefined : data, isLoading };
}
