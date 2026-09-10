# MacroVidrios Cut - Indice de continuidad

**Estado:** Aplicacion implementada (MVP en modo demo), motor rectangular probado, Supabase preparado por migracion
**Fuente funcional:** `MacroVidrios-Cut-Especificacion-y-Arquitectura.md`
**Ultima actualizacion:** 2026-09-10

## Proposito

Este archivo permite que una nueva sesion de IA entienda rapidamente el estado del proyecto, las decisiones que no deben romperse y el orden de trabajo recomendado.

## Estado del repositorio

- Existe una aplicacion Next.js 15 (App Router) + TypeScript + Tailwind con 17 rutas.
- El motor de optimizacion rectangular es una biblioteca TypeScript pura en `src/lib/optimization` con 21 pruebas unitarias e invariantes.
- La capa de dominio y datos vive en `src/domain` y `src/lib/data`, con un repositorio en memoria y seed sintetico; `supabase/migrations/0001_initial_schema.sql` define el esquema PostgreSQL con RLS.
- La autenticacion funciona en modo demo (cookie de sesion, cuentas sembradas); Supabase Auth queda pendiente de provisionar.
- Verificacion actual: `npm run lint`, `npm run typecheck`, `npm run test` (29 pruebas) y `npm run build` pasan; E2E de Playwright cubre login, proteccion de rutas y cuadre completo.
- El siguiente trabajo tecnico correcto es provisionar Supabase y sustituir el repositorio en memoria, generar PDF de produccion y cerrar Fase 0 (reglas reales de negocio).

## Comandos utiles

- `npm run dev` inicia la app (usar `-- --port 3100` si el puerto 3000 esta ocupado).
- `npm run optimizer` ejecuta el optimizador con el fixture de ejemplo (`-- --json` para salida completa).
- `npm run test` unitarias e integracion; `npm run test:e2e` flujos Playwright.


## Documentos del plan

| Archivo | Uso |
|---|---|
| `00-INDICE-Y-CONTINUIDAD.md` | Contexto, invariantes y protocolo para futuras sesiones |
| `01-PLAN-DE-DESARROLLO.md` | Alcance, fases, entregables, dependencias y criterios de salida |
| `02-ARQUITECTURA-TECNICA.md` | Stack, estructura de codigo, datos, seguridad, rendimiento y despliegue |
| `03-UX-UI-RESPONSIVE-PWA.md` | Flujos, pantallas, estados y comportamiento en PC, tablet y movil |
| `04-MOTOR-OPTIMIZACION.md` | Contrato, algoritmo incremental, validacion y pruebas geometricas |
| `05-CALIDAD-OPERACION.md` | Testing, observabilidad, seguridad, CI/CD, riesgos y soporte |
| `06-BACKLOG-INICIAL.md` | Trabajo atomico ordenado para comenzar la implementacion |

## Invariantes del producto

Estas reglas tienen prioridad sobre decisiones de conveniencia tecnica:

1. Un pedido y un trabajo de corte son entidades distintas.
2. Una pieza siempre conserva su pedido de origen, incluso dentro de un trabajo multi-pedido.
3. Un retazo reservado no puede ser asignado simultaneamente a otro trabajo.
4. Toda solucion de corte debe ser geometrica y operativamente valida, no solo eficiente en area.
5. Las unidades internas son milimetros, mm2 y dinero en centavos enteros.
6. La version del optimizador y de su configuracion se conserva en cada cuadre.
7. Los cambios manuales posteriores a una optimizacion se auditan y no sobrescriben silenciosamente el resultado.
8. La interfaz operativa debe ocultar la complejidad matematica y mostrar siempre el siguiente paso.
9. El modo de produccion se diseña para tablet y movil, separado del modo administrativo.
10. Las validaciones criticas ocurren en servidor/base de datos; el cliente solo mejora la experiencia.

## Orden de lectura recomendado para una nueva sesion

1. Este archivo.
2. La especificacion maestra, especialmente las secciones 15, 20, 21, 30, 32, 38, 39, 42 y 44.
3. `01-PLAN-DE-DESARROLLO.md` para saber que fase esta activa.
4. El documento especializado relacionado con la tarea.
5. El backlog y el estado real del codigo antes de editar.

## Protocolo de continuidad

Antes de implementar una tarea:

1. Leer el backlog y localizar el identificador de la tarea.
2. Confirmar que sus dependencias estan completadas.
3. Revisar decisiones pendientes que puedan bloquearla.
4. Implementar el minimo alcance que cumple el criterio de salida.
5. Ejecutar las pruebas indicadas.
6. Actualizar el estado del backlog y documentar decisiones nuevas.

Al cerrar una sesion:

- actualizar el estado real de la tarea;
- anotar bloqueos y decisiones en el documento correspondiente;
- no marcar una fase como completa si falta su criterio de salida;
- mantener la especificacion maestra como referencia funcional, pero usar estos documentos para el detalle ejecutable.

## Decisiones pendientes de negocio

No deben codificarse como valores definitivos hasta confirmarlas con MacroVidrios:

- formatos reales de plancha;
- kerf por herramienta y proceso;
- margenes y separaciones minimas;
- piezas que pueden rotarse;
- formas reales usadas en produccion;
- umbrales para convertir sobrantes en retazos;
- formula comercial de precios;
- ubicacion fisica y politica de inventario;
- permisos definitivos por puesto;
- comportamiento ante falta de material;
- prioridad entre ahorro de material, menor cantidad de cortes y facilidad operativa.

## Criterio para aceptar nuevas decisiones

Toda decision nueva debe registrar:

- fecha y responsable;
- problema que resuelve;
- alternativa descartada;
- impacto en datos, UX, algoritmo y permisos;
- documentos que deben actualizarse;
- forma de validarla con usuarios o datos reales.
