import secrets
import sqlite3


def gerar_numero_conta(conn: sqlite3.Connection) -> str:
    """Gera um identificador numerico ainda nao usado na tabela de contas."""
    for _ in range(10):
        numero = str(secrets.randbelow(900_000_000) + 100_000_000)
        existente = conn.execute(
            "SELECT 1 FROM contas WHERE numero_conta = ?", (numero,)
        ).fetchone()
        if existente is None:
            return numero
    raise ValueError("Nao foi possivel gerar um numero de conta unico")
