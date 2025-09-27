# The Blacklist v2.0 - Nuevas Funcionalidades

Esta carpeta contiene todas las nuevas funcionalidades y mejoras de la versión 2.0.

## Estructura de Carpetas

```
src/v2/
├── components/          # Componentes nuevos y mejorados
├── services/           # Servicios v2.0
├── stores/             # Stores Pinia v2.0
├── composables/        # Composables mejorados
├── utils/              # Utilidades v2.0
├── types/              # Tipos TypeScript v2.0
├── api/                # Nueva API v2.0
└── features/           # Funcionalidades por módulos
```

## Principios de Desarrollo v2.0

1. **Modularidad**: Cada funcionalidad es un módulo independiente
2. **Composición**: Uso extensivo de Composition API
3. **TypeScript First**: Tipado estricto en todo el código
4. **Performance**: Optimización desde el diseño
5. **Accesibilidad**: WCAG 2.1 AA compliance
6. **Testing**: TDD (Test Driven Development)

## Convenciones de Nomenclatura

- Componentes: `PascalCase` con sufijo `V2` si reemplaza uno existente
- Services: `camelCase` con namespace `v2`
- Stores: `camelCase` con sufijo `V2Store`
- Types: `PascalCase` con sufijo `V2` si es nueva versión

## Feature Flags

Todas las nuevas funcionalidades deben implementarse con feature flags para permitir rollout gradual.
