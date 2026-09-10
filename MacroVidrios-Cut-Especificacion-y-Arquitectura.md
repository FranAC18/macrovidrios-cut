# MACROVIDRIOS CUT
## Documento maestro de especificaciones, arquitectura y roadmap

**Versión:** 0.1.0
**Estado:** Diseño / Especificación inicial
**Proyecto:** MacroVidrios Cut
**Empresa:** MacroVidrios
**Tipo:** Aplicación web responsive + PWA
**Idioma inicial:** Español
**Zona horaria inicial:** America/Guayaquil

---

# 1. Resumen ejecutivo

MacroVidrios Cut será una aplicación orientada a pequeñas y medianas vidrierías que permita gestionar pedidos, clientes, inventario de planchas y retazos, optimizar cortes de vidrio, generar planos y órdenes de corte, controlar la ejecución de los cortes, calcular costos y mantener un historial completo.

La prioridad del producto no será ofrecer la mayor cantidad de funciones visibles, sino ofrecer una experiencia extremadamente sencilla. La complejidad matemática y operativa deberá estar dentro del sistema, evitando que el usuario tenga que comprender conceptos técnicos de optimización.

### Principio principal del producto

> El usuario indica qué necesita cortar; MacroVidrios Cut calcula cómo aprovechar mejor el material y guía al operario paso a paso.

### Objetivo empresarial

Reducir desperdicio de vidrio, reducir tiempo de planificación, disminuir errores de corte y facilitar el control de pedidos y costos sin exigir conocimientos técnicos avanzados al personal.

---

# 2. Nivel de dificultad

## Clasificación general: ALTA — 8.5/10

El proyecto se divide en componentes de dificultad muy diferente.

| Componente | Dificultad | Motivo |
|---|---:|---|
| Autenticación y usuarios | 3/10 | Funcionalidad estándar |
| Clientes | 2/10 | CRUD convencional |
| Pedidos | 4/10 | Reglas de negocio y estados |
| Inventario de planchas | 4/10 | Stock, estados y trazabilidad |
| Inventario de retazos | 6/10 | Compatibilidad geométrica y trazabilidad |
| Costos | 5/10 | Reglas configurables |
| PDF | 5/10 | Maquetación del plano y producción |
| Dashboard | 4/10 | Agregaciones y métricas |
| Cuadre rectangular | 7/10 | Optimización combinatoria |
| Guillotine cutting / secuencia | 8/10 | Restricciones de corte y orden operativo |
| Trapecios / triángulos | 8/10 | Geometría computacional |
| Polígonos irregulares | 9/10 | Nesting 2D y restricciones geométricas |
| Optimización mixta plancha + retazos | 9/10 | Problema de asignación + nesting |
| Mezcla de pedidos | 7/10 | Compatibilidad y trazabilidad |
| UX extremadamente simple | 8/10 | Requiere diseño, pruebas e iteración |
| Responsive/PWA | 4/10 | Tecnología conocida, requiere cuidado de UX |

## 2.1 Riesgo técnico principal

El mayor riesgo del proyecto no está en Supabase, Next.js, autenticación ni CRUD.

El mayor riesgo es construir un motor de optimización que produzca soluciones:

1. geométricamente válidas;
2. eficientes en uso de material;
3. compatibles con las reglas reales de corte;
4. fáciles de ejecutar por un operario;
5. suficientemente rápidas para el uso diario;
6. reproducibles y auditables.

Por ello, el motor de optimización deberá ser diseñado y validado como un subsistema independiente.

---

# 3. Visión del producto

## 3.1 Propuesta de valor

MacroVidrios Cut debe diferenciarse de software industrial complejo mediante una experiencia orientada a la realidad de una vidriería pequeña.

### Mensaje del producto

**MacroVidrios Cut — Corta mejor. Desperdicia menos.**

### Promesa de UX

> Ninguna función cotidiana debe requerir conocimientos técnicos de optimización.

---

# 4. Principios de diseño

## UX-01 — Simplicidad

El usuario debe entender qué hacer sin leer un manual.

## UX-02 — La aplicación calcula por el usuario

Si un dato puede determinarse automáticamente a partir de configuración o contexto, no debe solicitarse manualmente cada vez.

## UX-03 — Una acción principal por pantalla

Cada pantalla debe tener una acción primaria clara.

## UX-04 — Lenguaje de vidriería

Evitar terminología innecesariamente técnica frente al usuario operativo.

Ejemplo:

- Preferir "Cuadrar vidrio" frente a "Ejecutar nesting".
- Preferir "Plancha + retazos" frente a "optimización híbrida de inventario".

## UX-05 — Complejidad oculta

Kerf, márgenes, rotaciones, heurísticas, score de optimización y reglas deben gestionarse en configuración.

## UX-06 — Siempre indicar el siguiente paso

El usuario debe saber qué hacer a continuación.

## UX-07 — Producción sin distracciones

El modo de corte debe mostrar solamente lo necesario para realizar el corte.

## UX-08 — Trazabilidad total

Una pieza cortada debe poder rastrearse hasta su pedido y hasta el trabajo de corte que la procesó.

---

# 5. Alcance funcional

## 5.1 Módulos

1. Dashboard
2. Clientes
3. Pedidos
4. Catálogo de vidrios
5. Inventario de planchas
6. Banco de retazos
7. Cuadre / Optimización
8. Producción / Corte
9. Costos
10. PDF / Documentos
11. Historial
12. Usuarios y permisos
13. Configuración
14. Auditoría

---

# 6. Flujo principal del negocio

```text
CLIENTE
   ↓
PEDIDO
   ↓
PIEZAS
   ↓
COLA DE PRODUCCIÓN
   ↓
SELECCIÓN DE UNO O VARIOS PEDIDOS
   ↓
SELECCIÓN DE MATERIAL
   ├── Planchas
   ├── Retazos
   └── Planchas + retazos
   ↓
MOTOR DE OPTIMIZACIÓN
   ↓
CUADRE
   ↓
ORDEN DE CORTE
   ↓
EJECUCIÓN
   ↓
RETazos GENERADOS
   ↓
FINALIZACIÓN
   ↓
HISTORIAL
```

---

# 7. Arquitectura tecnológica propuesta

## 7.1 Stack principal

| Capa | Tecnología | Propósito |
|---|---|---|
| Frontend | Next.js + React + TypeScript | Aplicación web |
| UI | Tailwind CSS + shadcn/ui | Interfaz |
| Backend | Next.js Server Actions / Route Handlers | Lógica de aplicación |
| DB | Supabase PostgreSQL | Persistencia |
| Auth | Supabase Auth | Autenticación |
| Storage | Supabase Storage | PDFs y archivos |
| Validación | Zod | Validación de entradas |
| Formularios | React Hook Form | Formularios |
| Visualización | SVG + Canvas/Konva según necesidad | Planos y editor geométrico |
| PDF | React-PDF | Documentos |
| Testing | Vitest + Playwright | Pruebas unitarias y E2E |
| Deploy | Vercel | Hosting |
| Distribución móvil | PWA | Experiencia instalable en Android |

## 7.2 Decisión de plataforma

La primera versión será una **web responsive/PWA**, no Android nativo.

### Motivos

- un único código base;
- menor costo de mantenimiento;
- uso desde PC, tablet y celular;
- instalación como PWA en Android;
- despliegue natural en Vercel;
- facilidad para evolucionar a aplicaciones nativas posteriormente si fuera necesario.

## 7.3 Arquitectura lógica

```text
┌──────────────────────────────────────────────┐
│              MACROVIDRIOS CUT                │
├──────────────────────────────────────────────┤
│ Next.js / React / TypeScript                  │
│ UI + navegación + formularios + PWA          │
├──────────────────────────────────────────────┤
│ Aplicación / dominio                          │
│ Pedidos | Clientes | Inventario | Producción  │
├──────────────────────────────────────────────┤
│ Motor de optimización                         │
│ Geometría | Nesting | Guillotine | Score      │
├──────────────────────────────────────────────┤
│ Supabase                                      │
│ PostgreSQL | Auth | Storage | RLS             │
├──────────────────────────────────────────────┤
│ Vercel                                        │
└──────────────────────────────────────────────┘
```

---

# 8. Arquitectura de software

Se recomienda separar claramente:

## 8.1 UI

Componentes visuales y navegación.

## 8.2 Aplicación

Casos de uso, por ejemplo:

- Crear pedido.
- Crear cuadre.
- Optimizar cuadre.
- Confirmar trabajo de corte.
- Finalizar corte.
- Registrar retazo.
- Calcular cotización.

## 8.3 Dominio

Reglas del negocio:

- compatibilidad entre material y pieza;
- estados de pedido;
- reglas de costos;
- estados de retazos;
- restricciones de corte.

## 8.4 Infraestructura

- Supabase;
- almacenamiento;
- PDF;
- logging;
- autenticación.

## 8.5 Motor de optimización

Debe ser una biblioteca desacoplada del frontend.

Propuesta:

```text
/lib
  /optimization
    geometry.ts
    normalize.ts
    placement.ts
    guillotine.ts
    scoring.ts
    sheets.ts
    remnants.ts
    irregular.ts
    scheduler.ts
    optimizer.ts
    types.ts
```

El motor debe recibir entradas estructuradas y devolver resultados deterministas y auditables.

---

# 9. Arquitectura de dominio

## Entidades principales

```text
Customer
Order
OrderItem
Piece
GlassProduct
GlassColor
GlassThickness
Sheet
Remnant
CuttingJob
CuttingJobOrder
CuttingLayout
CuttingArea
CuttingOperation
PricingRule
AdditionalService
PdfDocument
UserProfile
AuditLog
```

---

# 10. Modelo de datos inicial

## 10.1 customers

Campos propuestos:

- id
- full_name
- identification_number nullable
- phone nullable
- whatsapp nullable
- email nullable
- address nullable
- notes nullable
- active
- created_at
- updated_at

## 10.2 glass_colors

- id
- name
- code
- display_order
- active
- created_at
- updated_at

Ejemplos:

- Claro
- Bronce
- Verde
- Negro
- Espejo
- Gris
- Azul

## 10.3 glass_thicknesses

- id
- thickness_mm
- active

## 10.4 glass_products

Representa una combinación válida de color + espesor.

- id
- color_id
- thickness_id
- internal_code
- name
- default_kerf_mm nullable
- default_margin_mm nullable
- default_edge_margin_mm nullable
- active
- created_at
- updated_at

## 10.5 sheet_types

Representa formatos de plancha comercial.

- id
- name
- width_mm
- height_mm
- default_cost
- minimum_usable_area_mm2 nullable
- active

## 10.6 inventory_sheets

Existencias físicas de planchas.

- id
- sheet_type_id
- glass_product_id
- quantity
- unit_cost
- status
- location nullable
- batch_reference nullable
- created_at
- updated_at

## 10.7 remnants

Inventario de retazos.

- id
- glass_product_id
- width_mm
- height_mm
- shape_type
- geometry_json nullable
- quantity
- minimum_usable_flag
- status
- source_cutting_job_id nullable
- source_layout_id nullable
- location nullable
- notes nullable
- created_at
- updated_at

Estados mínimos:

- available
- reserved
- consumed
- discarded

## 10.8 orders

- id
- order_number
- customer_id nullable
- status
- requested_at
- due_at nullable
- reference nullable
- notes nullable
- subtotal
- discount
- total
- created_by
- created_at
- updated_at
- completed_at nullable

Estados iniciales:

- draft
- pending
- queued
- in_progress
- completed
- cancelled

## 10.9 order_items

- id
- order_id
- glass_product_id
- name nullable
- piece_type
- quantity
- width_mm nullable
- height_mm nullable
- geometry_json nullable
- notes nullable
- status
- created_at
- updated_at

## 10.10 pieces

Debe existir una identificación individual cuando la trazabilidad requiera controlar cada pieza.

- id
- order_item_id
- sequence_number
- piece_code
- quantity_index
- geometry_type
- geometry_json
- requested_width_mm nullable
- requested_height_mm nullable
- area_mm2
- status
- cutting_job_id nullable
- cutting_operation_id nullable
- cut_at nullable

## 10.11 cutting_jobs

Es el concepto clave que permite mezclar pedidos sin fusionarlos.

- id
- job_number
- status
- material_strategy
- optimizer_version
- requested_at
- started_at nullable
- completed_at nullable
- total_sheet_area_mm2
- total_used_area_mm2
- total_waste_area_mm2
- utilization_percent
- waste_percent
- total_material_cost
- total_cutting_cost
- total_job_cost
- notes nullable
- created_by
- completed_by nullable

Estados:

- draft
- optimizing
- optimized
- ready
- in_progress
- completed
- cancelled

## 10.12 cutting_job_orders

Tabla puente entre trabajos y pedidos.

- cutting_job_id
- order_id
- created_at

Un mismo trabajo puede contener varios pedidos.

## 10.13 cutting_layouts

Representa una solución de cuadre.

- id
- cutting_job_id
- sequence_number
- material_type
- inventory_sheet_id nullable
- remnant_id nullable
- width_mm
- height_mm
- utilization_percent
- waste_percent
- geometry_json
- score
- is_selected
- optimizer_version
- created_at

## 10.14 cutting_areas

Representa las áreas/subáreas de corte.

- id
- cutting_layout_id
- parent_area_id nullable
- sequence_number
- x_mm
- y_mm
- width_mm
- height_mm
- geometry_json nullable
- area_type
- created_at

## 10.15 cutting_operations

Representa el orden real de corte.

- id
- cutting_layout_id
- sequence_number
- operation_type
- target_area_id nullable
- target_piece_id nullable
- axis nullable
- position_mm nullable
- cut_length_mm nullable
- instruction
- status
- completed_at nullable
- completed_by nullable

Estados:

- pending
- in_progress
- completed
- skipped
- issue

## 10.16 pricing_rules

- id
- name
- rule_type
- parameter_json
- priority
- active
- created_at
- updated_at

Tipos posibles:

- per_piece
- per_linear_meter
- per_square_meter
- per_cut
- fixed
- formula

## 10.17 additional_services

- id
- name
- unit_type
- unit_price
- active

Ejemplos:

- corte;
- mano de obra;
- perforación;
- pulido;
- biselado;
- transporte;
- instalación;
- otros.

## 10.18 audit_logs

- id
- user_id
- entity_type
- entity_id
- action
- previous_data_json nullable
- new_data_json nullable
- created_at

---

# 11. Estados y ciclo de vida

## 11.1 Pedido

```text
BORRADOR
   ↓
PENDIENTE
   ↓
EN COLA
   ↓
EN CORTE
   ↓
COMPLETADO
```

Puede existir cancelación desde estados permitidos.

## 11.2 Trabajo de corte

```text
BORRADOR
   ↓
OPTIMIZANDO
   ↓
OPTIMIZADO
   ↓
LISTO PARA CORTAR
   ↓
EN CORTE
   ↓
COMPLETADO
```

## 11.3 Retazo

```text
DISPONIBLE
   ↓
RESERVADO
   ↓
UTILIZADO
```

o:

```text
DISPONIBLE → DESCARTADO
```

---

# 12. Regla de mezcla de pedidos

Los pedidos nunca se fusionan administrativamente.

Se pueden asociar a un mismo **Trabajo de Corte**.

Ejemplo:

```text
Pedido MV-00231 ─┐
                 ├── Trabajo TC-00128
Pedido MV-00234 ─┤
                 │
Pedido MV-00238 ─┘
```

Esto permite optimizar material de forma conjunta y conservar trazabilidad individual.

## 12.1 Reglas de compatibilidad

Dos o más pedidos se pueden mezclar únicamente si las piezas son compatibles con la misma familia de material.

Como mínimo deben coincidir:

- color;
- espesor;
- características relevantes del material;
- reglas de corte incompatibles no deben mezclarse.

## 12.2 Experiencia de usuario

El sistema debe sugerir agrupaciones compatibles, por ejemplo:

> Hay 3 pedidos pendientes de Claro 6 mm. Puedes optimizarlos juntos.

El usuario podrá aceptar, rechazar o seleccionar manualmente pedidos.

---

# 13. Sistema de retazos

## 13.1 Objetivo

Aprovechar material sobrante antes de consumir una plancha nueva.

## 13.2 Registro manual

Al finalizar un trabajo:

> ¿Quedaron retazos aprovechables?

Opciones:

- No
- Sí

Si es sí:

- color/material heredado;
- espesor heredado;
- ancho;
- alto;
- cantidad;
- forma;
- ubicación opcional.

## 13.3 Registro automático opcional

El algoritmo puede identificar sobrantes candidatos a retazo.

No debe convertir automáticamente todos los sobrantes en retazos.

Debe utilizar criterios configurables, por ejemplo:

- área mínima;
- ancho mínimo;
- alto mínimo;
- forma mínima aprovechable.

## 13.4 Banco de retazos

Debe permitir:

- buscar;
- filtrar por color;
- filtrar por espesor;
- filtrar por dimensiones;
- ver estado;
- reservar;
- consumir;
- descartar;
- ver origen.

## 13.5 Trazabilidad

Todo retazo generado por un corte debe guardar:

- trabajo de corte de origen;
- cuadre de origen;
- fecha;
- usuario;
- material.

---

# 14. Estrategias de material

El cuadre permitirá:

### Opción A — Solo planchas

Usar únicamente planchas nuevas.

### Opción B — Solo retazos

Usar únicamente retazos compatibles.

### Opción C — Planchas + retazos

Permitir que el optimizador determine la mejor combinación.

La opción C será una característica estratégica del producto.

---

# 15. Motor de optimización

## 15.1 Entrada

El motor debe recibir:

- piezas;
- geometría;
- cantidades;
- material;
- dimensiones de planchas;
- stock;
- retazos disponibles;
- kerf;
- márgenes;
- reglas de rotación;
- reglas de corte;
- prioridades de optimización.

## 15.2 Salida

Debe devolver:

- materiales utilizados;
- distribución de piezas;
- coordenadas;
- rotación;
- áreas;
- subáreas;
- operaciones de corte;
- desperdicio;
- aprovechamiento;
- score;
- costo de material;
- candidatos alternativos;
- versión del algoritmo.

---

# 16. Estrategia del algoritmo

No depender de un único algoritmo.

## 16.1 Rectángulos

Primera etapa:

- normalización;
- rotación;
- ordenamiento de piezas;
- colocación heurística;
- guillotine partitioning;
- evaluación de candidatos.

## 16.2 Guillotine cutting

La solución debe representar cortes sucesivos capaces de ejecutarse mediante divisiones rectas.

Ejemplo conceptual:

```text
PLANCHA
├── CORTE PRINCIPAL
│   ├── ÁREA A
│   │   ├── PIEZA 1
│   │   └── PIEZA 2
│   └── ÁREA B
│       ├── PIEZA 3
│       └── PIEZA 4
```

## 16.3 Función de score

El score debe considerar al menos:

```text
Eficiencia material
+
Facilidad de corte
+
Número de operaciones
+
Compatibilidad con reglas
```

Los pesos deben ser configurables.

Una configuración inicial sugerida:

- 70% aprovechamiento material;
- 20% facilidad de corte;
- 10% cantidad de operaciones.

Estos pesos son una hipótesis inicial y deberán validarse con datos reales de MacroVidrios.

---

# 17. Geometrías

## Nivel 1 — Rectángulo

Obligatorio para MVP.

## Nivel 2 — Trapecio

Primera geometría no rectangular.

## Nivel 3 — Triángulo

## Nivel 4 — Polígono personalizado

El editor debe permitir definir puntos o dibujar visualmente.

Cada geometría deberá guardar una representación normalizada.

---

# 18. Unidades y precisión

Unidad interna principal:

**milímetros (mm)** para dimensiones.

Área interna:

**mm²**, con presentación convertida a **m²**.

Dinero:

**centavos enteros** o representación decimal segura, evitando errores de punto flotante.

Porcentajes:

mostrar normalmente con 1 o 2 decimales.

---

# 19. Kerf y márgenes

El sistema debe contemplar:

- kerf del proceso de corte;
- margen perimetral;
- separación mínima entre piezas;
- restricciones específicas por material.

Estos datos deben configurarse una vez y heredarse automáticamente.

El usuario operativo no debe introducirlos en cada cuadre.

---

# 20. UX del flujo de cuadre

## Paso 1 — Cliente

Seleccionar cliente o continuar sin cliente.

## Paso 2 — Material

Seleccionar visualmente:

- Claro;
- Bronce;
- Verde;
- Negro;
- Espejo;
- Otros.

Después seleccionar espesor.

## Paso 3 — Piezas

Entrada simple:

```text
Ancho × Alto × Cantidad
```

## Paso 4 — Piezas especiales

Seleccionar:

- rectangular;
- trapecio;
- triángulo;
- forma especial.

## Paso 5 — Fuente de material

```text
○ Planchas
○ Retazos
○ Planchas + retazos
```

## Paso 6 — Pedidos relacionados

El sistema puede sugerir pedidos compatibles para optimización conjunta.

## Paso 7 — Optimizar

Botón principal:

**CUADRAR VIDRIO**

## Paso 8 — Resultado

Mostrar inicialmente solo:

- aprovechamiento;
- desperdicio;
- material requerido;
- cantidad de planchas;
- retazos utilizados.

## Paso 9 — Ver cuadre

Plano visual + piezas identificadas.

## Paso 10 — Iniciar corte

Crear las operaciones de producción.

---

# 21. Modo de producción

El modo de producción debe ser diferente del modo administrativo.

Debe mostrar:

- trabajo;
- paso actual;
- plano;
- instrucción;
- medida;
- botón grande para marcar completado.

Ejemplo:

```text
CORTE 03 DE 12

Separar área A

Cortar a 800 mm

[ YA CORTADO ]
```

Debe soportar:

- siguiente;
- anterior;
- pausa;
- problema;
- reabrir operación con permisos adecuados.

---

# 22. Costos

## 22.1 Material

Costo de la plancha o costo asignado al retazo.

## 22.2 Corte

Configuración por:

- pieza;
- corte;
- metro lineal;
- m²;
- fijo;
- fórmula combinada.

## 22.3 Otros servicios

- mano de obra;
- perforación;
- pulido;
- biselado;
- transporte;
- instalación;
- otros.

## 22.4 Fórmula conceptual

```text
TOTAL = MATERIAL + CORTE + SERVICIOS + MANO DE OBRA - DESCUENTO
```

El motor de precios debe guardar cómo se llegó al total para permitir auditoría.

---

# 23. PDF de producción

Cada trabajo de corte seleccionado debe poder generar un PDF.

Contenido mínimo:

1. encabezado MacroVidrios;
2. pedido(s);
3. cliente(s);
4. material;
5. plancha/retazo;
6. plano;
7. piezas y códigos;
8. medidas;
9. porcentaje de aprovechamiento;
10. desperdicio;
11. orden de corte;
12. casillas de verificación;
13. fecha;
14. identificador del trabajo.

Debe existir una versión optimizada para impresión y otra usable digitalmente.

---

# 24. Dashboard

Indicadores iniciales:

- pedidos pendientes;
- trabajos en corte;
- trabajos completados;
- planchas utilizadas;
- m² cortados;
- m² desperdiciados;
- aprovechamiento promedio;
- porcentaje de desperdicio;
- costos de material;
- costos de corte.

## Métricas históricas

Permitir análisis por:

- período;
- color;
- espesor;
- usuario;
- tipo de material;
- pedido;
- trabajo de corte.

---

# 25. Roles y permisos

## Administrador

Acceso total.

## Supervisor

Pedidos, clientes, producción, inventario, reportes y configuración operativa.

## Vendedor

Clientes, pedidos, cotizaciones y consulta de materiales.

## Cortador

Trabajos asignados, planos, secuencia y actualización del estado de corte.

El acceso a datos debe estar reforzado con RLS de Supabase.

---

# 26. Seguridad

Requisitos:

- Supabase Auth;
- sesiones seguras;
- RLS activado en tablas expuestas;
- políticas por rol;
- validación de servidor;
- no confiar en validaciones del cliente;
- auditoría de cambios críticos;
- control de acceso a PDFs;
- separación entre datos públicos y privados.

---

# 27. Responsive / PWA

## Desktop

Optimizado para administración, pedidos, inventario, configuración y análisis.

## Tablet

Optimizado para producción y supervisión.

## Móvil

Optimizado para:

- crear pedidos simples;
- revisar trabajos;
- consultar retazos;
- modo de corte;
- marcar operaciones.

No se debe replicar exactamente el layout de escritorio en móvil.

---

# 28. Estructura de navegación

## Desktop

```text
Dashboard
Pedidos
Cuadres
Producción
Clientes
Retazos
Planchas
Historial
Configuración
```

## Móvil

Acciones principales:

```text
+ Nuevo corte
Pedidos
En corte
Retazos
Historial
```

Las funciones administrativas se agrupan en configuración.

---

# 29. Componentes UI clave

Componentes reutilizables:

- Button
- Input
- NumericInput
- Select
- SearchInput
- CustomerSelector
- GlassSelector
- ThicknessSelector
- PieceRow
- PieceEditor
- GeometryEditor
- MaterialSelector
- LayoutViewer
- CutStepViewer
- UtilizationCard
- WasteCard
- OrderCard
- RemnantCard
- StatusBadge
- ConfirmDialog
- EmptyState
- LoadingState
- ErrorState

---

# 30. Reglas de negocio críticas

1. Una pieza siempre pertenece a un pedido.
2. Un trabajo de corte puede incluir piezas de múltiples pedidos compatibles.
3. Un pedido no debe perder su identidad por ser mezclado.
4. Un retazo tiene material y espesor definidos.
5. Un retazo reservado no puede ser consumido simultáneamente por otro trabajo.
6. Una pieza no puede marcarse como cortada sin pertenecer a un trabajo válido.
7. Un trabajo no puede completarse si existen operaciones obligatorias pendientes, salvo que un rol autorizado fuerce la finalización.
8. El costo calculado debe quedar registrado al momento de cerrar el proceso financiero correspondiente.
9. La versión del optimizador utilizada para un cuadre debe conservarse.
10. Los cambios críticos deben quedar auditados.

---

# 31. Manejo de errores

La interfaz debe evitar mensajes técnicos como:

> foreign key constraint failed

En su lugar:

> No pudimos completar esta acción. El material seleccionado ya no está disponible. Actualiza el cuadre e inténtalo nuevamente.

Cada error debe tener:

- mensaje comprensible;
- acción sugerida;
- registro técnico en backend.

---

# 32. Concurrencia

Especialmente importante para retazos.

Si dos usuarios intentan reservar el mismo retazo:

- solamente uno debe conseguir la reserva;
- el segundo debe recibir un mensaje claro;
- la transacción debe ser atómica.

Esto debe resolverse en backend/base de datos, no solamente en frontend.

---

# 33. Rendimiento

Objetivos iniciales no funcionales:

- carga rápida de pantallas administrativas;
- navegación fluida en móvil;
- evitar recalcular el optimizador innecesariamente;
- cachear datos de catálogo estables;
- ejecutar optimizaciones pesadas fuera del render de UI;
- mostrar progreso durante optimizaciones complejas.

Para problemas grandes podría evaluarse ejecución asíncrona mediante jobs, pero no se introduce complejidad innecesaria en el MVP.

---

# 34. Observabilidad

Registrar:

- errores de aplicación;
- errores de optimización;
- duración de optimización;
- versión de algoritmo;
- cantidad de candidatos evaluados;
- solución seleccionada;
- cambios manuales realizados después de optimizar.

Esto será muy importante para mejorar el algoritmo con el tiempo.

---

# 35. Versionado del optimizador

Cada cuadre debe almacenar:

```text
optimizer_version
configuration_version
```

Esto permite reproducir o analizar por qué una solución fue generada.

---

# 36. Comparación de soluciones

La interfaz simple muestra la mejor solución.

El modo avanzado puede permitir:

```text
Opción A — 94.3%
Opción B — 93.8%
Opción C — 92.9%
```

Con métricas:

- desperdicio;
- cantidad de planchas;
- cantidad de cortes;
- material reutilizado;
- costo.

---

# 37. Registro de cambios manuales

Si un supervisor modifica el cuadre generado:

- registrar qué cambió;
- quién lo cambió;
- cuándo;
- estado anterior;
- estado posterior.

No sobrescribir silenciosamente el resultado del algoritmo.

---

# 38. Testing del motor de optimización

El motor debe tener datasets de prueba reales y artificiales.

## Casos mínimos

1. una pieza;
2. múltiples rectángulos;
3. piezas que caben solamente rotadas;
4. piezas que no caben;
5. varias planchas;
6. retazo útil;
7. retazo incompatible;
8. mezcla de pedidos;
9. trapecio;
10. geometría irregular;
11. kerf;
12. margen;
13. restricciones de orientación.

## Validaciones geométricas

Toda solución debe comprobar que:

- ninguna pieza sale del material;
- ninguna pieza se superpone;
- se respetan separaciones;
- se respetan márgenes;
- se respeta kerf;
- todas las piezas requeridas están asignadas.

---

# 39. MVP recomendado

## Incluye

### Catálogo

- colores;
- espesores;
- planchas;
- costos.

### Clientes

- crear;
- editar;
- buscar.

### Pedidos

- crear;
- piezas rectangulares;
- cantidades;
- estados.

### Cuadre

- rectángulos;
- rotación;
- kerf;
- márgenes;
- plancha nueva;
- retazos;
- mezcla compatible de pedidos;
- aprovechamiento;
- desperdicio;
- secuencia guillotine.

### Producción

- operaciones;
- marcar cortado;
- finalizar.

### Retazos

- registrar;
- buscar;
- reservar;
- consumir.

### PDF

- plano;
- medidas;
- secuencia;
- resumen.

### Historial

- trabajos completados;
- pedidos completados.

---

# 40. Funcionalidades posteriores al MVP

1. trapecios;
2. triángulos;
3. polígonos irregulares;
4. editor visual de geometría;
5. sugerencias automáticas de agrupación de pedidos;
6. optimización avanzada con múltiples heurísticas;
7. estadísticas avanzadas;
8. análisis de rentabilidad;
9. alertas de stock;
10. comparación entre plan calculado y corte ejecutado;
11. mejora del algoritmo mediante datos históricos;
12. integración con máquinas de corte, si el negocio lo requiere.

---

# 41. Roadmap por fases

## Fase 0 — Descubrimiento

- confirmar tamaños reales de plancha;
- confirmar kerf;
- confirmar márgenes;
- estudiar método de corte real;
- confirmar reglas comerciales;
- recopilar ejemplos reales.

## Fase 1 — Plataforma

- repositorio;
- Next.js;
- TypeScript;
- Supabase;
- autenticación;
- layout;
- CI/CD;
- PWA.

## Fase 2 — Datos y catálogo

- clientes;
- vidrios;
- espesores;
- planchas;
- inventario.

## Fase 3 — Pedidos

- pedidos;
- piezas;
- estados;
- costos básicos.

## Fase 4 — Motor rectangular

- geometría;
- colocación;
- rotación;
- guillotine;
- score;
- desperdicio;
- secuencia.

## Fase 5 — Retazos

- banco;
- compatibilidad;
- reserva;
- consumo;
- generación automática/manual.

## Fase 6 — Mezcla de pedidos

- cola de producción;
- compatibilidad;
- trabajo multi-pedido;
- trazabilidad.

## Fase 7 — Producción y PDF

- modo cortador;
- operaciones;
- PDF;
- finalización.

## Fase 8 — Geometrías especiales

- trapecios;
- triángulos;
- polígonos.

## Fase 9 — Analítica y mejora

- dashboard avanzado;
- eficiencia histórica;
- análisis de desperdicio;
- aprendizaje a partir de modificaciones reales.

---

# 42. Requisitos de aceptación del MVP

El MVP podrá considerarse funcional cuando:

1. un usuario pueda crear un cliente;
2. crear un pedido;
3. agregar múltiples piezas rectangulares;
4. seleccionar material;
5. seleccionar planchas disponibles;
6. seleccionar retazos disponibles;
7. combinar pedidos compatibles;
8. ejecutar un cuadre válido;
9. visualizar el plano;
10. obtener el porcentaje de desperdicio;
11. obtener una secuencia de cortes;
12. marcar las operaciones como realizadas;
13. finalizar el trabajo;
14. registrar retazos sobrantes;
15. generar PDF;
16. consultar el historial.

---

# 43. Datos de ejemplo para desarrollo

## Material

```text
Claro 6 mm
Plancha: 3210 × 2140 mm
Kerf: 3 mm
Margen: 10 mm
```

## Pedido A

```text
1200 × 800 × 2
900 × 600 × 2
```

## Pedido B

```text
1000 × 500 × 2
600 × 400 × 3
```

## Retazo

```text
Claro 6 mm
1200 × 750 mm
```

Estos valores son únicamente de desarrollo hasta que MacroVidrios confirme sus valores reales.

---

# 44. Decisiones pendientes

Antes del desarrollo definitivo se deben confirmar:

- tamaños reales de planchas;
- kerf real por proceso;
- márgenes mínimos;
- posibilidad de rotar cada tipo de pieza;
- reglas de seguridad;
- tamaños mínimos de retazos;
- ubicación física de retazos;
- fórmula de precios actual;
- servicios adicionales;
- tipos de geometría que se utilizan en la práctica;
- si un mismo vidrio puede manejar diferentes procesos de corte;
- comportamiento deseado cuando falta material;
- prioridades exactas del algoritmo.

---

# 45. Estrategia de desarrollo recomendada

No desarrollar todo el sistema y dejar el algoritmo para el final.

El desarrollo debe ocurrir en paralelo:

```text
UX/UI
   +
Modelo de datos
   +
Motor de optimización
   +
Producción real
```

El motor deberá probarse desde temprano con casos reales.

La mejor estrategia es construir un pequeño **prototipo independiente del optimizador** antes de integrarlo completamente con la aplicación.

---

# 46. Criterio de calidad del producto

MacroVidrios Cut no será exitoso únicamente por tener muchas funciones.

Debe cumplir simultáneamente:

```text
SIMPLE DE USAR
       +
OPTIMIZACIÓN REAL
       +
TRAZABILIDAD
       +
RAPIDEZ
       +
BAJO DESPERDICIO
       +
BUENA EXPERIENCIA MÓVIL
```

---

# 47. Dirección de producto

La aplicación deberá sentirse más cercana a una herramienta de trabajo cotidiana que a un ERP industrial complejo.

El usuario operativo debería poder realizar el flujo principal sin capacitación extensa:

```text
Nuevo corte
   ↓
Cliente
   ↓
Vidrio
   ↓
Piezas
   ↓
Cuadrar
   ↓
Ver plano
   ↓
Cortar
   ↓
Finalizar
```

La sofisticación técnica debe existir en el motor y en la administración, no en el flujo cotidiano.

---

# 48. Principio arquitectónico final

> **Pedido y trabajo de corte son conceptos diferentes.**

Este principio permite soportar:

- múltiples pedidos en un mismo trabajo;
- reutilización de retazos;
- optimización conjunta;
- trazabilidad por pieza;
- historial independiente;
- costos independientes;
- producción centralizada.

---

# 49. Próximo documento recomendado

El siguiente documento técnico derivado de este archivo debe ser:

**`MacroVidrios-Cut-Especificacion-UX-UI.md`**

Debe definir, pantalla por pantalla:

- wireframe;
- componentes;
- botones;
- estados;
- validaciones;
- navegación;
- mensajes;
- comportamiento responsive;
- flujo de usuario;
- modo simple;
- modo avanzado.

Después se recomienda crear:

**`MacroVidrios-Cut-Spec-Motor-Optimizacion.md`**

para especificar formalmente el algoritmo, restricciones geométricas, función objetivo, representación de soluciones, generación de candidatos, validación y casos de prueba.

---

# 50. Estado actual del proyecto

### Definido

- visión del producto;
- UX centrada en simplicidad;
- web responsive/PWA;
- Next.js + TypeScript;
- Supabase;
- Vercel;
- pedidos;
- mezcla de pedidos;
- planchas;
- retazos;
- costos;
- producción;
- historial;
- PDF;
- dashboard;
- concepto de trabajo de corte;
- arquitectura general;
- modelo de datos inicial;
- roadmap.

### Pendiente de especificar a detalle

- UX/UI pantalla por pantalla;
- algoritmo de optimización completo;
- reglas reales de MacroVidrios;
- fórmula final de costos;
- casos reales de geometrías;
- política de inventario;
- permisos definitivos;
- diseño final de base de datos;
- APIs/Server Actions;
- estrategia exacta de despliegue;
- pruebas con casos reales.

---

# 51. Nota de implementación

Este documento es una **especificación viva**. No debe considerarse inmutable.

Cada nueva decisión importante debe:

1. documentarse;
2. indicar su motivo;
3. indicar qué parte del sistema afecta;
4. actualizar requisitos relacionados;
5. evitar contradicciones con decisiones anteriores.

La prioridad es construir un sistema que funcione bien para la realidad operativa de MacroVidrios, no una abstracción genérica de software de corte.
