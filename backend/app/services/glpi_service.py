"""
Integração básica com GLPI
"""
import httpx
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class GLPIService:
    """Serviço de integração com GLPI via API REST"""
    
    def __init__(self):
        self.enabled = settings.glpi_enabled
        self.base_url = settings.glpi_url
        self.api_token = settings.glpi_api_token
        self.session_token: Optional[str] = None
    
    async def init_session(self) -> bool:
        """Inicializa sessão com GLPI"""
        if not self.enabled or not self.api_token:
            return False
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/apirest.php/initSession",
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"user_token {self.api_token}"
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.session_token = data.get("session_token")
                    logger.info("Sessão GLPI iniciada com sucesso")
                    return True
                else:
                    logger.error(f"Erro ao iniciar sessão GLPI: {response.status_code}")
                    return False
        except Exception as e:
            logger.error(f"Erro na conexão com GLPI: {str(e)}")
            return False
    
    async def kill_session(self):
        """Encerra sessão com GLPI"""
        if not self.session_token:
            return
        
        try:
            async with httpx.AsyncClient() as client:
                await client.get(
                    f"{self.base_url}/apirest.php/killSession",
                    headers={
                        "Content-Type": "application/json",
                        "Session-Token": self.session_token
                    }
                )
                self.session_token = None
        except Exception as e:
            logger.error(f"Erro ao encerrar sessão GLPI: {str(e)}")
    
    async def get_tickets(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Busca tickets do GLPI"""
        if not await self.init_session():
            return []
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/apirest.php/Ticket",
                    headers={
                        "Content-Type": "application/json",
                        "Session-Token": self.session_token
                    },
                    params={"range": f"0-{limit-1}"},
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Erro ao buscar tickets GLPI: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Erro ao buscar tickets: {str(e)}")
            return []
        finally:
            await self.kill_session()
    
    async def create_ticket(self, ticket_data: Dict[str, Any]) -> Optional[int]:
        """Cria ticket no GLPI"""
        if not await self.init_session():
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/apirest.php/Ticket",
                    headers={
                        "Content-Type": "application/json",
                        "Session-Token": self.session_token
                    },
                    json={"input": ticket_data},
                    timeout=30.0
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    glpi_id = data.get("id")
                    logger.info(f"Ticket criado no GLPI com ID {glpi_id}")
                    return glpi_id
                else:
                    logger.error(f"Erro ao criar ticket GLPI: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Erro ao criar ticket: {str(e)}")
            return None
        finally:
            await self.kill_session()
    
    async def update_ticket(self, glpi_id: int, ticket_data: Dict[str, Any]) -> bool:
        """Atualiza ticket no GLPI"""
        if not await self.init_session():
            return False
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.base_url}/apirest.php/Ticket/{glpi_id}",
                    headers={
                        "Content-Type": "application/json",
                        "Session-Token": self.session_token
                    },
                    json={"input": ticket_data},
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    logger.info(f"Ticket {glpi_id} atualizado no GLPI")
                    return True
                else:
                    logger.error(f"Erro ao atualizar ticket GLPI: {response.status_code}")
                    return False
        except Exception as e:
            logger.error(f"Erro ao atualizar ticket: {str(e)}")
            return False
        finally:
            await self.kill_session()
    
    async def get_assets(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Busca ativos do GLPI"""
        if not await self.init_session():
            return []
        
        try:
            async with httpx.AsyncClient() as client:
                # GLPI usa diferentes endpoints para tipos de ativos
                computers = await self._get_items(client, "Computer", limit)
                monitors = await self._get_items(client, "Monitor", limit)
                printers = await self._get_items(client, "Printer", limit)
                
                return computers + monitors + printers
        except Exception as e:
            logger.error(f"Erro ao buscar ativos: {str(e)}")
            return []
        finally:
            await self.kill_session()
    
    async def _get_items(self, client: httpx.AsyncClient, item_type: str, limit: int) -> List[Dict[str, Any]]:
        """Helper para buscar itens de um tipo específico"""
        try:
            response = await client.get(
                f"{self.base_url}/apirest.php/{item_type}",
                headers={
                    "Content-Type": "application/json",
                    "Session-Token": self.session_token
                },
                params={"range": f"0-{limit-1}"},
                timeout=30.0
            )
            
            if response.status_code == 200:
                items = response.json()
                # Adiciona tipo aos items
                for item in items:
                    item["_type"] = item_type
                return items
            return []
        except:
            return []


# Instância global
glpi_service = GLPIService()
