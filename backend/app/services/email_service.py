"""
Serviço de envio de emails
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from datetime import datetime
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Serviço para envio de emails SMTP"""
    
    def __init__(self):
        self.smtp_host = settings.smtp_host
        self.smtp_port = settings.smtp_port
        self.smtp_user = settings.smtp_user
        self.smtp_password = settings.smtp_password
        self.smtp_from = settings.smtp_from_email
        self.smtp_use_tls = settings.smtp_use_tls
    
    def send_email(
        self,
        to: List[str],
        subject: str,
        body: str,
        html: bool = False,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
    ) -> bool:
        """
        Envia email via SMTP
        
        Args:
            to: Lista de destinatários
            subject: Assunto do email
            body: Corpo do email (texto ou HTML)
            html: Se True, corpo é tratado como HTML
            cc: Lista de cópias
            bcc: Lista de cópias ocultas
            
        Returns:
            True se enviado com sucesso, False caso contrário
        """
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.smtp_from
            msg['To'] = ', '.join(to)
            
            if cc:
                msg['Cc'] = ', '.join(cc)
            
            # Adiciona corpo do email
            mime_type = 'html' if html else 'plain'
            part = MIMEText(body, mime_type, 'utf-8')
            msg.attach(part)
            
            # Conecta ao servidor SMTP
            if self.smtp_use_tls:
                server = smtplib.SMTP(self.smtp_host, self.smtp_port)
                server.starttls()
            else:
                server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            
            # Login se credenciais fornecidas
            if self.smtp_user and self.smtp_password:
                server.login(self.smtp_user, self.smtp_password)
            
            # Envia email
            recipients = to + (cc or []) + (bcc or [])
            server.sendmail(self.smtp_from, recipients, msg.as_string())
            server.quit()
            
            logger.info(f"Email enviado com sucesso para {', '.join(to)}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao enviar email: {str(e)}")
            return False


# Templates de email
class EmailTemplates:
    """Templates HTML para emails do sistema"""
    
    @staticmethod
    def base_template(content: str, title: str = "ITSM COPPEAD") -> str:
        """Template base HTML"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #003366;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px 5px 0 0;
                }}
                .content {{
                    background-color: #f9f9f9;
                    padding: 20px;
                    border: 1px solid #ddd;
                }}
                .footer {{
                    background-color: #f1f1f1;
                    padding: 15px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                    border-radius: 0 0 5px 5px;
                }}
                .button {{
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #003366;
                    color: white !important;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 10px 0;
                }}
                .info-box {{
                    background-color: #e7f3ff;
                    border-left: 4px solid #2196F3;
                    padding: 10px;
                    margin: 10px 0;
                }}
                .warning-box {{
                    background-color: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 10px;
                    margin: 10px 0;
                }}
                .danger-box {{
                    background-color: #f8d7da;
                    border-left: 4px solid #dc3545;
                    padding: 10px;
                    margin: 10px 0;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>{title}</h1>
            </div>
            <div class="content">
                {content}
            </div>
            <div class="footer">
                <p>Este é um email automático. Por favor, não responda.</p>
                <p>&copy; 2026 COPPEAD UFRJ - Sistema de Gestão de TI</p>
            </div>
        </body>
        </html>
        """
    
    @staticmethod
    def ticket_created(ticket_number: int, title: str, description: str, 
                      priority: str, ticket_url: str) -> str:
        """Template para ticket criado"""
        content = f"""
        <h2>Novo Ticket Criado - #{ticket_number}</h2>
        <div class="info-box">
            <p><strong>Título:</strong> {title}</p>
            <p><strong>Descrição:</strong> {description}</p>
            <p><strong>Prioridade:</strong> {priority}</p>
            <p><strong>Criado em:</strong> {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
        </div>
        <p>Um novo ticket foi criado no sistema ITSM. Você pode visualizá-lo clicando no botão abaixo:</p>
        <a href="{ticket_url}" class="button">Ver Ticket</a>
        """
        return EmailTemplates.base_template(content, "Novo Ticket")
    
    @staticmethod
    def ticket_updated(ticket_number: int, title: str, changes: str, 
                      updated_by: str, ticket_url: str) -> str:
        """Template para ticket atualizado"""
        content = f"""
        <h2>Ticket Atualizado - #{ticket_number}</h2>
        <div class="info-box">
            <p><strong>Título:</strong> {title}</p>
            <p><strong>Atualizado por:</strong> {updated_by}</p>
            <p><strong>Alterações:</strong></p>
            <pre style="background: white; padding: 10px; border-radius: 3px;">{changes}</pre>
        </div>
        <a href="{ticket_url}" class="button">Ver Ticket</a>
        """
        return EmailTemplates.base_template(content, "Ticket Atualizado")
    
    @staticmethod
    def ticket_assigned(ticket_number: int, title: str, assigned_to: str, 
                       assigned_by: str, ticket_url: str) -> str:
        """Template para ticket atribuído"""
        content = f"""
        <h2>Ticket Atribuído a Você - #{ticket_number}</h2>
        <div class="info-box">
            <p><strong>Título:</strong> {title}</p>
            <p><strong>Atribuído por:</strong> {assigned_by}</p>
            <p><strong>Atribuído em:</strong> {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
        </div>
        <p>Olá {assigned_to},</p>
        <p>Um ticket foi atribuído a você. Por favor, verifique os detalhes e tome as ações necessárias.</p>
        <a href="{ticket_url}" class="button">Ver Ticket</a>
        """
        return EmailTemplates.base_template(content, "Ticket Atribuído")
    
    @staticmethod
    def sla_warning(ticket_number: int, title: str, sla_deadline: str, 
                   time_remaining: str, ticket_url: str) -> str:
        """Template para alerta de SLA"""
        content = f"""
        <h2>⚠️ Alerta de SLA - Ticket #{ticket_number}</h2>
        <div class="warning-box">
            <p><strong>Título:</strong> {title}</p>
            <p><strong>Prazo SLA:</strong> {sla_deadline}</p>
            <p><strong>Tempo Restante:</strong> {time_remaining}</p>
        </div>
        <p>O prazo de SLA deste ticket está próximo do vencimento. Tome ação imediatamente para evitar violação.</p>
        <a href="{ticket_url}" class="button">Ver Ticket</a>
        """
        return EmailTemplates.base_template(content, "Alerta de SLA")
    
    @staticmethod
    def sla_violated(ticket_number: int, title: str, ticket_url: str) -> str:
        """Template para SLA violado"""
        content = f"""
        <h2>🚨 SLA VIOLADO - Ticket #{ticket_number}</h2>
        <div class="danger-box">
            <p><strong>Título:</strong> {title}</p>
            <p><strong>Status:</strong> SLA VIOLADO</p>
            <p><strong>Violado em:</strong> {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
        </div>
        <p><strong>ATENÇÃO:</strong> O SLA deste ticket foi violado. Ação imediata é necessária!</p>
        <a href="{ticket_url}" class="button">Ver Ticket</a>
        """
        return EmailTemplates.base_template(content, "SLA VIOLADO")
    
    @staticmethod
    def approval_request(approval_id: str, ticket_number: int, title: str,
                        requester: str, level: int, approval_url: str) -> str:
        """Template para solicitação de aprovação"""
        content = f"""
        <h2>Solicitação de Aprovação - Nível {level}</h2>
        <div class="info-box">
            <p><strong>Ticket:</strong> #{ticket_number} - {title}</p>
            <p><strong>Solicitante:</strong> {requester}</p>
            <p><strong>Nível de Aprovação:</strong> {level}</p>
        </div>
        <p>Você foi designado como aprovador para esta solicitação. Por favor, revise e tome uma decisão.</p>
        <a href="{approval_url}" class="button">Revisar Aprovação</a>
        """
        return EmailTemplates.base_template(content, "Solicitação de Aprovação")
    
    @staticmethod
    def approval_decided(ticket_number: int, title: str, decision: str,
                        decided_by: str, comment: str, ticket_url: str) -> str:
        """Template para decisão de aprovação"""
        decision_class = "info-box" if decision == "APROVADO" else "danger-box"
        content = f"""
        <h2>Decisão de Aprovação - Ticket #{ticket_number}</h2>
        <div class="{decision_class}">
            <p><strong>Título:</strong> {title}</p>
            <p><strong>Decisão:</strong> {decision}</p>
            <p><strong>Decidido por:</strong> {decided_by}</p>
            <p><strong>Comentário:</strong> {comment or 'Sem comentários'}</p>
        </div>
        <a href="{ticket_url}" class="button">Ver Ticket</a>
        """
        return EmailTemplates.base_template(content, f"Aprovação {decision}")


# Instância global
email_service = EmailService()
