-- Políticas de Segurança para permitir o salvamento de imagens no Bucket 'products'

-- 1. Permite que quem estiver LIGADO/AUTENTICADO no App faça Upload (Insert) de imagens.
CREATE POLICY "Permitir upload para autenticados" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'products');

-- 2. Permite que QUALQUER UM (Public) veja/leia as fotos dos produtos pelo link
CREATE POLICY "Permitir visualizacao publica de imagens" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'products');

-- 3. Opcional: Permite que apenas autenticados editem as próprias fotos
CREATE POLICY "Permitir exclusao e edicao" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'products');
