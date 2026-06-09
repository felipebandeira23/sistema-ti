from contextlib import asynccontextmanager
import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db, close_db, AsyncSessionLocal
from app.core.security import get_password_hash
from app.core.cache import get_redis, close_redis
from app.api.routes import api_router
from app.services import ensure_admin_seed

logger = logging.getLogger(__name__)

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# Rotas excluídas do rate limiting
_RATE_LIMIT_SKIP = {"/health", "/", "/docs", "/openapi.json", "/redoc"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia lifecycle da aplicação (startup/shutdown)"""
    logger.info(f"🚀 Iniciando {settings.app_name} em modo {settings.environment}")

    await init_db()
    logger.info("✓ Banco de dados inicializado")

    try:
        async with AsyncSessionLocal() as session:
            admin_hash = get_password_hash(settings.admin_password)
            await ensure_admin_seed(
                session,
                admin_username=settings.admin_username,
                admin_password_hash=admin_hash,
                admin_email=settings.smtp_from_email,
            )
        logger.info("✓ Admin local verificado/criado")
    except Exception as exc:  # pylint: disable=broad-except
        logger.warning("Falha ao criar admin local: %s", exc)

    yield

    await close_db()
    await close_redis()
    logger.info("🛑 Aplicação finalizada")


def _get_client_ip(request: Request) -> str:
    """Extrai IP real considerando proxy reverso."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def create_application() -> FastAPI:
    """Factory para criar e configurar a aplicação FastAPI"""

    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description="Sistema de Gerenciamento de TI COPPEAD/UFRJ",
        lifespan=lifespan,
        debug=settings.debug,
    )

    # ── CORS ────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=settings.cors_allow_methods,
        allow_headers=settings.cors_allow_headers,
    )

    # ── Security Headers ────────────────────────────────────────────────────
    @app.middleware("http")
    async def security_headers_middleware(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )
        # Strict-Transport-Security only in production (requires HTTPS)
        if settings.environment == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        return response

    # ── Rate Limiting (Redis sliding window) ────────────────────────────────
    if settings.rate_limit_enabled:
        @app.middleware("http")
        async def rate_limit_middleware(request: Request, call_next):
            if request.url.path in _RATE_LIMIT_SKIP:
                return await call_next(request)

            client_ip = _get_client_ip(request)
            window = settings.rate_limit_window_seconds
            limit = settings.rate_limit_requests
            now = int(time.time())
            bucket_key = f"rl:{client_ip}:{now // window}"

            try:
                redis = get_redis()
                current = await redis.incr(bucket_key)
                if current == 1:
                    await redis.expire(bucket_key, window * 2)

                if current > limit:
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Muitas requisições. Aguarde e tente novamente."},
                        headers={"Retry-After": str(window)},
                    )
            except Exception:  # pylint: disable=broad-except
                # Falha silenciosa: se Redis estiver indisponível, não bloquear o usuário
                pass

            return await call_next(request)

    # ── Rotas ───────────────────────────────────────────────────────────────
    @app.get("/")
    async def root():
        return {
            "app": settings.app_name,
            "version": "1.0.0",
            "environment": settings.environment,
            "status": "online",
        }

    @app.get("/health")
    async def health():
        try:
            redis = get_redis()
            await redis.ping()
            cache_status = "ok"
        except Exception:  # pylint: disable=broad-except
            cache_status = "unreachable"
        return {"status": "healthy", "cache": cache_status}

    app.include_router(api_router)

    return app


app = create_application()
