# MacroVidrios Cut - Plan de desarrollo

**Version del plan:** 1.0
**Base:** especificacion maestra v0.1.0
**Estado:** listo para iniciar descubrimiento, no implementado

## 1. Direccion

MacroVidrios Cut sera una web responsive instalable como PWA para gestionar pedidos, inventario, cuadre, produccion y trazabilidad en una vidrieria. El valor principal no es acumular modulos, sino convertir una necesidad de corte en una secuencia clara y ejecutable con menor desperdicio.

El alcance se divide en dos productos coordinados:

- **Administracion:** clientes, pedidos, materiales, costos, historial y configuracion.
- **Operacion:** cuadre, plano, orden de corte, avance y registro de retazos.

El motor de optimizacion se desarrolla desde el principio como biblioteca independiente, con datos de prueba reales, para evitar que el riesgo principal quede para el final.

## 2. Objetivo del MVP

Un usuario autorizado debe poder:

1. crear un cliente o trabajar sin cliente;
2. crear un pedido con piezas rectangulares y cantidades;
3. seleccionar color, espesor, planchas y/o retazos;
4. agrupar pedidos compatibles en un trabajo de corte sin perder identidad;
5. obtener una solucion rectangular valida con rotacion, kerf, margenes y secuencia guillotine;
6. revisar el plano y el desperdicio;
7. iniciar y completar operaciones desde movil o tablet;
8. registrar, reservar y consumir retazos;
9. generar PDF de produccion;
10. consultar historial y trazabilidad.

## 3. Fuera del MVP

No bloquean el primer lanzamiento:

- trapecios, triangulos y poligonos irregulares;
- editor geometrico libre;
- aprendizaje automatico;
- integracion con maquinaria;
- analitica avanzada de rentabilidad;
- comparacion automatica entre plan calculado y corte ejecutado;
- optimizacion asincrona distribuida para cargas grandes;
- aplicacion movil nativa.

## 4. Estrategia de entrega

Se trabajara en rebanadas verticales verificables. Cada rebanada debe atravesar UI, caso de uso, persistencia, permisos, errores y pruebas cuando corresponda. No se construiran pantallas aisladas que luego deban rehacerse al integrar el dominio.

El orden es deliberado:

1. confirmar reglas reales;
2. crear plataforma segura y observable;
3. estabilizar datos y catalogos;
4. entregar pedidos;
5. validar el optimizador rectangular fuera de la UI;
6. integrar retazos y concurrencia;
7. completar produccion y PDF;
8. ampliar geometrias solo cuando el rectangulo sea confiable.

## 5. Fases y criterios de salida

### Fase 0 - Descubrimiento operativo

**Objetivo:** convertir supuestos del documento en reglas verificadas.

**Entregables:**

- entrevista y mapa del flujo real;
- fotos o muestras de formatos y herramientas;
- tabla de materiales, espesores, kerf, margenes y rotaciones;
- ejemplos anonimizados de pedidos y cortes;
- formula de costos y politica de inventario;
- matriz de permisos por puesto;
- dataset de aceptacion firmado por el negocio;
- decision sobre red, dispositivos y uso offline.

**Salida:** ninguna regla critica permanece como supuesto sin propietario o fecha de validacion.

### Fase 1 - Fundacion de plataforma

**Objetivo:** disponer de una base desplegable, segura y mantenible.

**Entregables:**

- Next.js + TypeScript configurado;
- Tailwind y componentes base accesibles;
- Supabase local/proyecto y migraciones;
- autenticacion y perfiles;
- frontera de organizacion/empresa y RLS;
- layout desktop y navegacion movil;
- manejo uniforme de carga, error y vacio;
- variables de entorno separadas por ambiente;
- lint, formato, typecheck, pruebas y CI;
- manifest PWA e iconos.

**Salida:** un usuario puede iniciar sesion, ver una pantalla protegida y cerrar sesion en local y preview, con RLS probado.

### Fase 2 - Catalogos, clientes e inventario base

**Objetivo:** crear datos confiables para todas las fases posteriores.

**Entregables:**

- clientes con busqueda y archivado;
- colores, espesores, productos y formatos de plancha;
- existencias de planchas y costos;
- historial de movimientos de inventario;
- importacion inicial controlada y datos de prueba;
- formularios con unidades y rangos validos.

**Salida:** se pueden administrar catalogos sin duplicados, con permisos y auditoria de cambios relevantes.

### Fase 3 - Pedidos y piezas rectangulares

**Objetivo:** capturar la demanda sin obligar al usuario a conocer el algoritmo.

**Entregables:**

- crear y editar pedidos;
- piezas con ancho, alto, cantidad y producto;
- expansion de cantidades a piezas trazables cuando se cree el trabajo;
- estados y transiciones validas;
- costos basicos con desglose;
- cola de produccion filtrable.

**Salida:** un pedido puede pasar de borrador a pendiente/cola y cada pieza conserva un codigo unico.

### Fase 4 - Motor rectangular independiente

**Objetivo:** obtener soluciones validas, deterministas y medibles.

**Entregables:**

- tipos de entrada/salida versionados;
- normalizacion de medidas;
- validacion geometrica;
- colocacion heuristica con rotacion;
- particionamiento guillotine;
- score configurable;
- calculo de desperdicio y costo;
- candidatos alternativos;
- dataset y benchmarks;
- CLI o runner de laboratorio para reproducir casos.

**Salida:** todos los casos MVP pasan validacion geometrica y el mismo input/configuracion produce el mismo resultado.

### Fase 5 - Cuadre integrado y retazos

**Objetivo:** reservar material real sin carreras entre usuarios.

**Entregables:**

- wizard de cuadre;
- estrategias planchas, retazos y mixto;
- banco de retazos con filtros;
- reserva atomica con expiracion o liberacion explicita;
- consumo y descarte;
- generacion manual y confirmacion de retazos sobrantes;
- snapshots de inventario usados en cada cuadre.

**Salida:** dos usuarios no pueden consumir el mismo retazo y un fallo de disponibilidad no deja un trabajo parcialmente reservado.

### Fase 6 - Mezcla de pedidos y trazabilidad

**Objetivo:** optimizar conjuntamente sin fusionar la administracion.

**Entregables:**

- sugerencia y seleccion de pedidos compatibles;
- trabajo de corte multi-pedido;
- trazabilidad pieza -> pedido -> trabajo -> layout -> operacion;
- bloqueo de incompatibilidades;
- auditoria de cambios manuales del cuadre.

**Salida:** un trabajo mixto conserva costos, estados e identidad de cada pedido y pieza.

### Fase 7 - Produccion, PDF e historial

**Objetivo:** llevar el plano al puesto de trabajo.

**Entregables:**

- modo cortador sin distracciones;
- operaciones siguiente/anterior/pausa/problema;
- permisos para reabrir o forzar;
- PDF imprimible y PDF digital;
- confirmacion de retazos al finalizar;
- historial de trabajos y pedidos;
- dashboard inicial.

**Salida:** el flujo completo desde pedido hasta finalizacion se puede ejecutar con un caso real y queda auditable.

### Fase 8 - Geometrias especiales

**Objetivo:** extender valor sin contaminar el nucleo rectangular.

**Orden:** trapecios, triangulos y luego poligonos personalizados.

Cada geometria requiere contrato, normalizacion, validacion, visualizacion, algoritmo y dataset propios. No se habilita en produccion solo por dibujarla en pantalla.

### Fase 9 - Analitica y mejora continua

**Objetivo:** aprender de cortes reales y modificaciones humanas.

**Entregables:**

- eficiencia por periodo/material/usuario;
- desviacion entre plan y ejecucion;
- analisis de desperdicio;
- comparacion de soluciones;
- alertas de stock;
- versionado y evaluacion de nuevas heuristicas.

## 6. Dependencias criticas

| Dependencia | Bloquea |
|---|---|
| Reglas reales de kerf, margen y rotacion | Motor y aceptacion del cuadre |
| Modelo de organizacion y roles | RLS y todas las pantallas protegidas |
| Catalogo de material | Pedidos, retazos, costos y optimizacion |
| Contrato del motor | Layouts, operaciones y PDF |
| Reserva atomica | Uso de retazos y cierre de cuadre |
| Dataset real | Validacion del algoritmo y UX |
| Formula de precios | Cotizacion y totales auditables |

## 7. Definition of Done

Una tarea se considera terminada cuando:

- cumple el caso de uso y sus restricciones de negocio;
- tiene validacion de servidor;
- contempla carga, vacio, error y permisos;
- tiene pruebas adecuadas a su riesgo;
- no introduce unidades ambiguas ni dinero flotante;
- es usable en el viewport objetivo;
- no deja logs sensibles;
- la documentacion y el backlog reflejan la decision final.

## 8. Riesgos que deben gestionarse desde el inicio

1. **Algoritmo valido pero impracticable:** medir facilidad de corte, no solo porcentaje de uso.
2. **Retazos duplicados o consumidos dos veces:** transacciones y restricciones en base de datos.
3. **Modelo de datos insuficiente:** usar movimientos, snapshots y auditoria, no solo campos mutables.
4. **Responsive como adaptacion tardia:** diseñar primero los flujos movil/tablet de produccion.
5. **Errores de reglas reales:** fase de descubrimiento obligatoria y dataset firmado.
6. **Complejidad prematura:** no activar geometria especial, jobs o analitica avanzada antes del criterio de salida.
