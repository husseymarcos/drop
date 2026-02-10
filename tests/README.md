# Tests - Business Behavior Verification

Este directorio contiene tests enfocados en **comportamiento de negocio** al estilo TDD.

## Filosofía

- **Behavior over Implementation**: Verificamos QUÉ hace el sistema, no CÓMO lo implementa
- **Business Language**: Los tests usan lenguaje del dominio ("user creates session", "system enforces policy")
- **Independencia**: Los tests no dependen de implementaciones concretas
- **Cobertura de reglas**: Cada test representa una regla de negocio importante

## Estructura

```
tests/
├── setup.ts              # Configuración global
├── unit/                 # Tests de comportamiento unitario
│   ├── args-parser.test.ts      # CLI interpreta comandos
│   ├── time-parser.test.ts      # Sistema interpreta tiempos
│   ├── slug-generator.test.ts   # Generación de identificadores
│   ├── session-manager.test.ts  # Ciclo de vida de sesiones
│   └── file-loader.test.ts      # Reconocimiento de archivos
└── integration/          # Flujos de negocio completos
    └── flows.test.ts            # Escenarios end-to-end
```

## Ejecución

```bash
bun test              # Todos los tests
bun run test:unit     # Solo tests unitarios
bun run test:integration  # Solo integración
bun run test:watch    # Modo watch
```

## Áreas de comportamiento verificadas

### 1. CLI Commands (`args-parser`)
- El CLI acepta comandos válidos para crear sesiones
- El CLI valida restricciones de negocio (archivo y tiempo requeridos)
- El CLI rechaza operaciones inválidas

### 2. Time Interpretation (`time-parser`)
- El sistema convierte notaciones de tiempo correctamente
- El sistema valida entradas de tiempo inválidas
- El sistema muestra duraciones en formato legible

### 3. Session Identifiers (`slug-generator`)
- El sistema genera identificadores únicos para cada sesión
- Los identificadores son seguros para URLs
- El sistema puede liberar identificadores para reutilización

### 4. Session Lifecycle (`session-manager`)
- El sistema reconoce sesiones activas vs expiradas
- El sistema aplica política de un solo uso
- El sistema limpia recursos al cerrarse

### 5. File Recognition (`file-loader`)
- El sistema identifica tipos de archivo correctamente
- El sistema formatea tamaños para visualización

### 6. End-to-End Flows (`flows`)
- El usuario puede crear sesiones de compartir archivos
- El sistema genera links únicos
- El sistema aplica seguridad y expiración

## Principios aplicados

1. **Test Behavior, Not Implementation**: Los tests describen comportamiento esperado
2. **Business Language**: "El sistema X hace Y" en lugar de "La función X devuelve Y"
3. **Un assert por comportamiento**: Cada test verifica una regla de negocio
4. **Independencia**: Los tests no rompen si cambiamos la implementación
5. **Casos edge**: Tests para escenarios límite y errores

## Añadir nuevos tests

```typescript
describe('System/Feature does something', () => {
  it('specific behavior under specific condition', () => {
    // Arrange - preparar el escenario
    // Act - ejecutar la acción
    // Assert - verificar el comportamiento esperado
  });
});
```
