#!/bin/bash

# Script para hacer deploy con modo demo habilitado
# Ejecutar: bash scripts/deploy-with-demo.sh

echo "🎭 Preparando deploy con Modo Demo..."
echo ""

# Verificar que estamos en la rama correcta
BRANCH=$(git branch --show-current)
echo "📍 Rama actual: $BRANCH"
echo ""

# Agregar todos los cambios
echo "📦 Agregando cambios..."
git add .

# Commit
echo "💾 Creando commit..."
git commit -m "feat: add demo mode for presentations without authentication

- Add useDemoMode composable for demo user management
- Add demo mode buttons on landing page
- Update auth store to support demo mode
- Add demo mode banners on dashboards
- Update router to allow navigation in demo mode
- Add documentation in MODO-DEMO.md

This allows anyone to access the dashboards without Google authentication,
perfect for presentations and demos."

# Push
echo "🚀 Haciendo push a GitHub..."
git push origin $BRANCH

echo ""
echo "✅ Deploy iniciado!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Espera 2-3 minutos para que Vercel haga el deploy"
echo "2. Ve a tu URL de Vercel"
echo "3. Busca la sección 'MODO DEMO' en el landing"
echo "4. Haz clic en 'Entrar como Cliente' o 'Entrar como Especialista'"
echo ""
echo "🎉 ¡Listo para tu presentación!"
