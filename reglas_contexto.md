# Reglas y Contexto - VetAdmin

## Descripción del Proyecto
VetAdmin es una aplicación de gestión para clínicas veterinarias construida con React y Vite. La aplicación proporciona funcionalidades para administrar datos de pacientes, citas y otras operaciones veterinarias.

## Stack Tecnológico
- **Frontend Framework**: React 18.2.0
- **Build Tool**: Vite 5.1.4
- **Routing**: React Router DOM 6.22.0
- **UI Icons**: Lucide React 1.8.0
- **Package Manager**: npm

## Estructura del Proyecto
```
veterinaria/
├── src/                    # Código fuente principal
│   ├── App.jsx            # Componente raíz
│   └── main.jsx           # Punto de entrada
├── dist/                  # Build output
├── public/                # Activos estáticos
├── index.html             # HTML principal
├── vite.config.js         # Configuración de Vite
├── package.json           # Dependencias y scripts
└── README.md              # Documentación
```

## Scripts Disponibles
```bash
npm run dev      # Inicia servidor de desarrollo en http://localhost:5173
npm run build    # Construye la aplicación para producción
npm run preview  # Previsualiza la build de producción localmente
```

## Reglas de Desarrollo

### 1. **Responsividad**
- La aplicación debe ser completamente responsive
- Usar media queries y componentes móviles cuando sea necesario
- Implementar sidebar drawer para navegación móvil


### 2. **Componentes React**
- Usar componentes funcionales con hooks
- Mantener componentes pequeños y reutilizables
- Propagar estado mediante props o Context API cuando sea necesario

### 3. **Routing**
- Configurar rutas utilizando React Router
- Mantener una estructura lógica de navegación
- Implementar lazy loading cuando sea apropiado

### 4. **Iconografía**
- Utilizar componentes de Lucide React para iconos
- Mantener consistencia visual con el uso de iconos

### 5. **Estilos**
- Usar CSS/CSS Modules o Tailwind CSS según configuración del proyecto
- Mantener estilos organizados y reutilizables
- Asegurar contraste y accesibilidad en los colores

### 6. **Git Workflow**
- Rama principal: `master`
- Hacer commits descriptivos y atómicos
- Usar mensajes de commit en inglés o español (consistencia)
- Las nuevas características deben incluirse en commits separados de refactoring

### 7. **Build y Despliegue**
- Proyecto deployado en Vercel (.vercel/project.json existe)
- Asegurar que `npm run build` no tenga errores antes de push
- Revisar que el build output esté limpio (dist/)
- No debes pushear hasta que yo no te diga explicitamente "PUSHEA"

## Puntos Importantes
- El proyecto está bajo control de versión Git
- Se ha implementado responsividad completa con sidebar móvil
- Los artefactos de build han sido removidos del tracking (.gitignore configurado)
- La versión actual es 0.1.0

## Contacto y Referencias
- Git User: diegogs92
- Email: dgarciasantillan@gmail.com
