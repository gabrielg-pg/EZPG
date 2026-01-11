-- Adiciona 'Pendente' como opção válida de status nas reuniões

ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_status_check;
ALTER TABLE meetings ADD CONSTRAINT meetings_status_check 
  CHECK (status IN ('Pendente', 'Compra', 'Talvez', 'Não compra'));

-- Atualiza o valor padrão para 'Pendente'
ALTER TABLE meetings ALTER COLUMN status SET DEFAULT 'Pendente';
