-- =========================================================================
-- SCRIPT PARA CORRIGIR O REALTIME DA TABELA STORE_SETTINGS
-- Instruções: Execute este script no SQL Editor do seu Dashboard Supabase.
-- =========================================================================

-- Passo 1: Adicionar a tabela ao Realtime (Se der erro avisando que já existe, ignore e execute apenas o Passo 2)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;

-- Passo 2: Garantir que o Supabase envie TODOS os dados (mesmo os não modificados) quando houver alteração
-- Isso conserta o bug do toggle de Frete não atualizar a tela do Cliente instantaneamente.
ALTER TABLE public.store_settings REPLICA IDENTITY FULL;
