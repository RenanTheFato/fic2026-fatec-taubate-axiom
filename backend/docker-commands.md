# Docker Compose — Cheatsheet MySQL

Comandos de referência para gerenciar o container do MySQL no backend.

## Subir e derrubar

| Comando | O que faz |
|---|---|
| `docker compose up -d` | Sobe em background |
| `docker compose up` | Sobe com logs no terminal |
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