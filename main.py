from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.clientes import router as clientes_router
from routes.contas import router as contas_router
from routes.transacoes import router as transacoes_router
from routes.auth_router import router as auth_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/", tags=["home"])
def sistema():

    return {"mensagem": "sistema  online"}


app.include_router(clientes_router)
app.include_router(contas_router)
app.include_router(transacoes_router)
app.include_router(auth_router)
