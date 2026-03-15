# 🏠 JAIKO!

**Plataforma para encontrar roomies y vivienda en Paraguay.**

JAIKO! conecta personas que buscan compartir alquiler con quienes publican
departamentos y habitaciones. Sistema completo con matching de compatibilidad,
grupos, chat en tiempo real y verificación de identidad.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend  | Python 3.12 + Flask 3 |
| Base de datos | PostgreSQL 16 + SQLAlchemy ORM |
| Chat real-time | Flask-SocketIO + eventlet |
| Mapas | React Leaflet + OpenStreetMap |
| Storage | Supabase Storage |
| Auth | Google OAuth 2.0 + JWT propio |
| Estado frontend | Zustand |

---

## Estructura del proyecto

```
jaiko/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory
│   │   ├── config.py            # Configuración por entorno
│   │   ├── extensions.py        # db, jwt, socketio, cors
│   │   ├── models/              # SQLAlchemy ORM
│   │   │   ├── user.py
│   │   │   ├── profile.py
│   │   │   ├── listing.py
│   │   │   ├── group.py
│   │   │   ├── chat.py
│   │   │   └── misc.py          # Request, Notif, Review, Report, Verification
│   │   ├── routes/              # Blueprints Flask
│   │   │   ├── auth_routes.py
│   │   │   ├── profile_routes.py
│   │   │   ├── listing_routes.py
│   │   │   ├── group_routes.py
│   │   │   ├── chat_routes.py
│   │   │   ├── request_routes.py
│   │   │   ├── notification_routes.py
│   │   │   ├── review_routes.py
│   │   │   ├── report_routes.py
│   │   │   ├── admin_routes.py
│   │   │   ├── verification_routes.py
│   │   │   └── upload_routes.py
│   │   ├── services/
│   │   │   ├── matching_service.py   # Algoritmo 80%
│   │   │   └── notification_service.py
│   │   ├── sockets/
│   │   │   └── chat_socket.py        # SocketIO events
│   │   └── utils/
│   │       └── storage.py            # Supabase upload helper
│   ├── run.py
│   ├── init_db.py               # Inicializar tablas + seed admin
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx              # Rutas
│   │   ├── index.css            # Tailwind + tokens
│   │   ├── components/
│   │   │   ├── layout/          # Layout, ProtectedRoute, AdminRoute
│   │   │   ├── ui/              # Avatar, Badge, Modal, Spinner, Cards
│   │   │   └── map/             # JaikoMap (React Leaflet)
│   │   ├── pages/
│   │   │   ├── HomePage
│   │   │   ├── LoginPage
│   │   │   ├── SearchPage       # Buscar roomies
│   │   │   ├── ProfilePage      # Ver / editar perfil
│   │   │   ├── ListingsPage     # Grid + Mapa
│   │   │   ├── ListingDetailPage
│   │   │   ├── CreateListingPage
│   │   │   ├── GroupsPage
│   │   │   ├── GroupDetailPage
│   │   │   ├── ChatPage         # Chat real-time
│   │   │   ├── NotificationsPage
│   │   │   ├── VerificationPage
│   │   │   └── AdminPage
│   │   ├── services/
│   │   │   ├── api.js           # Axios + interceptors
│   │   │   └── socket.js        # Socket.IO client
│   │   └── context/
│   │       ├── authStore.js     # Zustand auth store
│   │       └── notifStore.js    # Zustand notifications
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
│
└── docker-compose.yml
```

---

## Primeros pasos

### 1. Variables de entorno

```bash
# Backend
cp backend/.env.example backend/.env
# Completar: DATABASE_URL, GOOGLE_CLIENT_ID, SUPABASE_URL, SUPABASE_KEY

# Frontend
cp frontend/.env.example frontend/.env
# Completar: VITE_GOOGLE_CLIENT_ID
```

### 2. Con Docker (recomendado)

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:5000
- DB:       localhost:5432

### 3. Sin Docker (desarrollo local)

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python init_db.py          # Crear tablas
python run.py              # Iniciar servidor
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## API REST — Endpoints principales

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/google` | Login con Google ID token → JWT |
| GET  | `/api/auth/me`     | Perfil autenticado actual |

### Perfiles
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | `/api/profiles/search` | Buscar roomies compatibles (≥80%) |
| PUT  | `/api/profiles/me`     | Actualizar mi perfil |
| GET  | `/api/profiles/:id`    | Ver perfil de otro usuario |

### Publicaciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET    | `/api/listings/`        | Listar con filtros |
| POST   | `/api/listings/`        | Crear publicación |
| GET    | `/api/listings/:id`     | Detalle |
| PUT    | `/api/listings/:id`     | Editar |
| DELETE | `/api/listings/:id`     | Eliminar (soft) |
| GET    | `/api/listings/my`      | Mis publicaciones |

### Grupos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | `/api/groups/`          | Listar grupos abiertos |
| POST | `/api/groups/`          | Crear grupo |
| GET  | `/api/groups/:id`       | Detalle |
| POST | `/api/groups/:id/join`  | Unirse |
| POST | `/api/groups/:id/leave` | Salir |
| GET  | `/api/groups/my`        | Mis grupos |

### Chat
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | `/api/chats/`                    | Mis chats |
| POST | `/api/chats/private/:user_id`    | Crear/obtener chat 1-a-1 |
| GET  | `/api/chats/:id/messages`        | Historial de mensajes |

### SocketIO events
| Evento (emit) | Datos | Descripción |
|---------------|-------|-------------|
| `join_chat`     | `{ chat_id }` | Unirse a sala de chat |
| `send_message`  | `{ chat_id, content }` | Enviar mensaje |
| `typing`        | `{ chat_id }` | Indicador "escribiendo" |
| `stop_typing`   | `{ chat_id }` | Detener indicador |

| Evento (on) | Descripción |
|-------------|-------------|
| `receive_message` | Nuevo mensaje en sala |
| `notification`    | Notificación en tiempo real |
| `user_typing`     | Otro usuario está escribiendo |

---

## Sistema de Matching

```python
compatibility = matches / total_filters  # threshold: 0.80 (80%)

# Filtros evaluados:
# - presupuesto  (rangos se solapan)
# - edad         (diferencia ≤ 10 años)
# - mascotas     (booleano igual)
# - fumador      (booleano igual)
# - horario      (igual o alguno es "flexible")
```

---

## Roles

| Rol | Permisos |
|-----|---------|
| `user`     | Todo lo básico |
| `verifier` | Aprobar/rechazar verificaciones |
| `admin`    | Panel admin, reportes, bloquear usuarios |

---

## Supabase Storage

Los archivos se suben en carpetas:
- `profiles/`      → fotos de perfil
- `listings/`      → fotos de publicaciones
- `verification/`  → selfies de verificación

---

## Configuración Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear credencial OAuth 2.0 (tipo: Web application)
3. Agregar `http://localhost:5173` a orígenes autorizados
4. Copiar el Client ID a `.env`

---

## Variables de entorno

### Backend `.env`
```
FLASK_ENV=development
SECRET_KEY=
JWT_SECRET_KEY=
DATABASE_URL=postgresql://user:pass@localhost:5432/jaiko_db
GOOGLE_CLIENT_ID=
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_BUCKET=jaiko-media
FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=admin@jaiko.com.py
```

### Frontend `.env`
```
VITE_GOOGLE_CLIENT_ID=
```
