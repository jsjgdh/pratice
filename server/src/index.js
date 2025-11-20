'use strict'

const path = require('path')
const fs = require('fs')
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const morgan = require('morgan')
const mongoose = require('mongoose')
const PDFDocument = require('pdfkit')
const csvParser = require('csv-parser')
const { format } = require('date-fns')

const app = express()
const PORT = process.env.PORT || 3001
const SECRET = process.env.JWT_SECRET || 'dev-secret'
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/budget_manager'

app.use(cors({ origin: '*', credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('combined'))

const uploadsDir = path.join(__dirname, '..', 'uploads')
const publicDir = path.join(__dirname, '..', 'public')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })

app.use('/uploads', express.static(uploadsDir))
app.use('/', express.static(publicDir))

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${uuidv4()}${ext}`)
  }
})
const upload = multer({ storage })

// MongoDB Connection
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err))

// Schemas
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'client_mgmt', 'self_employed', 'salary', 'accountant', 'viewer'], default: 'salary' },
  created_at: { type: Date, default: Date.now }
})

const TransactionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category_id: { type: String, required: true },
  account: { type: String, default: 'Cash' },
  tags: [{ type: String }],
  vendor: { type: String, default: '' },
  client: { type: String, default: '' },
  project_id: { type: String, default: '' },
  invoice_id: { type: String, default: '' },
  receipt_url: { type: String, default: '' },
  reconciled: { type: Boolean, default: false },
  notes: { type: String, default: '' },
  splits: { type: mongoose.Schema.Types.Mixed, default: [] }
})

const BudgetSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category_id: { type: String, required: true },
  target: { type: Number, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  notes: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
})

const ClientSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  gstin: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
})

const InvoiceSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  invoice_number: { type: String, unique: true, required: true },
  status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'], default: 'draft' },
  issue_date: { type: Date, required: true },
  due_date: { type: Date, required: true },
  subtotal: { type: Number, required: true },
  tax_rate: { type: Number, default: 0 },
  tax_amount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  notes: { type: String, default: '' },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
    tax_rate: { type: Number, default: 0 }
  }],
  created_at: { type: Date, default: Date.now }
})

const AuditSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String },
  ip: { type: String },
  path: { type: String },
  resource: { type: String },
  action: { type: String },
  status: { type: String, enum: ['allowed', 'denied'] },
  reason: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
})

// Static data
const categories = [
  { id: 'income', name: 'Income', icon: '💰' },
  { id: 'salary', name: 'Salary', icon: '💼' },
  { id: 'freelance', name: 'Freelance', icon: '🎯' },
  { id: 'investment', name: 'Investment', icon: '📈' },
  { id: 'other_income', name: 'Other Income', icon: '💵' },
  { id: 'expense', name: 'General', icon: '📦' },
  { id: 'food', name: 'Food', icon: '🍔' },
  { id: 'transport', name: 'Transport', icon: '🚗' },
  { id: 'utilities', name: 'Utilities', icon: '💡' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'rent', name: 'Rent', icon: '🏠' },
  { id: 'insurance', name: 'Insurance', icon: '🛡️' },
  { id: 'tax', name: 'Tax', icon: '📄' },
  { id: 'office', name: 'Office', icon: '🏢' },
  { id: 'marketing', name: 'Marketing', icon: '📢' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'subscription', name: 'Subscription', icon: '🔔' }
]

const accounts = ['Cash', 'Bank', 'Credit Card', 'PayPal', 'UPI', 'Net Banking']

const User = mongoose.model('User', UserSchema)
const Transaction = mongoose.model('Transaction', TransactionSchema)
const Budget = mongoose.model('Budget', BudgetSchema)
const Client = mongoose.model('Client', ClientSchema)
const Invoice = mongoose.model('Invoice', InvoiceSchema)
const Audit = mongoose.model('Audit', AuditSchema)

async function seedUsers() {
  const count = await User.countDocuments()
  if (count) return
  const samples = [
    { email: 'admin@example.com', password: 'admin123', role: 'admin' },
    { email: 'cm@example.com', password: 'cm123', role: 'client_mgmt' },
    { email: 'salary@example.com', password: 'salary123', role: 'salary' },
    { email: 'self@example.com', password: 'self123', role: 'self_employed' },
    { email: 'acct@example.com', password: 'acct123', role: 'accountant' }
  ]
  for (const s of samples) {
    const hash = bcrypt.hashSync(s.password, 10)
    await User.create({ email: s.email, password_hash: hash, role: s.role })
  }
  console.log('Seeded sample users')
}
seedUsers()

function parseDate(d) {
  const x = new Date(d)
  if (isNaN(x.getTime())) return null
  return x
}

function toISODate(d) {
  return new Date(d).toISOString()
}

function isIncome(t) { return t.type === 'income' }
function isExpense(t) { return t.type === 'expense' }

function applyFilters(list, query) {
  let out = list
  if (query.type) out = out.filter(t => t.type === query.type)
  if (query.account) out = out.filter(t => t.account === query.account)
  if (query.category_id) out = out.filter(t => t.category_id === query.category_id)
  if (query.tag) out = out.filter(t => Array.isArray(t.tags) && t.tags.includes(query.tag))
  if (query.reconciled !== undefined) {
    if (query.reconciled === 'true') out = out.filter(t => !!t.reconciled)
    if (query.reconciled === 'false') out = out.filter(t => !t.reconciled)
  }
  if (query.from) {
    const f = parseDate(query.from)
    if (f) out = out.filter(t => parseDate(t.date) >= f)
  }
  if (query.to) {
    const to = parseDate(query.to)
    if (to) out = out.filter(t => parseDate(t.date) <= to)
  }
  if (query.q) {
    const q = query.q.toLowerCase()
    out = out.filter(t =>
      (t.notes && t.notes.toLowerCase().includes(q)) ||
      (t.vendor && t.vendor.toLowerCase().includes(q)) ||
      (t.client && t.client.toLowerCase().includes(q)) ||
      (Array.isArray(t.tags) && t.tags.join(' ').toLowerCase().includes(q))
    )
  }
  return out
}

async function logAudit(req, resource, action, status, reason) {
  await Audit.create({
    user_id: req.user ? req.user.user_id : null,
    role: req.user ? req.user.role : null,
    ip: req.ip,
    path: req.originalUrl,
    resource,
    action,
    status,
    reason: reason || '',
    timestamp: new Date()
  })
}

const permissions = {
  dashboard: { view: ['admin', 'client_mgmt', 'self_employed', 'salary', 'accountant', 'viewer'] },
  transactions: {
    view: ['admin', 'client_mgmt', 'self_employed', 'salary', 'accountant', 'viewer'],
    create: ['admin', 'client_mgmt', 'self_employed', 'salary'],
    update: ['admin', 'client_mgmt', 'self_employed', 'salary'],
    delete: ['admin'],
    export: ['admin', 'client_mgmt', 'self_employed', 'accountant', 'salary'],
    import: ['admin', 'client_mgmt', 'self_employed', 'salary']
  },
  budgets: {
    view: ['admin', 'client_mgmt', 'self_employed', 'salary', 'accountant', 'viewer'],
    create: ['admin', 'self_employed', 'client_mgmt', 'salary'],
    update: ['admin', 'self_employed', 'client_mgmt', 'salary'],
    delete: ['admin']
  },
  clients: {
    view: ['admin', 'client_mgmt', 'self_employed', 'accountant'],
    detail: ['admin', 'client_mgmt', 'self_employed', 'accountant'],
    create: ['admin', 'client_mgmt', 'self_employed'],
    update: ['admin', 'client_mgmt', 'self_employed'],
    delete: ['admin']
  },
  audit: { view: ['admin'] }
}

function authenticate(req, res, next) {
  const h = req.headers['authorization'] || ''
  const m = h.match(/^Bearer\s+(.+)$/)
  if (!m) return res.status(401).json({ error: 'unauthorized' })
  try {
    const payload = jwt.verify(m[1], SECRET)
    req.user = { user_id: payload.user_id, role: payload.role, email: payload.email }
    next()
  } catch (e) {
    return res.status(401).json({ error: 'unauthorized' })
  }
}

function authorize(resource, action) {
  return async function (req, res, next) {
    const role = req.user && req.user.role
    const allowed = permissions[resource] && permissions[resource][action] && permissions[resource][action].includes(role)
    if (!allowed) {
      await logAudit(req, resource, action, 'denied', 'role_restricted')
      return res.status(403).json({ error: 'forbidden', reason: 'role_restricted' })
    }
    await logAudit(req, resource, action, 'allowed')
    next()
  }
}

app.post('/api/auth/register', async (req, res) => {
  const { email, password, role } = req.body || {}
  if (!email || !password || !role) return res.status(400).json({ error: 'email, password, role required' })
  const existing = await User.findOne({ email })
  if (existing) return res.status(409).json({ error: 'email_exists' })
  const hash = bcrypt.hashSync(password, 10)
  const user = await User.create({ email, password_hash: hash, role })
  res.status(201).json({ id: user._id, email: user.email, role: user.role })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  const user = await User.findOne({ email })
  if (!user) return res.status(401).json({ error: 'unauthorized' })
  if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'unauthorized' })
  const token = jwt.sign({ user_id: user._id, role: user.role, email: user.email }, SECRET, { expiresIn: '2h' })
  res.json({ token, role: user.role })
})

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user_id: req.user.user_id, role: req.user.role, email: req.user.email })
})

async function calcSnapshot(userId, role) {
  const now = new Date()
  const days30 = new Date(now.getTime() - 30 * 86400000)
  const days90 = new Date(now.getTime() - 90 * 86400000)
  const match = role === 'admin' ? {} : { user_id: userId }
  const tx = await Transaction.find(match).lean()
  const tx30 = tx.filter(t => new Date(t.date) >= days30)
  const tx90 = tx.filter(t => new Date(t.date) >= days90)
  const sum = arr => arr.reduce((a, b) => a + b, 0)
  const incomeTotal = sum(tx.filter(t => t.type === 'income').map(t => t.amount))
  const expenseTotal = sum(tx.filter(t => t.type === 'expense').map(t => t.amount))
  const balance = incomeTotal - expenseTotal
  const cash30 = sum(tx30.filter(t => t.type === 'income').map(t => t.amount)) - sum(tx30.filter(t => t.type === 'expense').map(t => t.amount))
  const cash90 = sum(tx90.filter(t => t.type === 'income').map(t => t.amount)) - sum(tx90.filter(t => t.type === 'expense').map(t => t.amount))
  const upcomingBills = tx.filter(t => t.type === 'expense' && new Date(t.date) > now)
  const budgets = await Budget.find(match).lean()
  const budgetsWithProgress = await Promise.all(budgets.map(async b => {
    const used = await Transaction.aggregate([
      { $match: { user_id: role === 'admin' ? {} : userId, category_id: b.category_id, type: 'expense', date: { $gte: b.start_date, $lte: b.end_date } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
    const total = used.length ? used[0].total : 0
    return { ...b, used: total, progress: b.target ? Math.min(100, Math.round((total / b.target) * 100)) : 0 }
  }))
  return { balance, cashflow_30d: cash30, cashflow_90d: cash90, upcoming_bills: upcomingBills.length, budgets: budgetsWithProgress }
}

app.get('/api/categories', (req, res) => {
  res.json(categories)
})

app.get('/api/accounts', (req, res) => {
  res.json(accounts)
})

app.get('/api/transactions', authenticate, authorize('transactions', 'view'), async (req, res) => {
  try {
    const match = req.user.role === 'admin' ? {} : { user_id: req.user.user_id }
    let transactions = await Transaction.find(match).lean()
    transactions = applyFilters(transactions, req.query)
    res.json(transactions)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/transactions', authenticate, authorize('transactions', 'create'), upload.single('receipt'), async (req, res) => {
  try {
    const body = req.body || {}
    const isMultipart = !!req.file
    const amount = Number(body.amount || 0)
    if (!amount || !body.type) return res.status(400).json({ error: 'amount and type are required' })
    const t = await Transaction.create({
      user_id: req.user.user_id,
      date: body.date ? toISODate(body.date) : new Date(),
      amount,
      currency: body.currency || 'INR',
      type: body.type,
      category_id: body.category_id || (body.type === 'income' ? 'income' : 'expense'),
      account: body.account || 'Cash',
      tags: body.tags ? (Array.isArray(body.tags) ? body.tags : String(body.tags).split(',').map(s => s.trim()).filter(Boolean)) : [],
      vendor: body.vendor || '',
      client: body.client || '',
      project_id: body.project_id || '',
      invoice_id: body.invoice_id || '',
      receipt_url: isMultipart && req.file ? `/uploads/${req.file.filename}` : (body.receipt_url || ''),
      reconciled: body.reconciled === 'true' || body.reconciled === true || false,
      notes: body.notes || '',
      splits: body.splits ? JSON.parse(body.splits) : []
    })
    res.status(201).json(t)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/transactions/:id', authenticate, authorize('transactions', 'update'), upload.single('receipt'), async (req, res) => {
  try {
    const { id } = req.params
    const transaction = await Transaction.findById(id)
    if (!transaction) return res.status(404).json({ error: 'Not found' })
    if (req.user.role !== 'admin' && transaction.user_id.toString() !== req.user.user_id) return res.status(403).json({ error: 'forbidden' })

    const body = req.body || {}
    const updates = {
      date: body.date ? toISODate(body.date) : transaction.date,
      amount: body.amount !== undefined ? Number(body.amount) : transaction.amount,
      currency: body.currency || transaction.currency,
      type: body.type || transaction.type,
      category_id: body.category_id || transaction.category_id,
      account: body.account || transaction.account,
      tags: body.tags ? (Array.isArray(body.tags) ? body.tags : String(body.tags).split(',').map(s => s.trim()).filter(Boolean)) : transaction.tags,
      vendor: body.vendor !== undefined ? body.vendor : transaction.vendor,
      client: body.client !== undefined ? body.client : transaction.client,
      project_id: body.project_id !== undefined ? body.project_id : transaction.project_id,
      invoice_id: body.invoice_id !== undefined ? body.invoice_id : transaction.invoice_id,
      receipt_url: req.file ? `/uploads/${req.file.filename}` : (body.receipt_url !== undefined ? body.receipt_url : transaction.receipt_url),
      reconciled: body.reconciled !== undefined ? (body.reconciled === 'true' || body.reconciled === true) : transaction.reconciled,
      notes: body.notes !== undefined ? body.notes : transaction.notes,
      splits: body.splits ? JSON.parse(body.splits) : transaction.splits
    }

    Object.assign(transaction, updates)
    await transaction.save()
    res.json(transaction)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/transactions/:id', authenticate, authorize('transactions', 'delete'), async (req, res) => {
  try {
    const { id } = req.params
    const transaction = await Transaction.findById(id)
    if (!transaction) return res.status(404).json({ error: 'Not found' })
    if (req.user.role !== 'admin' && transaction.user_id.toString() !== req.user.user_id) return res.status(403).json({ error: 'forbidden' })
    await Transaction.findByIdAndDelete(id)
    res.json(transaction)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/dashboard', authenticate, authorize('dashboard', 'view'), async (req, res) => {
  try {
    const snapshot = await calcSnapshot(req.user.user_id, req.user.role)
    res.json(snapshot)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/budgets', authenticate, authorize('budgets', 'view'), async (req, res) => {
  try {
    const match = req.user.role === 'admin' ? {} : { user_id: req.user.user_id }
    const budgets = await Budget.find(match).lean()
    res.json(budgets)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/budgets', authenticate, authorize('budgets', 'create'), async (req, res) => {
  try {
    const body = req.body || {}
    if (!body.category_id || !body.start_date || !body.end_date) return res.status(400).json({ error: 'category_id, start_date, end_date required' })
    const b = await Budget.create({
      user_id: req.user.user_id,
      category_id: body.category_id,
      target: Number(body.target || 0),
      start_date: toISODate(body.start_date),
      end_date: toISODate(body.end_date),
      notes: body.notes || ''
    })
    res.status(201).json(b)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/transactions/export.csv', authenticate, authorize('transactions', 'export'), async (req, res) => {
  try {
    const cols = ['_id', 'date', 'amount', 'currency', 'type', 'category_id', 'account', 'tags', 'vendor', 'client', 'project_id', 'invoice_id', 'receipt_url', 'reconciled', 'notes']
    const rows = [cols.join(',')]
    const match = req.user.role === 'admin' ? {} : { user_id: req.user.user_id }
    const items = await Transaction.find(match).lean()
    items.forEach(t => {
      const vals = cols.map(k => {
        let v = t[k]
        if (Array.isArray(v)) v = v.join('|')
        if (typeof v === 'string') {
          v = '"' + v.replace(/"/g, '""') + '"'
        }
        return v
      })
      rows.push(vals.join(','))
    })
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"')
    res.send(rows.join('\n'))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/transactions/import.csv', authenticate, authorize('transactions', 'import'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file required' })
    const csv = fs.readFileSync(path.join(uploadsDir, req.file.filename), 'utf8')
    const lines = csv.split(/\r?\n/).filter(Boolean)
    if (lines.length < 2) return res.status(400).json({ error: 'No rows' })
    const header = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''))
    let imported = 0
    for (let i = 1; i < lines.length; i++) {
      const raw = lines[i]
      const parts = []
      let cur = ''
      let inQuotes = false
      for (let ch of raw) {
        if (ch === '"') { inQuotes = !inQuotes; continue }
        if (ch === ',' && !inQuotes) { parts.push(cur); cur = ''; continue }
        cur += ch
      }
      parts.push(cur)
      const obj = {}
      header.forEach((h, idx) => { obj[h] = parts[idx] })
      const t = await Transaction.create({
        user_id: req.user.user_id,
        date: obj.date ? new Date(obj.date) : new Date(),
        amount: Number(obj.amount || 0),
        currency: obj.currency || 'INR',
        type: obj.type || 'expense',
        category_id: obj.category_id || 'expense',
        account: obj.account || 'Cash',
        tags: obj.tags ? obj.tags.split('|').filter(Boolean) : [],
        vendor: obj.vendor || '',
        client: obj.client || '',
        project_id: obj.project_id || '',
        invoice_id: obj.invoice_id || '',
        receipt_url: obj.receipt_url || '',
        reconciled: obj.reconciled === 'true',
        notes: obj.notes || ''
      })
      if (t.amount) imported++
    }
    res.json({ imported })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/clients', authenticate, authorize('clients', 'view'), async (req, res) => {
  try {
    let match = {}
    if (req.user.role !== 'admin' && req.user.role !== 'client_mgmt') {
      match = { user_id: req.user.user_id }
    }
    const clients = await Client.find(match).lean()
    res.json(clients)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/clients/:id', authenticate, authorize('clients', 'detail'), async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).lean()
    if (!client) return res.status(404).json({ error: 'Not found' })
    if (req.user.role !== 'admin' && req.user.role !== 'client_mgmt' && client.user_id.toString() !== req.user.user_id) return res.status(403).json({ error: 'forbidden' })
    res.json(client)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/clients', authenticate, authorize('clients', 'create'), async (req, res) => {
  try {
    const { name, email, phone, address, gstin } = req.body || {}
    if (!name) return res.status(400).json({ error: 'name required' })
    const c = await Client.create({
      user_id: req.user.user_id,
      name,
      email: email || '',
      phone: phone || '',
      address: address || '',
      gstin: gstin || ''
    })
    res.status(201).json(c)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/clients/:id', authenticate, authorize('clients', 'update'), async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
    if (!client) return res.status(404).json({ error: 'Not found' })
    if (req.user.role !== 'admin' && req.user.role !== 'client_mgmt' && client.user_id.toString() !== req.user.user_id) return res.status(403).json({ error: 'forbidden' })

    const { name, email, phone, address, gstin } = req.body || {}
    const updates = {
      name: name !== undefined ? name : client.name,
      email: email !== undefined ? email : client.email,
      phone: phone !== undefined ? phone : client.phone,
      address: address !== undefined ? address : client.address,
      gstin: gstin !== undefined ? gstin : client.gstin
    }

    Object.assign(client, updates)
    await client.save()
    res.json(client)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})



// Invoice Endpoints
app.get('/api/invoices', authenticate, authorize('clients', 'view'), async (req, res) => {
  try {
    let match = {}
    if (req.user.role !== 'admin' && req.user.role !== 'client_mgmt') {
      match = { user_id: req.user.user_id }
    }
    const invoices = await Invoice.find(match).populate('client_id', 'name email').lean()
    res.json(invoices)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/invoices/:id', authenticate, authorize('clients', 'detail'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('client_id').lean()
    if (!invoice) return res.status(404).json({ error: 'Not found' })
    if (req.user.role !== 'admin' && req.user.role !== 'client_mgmt' && invoice.user_id.toString() !== req.user.user_id) return res.status(403).json({ error: 'forbidden' })
    res.json(invoice)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/invoices', authenticate, authorize('clients', 'create'), async (req, res) => {
  try {
    const body = req.body || {}
    if (!body.client_id || !body.invoice_number || !body.issue_date || !body.due_date || !body.items) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Calculate totals
    const items = Array.isArray(body.items) ? body.items : []
    let subtotal = 0
    let totalTax = 0
    const processedItems = items.map(item => {
      const amount = Number(item.quantity) * Number(item.rate)
      const tax = amount * (Number(item.tax_rate) / 100)
      subtotal += amount
      totalTax += tax
      return { ...item, amount, tax_rate: Number(item.tax_rate) }
    })

    const total = subtotal + totalTax

    const invoice = await Invoice.create({
      user_id: req.user.user_id,
      client_id: body.client_id,
      invoice_number: body.invoice_number,
      status: body.status || 'draft',
      issue_date: toISODate(body.issue_date),
      due_date: toISODate(body.due_date),
      subtotal,
      tax_rate: 0, // Individual item tax used
      tax_amount: totalTax,
      total,
      currency: body.currency || 'INR',
      notes: body.notes || '',
      items: processedItems
    })
    res.status(201).json(invoice)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/invoices/:id', authenticate, authorize('clients', 'update'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Not found' })
    if (req.user.role !== 'admin' && req.user.role !== 'client_mgmt' && invoice.user_id.toString() !== req.user.user_id) return res.status(403).json({ error: 'forbidden' })

    const body = req.body || {}

    if (body.items) {
      const items = Array.isArray(body.items) ? body.items : []
      let subtotal = 0
      let totalTax = 0
      const processedItems = items.map(item => {
        const amount = Number(item.quantity) * Number(item.rate)
        const tax = amount * (Number(item.tax_rate) / 100)
        subtotal += amount
        totalTax += tax
        return { ...item, amount, tax_rate: Number(item.tax_rate) }
      })
      invoice.items = processedItems
      invoice.subtotal = subtotal
      invoice.tax_amount = totalTax
      invoice.total = subtotal + totalTax
    }

    if (body.status) invoice.status = body.status
    if (body.issue_date) invoice.issue_date = toISODate(body.issue_date)
    if (body.due_date) invoice.due_date = toISODate(body.due_date)
    if (body.notes !== undefined) invoice.notes = body.notes

    await invoice.save()
    res.json(invoice)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/invoices/:id', authenticate, authorize('clients', 'delete'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Not found' })
    if (req.user.role !== 'admin' && req.user.role !== 'client_mgmt' && invoice.user_id.toString() !== req.user.user_id) return res.status(403).json({ error: 'forbidden' })
    await Invoice.findByIdAndDelete(req.params.id)
    res.json(invoice)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/audit', authenticate, authorize('audit', 'view'), (req, res) => {
  res.json(db.audit)
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})