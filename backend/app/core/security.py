from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from jose import jwt, JWTError
import bcrypt
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Configuração JWT
ALGORITHM = "HS256"


def create_access_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
    extra: Optional[Dict[str, Any]] = None,
) -> str:
    """Cria JWT access token com expiração configurável"""
    payload: Dict[str, Any] = {"sub": subject, "type": "access"}
    
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload["exp"] = expire
    payload["iat"] = datetime.now(timezone.utc)
    
    if extra:
        payload.update(extra)
    
    token = jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)
    return token


def create_refresh_token(subject: str) -> str:
    """Cria JWT refresh token com validade maior"""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    payload = {
        "sub": subject,
        "type": "refresh",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)
    return token


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodifica e valida JWT token"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.warning(f"Token decode error: {str(e)}")
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se senha corresponde ao hash usando bcrypt nativo"""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception as e:
        logger.error(f"Erro ao verificar senha: {e}")
        return False


def get_password_hash(password: str) -> str:
    """Gera hash seguro da senha com bcrypt nativo"""
    # Truncar senha para 72 bytes (limite do bcrypt)
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """Valida força da senha (req. do documento: 12+ chars, complexidade)"""
    if len(password) < 12:
        return False, "Senha deve ter no mínimo 12 caracteres"
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in "!@#$%^&*()-_=+[]{}|;:,.<>?" for c in password)
    
    if not (has_upper and has_lower and has_digit and has_special):
        return False, (
            "Senha deve conter: maiúsculas, minúsculas, números e símbolos"
        )
    
    # Validar contra padrões óbvios
    common_patterns = ["123456", "qwerty", "password", "admin", "000000"]
    if any(pattern in password.lower() for pattern in common_patterns):
        return False, "Senha contém padrão muito óbvio"
    
    return True, None
