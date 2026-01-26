from sqlalchemy.orm import DeclarativeBase
from uuid import uuid4
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID


class Base(DeclarativeBase):
    """Base class para todos os modelos ORM"""
    pass
