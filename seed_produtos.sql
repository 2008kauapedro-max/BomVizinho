-- Gerado de js/data.js. Rode de novo sempre que mudar produtos ou preços no site.
insert into public.produtos (id, nome, categoria, preco_centavos, ativo) values
  (1, 'Parafusadeira Furadeira de Impacto Brushless 20V', 'Elétricas', 99900, true),
  (2, 'Jogo de Ferramentas Completo 178 Peças com Chaves', 'Kits', 91990, true),
  (3, 'Esmerilhadeira Angular 4-1/2 Pol 850W 110V', 'Elétricas', 27990, true),
  (4, 'Furadeira de Impacto 750W 220V com Maleta', 'Elétricas', 37990, true),
  (5, 'Parafusadeira Furadeira de Impacto 38Pol 20V', 'Elétricas', 22990, true),
  (6, 'Kit Jardinagem Completo com Maleta 10 Peças', 'Jardim', 8990, true),
  (7, 'Compressor de Ar 110 Litros 10 Pés 220V', 'Elétricas', 289999, true),
  (8, 'Lavadora de Alta Pressão 1740PSI 1400W', 'Limpeza', 52990, true),
  (9, 'Chave Combinada Jogo 12 Peças Cromo Vanádio', 'Manuais', 14990, true),
  (10, 'Sistema de Irrigação por Gotejamento 50m', 'Irrigação', 18990, true),
  (11, 'Roçadeira a Gasolina 52cc Profissional', 'Agropecuária', 129900, true),
  (12, 'Betoneira 400L 220V Monofásica', 'Construção', 259990, true)
on conflict (id) do update set nome = excluded.nome, categoria = excluded.categoria, preco_centavos = excluded.preco_centavos, ativo = true;
