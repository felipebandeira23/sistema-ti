"""
Paginação avançada para consultas
"""
from typing import Generic, TypeVar, List
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar("T")


class PageParams(BaseModel):
    """Parâmetros de paginação"""
    page: int = 1
    page_size: int = 50
    
    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size
    
    @property
    def limit(self) -> int:
        return self.page_size


class PageResponse(BaseModel, Generic[T]):
    """Resposta paginada"""
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool
    
    @classmethod
    def create(cls, items: List[T], total: int, page_params: PageParams):
        """Cria resposta paginada"""
        total_pages = (total + page_params.page_size - 1) // page_params.page_size
        
        return cls(
            items=items,
            total=total,
            page=page_params.page,
            page_size=page_params.page_size,
            total_pages=total_pages,
            has_next=page_params.page < total_pages,
            has_prev=page_params.page > 1
        )


async def paginate(
    session: AsyncSession,
    query,
    page_params: PageParams,
    model_class=None
) -> tuple[List, int]:
    """
    Executa query com paginação e retorna resultados + total
    
    Args:
        session: Sessão assíncrona do SQLAlchemy
        query: Query do SQLAlchemy
        page_params: Parâmetros de paginação
        model_class: Classe do modelo (opcional, para count)
    
    Returns:
        Tupla (items, total)
    """
    # Conta total de registros
    if model_class:
        count_query = select(func.count()).select_from(model_class)
        # Aplica os mesmos filtros do query original
        if hasattr(query, 'whereclause') and query.whereclause is not None:
            count_query = count_query.where(query.whereclause)
    else:
        count_query = select(func.count()).select_from(query.subquery())
    
    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0
    
    # Aplica paginação
    paginated_query = query.offset(page_params.offset).limit(page_params.limit)
    result = await session.execute(paginated_query)
    items = list(result.scalars().unique().all())
    
    return items, total
