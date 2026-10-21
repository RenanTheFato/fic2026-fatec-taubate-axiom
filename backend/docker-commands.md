# Docker Compose: Cheatsheet MySQL

Comandos de referência para gerenciar o container do MySQL no backend.

## Subir e derrubar

| Comando | O que faz |
|---|---|
| `docker compose up -d` | Sobe em background |
| `docker compose up` | Sobe com logs no terminal (o Ctrl+C nesse terminal **para o container**) |
| `docker compose down` | Para e remove containers (mantém o volume/dados) |
| `docker compose down -v` | Para e **apaga o volume também** (perde os dados do banco) |
| `docker compose stop` | Só pausa os containers, sem remover |
| `docker compose start` | Retoma containers parados |
| `docker compose restart` | Reinicia os containers |

## Status e logs

| Comando | O que faz |
|---|---|
| `docker compose ps` | Lista containers do compose e status |
| `docker compose logs mysql` | Mostra logs do serviço mysql |
| `docker compose logs -f mysql` | Segue os logs em tempo real (`-f` = follow) |
| `docker compose top` | Mostra processos rodando dentro dos containers |

## Acessar o MySQL diretamente

| Comando | O que faz |
|---|---|
| `docker compose exec mysql bash` | Entra no shell do container |
| `docker compose exec mysql mysql -u root -p` | Abre o client mysql (pede senha) |
| `docker compose exec mysql mysql -u app_user -p meu_banco` | Já conecta direto no banco |

## Rebuild e limpeza

| Comando | O que faz |
|---|---|
| `docker compose pull` | Atualiza a imagem (puxa versão nova do `mysql:8.4`) |
| `docker compose up -d --force-recreate` | Força recriar o container mesmo sem mudanças |
| `docker volume ls` | Lista volumes (pra achar o `mysql_data`) |
| `docker volume rm <nome>` | Remove um volume específico manualmente |

## Backup e restore

| Comando | O que faz |
|---|---|
| `docker compose exec mysql mysqldump -u root -p meu_banco > backup.sql` | Dump do banco pra um arquivo `.sql` |
| `docker compose exec -T mysql mysql -u root -p meu_banco < backup.sql` | Restaura a partir do arquivo |

## Liberar a memória do WSL (Windows)

No Windows o Docker Desktop roda dentro do WSL 2, e a memória que ele ocupa aparece no Gerenciador
de Tarefas como `VmmemWSL`. Fechar a janela do Docker Desktop não devolve essa memória: só desligar
o WSL devolve. Rode na ordem, em qualquer pasta, exceto o primeiro comando, que é dentro de
`backend/`:

| Comando | O que faz |
|---|---|
| `docker compose stop` | Para o container antes, para o MySQL fechar os arquivos com calma |
| `docker desktop stop` | Desliga o Docker Desktop. Com ele aberto, o `wsl --shutdown` derruba o motor e ele tenta religar |
| `wsl --shutdown` | **Desliga o WSL inteiro**: todas as distribuições (`docker-desktop`, `Ubuntu`) e a máquina virtual. Devolve a memória do `VmmemWSL` |
| `wsl -l -v` | Confere: todas as distribuições devem aparecer como `Stopped` |
| `wsl --terminate Ubuntu` | Desliga só uma distribuição e deixa as outras rodando |

Para voltar: `docker desktop start` (ele religa o WSL sozinho) e depois `docker compose up -d` em
`backend/`. Os dados do banco ficam no volume e não se perdem.

Para o WSL nunca passar de um teto, crie `%UserProfile%\.wslconfig` com o conteúdo abaixo e rode
`wsl --shutdown` uma vez para valer:

```ini
[wsl2]
memory=4GB
```