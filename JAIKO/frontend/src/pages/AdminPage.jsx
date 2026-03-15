import { useState, useEffect } from 'react'
import { Users, FileWarning, BarChart3, ShieldX, AlertTriangle } from 'lucide-react'
import api from '../services/api'
import { Badge, Spinner } from '../components/ui'
import { toast } from 'react-hot-toast'

const TABS = ['Estadísticas', 'Reportes', 'Usuarios']

export default function AdminPage() {
  const [tab, setTab] = useState(0)
  const [stats, setStats] = useState(null)
  const [reports, setReports] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data))
    api.get('/admin/reports?status=open').then(({ data }) => setReports(data.reports))
    api.get('/admin/users').then(({ data }) => setUsers(data.users))
      .finally(() => setLoading(false))
  }, [])

  const handleReport = async (id, action, status = 'reviewed') => {
    try {
      await api.put(`/admin/reports/${id}`, { action, status })
      setReports(r => r.filter(rep => rep.id !== id))
      toast.success('Acción aplicada')
    } catch {
      toast.error('Error')
    }
  }

  const handleUserStatus = async (userId, status) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { status })
      setUsers(us => us.map(u => u.id === userId ? { ...u, status } : u))
      toast.success('Estado actualizado')
    } catch {
      toast.error('Error')
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-dark flex items-center justify-center">
          <ShieldX size={20} className="text-primary-400" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-3xl">Panel de Administración</h1>
          <p className="text-orange-400 text-sm">Gestión de JAIKO!</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-orange-100 pb-0">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2.5 font-semibold text-sm rounded-t-xl transition-all -mb-px border border-b-0
              ${tab === i ? 'bg-white border-orange-200 text-primary-600' : 'text-orange-400 border-transparent hover:text-primary-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Stats */}
      {tab === 0 && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Usuarios', value: stats.users.total, sub: `${stats.users.blocked} bloqueados`, icon: Users, color: 'bg-blue-50 text-blue-600' },
            { label: 'Publicaciones', value: stats.listings.active, sub: 'activas', icon: BarChart3, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Grupos', value: stats.groups.open, sub: 'abiertos', icon: Users, color: 'bg-purple-50 text-purple-600' },
            { label: 'Reportes', value: stats.reports.open, sub: 'pendientes', icon: FileWarning, color: 'bg-red-50 text-red-600' },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="card">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon size={18} />
              </div>
              <p className="font-display font-extrabold text-3xl">{value}</p>
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-orange-400">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reports */}
      {tab === 1 && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <p className="text-center text-orange-400 py-10">No hay reportes pendientes 🎉</p>
          ) : reports.map(r => (
            <div key={r.id} className="card flex items-start gap-4">
              <AlertTriangle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="red">{r.reason}</Badge>
                  <span className="text-xs text-orange-400">por usuario #{r.reporter_id}</span>
                  {r.reported_user_id && <span className="text-xs text-gray-500">→ usuario #{r.reported_user_id}</span>}
                </div>
                {r.description && <p className="text-sm text-gray-600">{r.description}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => handleReport(r.id, 'block', 'resolved')}
                  className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors">
                  Bloquear
                </button>
                <button onClick={() => handleReport(r.id, 'warn', 'resolved')}
                  className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors">
                  Advertir
                </button>
                <button onClick={() => handleReport(r.id, 'dismiss', 'dismissed')}
                  className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg font-semibold transition-colors">
                  Ignorar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {tab === 2 && (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-orange-50 text-orange-500 font-semibold text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-orange-50 hover:bg-orange-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-orange-400">#{u.id}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3"><Badge variant={u.role === 'admin' ? 'dark' : 'gray'}>{u.role}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge variant={u.status === 'active' ? 'green' : u.status === 'blocked' ? 'red' : 'orange'}>
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {u.status !== 'blocked' && (
                        <button onClick={() => handleUserStatus(u.id, 'blocked')}
                          className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-2 py-1 rounded-lg transition-colors font-semibold">
                          Bloquear
                        </button>
                      )}
                      {u.status !== 'active' && (
                        <button onClick={() => handleUserStatus(u.id, 'active')}
                          className="text-xs bg-emerald-100 text-emerald-600 hover:bg-emerald-200 px-2 py-1 rounded-lg transition-colors font-semibold">
                          Activar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
