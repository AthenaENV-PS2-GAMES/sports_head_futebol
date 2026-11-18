# Comparação port × SWF original

Método: SWF original executado no Ruffle (nightly 2026-11-17, X11, tela cheia), capturas via `gnome-screenshot` e reduzidas a 800×540; port capturado no PCSX2 2.8.2 com F8. Os pares lado a lado contêm quadros do jogo original e não são versionados.
Limite: Ruffle não é o Flash Player oficial, e a comparação é visual/estática. Não houve replay determinístico (IA e `Math.random` do original).

| # | Tela | Original | Port | Gravidade | Status |
|---|---|---|---|---|---|
| 1 | Partida | Contagem 3-2-1 (`Counter_109`, 90 quadros com `pauseGame`) no início e após cada gol, com placar grande `0 - 0` | Sem contagem nem sprite correspondente | Alta | **Corrigido**: 3-2-1 de 90 atualizações congela física e relógio após o início e cada gol (`game/physics.js reset`, `runtime.js`) |
| 2 | Partida (HUD) | Placar grande em branco nos cantos superiores, tempo no topo central | Nomes pequenos nos cantos ("WINE RUNEY"/"PLAYER 1"), placar pequeno verde no centro | Alta | **Corrigido**: placares brancos nos cantos, tempo no topo, placar grande com fade de 100 atualizações |
| 3 | Partida (barra inferior) | Controles, "1 MINUTE TIMED GAME", logos | Quatro caixas vazias | Média | **Corrigido**: controles do DualShock e modo de jogo nas caixas (logos omitidos) |
| 4 | Partida | `MatchPoint_110`, `GoalHit_118`, `Flasher_121`, `GroundBlinker_107`, `score_mc_108` | Não usados no port | Média | **Resolvido**: só `Flasher_121` é visível no original (brilho vermelho aos 10 s, implementado). `MatchPoint_110` fica fora do palco (y=-237/-100), `GroundBlinker_107` depende de `bouncesLeft/Right`, que nunca são incrementados, e `GoalHit_118` são caixas invisíveis (o port já usa as áreas). `score_mc_108` foi feito no item 2 |
| 5 | Seleção de níveis | Cartões com brilho azul (disponível) / vermelho (bloqueado); nomes legíveis | Sem brilho; cartão cinza com padrão circular; nomes ilegíveis (~6 px); nível 1 não parece disponível | Alta | **Corrigido**: brilho vermelho/azul/verde (canvas ampliado em `build_assets.py`), gradiente sem faixas (libimagequant), nomes e números legíveis |
| 6 | Cartão de partida | Sem bola visível | Bola visível sobre o cartão | Baixa | **Corrigido**: bola não é desenhada durante o cartão |
| 7 | Splash | Logo Mousebreaker antes das instruções | Omitido (começa nas instruções) | Baixa | **Corrigido**: os 208 quadros de `mb_intro_9` são exportados do SVG e reproduzidos a 30 Hz (X/START pula; o original não permite pular); anúncio omitido |
| 8 | Menu | "Sports Heads Tennis", "Play More Games" | Omitidos (links/anúncios) | Aceito | **Aceito** (links/anúncios) |
| 9 | Menu | Continue Game a 50% | Continue Game claramente mais claro que o original | Baixa, verificar | **Corrigido**: a modulação do GS dobrava o branco (128 = neutro); agora 50% real |
| 10 | Brief | Texto diz 2 minutos; barra diz "1 MINUTE" (inconsistência do original) | Mantém 2 minutos | Informativo | Informativo |

Revalidado no PCSX2 (F8) após as correções.

Não verificados: física/trajetórias, efeitos de cada power-up, fim de partida, conquistas, 2 jogadores no original.

## Auditoria de áudio, efeitos, power-ups e cosméticos (segunda passada)

Método: leitura das chamadas `Utils.playSound`, `PUHandler_103`, `Bomb`, `spawn*` e dos quadros do SWF contra `game/`, mais capturas F8. Áudio não foi comparado de ouvido; a conferência é por código.

| Item | Original | Port antes | Status |
|---|---|---|---|
| Som `die` (`8_DieSound`) | Toca em todo gol | Não existia | **Corrigido** (`tools/prepare_audio.py`) |
| Som `cheer` no gol | Só quando o lado direito marca | Em todo gol | **Corrigido** |
| Apito | Só ao fim da partida | Também no início | **Corrigido** |
| Som `kick` nos botões | Níveis, voltar, instruções, conquistas | Só no menu | **Corrigido** |
| Nome do power-up | Escrito no placar grande (`scoreMC.writeText`), sem texto para cabeça/perna/streaker | Texto pequeno, inclusive para cabeça/perna/streaker | **Corrigido** |
| Anéis ao coletar | Só em power-ups de bola (`updateBall`, também na expiração) | Em todos | **Corrigido** |
| Anéis ao surgir bomba | `spawn4Rings` | Nenhum | **Corrigido** |
| Sombra da bola (`Shadow`, sprite 430) | x da bola, y=463, escala Y 1/3 | Ausente | **Corrigido** |
| Paredes | Posição (-4, 4) | (4, -4): faixa clara na esquerda e 8 px de erro vertical | **Corrigido** |
| Logos Mousebreaker/KChamp na barra | Presentes | Ausentes | **Corrigido** |
| Botões Menu/Instructions/Achievements (níveis) | Bisel e sombra do quadro 14 | Sem filtro | **Corrigido** |

Divergências conhecidas mantidas: som `pop` ao navegar por menus com o direcional (adaptação ao controle; o original usa mouse); som de salto também no salto da IA que no original é silencioso; temporizadores dos power-ups de gelo e bola com expiração independente (o original reinicia o temporizador errado, o que pode deixar o congelamento sem fim até o próximo ponto).

## Terceira passada (feedback de uso)

| Item | Causa | Status |
|---|---|---|
| Mapa com faixa em branco no topo/direita | `Scores_94` contém as paredes (posição líquida 0,0) e a moldura preta; a posição (±4, ∓4) estava errada | **Corrigido** (`walls_composite` em `build_assets.py`) |
| Sombra interna cinza da moldura | `filter51` de `Scores_94` | **Corrigido** |
| Sombra no topo da HUD e acima do chão | `filter67` de `GroundBlock_100`, perdido ao compor a faixa à parte | **Corrigido** (campo, menu e níveis) |
| Ícones de áudio da barra | Brancos na partida, escuros nos menus | **Corrigido** |
| Animação dos power-ups | JPEXS congela o distintivo (sprites 110/104/119, 30 quadros) no quadro 1 | **Corrigido**: emblema estático + distintivo animado desde o surgimento |
| Animação do Mousebreaker | JPEXS repete `Symbol242_12` (explosão, 19 quadros, para invisível) em loop | **Corrigido**: explosão só nos quadros 46–58; som `175.mp3` no quadro 46; música só depois do splash |
| Realce da seleção | Moldura amarela era invenção do port | **Removida**: só o `lightTint` de 50% do original |
| Ícone do memory card | Verificado na BIOS (PCSX2): título, tamanho e ícone 3D corretos; a cabeça do Head 1 (sprite original) extrudada em placa 3D, como no Gravity Guy: 1 frame estático, 540 vértices, gerada no Blender (`tools/blender/head1_slab.py`) | `docs/screenshots/memory-card-icon.png` |

## Quarta passada

| Item | Antes | Agora | Evidência |
| --- | --- | --- | --- |
| Texto do briefing de 2 jogadores | O divisor central cortava "X / START: KICK OFF" | A linha foi para baixo do fim do divisor | `docs/screenshots/intro-two-player.png` |
| Seleção ao confirmar em menus | `go()` zerava o cursor e a tela de saída era desenhada com o primeiro item em destaque durante a transição | A tela de saída mantém a própria seleção até terminar o fade | `docs/screenshots/menu-transition.png` (cena `menu-transition`) |
