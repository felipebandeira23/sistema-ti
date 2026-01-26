"""Cliente Redis compartilhado para cache/rate limiting."""
import redis.asyncio as redis
from typing import AsyncGenerator

from app.core.config import settings

_redis_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    """Retorna instância singleton do cliente Redis."""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_client


async def close_redis() -> None:
    """Fecha conexões do Redis."""
    global _redis_client
    if _redis_client is not None:
        await _redis_client.close()
        _redis_client = None


async def get_redis_dependency() -> AsyncGenerator[redis.Redis, None]:
    """Dependency para injeção em rotas/serviços."""
    client = get_redis()
    try:
        yield client
    finally:
        # Conexão é gerenciada pelo client singleton; nada a fechar aqui.
        pass
