import { useState, useCallback } from 'react';
import { supabase } from '../../../../data/datasources/supabase/client';

interface DeletedUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  deleted_at: string;
  scheduled_delete_at: string;
}

export function useAdminSettingsDeletedUsers() {
  const [showDeletedUsersModal, setShowDeletedUsersModal] = useState(false);
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDeletedUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, deleted_at, scheduled_delete_at')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (!error && data) {
        setDeletedUsers(data as DeletedUser[]);
      }
    } catch {
      setDeletedUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenDeletedUsers = useCallback(() => {
    fetchDeletedUsers();
    setShowDeletedUsersModal(true);
  }, [fetchDeletedUsers]);

  const handleHardDelete = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('hard_delete_expired_accounts');
      if (error) {
        console.log('Erro ao deletar conta:', error);
        return;
      }
      await fetchDeletedUsers();
    } catch (err) {
      console.log('Erro ao deletar conta:', err);
    }
  }, [fetchDeletedUsers]);

  return {
    showDeletedUsersModal,
    setShowDeletedUsersModal,
    deletedUsers,
    loading,
    handleOpenDeletedUsers,
    handleHardDelete,
  };
}
