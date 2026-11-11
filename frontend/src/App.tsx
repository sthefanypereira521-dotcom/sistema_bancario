import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Banknote, Check, ChevronRight, CircleAlert, Eye, EyeOff, Landmark, LogOut, RefreshCw, ShieldCheck, Wallet } from 'lucide-react'
import { getAccount, login, makeTransaction, register, type AccountSummary, type Transaction } from './api'

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function friendlyDate() {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
}

function App() {
  const [token, setToken] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [account, setAccount] = useState<AccountSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [action, setAction] = useState<'deposito' | 'saque' | null>(null)
  const [amount, setAmount] = useState('')
  const [showBalance, setShowBalance] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  const loadAccount = useCallback(async (activeToken: string) => {
    setLoading(true)
    setError('')
    try {
      const data = await getAccount(activeToken)
      setAccount(data[0] ?? null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar sua conta.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { if (token) void loadAccount(token) }, [token, loadAccount])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setWorking(true); setError(''); setNotice('')
    try { setToken(await login(email.trim(), password)); setPassword('') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.') }
    finally { setWorking(false) }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setWorking(true); setError(''); setNotice('')
    try {
      await register(name.trim(), email.trim(), password)
      setAuthMode('login')
      setPassword('')
      setNotice('Cadastro criado. Entre com seu e-mail e sua senha.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Nao foi possivel criar o cadastro.')
    } finally { setWorking(false) }
  }

  function switchAuthMode(mode: 'login' | 'register') {
    setAuthMode(mode); setError(''); setNotice(''); setPassword('')
  }

  async function handleTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !account?.conta_id || !action) return
    const value = Number(amount.replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) { setError('Informe um valor maior que zero.'); return }
    if (action === 'saque' && value > (account.saldo ?? 0)) { setError('O valor informado é maior que o saldo disponível.'); return }
    setWorking(true); setError(''); setNotice('')
    try {
      await makeTransaction(token, action, account.conta_id, value)
      setNotice(action === 'deposito' ? 'Depósito realizado com sucesso.' : 'Saque realizado com sucesso.')
      setAction(null); setAmount('')
      await loadAccount(token)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível realizar a operação.') }
    finally { setWorking(false) }
  }

  function logout() { setToken(null); setAccount(null); setAction(null); setError(''); setNotice('') }

  const transactions: Transaction[] = account?.transacoes ?? []
  const balance = account?.saldo ?? 0
  const totalIn = useMemo(() => transactions.filter(t => t.tipo.toLowerCase() === 'deposito').reduce((sum, t) => sum + t.valor, 0), [transactions])
  const totalOut = useMemo(() => transactions.filter(t => t.tipo.toLowerCase() === 'saque').reduce((sum, t) => sum + t.valor, 0), [transactions])

  if (!token) return <main className="login-page">
    <section className="login-aside" aria-label="Sobre a conta">
      <div className="brand"><span className="brand-mark"><Landmark size={21} strokeWidth={1.8} /></span><span>conta<span className="brand-period">.</span></span></div>
      <div className="aside-copy"><span className="eyebrow">SISTEMA BANCÁRIO</span><h1>Seu dinheiro,<br />no seu ritmo.</h1><p>Acompanhe seu saldo e suas movimentações em um só lugar.</p></div>
      <div className="aside-foot"><ShieldCheck size={16} /> Acesso protegido por autenticação</div>
    </section>
    <section className="login-main">
      <div className="mobile-brand brand"><span className="brand-mark"><Landmark size={21} /></span><span>conta<span className="brand-period">.</span></span></div>
      <div className="login-box">
        <span className="eyebrow">AREA DO CLIENTE</span>
        <h2>{authMode === 'login' ? 'Bem-vinda de volta' : 'Crie seu cadastro'}</h2>
        <p className="muted">{authMode === 'login' ? 'Entre com os dados cadastrados na sua conta.' : 'Preencha seus dados para criar uma conta de acesso.'}</p>
        <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="form-stack">
          {authMode === 'register' && <><label htmlFor="name">Nome completo</label><input id="name" type="text" autoComplete="name" minLength={2} maxLength={100} required value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" /></>}
          <label htmlFor="email">E-mail</label><input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@exemplo.com" />
          <label htmlFor="password">Senha</label><div className="password-wrap"><input id="password" type={showPassword ? 'text' : 'password'} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength={authMode === 'register' ? 8 : undefined} maxLength={authMode === 'register' ? 72 : undefined} required value={password} onChange={e => setPassword(e.target.value)} placeholder={authMode === 'register' ? 'Pelo menos 8 caracteres' : 'Sua senha'} /><button className="reveal" type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
          {error && <p className="form-error" role="alert"><CircleAlert size={16} />{error}</p>}
          {notice && <p className="form-success" role="status"><Check size={16} />{notice}</p>}
          <button className="primary-button login-submit" disabled={working}>{working ? (authMode === 'login' ? 'Entrando...' : 'Criando cadastro...') : (authMode === 'login' ? 'Entrar na conta' : 'Criar cadastro')}<ChevronRight size={17} /></button>
        </form>
        <p className="login-switch">{authMode === 'login' ? 'Ainda nao tem cadastro?' : 'Ja tem cadastro?'} <button type="button" onClick={() => switchAuthMode(authMode === 'login' ? 'register' : 'login')}>{authMode === 'login' ? 'Criar cadastro' : 'Fazer login'}</button></p>
      </div>
    </section>
  </main>

  return <main className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark"><Landmark size={21} /></span><span>conta<span className="brand-period">.</span></span></div><div className="side-label">MENU</div><a className="nav-link active" href="#inicio"><Wallet size={18} />Visão geral</a><a className="nav-link" href="#movimentacoes"><ArrowLeftRight size={18} />Movimentações</a><div className="sidebar-bottom"><div className="secure-note"><ShieldCheck size={17} /><span>Sessão autenticada<br /><small>Conexão protegida</small></span></div><button className="logout-button" onClick={logout}><LogOut size={17} />Sair da conta</button></div></aside>
    <section className="workspace" id="inicio"><header className="topbar"><div className="topbar-caption">Conta pessoal <span>/</span> Visão geral</div><div className="user-chip"><span className="avatar">{account?.nome?.charAt(0).toUpperCase() ?? 'C'}</span><span>{account?.nome ?? 'Cliente'}</span></div></header>
      <div className="content"><div className="welcome-row"><div><p className="date-line">{friendlyDate()}</p><h1>Olá, {account?.nome?.split(' ')[0] ?? 'cliente'}.</h1><p className="muted">Aqui está um resumo da sua conta.</p></div><button className="refresh-button" onClick={() => token && void loadAccount(token)} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} />Atualizar</button></div>
        {error && <div className="alert-error" role="alert"><CircleAlert size={18} />{error}<button aria-label="Fechar aviso" onClick={() => setError('')}>×</button></div>}{notice && <div className="alert-success" role="status"><Check size={18} />{notice}<button aria-label="Fechar aviso" onClick={() => setNotice('')}>×</button></div>}
        {loading && !account ? <div className="loading-state"><span className="loader" />Carregando seus dados…</div> : <>
        <div className="summary-grid"><article className="balance-card"><div className="card-top"><span>Saldo disponível</span><button className="icon-button light-icon" onClick={() => setShowBalance(!showBalance)} aria-label={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}>{showBalance ? <Eye size={18} /> : <EyeOff size={18} />}</button></div><div className="balance-value">{showBalance ? money.format(balance) : '••••••'}</div><div className="account-meta">{account?.tipo_conta ? `Conta ${account.tipo_conta}` : 'Conta pessoal'}{account?.conta_id ? <span> · Nº {String(account.conta_id).padStart(5, '0')}</span> : null}</div><div className="balance-foot"><span><Check size={14} /> Saldo atualizado</span><span>BRL</span></div></article>
          <article className="stat-card"><span className="stat-icon income"><ArrowDownLeft size={19} /></span><span className="stat-label">Total em depósitos</span><strong>{showBalance ? money.format(totalIn) : '••••••'}</strong><small>Movimentado na conta</small></article><article className="stat-card"><span className="stat-icon expense"><ArrowUpRight size={19} /></span><span className="stat-label">Total em saques</span><strong>{showBalance ? money.format(totalOut) : '••••••'}</strong><small>Movimentado na conta</small></article></div>
        <div className="section-heading"><div><span className="eyebrow">OPERACOES</span><h2>O que voce precisa fazer?</h2></div></div>
        {!account?.conta_id ? <div className="empty-state"><span className="empty-icon"><Landmark size={22} /></span><strong>Conta bancaria nao localizada</strong><p>Atualize os dados da conta ou entre novamente para continuar.</p></div> : action ? <form className="transaction-panel" onSubmit={handleTransaction}><div className="panel-title"><span className={`stat-icon ${action === 'deposito' ? 'income' : 'expense'}`}>{action === 'deposito' ? <ArrowDownLeft size={19} /> : <ArrowUpRight size={19} />}</span><div><strong>{action === 'deposito' ? 'Fazer deposito' : 'Fazer saque'}</strong><small>{action === 'deposito' ? 'Adicione um valor a sua conta.' : 'Retire um valor do seu saldo.'}</small></div><button type="button" className="close-button" onClick={() => { setAction(null); setError('') }} aria-label="Fechar">×</button></div><label htmlFor="amount">Valor</label><div className="amount-input"><span>R$</span><input id="amount" inputMode="decimal" required autoFocus value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" aria-describedby="amount-help" /></div><small id="amount-help">{action === 'saque' ? `Disponivel: ${money.format(balance)}` : 'Informe o valor que deseja depositar.'}</small><div className="panel-actions"><button className="secondary-button" type="button" onClick={() => setAction(null)}>Cancelar</button><button className="primary-button" disabled={working}>{working ? 'Processando...' : 'Confirmar operacao'}</button></div></form> : <div className="action-grid"><button className="action-card" onClick={() => { setAction('deposito'); setError('') }}><span className="action-icon deposit"><ArrowDownLeft size={20} /></span><span><strong>Depositar</strong><small>Adicionar saldo a conta</small></span><ChevronRight size={18} className="action-chevron" /></button><button className="action-card" onClick={() => { setAction('saque'); setError('') }}><span className="action-icon withdraw"><ArrowUpRight size={20} /></span><span><strong>Sacar</strong><small>Retirar dinheiro da conta</small></span><ChevronRight size={18} className="action-chevron" /></button></div>}        <section className="transactions-section" id="movimentacoes"><div className="transactions-heading"><div><span className="eyebrow">ATIVIDADE</span><h2>Movimentações recentes</h2></div><span className="count-pill">{transactions.length} {transactions.length === 1 ? 'registro' : 'registros'}</span></div>{transactions.length ? <div className="transaction-list">{[...transactions].reverse().map((item, index) => { const isDeposit = item.tipo.toLowerCase() === 'deposito'; return <article className="transaction-row" key={item.id ?? `${item.tipo}-${index}`}><span className={`transaction-symbol ${isDeposit ? 'income' : 'expense'}`}>{isDeposit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</span><div className="transaction-info"><strong>{isDeposit ? 'Depósito' : 'Saque'}</strong><small>Movimentação da conta</small></div><time>#{String(item.id ?? index + 1).padStart(4, '0')}</time><strong className={`transaction-amount ${isDeposit ? 'positive' : ''}`}>{isDeposit ? '+' : '−'} {money.format(item.valor)}</strong></article> })}</div> : <div className="empty-state"><span className="empty-icon"><Banknote size={22} /></span><strong>Nenhuma movimentação por enquanto</strong><p>Quando houver depósitos ou saques, eles aparecerão aqui.</p></div>}</section>
        </>}
        <footer className="page-footer"><span>Conta pessoal</span><span><ShieldCheck size={14} /> Seus dados são acessados com segurança</span></footer>
      </div>
    </section>
  </main>
}

export default App
