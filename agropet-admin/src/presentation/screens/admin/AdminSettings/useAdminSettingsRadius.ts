import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../../data/datasources/supabase/client';

export function useAdminSettingsRadius(checkAllPermissions: () => Promise<void>) {
  const [radius, setRadius] = useState('17');
  const [isEditingRadius, setIsEditingRadius] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deliveryDisabled, setDeliveryDisabled] = useState(false);

  const fetchRadius = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('delivery_radius_km, delivery_active')
        .maybeSingle();

      if (data && !error) {
        if (data.delivery_radius_km !== null) {
          setRadius(String(Math.round(data.delivery_radius_km)));
        } else {
          setRadius('17');
        }
        if (data.delivery_active !== undefined && data.delivery_active !== null) {
          setDeliveryDisabled(!data.delivery_active);
        } else {
          setDeliveryDisabled(false);
        }
      } else {
        setRadius('17');
        setDeliveryDisabled(false);
      }
    } catch (e) {
      console.log('Error loading radius/delivery from DB:', e);
      setRadius('17');
      setDeliveryDisabled(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      checkAllPermissions(),
      fetchRadius()
    ]);
    setRefreshing(false);
  };

  const handleSaveRadius = async (newRadius: string) => {
    const parsed = parseFloat(newRadius);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Erro', 'Por favor, insira um número válido maior que zero.');
      return;
    }

    try {
      const { data: existing, error: selectError } = await supabase
        .from('store_settings')
        .select('id')
        .maybeSingle();

      if (selectError) throw selectError;

      if (existing) {
        const { error: updateError } = await supabase
          .from('store_settings')
          .update({ delivery_radius_km: parsed })
          .eq('id', existing.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('store_settings')
          .insert({ delivery_radius_km: parsed });
        if (insertError) throw insertError;
      }

      setRadius(String(Math.round(parsed)));
      setIsEditingRadius(false);
      Alert.alert('Sucesso', 'Raio de alcance atualizado com sucesso!');
    } catch (e) {
      console.error('Error saving radius:', e);
      Alert.alert('Erro', 'Não foi possível salvar o raio de alcance.');
    }
  };

  const handleToggleDelivery = async (newDisabledState: boolean) => {
    try {
      const activeValue = !newDisabledState;

      const { data: existing, error: selectError } = await supabase
        .from('store_settings')
        .select('id')
        .maybeSingle();

      if (selectError) throw selectError;

      if (existing) {
        const { error: updateError } = await supabase
          .from('store_settings')
          .update({ delivery_active: activeValue })
          .eq('id', existing.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('store_settings')
          .insert({ delivery_active: activeValue });
        if (insertError) throw insertError;
      }

      setDeliveryDisabled(newDisabledState);
      Alert.alert(
        'Sucesso',
        newDisabledState
          ? 'Frete desativado com sucesso!'
          : 'Frete ativado com sucesso!'
      );
    } catch (e) {
      console.error('Error toggling delivery:', e);
      Alert.alert('Erro', 'Não foi possível alterar a configuração de frete.');
    }
  };

  return {
    radius,
    setRadius,
    isEditingRadius,
    setIsEditingRadius,
    refreshing,
    deliveryDisabled,
    setDeliveryDisabled,
    fetchRadius,
    handleRefresh,
    handleSaveRadius,
    handleToggleDelivery,
  };
}
