from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuração da aplicação baseada em variáveis de ambiente"""
    
    # Aplicação
    app_name: str = "COPPEAD ITSM"
    debug: bool = False
    environment: str = "development"
    
    # Segurança
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 120
    refresh_token_expire_days: int = 30
    
    # Banco de dados (PostgreSQL)
    database_url: str = "postgresql+asyncpg://itsm_user:itsm_password@db:5432/itsm"
    
    # Cache e Fila (Redis)
    redis_url: str = "redis://redis:6379/0"
    redis_cache_ttl: int = 3600
    
    # LDAP/Active Directory
    ldap_enabled: bool = True
    ldap_server: str = "ldap://ldap.coppead.ufrj.br:389"
    ldap_base_dn: str = "dc=coppead,dc=ufrj,dc=br"
    ldap_bind_dn: str | None = None
    ldap_bind_password: str | None = None
    ldap_users_ou: str = "ou=users"
    ldap_groups_ou: str = "ou=groups"
    ldap_use_ssl: bool = False
    
    # Admin Local (fallback)
    admin_username: str = "admin"
    admin_password: str = "change_me_immediately"
    
    # Email (SMTP)
    smtp_host: str = "smtp.coppead.ufrj.br"
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str = "suporte-ti@coppead.ufrj.br"
    smtp_use_tls: bool = True
    
    # GLPI Integration
    glpi_enabled: bool = True
    glpi_url: str = "https://glpi.coppead.ufrj.br"
    glpi_api_token: str | None = None
    glpi_sync_schedule: str = "0 2 * * *"  # 02:00 daily
    
    # Calendário (horário útil)
    timezone: str = "America/Sao_Paulo"
    work_hours_start: str = "08:00"
    work_hours_end: str = "18:00"
    work_days: list[str] = ["MON", "TUE", "WED", "THU", "FRI"]
    
    # Celery
    celery_broker_url: str = "redis://redis:6379/1"
    celery_result_backend: str = "redis://redis:6379/2"
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = ["*"]
    cors_allow_headers: list[str] = ["*"]

    # Rate Limiting
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 100  # requests per window
    rate_limit_window_seconds: int = 60  # window size in seconds

    # Frontend URL (para links em emails)
    frontend_url: str = "http://localhost:3000"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


def get_settings() -> Settings:
    """Retorna instância de Settings (injeção de dependência)"""
    return Settings()


settings = get_settings()
