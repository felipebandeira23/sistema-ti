# Backend ITSM - Resumo e Execução

## Endpoints Novos
- SLA
  - POST /api/sla/recalculate: Recalcula status de SLA dos tickets.
  - POST /api/sla/simulate: Simula soma de horas úteis com corpo `{calendar_id, start, hours}`.

## Lógica de SLA (Horas Úteis)
- `app/services/sla_service.py:add_business_hours(session, calendar_id, start, hours)`: soma horas úteis considerando dias/horários de trabalho e feriados do calendário.
- Integrado na criação de tickets (`app/services/ticket_service.py`) quando o SLA possui `calendar_id`.

## Aprovações
- Multi-nível com quórum em `app/services/approval_service.py`:
  - Rejeição imediata cancela o ticket.
  - Quando atingido o quórum de aprovados, cria próximo nível ou avança o ticket para `EM_ANDAMENTO` na aprovação final.

## Tarefas Agendadas (Celery Beat)
- Configurado em `app/tasks/celery_app.py`:
  - `check_sla_status` a cada 5 minutos.
- Execução:
  - Worker: `celery -A app.tasks.celery_app.celery_app worker -l info`
  - Beat: `celery -A app.tasks.celery_app.celery_app beat -l info`

## Migrações Alembic
- Ambiente atual usa engine assíncrona (asyncpg) via `alembic/env.py`.
- Se houver erros, verifique dependências e URL do banco em `app/core/config.py`.
- Comandos:
  ```bash
  alembic -c alembic.ini upgrade head
  alembic -c alembic.ini revision --autogenerate -m "update models"
  ```

## Seed de Dados
- Script: `backend/seed_database.py` (já executado com sucesso no ambiente).

## Observações
- Pacotes necessários: `fastapi`, `sqlalchemy[asyncio]`, `asyncpg`, `pydantic`, `celery`, `redis`.
- Variáveis em `.env` podem sobrepor `app/core/config.py`.
