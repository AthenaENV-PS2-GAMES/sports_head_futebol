# Evidências e reconstrução

## Alvo e método

- Arquivo: SWF original (não distribuído; caminho em `SHF_SWF`).
- SHA-256: `d1d3c94dff217f402c26e06e386ed3d831055ebdd58c4ee12d8e81d02347554e`.
- SWF comprimido CWS, ActionScript AVM2, palco 800 × 540, 30 FPS declarados.
- Skill aplicada: `reverse-engineer-anything`, versão 42 instalada.
- A chamada REA `open_binary` recusou o alvo: `unsupported_target`, `file_format_rejected`, "unsupported binary format". O servidor não forneceu decompilação SWF. Não houve instalação nem alteração da configuração do REA.
- Alternativa específica de Flash: JPEXS 26.4.0 / Java 17, exportação de 216 scripts ActionScript, bitmaps, som, símbolos, textos e SVGs das timelines. `tools/inspect_swf.py`, aproveitado do port irmão, inventaria tags sem executar o Flash. Evidências completas: `analysis/swf_inventory.json`, `analysis/jpexs-*.log`, `reference/export`, `reference/vector`.
- Não houve execução comparativa do SWF original. A referência de comportamento é a lógica descompilada; as capturas do PCSX2 mostram a reconstrução.

## Correspondência com o código recuperado

| Evidência em `reference/export/scripts` | Implementação |
|---|---|
| `SportsHeadsSoccerDist_fla/MainTimeline.as`, `resetWorld` | Gravidade 300, três passos de 1/96 s; mundo nativo com escala de 30 pixels/metro |
| `initLevel` | Bola de raio 10, cabeças de raio 20 e densidade 100, pés retangulares 40 × 10, juntas com motor, paredes, teto e travessões |
| `onFrame_game` | Aceleração, amortecimento horizontal ×0,7, salto, controle do pé, IA por adversário e expansão do limite defensivo após 500/1000/1500 atualizações |
| `startLevel`, `checkWin`, `checkWinTime` | Regras alternadas, sete gols, relógio de 40 atualizações/segundo e morte súbita |
| `checkWinPoint`, `pointComp` | Gatilhos dos gols e intervalo de 15 atualizações entre pontos |
| `LevelBox_76.as` | Desbloqueio sequencial e repetição dos adversários vencidos |
| `Blueprints_85.as`, `Block_Prop.as`, `Circle_Prop.as` + sprite 362 | Geometria dos dez campos extraída das matrizes SVG; blocos usam escala ×50, círculos escala ×60 |
| Sprite 380 `Walls_95` | Arte dos obstáculos e contorno de cada campo |
| `spawnPU`, `PUHandler_103.as` | Dezoito power-ups, coleta pela bola e atribuição ao último jogador que tocou nela |
| `Bomb.as`, `spawnBomb` | Bombas visuais com aceleração 0,2/atualização, explosão em y=470, raio 50 para incapacitar jogadores |
| `spawnStreaker`, `onFrame_game` | Terceira cabeça física, alvos aleatórios, movimento ±100 e salto -300 |
| `CollisionHappened`, chamadas `Award` | Dezessete condições de conquistas, incluindo gols especiais, defesa, recuperação e campanha |
| `saveGame` / SharedObject | Persistência adaptada para MemoryCard do PS2 |
| Timelines raiz 4, 5, 14, 23, 32 e 40 | Instruções iniciais, menu, seleção, partida, medalhas/recordes e placares online identificados e separados |
| `ChoosePlayer2P_73`, `Briefer_119`, `GoalWords_113`, `PlayerWins_115` | Seletor, cartões de partida, gol, fim de tempo e vencedor reutilizados como artes do port |
| `AchievementsPage_82`, `Ach_decal_83`, `LevelBox_76` | Página original de conquistas, estados dos emblemas e três estados de bloqueio/vitória dos cards |
| `Cover_15.as` | Transição guarda uma cópia do palco e a remove após 20 quadros |

O jogador humano do modo solo ocupa o lado direito, como no original. "Bombs_Good/Bad" são nomes de classes que alteram o tamanho dos gols; o power-up que realmente faz cair bombas é `PU_Fireground_Neu`.

No SWF, `HERORACKET` e `OPPRACKET` recebem a posição do corpo Box2D do pé e a rotação do corpo +180 graus. Os SVGs registram os pivôs do pé em x=2,75 e x=15,75 (y=9,55); por isso o port agora gira as imagens em torno desses pontos, não do centro da textura. As velocidades/ângulos do motor já seguiam as fórmulas de `onFrame_game`.

## AthenaENV e limites do PS2

Foi inspecionado o catálogo de 69 módulos e os tipos/fontes locais. A compilação foi feita em uma cópia em `/tmp/shf-athena`, sem configurar nem compilar dentro do projeto pai. Referência Git do pai na análise: `c04434bdb51e9d6141c61a953ce9e8a81273eb8f` (esse hash não autentica eventuais modificações locais do pai).

O novo ELF contém Box2D 3.2 nativo, renderização, input, áudio, memória e armazenamento. A seleção gerada está em `docs/Makefile.modules`. CDROM registra cdfs; USBMASS registra usbd, bdm, bdmfs_fatfs e usbmass_bd, carregados conforme o dispositivo de boot. Registro não significa que o driver USB tenha sido iniciado em uma execução por HostFS.

As imagens são rasterizadas offline a 80% do palco e quantizadas para PNG indexado. Cenário e piso são compostos offline, preservando os filtros do SVG. O bitmap de piso original 93 é composto separadamente porque o padrão aninhado GroundBlock exigia uma superfície intermediária maior que 32K no librsvg. Sem processamento de SVG ou ActionScript no console.

O Loop nativo apresenta a tela com VSync e atualiza a simulação a 30 Hz. Os dois loops musicais originais têm durações diferentes. O maior usa a voz de streaming do audsrv; o menor usa uma voz ADPCM com loop na SPU2, mantendo repetição independente. Os demais efeitos também usam ADPCM na SPU2. A conversão para 22,05 kHz mono respeita `SeekSamples` e a quantidade de amostras de cada DefineSound para remover atraso de codificação e padding dos MP3s. MemoryCard faz gravações JSON atômicas e enfileira a atualização mais recente, com ícone próprio no navegador do PS2.

## Fidelidade visual e diferenças restantes

As telas de instrução, menu, seleção de adversários e conquistas agora partem dos quadros/símbolos originais. Os cards de nível usam os estados nativos bloqueado, disponível e vencido, com nomes/placares dinâmicos. A tela de dois jogadores, os cartões de introdução, os textos de gol/fim de tempo e os emblemas são exportados do SWF. Os rótulos de teclado nos cartões foram substituídos pelos controles DualShock 2; não há painéis de instruções, pausa ou resultado desenhados pelo port nas telas usadas normalmente.

Os MovieClips laterais `296` do menu percorrem seus 48 quadros e os contornos de power-up `104`, `110` e `119` nas instruções percorrem os 30 quadros originais. Os quadros são PNGs transparentes/indexados, avançados a 30 Hz pelo loop nativo. A posição do botão “2 Player” usa o registro original em x=300, que centraliza o sprite de 200 unidades no palco de 800. Os quatro botões do menu são recortados dos usos da timeline raiz 5, incluindo os filtros SVG de sombra/relevo que não estão nos símbolos internos; o rollover (`lightTint`) é uma mistura de 50% com branco. “Continue Game” sem gravação usa opacidade de 50%, conforme o estado desabilitado original.

O SWF inicia com a animação `mb_intro_9` (sprite 197, 208 quadros) e uma chamada de anúncio Mochi, e prossegue para as instruções. O port reproduz a animação quadro a quadro (PNGs indexados de 64 cores, carregados sob demanda e liberados para limitar a memória) e omite o anúncio, que não existe no PS2. O quadro `results` (32) é a página de medalhas/pontos, não o resultado imediato de uma partida. O fim de jogo original mostra `FULL TIME!` no modo solo ou a mensagem `PLAYER n WINS!` no modo local e volta à seleção/menu após a animação; essa sequência foi mantida. As entradas entre telas preservam por 20 atualizações o estado visual anterior antes de revelar a tela seguinte.

Limite da transição: `Cover_15` chama `BitmapData.draw(root)` e exibe um snapshot de framebuffer. Os módulos disponíveis no AthenaENV não expõem leitura do framebuffer ao JavaScript, então o port redesenha a tela anterior congelada durante os 20 quadros em vez de copiar pixels. Isso preserva duração e composição estática, mas não reproduz o snapshot/fade pixel a pixel. O intervalo entre gols também não usa o snapshot do Cover.

- O Flash contém uma versão antiga do Box2D; AthenaENV oferece 3.2. A geometria e os parâmetros foram transportados, mas o solver e suas tolerâncias são diferentes. Cada chamada usa quatro subpassos nativos, em vez de 48 iterações do solver antigo. Colisões e trajetórias não têm equivalência numérica demonstrada.
- Alguns temporizadores do `PUHandler` original reiniciam variáveis de outro efeito. O port usa expiração independente do efeito correspondente; não reproduz esses aparentes erros de associação. Todas as 17 conquistas são persistidas, enquanto `saveGame` do SWF lista apenas as primeiras 12.
- Explosões usam os 20 quadros originais. Poeira, rastros, rings de impacto/salto, ícones de áudio, brilho de velocidade, gelo/bomba e pés quebrados usam sprites exportados. Os efeitos leves têm um limite de 64 instâncias para conter o custo no PS2. Os 18 ícones de power-up têm um quadro cada no SWF.
- A consulta/entrada no placar online de frames 32 e 40 depende do serviço Mochi, que foi encerrado e não é transportado para o PS2. As telas de fim de partida locais usam os avisos originais; não há uma tabela local inventada.
- O intervalo entre gols suspende a simulação do port; o SWF continua atualizando o mundo durante parte dessa transição. O port anuncia o resultado assim que a condição é cumprida.
- Não foi realizado replay automatizado com entradas idênticas no Flash e no PS2. Portanto, "extremamente fiel" continua sendo uma meta de comparação, não uma certificação entregue por estes testes.
- Serviços Mochi, anúncios, links e placares web não fazem parte do port.
- Testes de CD/USB em um PS2 físico continuam necessários; PCSX2 não comprova compatibilidade elétrica, desempenho de mídia nem limites de todos os modelos do console.
