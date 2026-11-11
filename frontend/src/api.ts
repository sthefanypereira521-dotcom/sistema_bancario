const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export type Transaction = { id?: number; tipo: string; valor: number; conta_id?: number }
export type AccountSummary = {
  cliente_id: number; conta_id: number | null; nome: string; email: string; tipo_conta: string | null;
  saldo: number | null; transacoes: Transaction[]
}

async function responseError(response: Response, fallback: string): Promise<Error> {
  try {
    const body = await response.json() as { detail?: string | Array<{ msg?: string }> }
    if (typeof body.detail === 'string') return new Error(body.detail)
    if (Array.isArray(body.detail)) {
      const messages = body.detail.map(item => item.msg).filter((message): message is string => Boolean(message))
      if (messages.length) return new Error(messages.join('. '))
    }
  } catch { /* resposta sem JSON */ }
  return new Error(fallback)
}

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  })
  if (!response.ok) {
    let message = 'Não foi possível concluir a solicitação.'
    try {
      const body = await response.json() as { detail?: string }
      if (typeof body.detail === 'string') message = body.detail
    } catch { /* resposta sem JSON */ }
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

export async function login(email: string, senha: string): Promise<string> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }),
  })
  if (!response.ok) throw new Error('E-mail ou senha inválidos. Confira os dados e tente novamente.')
  const data = await response.json() as { access_token: string }
  return data.access_token
}

export async function register(nome: string, email: string, senha: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/cadastro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, senha }),
  })
  if (!response.ok) throw await responseError(response, 'Nao foi possivel criar o cadastro.')
}

export const getAccount = (token: string) => request<AccountSummary[]>('/transacoes/contas/clientes/', token)
export const makeTransaction = (token: string, type: 'deposito' | 'saque', accountId: number, amount: number) =>
  request<{ mensagem: string }>(`/transacoes/${type}?conta_id=${accountId}&valor=${amount}`, token, { method: 'POST' })
