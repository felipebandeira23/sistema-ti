#!/usr/bin/env python3
"""
Script de teste para validar todos os endpoints da API COPPEAD ITSM
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Configuração
BASE_URL = "http://localhost:8000"
API_PREFIX = "/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

class APITester:
    def __init__(self):
        self.base_url = BASE_URL + API_PREFIX
        self.token: Optional[str] = None
        self.user_id: Optional[str] = None
        self.results = []

    def print_header(self, text: str):
        print(f"\n{Colors.BLUE}{'='*60}")
        print(f"{text}")
        print(f"{'='*60}{Colors.END}\n")

    def print_test(self, name: str, passed: bool, details: str = ""):
        status = f"{Colors.GREEN}✓ PASSOU{Colors.END}" if passed else f"{Colors.RED}✗ FALHOU{Colors.END}"
        print(f"{status} - {name}")
        if details:
            print(f"  {Colors.YELLOW}{details}{Colors.END}")
        self.results.append((name, passed))

    def print_json(self, data: Any):
        print(f"{Colors.YELLOW}{json.dumps(data, indent=2, ensure_ascii=False)}{Colors.END}")

    def test_health_check(self):
        """Testar health check do backend"""
        self.print_header("1. TESTE DE SAÚDE")
        try:
            response = requests.get(f"{BASE_URL}/health")
            passed = response.status_code == 200
            self.print_test(
                "Health Check",
                passed,
                f"Status: {response.status_code}"
            )
            if passed:
                self.print_json(response.json())
        except Exception as e:
            self.print_test("Health Check", False, str(e))

    def test_authentication(self):
        """Testar autenticação"""
        self.print_header("2. AUTENTICAÇÃO")
        
        # Teste de login com credenciais válidas
        try:
            response = requests.post(
                f"{self.base_url}/auth/login",
                json={"username": "admin", "password": "admin123"}
            )
            passed = response.status_code == 200
            self.print_test(
                "Login com credenciais válidas",
                passed,
                f"Status: {response.status_code}"
            )
            
            if passed:
                data = response.json()
                self.token = data.get("token", {}).get("access_token")
                self.user_id = data.get("user_id")
                self.print_json(data)
        except Exception as e:
            self.print_test("Login", False, str(e))

        # Teste de login com credenciais inválidas
        try:
            response = requests.post(
                f"{self.base_url}/auth/login",
                json={"username": "invalid", "password": "invalid"}
            )
            passed = response.status_code == 401
            self.print_test(
                "Login com credenciais inválidas (deve falhar)",
                passed,
                f"Status: {response.status_code}"
            )
        except Exception as e:
            self.print_test("Login inválido", False, str(e))

    def test_tickets(self):
        """Testar endpoint de tickets"""
        if not self.token:
            print(f"{Colors.RED}Token não disponível, pulando testes de tickets{Colors.END}")
            return

        self.print_header("3. TICKETS")
        headers = {"Authorization": f"Bearer {self.token}"}

        # Listar tickets
        try:
            response = requests.get(f"{self.base_url}/tickets/", headers=headers)
            passed = response.status_code == 200
            self.print_test(
                "Listar tickets",
                passed,
                f"Status: {response.status_code} - Total: {len(response.json())}"
            )
        except Exception as e:
            self.print_test("Listar tickets", False, str(e))

        # Criar novo ticket
        try:
            payload = {
                "title": "Ticket de Teste",
                "description": "Este é um ticket de teste",
                "priority": "medium",
                "category": "incident"
            }
            response = requests.post(
                f"{self.base_url}/tickets/",
                json=payload,
                headers=headers
            )
            passed = response.status_code == 201
            self.print_test(
                "Criar novo ticket",
                passed,
                f"Status: {response.status_code}"
            )
            if passed:
                ticket = response.json()
                self.print_json(ticket)
        except Exception as e:
            self.print_test("Criar ticket", False, str(e))

    def test_assets(self):
        """Testar endpoint de ativos"""
        if not self.token:
            return

        self.print_header("4. ATIVOS")
        headers = {"Authorization": f"Bearer {self.token}"}

        # Listar ativos
        try:
            response = requests.get(f"{self.base_url}/assets/", headers=headers)
            passed = response.status_code == 200
            self.print_test(
                "Listar ativos",
                passed,
                f"Status: {response.status_code} - Total: {len(response.json())}"
            )
        except Exception as e:
            self.print_test("Listar ativos", False, str(e))

    def test_cmdb(self):
        """Testar endpoint de CMDB"""
        if not self.token:
            return

        self.print_header("5. CMDB")
        headers = {"Authorization": f"Bearer {self.token}"}

        # Listar CIs
        try:
            response = requests.get(f"{self.base_url}/cmdb/cis", headers=headers)
            passed = response.status_code == 200
            self.print_test(
                "Listar Configuration Items",
                passed,
                f"Status: {response.status_code} - Total: {len(response.json())}"
            )
        except Exception as e:
            self.print_test("Listar CIs", False, str(e))

    def test_catalog(self):
        """Testar endpoint de catálogo de serviços"""
        if not self.token:
            return

        self.print_header("6. CATÁLOGO DE SERVIÇOS")
        headers = {"Authorization": f"Bearer {self.token}"}

        # Listar itens
        try:
            response = requests.get(f"{self.base_url}/catalog/items", headers=headers)
            passed = response.status_code == 200
            self.print_test(
                "Listar serviços",
                passed,
                f"Status: {response.status_code} - Total: {len(response.json())}"
            )
        except Exception as e:
            self.print_test("Listar serviços", False, str(e))

    def test_knowledge(self):
        """Testar endpoint de base de conhecimento"""
        if not self.token:
            return

        self.print_header("7. BASE DE CONHECIMENTO")
        headers = {"Authorization": f"Bearer {self.token}"}

        # Listar artigos
        try:
            response = requests.get(f"{self.base_url}/knowledge/articles/", headers=headers)
            passed = response.status_code == 200
            self.print_test(
                "Listar artigos",
                passed,
                f"Status: {response.status_code} - Total: {len(response.json())}"
            )
        except Exception as e:
            self.print_test("Listar artigos", False, str(e))

    def test_approvals(self):
        """Testar endpoint de aprovações"""
        if not self.token:
            return

        self.print_header("8. APROVAÇÕES")
        headers = {"Authorization": f"Bearer {self.token}"}

        # Listar aprovações
        try:
            response = requests.get(f"{self.base_url}/approvals/", headers=headers)
            passed = response.status_code == 200
            self.print_test(
                "Listar aprovações",
                passed,
                f"Status: {response.status_code} - Total: {len(response.json())}"
            )
        except Exception as e:
            self.print_test("Listar aprovações", False, str(e))

    def test_sla(self):
        """Testar endpoint de SLA"""
        if not self.token:
            return

        self.print_header("9. SLA")
        headers = {"Authorization": f"Bearer {self.token}"}

        # Listar SLAs
        try:
            response = requests.get(f"{self.base_url}/sla/", headers=headers)
            passed = response.status_code == 200
            self.print_test(
                "Listar SLAs",
                passed,
                f"Status: {response.status_code} - Total: {len(response.json())}"
            )
        except Exception as e:
            self.print_test("Listar SLAs", False, str(e))

    def test_users(self):
        """Testar endpoint de usuários"""
        if not self.token:
            return

        self.print_header("10. USUÁRIOS")
        headers = {"Authorization": f"Bearer {self.token}"}

        # Listar usuários
        try:
            response = requests.get(f"{self.base_url}/users/", headers=headers)
            passed = response.status_code == 200
            self.print_test(
                "Listar usuários",
                passed,
                f"Status: {response.status_code} - Total: {len(response.json())}"
            )
        except Exception as e:
            self.print_test("Listar usuários", False, str(e))

    def print_summary(self):
        """Imprimir resumo dos testes"""
        self.print_header("RESUMO DOS TESTES")
        
        total = len(self.results)
        passed = sum(1 for _, p in self.results if p)
        failed = total - passed
        
        for test_name, passed_test in self.results:
            status = f"{Colors.GREEN}✓{Colors.END}" if passed_test else f"{Colors.RED}✗{Colors.END}"
            print(f"{status} {test_name}")
        
        print(f"\n{Colors.BLUE}{'='*60}")
        print(f"Total: {total} | {Colors.GREEN}Passou: {passed}{Colors.END} | {Colors.RED}Falhou: {failed}{Colors.END}")
        print(f"{'='*60}{Colors.END}\n")
        
        return failed == 0

    def run_all_tests(self):
        """Executar todos os testes"""
        print(f"{Colors.BLUE}INICIANDO TESTES DA API COPPEAD ITSM{Colors.END}")
        
        self.test_health_check()
        self.test_authentication()
        self.test_tickets()
        self.test_assets()
        self.test_cmdb()
        self.test_catalog()
        self.test_knowledge()
        self.test_approvals()
        self.test_sla()
        self.test_users()
        
        success = self.print_summary()
        return 0 if success else 1

if __name__ == "__main__":
    tester = APITester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)
