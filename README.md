# The Blacklist - Marketplace Académico de Élite

Una Progressive Web App (PWA) futurista que conecta estudiantes universitarios ("Clientes") con académicos de élite ("Especialistas") a través de un sofisticado sistema de licitación, depósito en garantía y calificaciones.

## 🚀 Características Principales

- **Interfaz Futurista**: Diseño cyberpunk con efectos visuales avanzados
- **PWA Completa**: Funciona offline y se instala como app nativa
- **Sistema de Escrow**: Transacciones seguras con depósito en garantía
- **Autenticación Firebase**: Login seguro con Google
- **Chat en Tiempo Real**: Comunicación privada entre usuarios
- **Sistema de Calificaciones**: Reputación mutua transparente

## 🛠️ Stack Tecnológico

- **Frontend**: Vue.js 3 + TypeScript + Vite
- **Styling**: Tailwind CSS con tema cyberpunk personalizado
- **Estado**: Pinia
- **Routing**: Vue Router 4
- **Backend**: Firebase (Auth, Firestore, Storage, Functions, Hosting)
- **PWA**: Vite PWA Plugin + Workbox

## 📦 Instalación

1. Clona el repositorio:
\`\`\`bash
git clone <repository-url>
cd the-blacklist-web
\`\`\`

2. Instala las dependencias:
\`\`\`bash
npm install
\`\`\`

3. Configura las variables de entorno:
\`\`\`bash
cp .env.example .env
# Edita .env con tus credenciales de Firebase
\`\`\`

4. Inicia el servidor de desarrollo:
\`\`\`bash
npm run dev
\`\`\`

## 🔧 Scripts Disponibles

- \`npm run dev\` - Servidor de desarrollo
- \`npm run build\` - Build de producción
- \`npm run preview\` - Preview del build
- \`npm run type-check\` - Verificación de tipos TypeScript

## 🏗️ Estructura del Proyecto

\`\`\`
src/
├── components/
│   ├── ui/                 # Componentes base reutilizables
│   ├── layout/             # Componentes de layout
│   ├── landing/            # Componentes de landing page
│   ├── dashboard/          # Componentes de dashboards
│   └── shared/             # Componentes compartidos
├── views/                  # Vistas principales
├── stores/                 # Pinia stores
├── services/               # Servicios Firebase
├── types/                  # Interfaces TypeScript
├── utils/                  # Utilidades
└── assets/                 # Assets estáticos
\`\`\`

## 🎨 Tema Visual

El proyecto utiliza un tema cyberpunk futurista con:

- **Colores Primarios**: Negro profundo (#0a0a0a), Guindo oscuro (#800020)
- **Acentos**: Cyan neón (#00ffff), Magenta (#ff00ff)
- **Efectos**: Glitch, hologramas, animaciones de escaneo
- **Tipografía**: Orbitron (futurista), JetBrains Mono (código)

## 🔐 Configuración de Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilita Authentication (Google provider)
3. Crea una base de datos Firestore
4. Configura Storage para archivos
5. Copia las credenciales al archivo \`.env\`

## 📱 PWA Features

- ✅ Instalable en dispositivos móviles y desktop
- ✅ Funciona offline con Service Worker
- ✅ Cache inteligente de recursos
- ✅ Notificaciones push (próximamente)
- ✅ Actualizaciones automáticas

## 🚀 Deployment

Para información detallada sobre deployment y CI/CD, consulta la [Guía de Deployment](docs/DEPLOYMENT.md).

### Quick Deploy

```bash
# Deploy a staging
node scripts/deploy.js staging

# Deploy a producción
node scripts/deploy.js production
```

## 🚧 Estado del Desarrollo

Este proyecto está en desarrollo activo. Consulta el archivo \`tasks.md\` en \`.kiro/specs/the-blacklist/\` para ver el progreso de implementación.

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (\`git checkout -b feature/AmazingFeature\`)
3. Commit tus cambios (\`git commit -m 'Add some AmazingFeature'\`)
4. Push a la rama (\`git push origin feature/AmazingFeature\`)
5. Abre un Pull Request

---

**The Blacklist** - Donde la élite académica se encuentra con la tecnología del futuro.