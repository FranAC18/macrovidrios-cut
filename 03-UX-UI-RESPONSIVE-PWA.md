# MacroVidrios Cut - UX, UI y responsive/PWA

## 1. Principio de experiencia

La interfaz debe sentirse como una herramienta de trabajo de una vidrieria, no como un ERP industrial. Cada pantalla tiene una accion principal y cada estado termina con una indicacion clara del siguiente paso.

El usuario cotidiano no debe ver `nesting`, `score`, `kerf` o `guillotine` como conceptos obligatorios. Esos conceptos se presentan como configuracion o detalle avanzado.

## 2. Modos de uso

### Administracion

Pensado para PC: pedidos, clientes, catalogos, costos, inventario, historial y analitica. Usa tablas, filtros, paneles laterales y comparacion de datos.

### Supervision

Pensado para tablet y PC: cola, disponibilidad, cuadre, excepciones, aprobacion de soluciones y seguimiento de trabajos.

### Produccion

Pensado para tablet y movil: plano, paso actual, medida, instruccion y botones grandes. Oculta menus administrativos y reduce la navegacion a lo esencial.

## 3. Navegacion responsive

### PC

- sidebar persistente;
- encabezado con contexto, organizacion y usuario;
- tablas con acciones por fila;
- panel de detalle sin perder la lista;
- atajos solo cuando no oculten acciones visibles.

### Tablet

- sidebar colapsable;
- paneles apilables;
- visor y lista de operaciones en columnas cuando el ancho lo permita;
- objetivos tactiles amplios y controles utilizables con guantes cuando sea posible.

### Movil

- barra inferior con `Nuevo corte`, `Pedidos`, `En corte`, `Retazos` e `Historial`;
- acciones secundarias bajo menu o configuracion;
- tarjetas y listas en lugar de tablas anchas;
- filtros en hoja inferior o dialogo a pantalla completa;
- formularios por pasos, una decision importante por pantalla;
- sin hover como requisito;
- confirmaciones para acciones irreversibles.

Los breakpoints deben responder al contenido y probarse en telefonos pequenos, no solo en un movil grande.

## 4. Flujo principal movil

```text
Nuevo corte
  -> Cliente o sin cliente
  -> Vidrio y espesor
  -> Piezas rectangulares
  -> Fuente de material
  -> Pedidos compatibles opcionales
  -> Cuadrar vidrio
  -> Resultado simple
  -> Ver plano
  -> Iniciar corte
  -> Siguiente operacion
  -> Finalizar y registrar retazos
```

El progreso debe ser visible, con posibilidad de volver sin perder datos. Si una etapa no puede continuar, se explica el motivo y la accion correctiva.

## 5. Pantallas del MVP

### Dashboard

Mostrar solo indicadores accionables: pedidos pendientes, trabajos en corte, alertas de material, aprovechamiento reciente y accesos a `Nuevo corte` y `Continuar corte`.

### Pedidos

- lista paginada con estado, cliente, fecha y prioridad;
- busqueda por numero, cliente o referencia;
- detalle con piezas, costo, historial y trabajo relacionado;
- transiciones de estado visibles solo cuando son validas.

### Nuevo pedido

- cliente opcional;
- material visual por color y espesor;
- filas de piezas con ancho, alto y cantidad;
- unidades explicitas y teclado numerico en movil;
- validacion inmediata de rangos y una validacion final en servidor.

### Cuadre

- resumen de piezas y material;
- selector de planchas/retazos/mixto en lenguaje de negocio;
- progreso durante calculo;
- resultado resumido primero;
- detalle avanzado con alternativas, score, cortes y versiones;
- accion primaria `Iniciar corte` solo cuando la solucion este validada y el material reservado.

### Visor de plano

- SVG escalable con zoom y ajuste;
- piezas con codigo, medida y pedido;
- leyenda simple;
- seleccion de una pieza resalta su operacion;
- no depender solo del color: usar codigo, borde, etiqueta o patron.

### Modo de corte

Mostrar:

```text
Trabajo TC-xxxxx
CORTE 03 DE 12
Separar area A
Cortar a 800 mm
[MARCAR COMO REALIZADO]
```

Acciones secundarias: anterior, pausar, reportar problema y ver plano completo. `Reabrir` requiere permiso de supervisor.

### Retazos

- busqueda por color y espesor;
- filtros por ancho/alto y forma;
- estado y ubicacion;
- origen navegable;
- reservar, consumir y descartar con confirmacion;
- advertencia si el retazo esta reservado o cerca de vencer.

## 6. Estados visuales obligatorios

Cada pantalla debe diseñarse para:

- carga inicial;
- carga parcial;
- vacio util con accion;
- error recuperable con instruccion;
- sin permisos;
- sin conexion o reconexion cuando aplique;
- guardado exitoso;
- conflicto de concurrencia;
- accion irreversible.

Los mensajes deben ser humanos. Ejemplo: `El retazo ya fue reservado por otro trabajo. Actualiza la lista para ver material disponible.`

## 7. Eficiencia de interaccion

- preservar borradores locales del wizard ante refresco accidental;
- autosave solo donde la regla sea clara y con indicador visible;
- no usar modales encadenados para el flujo principal;
- permitir duplicar una pieza o pedido frecuente;
- recordar filtros de la misma sesion;
- mostrar unidades junto al campo, no en una ayuda escondida;
- usar teclado numerico en campos de medida/cantidad;
- permitir escaneo o lectura de codigo en una evolucion, no bloquear MVP por ello.

## 8. Accesibilidad y seguridad operacional

- contraste AA como minimo;
- foco visible y orden de teclado;
- etiquetas asociadas a todos los campos;
- mensajes de error junto al campo y resumen accesible;
- targets tactiles de al menos 44 px cuando el dispositivo sea tactil;
- no comunicar estado solo por color;
- texto legible a distancia razonable en modo de corte;
- confirmacion verbal/visual de operacion completada;
- evitar acciones destructivas cerca del boton principal.

## 9. PWA y comportamiento offline

La primera version debe ser instalable y tolerante a cortes breves de red, pero no debe prometer que una operacion critica se completo offline sin confirmacion del servidor.

### Permitido offline

- cargar shell y recursos estables;
- consultar una copia claramente marcada como posiblemente desactualizada;
- conservar un borrador local no sincronizado;
- mostrar la ultima pantalla de produccion como referencia.

### Requiere red y confirmacion

- reservar o consumir material;
- marcar una operacion como completada;
- finalizar un trabajo;
- cambiar costos, permisos o configuracion;
- generar la version oficial de un PDF.

La interfaz debe mostrar estado de conexion, ultima sincronizacion y acciones pendientes. No se implementa sincronizacion compleja hasta validar la necesidad en campo.
