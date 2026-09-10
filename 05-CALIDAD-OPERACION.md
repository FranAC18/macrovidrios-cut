# MacroVidrios Cut - Calidad, seguridad y operacion

## 1. Estrategia de pruebas

### Unitarias

Cubrir dominio, transiciones, calculos de costo, normalizacion y geometria. Son la defensa principal del motor y deben ejecutarse rapido en cada cambio.

### Integracion

Probar repositorios, funciones SQL, RLS, transacciones de reserva, auditoria, almacenamiento y acciones de servidor con base de datos de prueba.

### Componentes

Probar formularios, estados de carga/error/vacio, validaciones accesibles y componentes de plano con fixtures pequenos.

### E2E

Los flujos criticos deben cubrir al menos:

- login y permisos por rol;
- crear cliente y pedido;
- crear piezas y pasar a cola;
- cuadre valido;
- mezcla compatible e incompatibilidad;
- reserva concurrente de un retazo;
- iniciar, pausar y finalizar corte;
- generar PDF;
- registrar retazo y consultar historial.

### Pruebas visuales y responsive

Validar PC, tablet y movil con datos reales anonimizados. Revisar especialmente el visor de plano, botones de produccion, tablas, teclado numerico y mensajes de error.

## 2. CI/CD

En cada pull request:

- instalacion reproducible;
- lint;
- typecheck;
- unitarias;
- integracion critica;
- build;
- auditoria basica de dependencias;
- Playwright smoke en preview cuando sea viable.

No permitir merge con migracion sin prueba, tipos rotos o fallo del motor. Las pruebas largas del dataset completo pueden ejecutarse en un pipeline adicional, pero deben ser obligatorias antes de publicar cambios del optimizador.

## 3. Observabilidad

Registrar con identificadores correlacionables:

- error de aplicacion;
- usuario, organizacion y caso de uso, sin secretos;
- trabajo de corte y version del optimizador;
- duracion y resultado de optimizacion;
- cantidad de candidatos;
- conflictos de reserva;
- cambios manuales;
- PDF generado y fallo de almacenamiento;
- transiciones forzadas.

Metricas iniciales:

- tiempo de respuesta por pantalla critica;
- tasa de errores por caso de uso;
- tiempo p50/p95 de optimizacion;
- porcentaje de trabajos finalizados sin incidencia;
- desperdicio planificado y real cuando exista;
- reservas rechazadas por concurrencia;
- uso de cada version del optimizador.

## 4. Seguridad operacional

- roles definidos por caso de uso, no solo por menu;
- supervisor requerido para reabrir o forzar operaciones;
- cortes finalizados no se borran: se corrigen mediante eventos o ajuste auditado;
- datos de cliente protegidos y minimizados;
- backups y prueba periodica de restauracion;
- PDFs con acceso autorizado y expiracion;
- log de auditoria protegido contra edicion normal;
- sesiones y cookies configuradas con practicas seguras;
- revision manual de politicas RLS antes de produccion.

## 5. Despliegue y soporte

### Antes de produccion

- completar checklist de reglas reales;
- cargar catalogos revisados;
- probar importacion y movimientos iniciales;
- capacitar con el flujo corto, no con toda la administracion;
- configurar alertas y responsables;
- ejecutar un piloto con trabajos reales supervisados;
- definir proceso para incidencias de material y correcciones.

### Publicacion gradual

1. entorno interno con datos sinteticos;
2. piloto con un puesto de trabajo;
3. ampliacion a supervision y ventas;
4. activacion de mas catalogos y casos;
5. revision de metricas y feedback antes de nuevas geometrias.

## 6. Matriz de riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|---|---:|---:|---|
| Algoritmo produce corte no ejecutable | Alta | Muy alto | Validador geometrico, dataset real, aprobacion de supervisor y piloto |
| Dos trabajos reservan el mismo retazo | Media | Alto | Transaccion atomica, RLS y prueba concurrente |
| Reglas de kerf/margen incorrectas | Alta | Alto | Descubrimiento con medicion y configuracion versionada |
| UI movil inutil en produccion | Media | Alto | Diseño movil temprano, prueba en dispositivo y modo simplificado |
| Perdida de trazabilidad | Media | Muy alto | IDs por pieza, snapshots, FK, auditoria y no borrado destructivo |
| Dashboard lento por agregaciones | Media | Medio | Consultas agrupadas, indices, paginacion y cache |
| Dependencia prematura de jobs complejos | Media | Medio | Umbrales medidos y ejecucion sincrona acotada en MVP |
| Cambio de regla rompe historicos | Media | Alto | Version de configuracion y snapshots inmutables |

## 7. Criterios de lanzamiento MVP

El MVP solo se publica cuando:

- el flujo completo de aceptacion pasa en E2E;
- los casos geometricos obligatorios pasan sin invalidaciones;
- RLS impide acceso cruzado entre organizaciones/roles;
- la reserva concurrente fue probada;
- los PDFs coinciden con el snapshot del trabajo;
- no quedan errores tecnicos visibles para el usuario;
- existen backups y procedimiento de restauracion;
- un operador real puede completar un trabajo piloto sin asistencia continua;
- estan documentadas las limitaciones: solo rectangulos, reglas vigentes y comportamiento offline.
