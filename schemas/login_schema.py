from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class Login(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    senha: str

    @field_validator("email", mode="before")
    @classmethod
    def normalizar_email(cls, valor: object) -> object:
        return valor.strip().lower() if isinstance(valor, str) else valor


class Cadastro(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nome: str = Field(min_length=2, max_length=100)
    email: EmailStr
    senha: str = Field(min_length=8, max_length=72)

    @field_validator("nome")
    @classmethod
    def nome_nao_pode_ser_apenas_espacos(cls, valor: str) -> str:
        nome = valor.strip()
        if len(nome) < 2:
            raise ValueError("Informe um nome com pelo menos 2 caracteres")
        return nome

    @field_validator("email", mode="before")
    @classmethod
    def normalizar_email(cls, valor: object) -> object:
        return valor.strip().lower() if isinstance(valor, str) else valor

    @field_validator("senha")
    @classmethod
    def limitar_senha_para_bcrypt(cls, valor: str) -> str:
        if len(valor.encode("utf-8")) > 72:
            raise ValueError("A senha deve ter no maximo 72 bytes")
        return valor


class CadastroResposta(BaseModel):
    id: int
    nome: str
    email: EmailStr
