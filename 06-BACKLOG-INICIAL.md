# MacroVidrios Cut - Backlog inicial

**Convencion:** `[ ]` pendiente, `[~]` parcial, `[x]` completado
**Estado actual:** aplicacion Next.js funcional con motor rectangular, dominio, capa de datos en memoria, UI responsive y PWA. Supabase queda preparado por migracion SQL, pendiente de provisionar proyecto.
**Ultima actualizacion:** 2026-09-10

> Nota: los valores de negocio (kerf, margen, formatos, precios) siguen siendo de desarrollo. No son definitivos hasta cerrar Fase 0.

## Fase 0 - Descubrimiento

- [ ] `DISC-001` Confirmar formatos reales de plancha y unidades de compra.
- [ ] `DISC-002` Medir kerf, margen perimetral y separacion por proceso.
- [ ] `DISC-003` Documentar rotacion permitida y restricciones de seguridad.
- [ ] `DISC-004` Recopilar al menos 20 pedidos y cortes anonimizados.
- [ ] `DISC-005` Confirmar umbral de retazo aprovechable y ubicaciones.
- [ ] `DISC-006` Confirmar formula de costos y servicios adicionales.
- [ ] `DISC-007` Validar roles, puestos, dispositivos y conectividad del taller.
- [ ] `DISC-008` Firmar dataset de aceptacion del optimizador.

## Fase 1 - Plataforma

- [x] `PLAT-001` Proyecto Next.js TypeScript con App Router.
- [x] `PLAT-002` Lint, formato, typecheck, Vitest y Playwright configurados.
- [~] `PLAT-003` Supabase: migracion SQL y seed sintetico listos; falta provisionar proyecto y aplicar migraciones.
- [x] `PLAT-004` Organizacion, perfiles y roles iniciales (admin, supervisor, vendedor, cortador).
- [x] `PLAT-005` Auth y rutas protegidas (modo demo con cookie de sesion; Supabase Auth pendiente).
- [x] `PLAT-006` Layout desktop, tablet y movil (sidebar + barra inferior).
- [x] `PLAT-007` Estados UI de carga, error, vacio y sin permisos.
- [~] `PLAT-008` CI en `.github/workflows/ci.yml`; preview deploy pendiente.
- [x] `PLAT-009` Manifest PWA, iconos y service worker con cache de shell.

## Fase 2 - Datos

- [x] `DATA-001` Clientes con busqueda y archivado.
- [x] `DATA-002` Colores, espesores y productos (combinacion color + espesor).
- [x] `DATA-003` Formatos y existencias de plancha.
- [x] `DATA-004` Movimientos de inventario (entrada, reserva, consumo, liberacion, descarte).
- [~] `DATA-005` Reglas y snapshots de configuracion: reglas de precio y version de optimizador guardadas; snapshot completo por trabajo pendiente.
- [~] `DATA-006` Auditoria y RLS: `audit_logs` y politicas RLS escritas; falta probar contra base de datos real.
- [x] `DATA-007` Indices y fixtures de consulta.

## Fase 3 - Pedidos

- [x] `ORDER-001` Crear pedido con cliente opcional.
- [x] `ORDER-002` Crear piezas rectangulares y cantidades.
- [x] `ORDER-003` Estados y transiciones validas.
- [x] `ORDER-004` Codigos de pieza trazables (`PZ-0001`).
- [x] `ORDER-005` Costo basico con desglose (material + corte).
- [x] `ORDER-006` Cola de produccion filtrable.
- [~] `ORDER-007` E2E cubre login, proteccion y cuadre completo; falta E2E dedicado de alta de pedido.

## Fase 4 - Optimizador

- [x] `OPT-001` Tipos versionados del contrato.
- [x] `OPT-002` Normalizacion y prechequeos.
- [x] `OPT-003` Validacion de rectangulos.
- [x] `OPT-004` Rotacion y colocacion heuristica.
- [x] `OPT-005` Particionamiento guillotine.
- [x] `OPT-006` Score configurable.
- [x] `OPT-007` Secuencia de operaciones.
- [x] `OPT-008` Alternativas y metricas.
- [x] `OPT-009` CLI/runner reproducible (`npm run optimizer`).
- [~] `OPT-010` Benchmark con fixtures; falta dataset real firmado.
- [x] `OPT-011` Invariantes y casos imposibles (21 pruebas).

## Fase 5 y 6 - Cuadre y retazos

- [x] `CUT-001` Wizard de cuadre en 3 pasos.
- [x] `CUT-002` Resultado y visor SVG.
- [x] `CUT-003` Trabajos de corte y snapshots de geometria.
- [x] `CUT-004` Reservas atomicas de material (con expiracion y liberacion).
- [x] `CUT-005` Banco de retazos con filtros.
- [x] `CUT-006` Consumo, descarte y liberacion.
- [~] `CUT-007` Bloqueo de materiales incompatibles; falta sugerencia automatica de agrupacion.
- [x] `CUT-008` Trazabilidad multi-pedido.
- [~] `CUT-009` Auditoria de creacion/cancelacion; falta auditoria de cambios manuales de layout.
- [x] `CUT-010` Prueba de concurrencia de retazos.

## Fase 7 - Produccion y documentos

- [x] `PROD-001` Lista de operaciones.
- [x] `PROD-002` Modo de corte movil/tablet con botones grandes.
- [x] `PROD-003` Siguiente, anterior, pausa y finalizacion.
- [~] `PROD-004` Forzar finalizacion con permiso; falta reapertura de operacion.
- [ ] `PROD-005` PDF de impresion dedicado (hoy existe visor SVG imprimible).
- [ ] `PROD-006` PDF digital dedicado.
- [x] `PROD-007` Registro de retazos al finalizar.
- [~] `PROD-008` Historial y dashboard inicial; falta dashboard avanzado.
- [ ] `PROD-009` Piloto con datos reales anonimizados.

## Evolucion posterior

- [ ] `GEO-001` Trapecios.
- [ ] `GEO-002` Triangulos.
- [ ] `GEO-003` Editor visual.
- [ ] `GEO-004` Poligonos irregulares.
- [ ] `AN-001` Analitica avanzada y alertas.
- [ ] `AN-002` Comparacion planificado vs ejecutado.
- [ ] `AN-003` Evaluacion de heuristicas con historial real.

## Siguiente trabajo recomendado

1. Provisionar Supabase, aplicar `supabase/migrations/0001_initial_schema.sql` y reemplazar el repositorio en memoria por el adaptador Supabase.
2. Generar PDF de produccion desde el snapshot del trabajo.
3. Completar sugerencia de agrupacion de pedidos y auditoria de cambios manuales.
4. Cerrar Fase 0 para sustituir valores de desarrollo por reglas reales.
