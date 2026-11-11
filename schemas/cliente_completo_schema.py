from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from schemas.transacoes_schema import Transacoes


class ClienteComTransacoes(BaseModel):
    cliente_id: int
    nome: str 
    email: EmailStr
    conta_id: Optional[int] = None
    tipo_conta: Optional[str] = None
    saldo: Optional[float] = None
    transacoes: list[Transacoes]
