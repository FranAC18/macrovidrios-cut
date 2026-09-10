# MacroVidrios Cut - Plan del motor de optimizacion

## 1. Objetivo tecnico

El motor debe devolver una solucion que pueda fabricarse y explicarse. El porcentaje de aprovechamiento es importante, pero una solucion con menos desperdicio no gana si viola margen, kerf, orientacion, disponibilidad o secuencia de corte.

El motor sera una biblioteca pura de TypeScript, independiente de Next.js, Supabase y React. Debe poder ejecutarse desde pruebas, CLI, servidor y posteriormente un worker sin cambiar sus reglas.

## 2. Contrato de entrada

El contrato versionado debe incluir al menos:

```text
OptimizationRequest
  request_version
  pieces[]
    piece_id
    order_id
    width_mm
    height_mm
    quantity_index
    rotatable
    material_id
  material
    color
    thickness_mm
    kerf_mm
    margin_mm
    separation_mm
  sources
    sheets[]
      source_id
      width_mm
      height_mm
      unit_cost_cents
    remnants[]
      source_id
      width_mm
      height_mm
      shape
      cost_cents
  constraints
  objective_weights
  random_seed
  optimizer_version
  configuration_version
```

La entrada se normaliza antes de optimizar. Las dimensiones internas son enteros en mm; no se aceptan floats ambiguos provenientes de la UI.

## 3. Contrato de salida

```text
OptimizationResult
  result_version
  status
  materials[]
  placements[]
    piece_id
    source_id
    x_mm
    y_mm
    width_mm
    height_mm
    rotation_deg
  areas[]
  operations[]
    sequence
    type
    area_id
    position_mm
    length_mm
    instruction
  utilization_percent
  waste_percent
  used_area_mm2
  waste_area_mm2
  material_cost_cents
  score
  alternatives[]
  validation
  metrics
    duration_ms
    candidates_evaluated
  optimizer_version
  configuration_version
```

Si no existe una solucion valida, el resultado debe explicar la causa: pieza que no cabe, material incompatible, stock insuficiente o restriccion conflictiva. Nunca devolver una solucion parcialmente asignada como si fuera completa.

## 4. Pipeline incremental

### Paso 1 - Normalizacion

- validar ids unicos;
- expandir cantidades a piezas trazables;
- ordenar medidas y conservar orientacion original;
- aplicar margen, separacion y kerf segun la regla confirmada;
- eliminar fuentes incompatibles;
- validar limites y overflow.

### Paso 2 - Prechequeos

- detectar piezas mayores que toda fuente;
- calcular area minima necesaria;
- comprobar rotacion permitida;
- comprobar que el stock candidato tiene material suficiente;
- informar imposibles antes de ejecutar heuristicas costosas.

### Paso 3 - Generacion de candidatos rectangulares

Para MVP evaluar varias estrategias simples y reproducibles:

- orden por lado mayor;
- orden por area;
- orden por dificultad de encaje;
- orientacion original y rotada;
- colocacion por espacios libres o guillotine partitioning;
- fuentes nuevas, retazos y combinacion segun estrategia.

### Paso 4 - Validacion geometrica

Cada candidato debe comprobar:

- pieza dentro del material;
- ausencia de superposicion;
- respeto de margen y separacion;
- kerf representado en la particion o banda correspondiente;
- todas las piezas asignadas exactamente una vez;
- operaciones ejecutables en orden.

### Paso 5 - Score

La configuracion inicial puede partir de:

```text
70% eficiencia material
20% facilidad de corte
10% cantidad de operaciones
```

No debe fijarse como verdad universal. Guardar los pesos, normalizar cada componente y permitir que el negocio compare resultados. Penalizar fuertemente violaciones de restricciones, de modo que ningun score pueda premiar una solucion invalida.

### Paso 6 - Secuencia guillotine

La salida no es solo un conjunto de rectangulos. Debe conservar el arbol de particiones y convertirlo en operaciones ordenadas, con area objetivo, eje, posicion, longitud e instruccion legible.

### Paso 7 - Resultado y alternativas

Devolver la mejor solucion valida y un conjunto pequeño de alternativas no dominadas. No presentar alternativas tecnicas al usuario simple; el modo avanzado las muestra con desperdicio, planchas, cortes, retazos y costo.

## 5. Planchas y retazos

En MVP, tratar cada plancha o retazo como fuente con identificador propio. La estrategia mixta debe comparar:

- consumo de retazos disponibles;
- costo imputado del retazo;
- area nueva consumida;
- numero de fuentes y operaciones;
- posibilidad de generar sobrantes utilizables.

El motor propone; la aplicacion reserva. No permitir que el algoritmo cambie stock por su cuenta.

## 6. Determinismo y reproducibilidad

- mismo input, configuracion, version y semilla producen el mismo resultado;
- no depender de orden de filas de base de datos sin ordenar;
- incluir semilla cuando exista aleatoriedad controlada;
- guardar input normalizado o su hash junto al trabajo;
- conservar version de algoritmo y configuracion;
- registrar modificaciones manuales como nueva revision del layout.

## 7. Rendimiento

El optimizador debe tener limites explicitos:

- maximo de piezas/candidatos para respuesta sincrona;
- timeout configurable;
- cancelacion si la UI abandona una optimizacion larga;
- metricas de duracion y candidatos;
- benchmark con los casos reales de mayor tamaño;
- fallback a una solucion valida menos optimizada, solo si se informa claramente y nunca si deja piezas sin asignar.

La ejecucion asincrona se introduce cuando las mediciones lo justifiquen, no como dependencia del MVP.

## 8. Geometrias posteriores

Cada nueva geometria debe implementar una interfaz comun para:

- area;
- bounding box;
- transformaciones permitidas;
- validacion de puntos;
- interseccion/solapamiento;
- renderizado;
- serializacion versionada.

Trapecios y triangulos pueden reutilizar parte del pipeline, pero poligonos irregulares requieren un subsistema de nesting y validacion mas costoso. No mezclar ambos desarrollos en la primera entrega.

## 9. Pruebas del motor

### Unitarias

- conversion y redondeo de mm;
- rotacion;
- margen y kerf;
- interseccion;
- area y porcentaje;
- estados de resultado;
- score y penalizaciones.

### Dataset minimo

1. una pieza;
2. varios rectangulos;
3. piezas que solo caben rotadas;
4. pieza imposible;
5. varias planchas;
6. retazo util;
7. retazo incompatible;
8. mezcla de pedidos;
9. kerf y margen;
10. orientacion bloqueada;
11. igualdad de resultados por semilla;
12. operaciones reproducibles.

### Propiedades invariantes

- no hay piezas fuera de limites;
- no hay superposiciones;
- cada pieza requerida aparece una vez;
- el material usado no supera el stock reservado;
- porcentajes y areas son consistentes;
- toda operacion referencia una entidad existente;
- una solucion invalida nunca llega a estado `ready`.
