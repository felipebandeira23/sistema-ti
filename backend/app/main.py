from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db, close_db, AsyncSessionLocal
from app.core.security import get_password_hash
from app.core.cache import get_redis, close_redis
from app.api.routes import api_router
from app.services import ensure_admin_seed

logger = logging.getLogger(__name__)

# Configurar logging estruturado
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia lifecycle da aplicação (startup/shutdown)"""
    logger.info(f"🚀 Iniciando {settings.app_name} em modo {settings.environment}")
    
    # Startup
    await init_db()
    logger.info("✓ Banco de dados inicializado")

    # Seed admin local
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
    
    # Shutdown
    await close_db()
    await close_redis()
    logger.info("🛑 Aplicação finalizada")


def create_application() -> FastAPI:
    """Factory para criar e configurar a aplicação FastAPI"""
    
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description="Sistema de Gerenciamento de TI COPPEAD/UFRJ",
        lifespan=lifespan,
        debug=settings.debug,
    )
    
    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=settings.cors_allow_methods,
        allow_headers=settings.cors_allow_headers,
    )
    
    # Rota raiz
    @app.get("/")
    async def root():
        return {
            "app": settings.app_name,
            "version": "1.0.0",
            "environment": settings.environment,
            "status": "online"
        }
    
    # Health check
    @app.get("/health")
    async def health():
        try:
            redis = get_redis()
            await redis.ping()
            cache_status = "ok"
        except Exception:  # pylint: disable=broad-except
            cache_status = "unreachable"
        return {"status": "healthy", "cache": cache_status}

    # API routes
    app.include_router(api_router)
    
    return app


app = create_application()
