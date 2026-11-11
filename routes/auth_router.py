import sqlite3
from fastapi import APIRouter, HTTPException, status

from schemas.login_schema import Cadastro, CadastroResposta, Login
from services.contas import gerar_numero_conta
from services.auth import criar_token, gerar_hash, verificar_senha

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


def garantir_conta_corrente(conn: sqlite3.Connection, cliente_id: int) -> None:
    existente = conn.execute(
        "SELECT 1 FROM contas WHERE cliente_id = ? LIMIT 1", (cliente_id,)
    ).fetchone()
    if existente is not None:
        return

    numero_conta = gerar_numero_conta(conn)
    conn.execute(
        """
        INSERT INTO contas (numero_conta, tipo_conta, saldo, cliente_id)
        VALUES (?, 'corrente', 0, ?)
        """,
        (numero_conta, cliente_id),
    )


@router.post(
    "/cadastro",
    response_model=CadastroResposta,
    status_code=status.HTTP_201_CREATED,
)
def cadastrar(dados: Cadastro):
    """Registra um cliente novo sem retornar ou armazenar senha em texto puro."""
    email = str(dados.email).strip().lower()
    senha_hash = gerar_hash(dados.senha)
    conn = sqlite3.connect("database/banco.sqlite3", timeout=5)
    try:
        # Serializa verificacao e insercao para reduzir risco de cadastro duplicado.
        conn.execute("BEGIN IMMEDIATE")
        existente = conn.execute(
            "SELECT 1 FROM clientes WHERE email = ? COLLATE NOCASE", (email,)
        ).fetchone()
        if existente:
            conn.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ja existe um cadastro para este e-mail",
            )

        cursor = conn.execute(
            "INSERT INTO clientes (nome, email, senha) VALUES (?, ?, ?)",
            (dados.nome.strip(), email, senha_hash),
        )
        cliente_id = cursor.lastrowid
        garantir_conta_corrente(conn, cliente_id)
        conn.commit()
        return {
            "id": cliente_id,
            "nome": dados.nome.strip(),
            "email": email,
        }
    except HTTPException:
        raise
    except sqlite3.IntegrityError:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ja existe um cadastro para este e-mail",
        ) from None
    except ValueError:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Nao foi possivel abrir a conta. Tente novamente.",
        ) from None
    finally:
        conn.close()


@router.post("/login")
def login(dados: Login):

    conn = sqlite3.connect("database/banco.sqlite3", timeout=5)
    conn.row_factory = sqlite3.Row
    try:
        cliente = conn.execute(
            "SELECT id, email, senha FROM clientes WHERE email = ? COLLATE NOCASE",
            (str(dados.email).strip().lower(),),
        ).fetchone()
    finally:
        conn.close()

    if not cliente:
        raise HTTPException(status_code=401,
                            detail="email ou senha invalidos")

    senha_correta = verificar_senha(dados.senha, cliente["senha"])

    if not senha_correta:
        raise HTTPException(status_code=401,
                            detail="email ou senha invalidos")

    conn = sqlite3.connect("database/banco.sqlite3", timeout=5)
    try:
        conn.execute("BEGIN IMMEDIATE")
        garantir_conta_corrente(conn, cliente["id"])
        conn.commit()
    except ValueError:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Nao foi possivel preparar a conta. Tente novamente.",
        ) from None
    finally:
        conn.close()

    token = criar_token({
        "sub": cliente["email"],
        "id": cliente["id"]
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }
