from contextlib import closing
import sqlite3

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from schemas.contas_schema import Conta, ContaResposta, CriarConta
from services.auth import verificar_token
from services.contas import gerar_numero_conta


router = APIRouter(prefix="/contas", tags=["contas"])
bearer = HTTPBearer(auto_error=False)


def cliente_autenticado(
    credenciais: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> int:
    if credenciais is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticacao obrigatoria",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = verificar_token(credenciais.credentials)
    cliente_id = payload.get("id")
    if not isinstance(cliente_id, int) or cliente_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessao invalida",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return cliente_id


@router.post("/", response_model=ContaResposta, status_code=status.HTTP_201_CREATED)
def criar_conta(
    dados: CriarConta,
    cliente_id: int = Depends(cliente_autenticado),
):
    """Cria uma conta vinculada ao cliente autenticado."""

    conn = sqlite3.connect("database/banco.sqlite3", timeout=5)
    conn.row_factory = sqlite3.Row
    try:
        # Serializa criacoes concorrentes para evitar gerar numero duplicado.
        conn.execute("BEGIN IMMEDIATE")

        cliente = conn.execute(
            "SELECT id FROM clientes WHERE id = ?", (cliente_id,)
        ).fetchone()
        if cliente is None:
            conn.rollback()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Cliente da sessao nao encontrado",
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            numero_conta = gerar_numero_conta(conn)
        except ValueError:
            conn.rollback()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Nao foi possivel gerar o numero da conta. Tente novamente.",
            ) from None

        cursor = conn.execute(
            """
            INSERT INTO contas (numero_conta, tipo_conta, saldo, cliente_id)
            VALUES (?, ?, 0, ?)
            """,
            (numero_conta, dados.tipo_conta, cliente_id),
        )
        conta_id = cursor.lastrowid
        conta = conn.execute(
            """
            SELECT id, numero_conta, tipo_conta, saldo, cliente_id
            FROM contas
            WHERE id = ? AND cliente_id = ?
            """,
            (conta_id, cliente_id),
        ).fetchone()
        conn.commit()
        return dict(conta)
    except HTTPException:
        raise
    except sqlite3.IntegrityError:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Nao foi possivel criar a conta com os dados informados.",
        ) from None
    finally:
        conn.close()


@router.get("/", response_model=list[ContaResposta])
def listar_contas(
    cliente_id: int = Depends(cliente_autenticado),
):
    with closing(sqlite3.connect("database/banco.sqlite3", timeout=5)) as conn:
        conn.row_factory = sqlite3.Row
        contas = conn.execute(
            """
            SELECT id, numero_conta, tipo_conta, saldo, cliente_id
            FROM contas
            WHERE cliente_id = ?
            ORDER BY id
            """,
            (cliente_id,),
        ).fetchall()
    return [dict(conta) for conta in contas]


@router.get("/{conta_id}", response_model=Conta)
def buscar_conta(
    conta_id: int,
    cliente_id: int = Depends(cliente_autenticado),
):
    with closing(sqlite3.connect("database/banco.sqlite3", timeout=5)) as conn:
        conn.row_factory = sqlite3.Row
        conta = conn.execute(
            "SELECT id, saldo FROM contas WHERE id = ? AND cliente_id = ?",
            (conta_id, cliente_id),
        ).fetchone()

    if conta is None:
        raise HTTPException(status_code=404, detail="Conta nao encontrada")
    return dict(conta)


@router.delete("/{conta_id}")
def deletar_conta(
    conta_id: int,
    cliente_id: int = Depends(cliente_autenticado),
):
    with closing(sqlite3.connect("database/banco.sqlite3", timeout=5)) as conn:
        with conn:
            cursor = conn.execute(
                "DELETE FROM contas WHERE id = ? AND cliente_id = ?",
                (conta_id, cliente_id),
            )
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Conta nao encontrada")
    return {"mensagem": "Conta removida com sucesso"}
