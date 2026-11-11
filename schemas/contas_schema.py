from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Conta(BaseModel):
    id: int
    saldo: float


class CriarConta(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    tipo_conta: Literal["corrente", "poupanca"] = Field(
        description="Tipo da conta bancária"
    )


class ContaResposta(BaseModel):
    id: int
    numero_conta: str
    tipo_conta: str
    saldo: float
    cliente_id: int
