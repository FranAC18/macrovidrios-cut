# MacroVidrios Cut - Logica de usabilidad y reglas de flujo

Este documento fija la logica de usabilidad que se implementara de forma incremental.
Cada cambio se trabaja y se commitea por separado; el push se realiza tras revision.

## 1. Principios

1. El usuario describe que necesita; el sistema decide como aprovecharlo.
2. Ningun dato que pueda heredarse de un contexto deberia pedirse repetidamente.
3. Toda accion principal termina con una indicacion clara del siguiente paso.
4. Las unidades operativas se muestran en centimetros (cm); internamente siguen en milimetros.
5. Nunca mostrar estados invalidos ni errores tecnicos.

## 2. Pedido agrupado por material (color + espesor)

**Problema:** hoy cada pieza repite color y espesor. Si un cliente pide un solo vidrio,
el operario reintroduce el mismo material en cada linea.

**Logica propuesta:**

- Un pedido se compone de **uno o varios grupos de material**. Cada grupo fija **una vez**
  el color y el espesor, y contiene una o varias piezas.
- Flujo recomendado: **primero material, luego piezas**.
  1. Elegir color y espesor del grupo.
  2. Agregar las piezas de ese material (ancho, alto, cantidad, descripcion, rotacion).
  3. Si el pedido usa otro vidrio, se agrega otro grupo de material.
- Si el pedido usa un solo vidrio, el usuario elige el material una unica vez y agrega
  todas las piezas.
- El resumen muestra grupos, piezas totales y area (m2).
- Al confirmar, cada pieza conserva el `glass_product_id` de su grupo (trazabilidad).
- Regla de compatibilidad: no se puede mezclar en un mismo grupo un color y un espesor
  que no correspondan a un producto configurado. La cascada Color -> Espesor ya lo garantiza.

**Casos borde:**

- Grupo sin material: se marca incompleto y no permite guardar.
- Pieza incompleta: se avisa y se expande la primera pieza incompleta al guardar.
- Pedido con un solo material: un grupo; con varios materiales: varios grupos.

## 2.1 Lista vs tarjetas de material en movil

**Pregunta:** en movil, ¿conviene una lista plana de materiales o tarjetas?

**Analisis:**

- **Lista plana** (cada material como una fila):
  - ventaja: ocupa menos altura por fila y se puede mostrar mas de un material a la vez;
  - desventaja: al desplegar un material, sus piezas compiten visualmente con los demas
    materiales; es dificil saber a que material pertenece cada pieza; los objetivos tactiles
    quedan mas juntos.
- **Tarjetas** (cada material como bloque con su contenido):
  - ventaja: la jerarquia material -> piezas es evidente; el bloque abierto queda aislado
    y sin ambiguedad; permite encabezados grandes y objetivos tactiles amplios; el resumen
    (material, piezas, area) se lee de un vistazo;
  - desventaja: cada tarjeta ocupa algo mas de altura; con muchos materiales colapsados
    el encabezado debe ser compacto para no generar scroll.

**Decision:** usar **tarjetas para los materiales** y **lista compacta de piezas dentro**
de cada tarjeta. Es el mejor equilibrio en movil:

- solo una tarjeta de material abierta a la vez (acordeon);
- dentro, las piezas son filas compactas y solo una pieza expandida a la vez;
- encabezado de material compacto con resumen, para que muchos materiales no generen
  scroll infinito;
- acciones grandes y visibles: "Agregar pieza" (CTA destacado) y "Agregar material".

Complementos para evitar scroll:

- **"Datos del pedido" tambien es colapsable** (se mantiene en el DOM para no perder valores).
- El resumen general (materiales, piezas, area) siempre visible en la cabecera.


## 3. Entrada de medidas en movil (ancho / alto)

**Problema:** escribir medidas en el teclado movil es lento y propenso a errores.

**Logica propuesta:** un componente unico de medida en cm con tres formas de entrada,
todas equivalentes:

1. **Steppers**: botones grandes menos / mas con paso de 1 cm (0,5 cm en valores pequenos).
2. **Deslizador (slide)**: barra de rango para ajuste rapido.
3. **Entrada manual**: campo numerico con teclado decimal para el valor exacto.

- Rango valido: 1 cm a 200 cm por lado (10 mm a 2000 mm). Se valida y se avisa si se sale.
- Decimales: se admite 1 decimal (0,5 cm). Se normaliza al salir del campo.
- El valor mostrado y el almacenado siempre coinciden (cm en UI, mm en datos).
- Se muestran las unidades junto al campo, nunca escondidas.

## 4. Vista de retazos

**Problema:** la vista actual es funcional pero poco clara para comparar tamanos.

**Logica propuesta:**

- Cada retazo se muestra como tarjeta con una **miniatura a escala** del rectangulo,
  medidas en cm, area, material, cantidad, ubicacion y estado.
- Filtros por material en cascada (color + espesor), medidas minimas en cm y estado.
- Orden por area descendente para priorizar el uso de retazos grandes.
- Acciones visibles segun estado (reservar / descartar) y origen navegable al cuadre.

## 5. Lista de pedidos

**Problema:** no se puede abrir un pedido tocando toda la fila; solo el numero es enlace.
Ademas no se puede modificar un pedido ya creado.

**Logica propuesta:**

- **Toda la fila es clicable** para abrir el detalle del pedido.
- **Edicion de pedido**: se permite modificar cliente, referencia, fecha, descuento, notas
  y las piezas mientras el pedido no tenga un trabajo de corte activo
  (estados `draft`, `pending`, `queued`).
- Si el pedido ya tiene un trabajo de corte, la edicion se bloquea con un mensaje claro
  y se ofrece cancelar el trabajo antes de editar.
- Al editar piezas, se recalculan costos y se regeneran las piezas trazables solo si
  no existe un trabajo asociado.

## 6. Regla de material disponible (planchas)

**Problema:** se puede crear un pedido con un vidrio del que no hay planchas, y luego el
cuadre falla sin guia.

**Logica propuesta:**

- El cuadre **solo ofrece fuentes realmente disponibles**: formatos de plancha con inventario
  (`inventory_sheets` con `status = available` y `quantity > 0`) y retazos disponibles.
- Si el material de un pedido **no tiene ninguna fuente** (ni plancha ni retazo):
  - el pedido se marca como "sin material disponible" en el asistente y en la lista;
  - no se permite avanzar el cuadre de ese material hasta registrar inventario o retazos;
  - se ofrece una accion directa: "Registrar planchas" o "Registrar retazo".
- Al crear un pedido, si el material elegido no tiene stock, se muestra una advertencia
  no bloqueante con enlace a inventario (no se impide crear el pedido, porque puede
  comprarse material despues).
- El asistente de cuadre nunca debe terminar en error tecnico por falta de material:
  la indisponibilidad se comunica antes y con una accion correctiva.

## 7. Plan de implementacion por cambios

1. `feat(order)`: pedido agrupado por material (color/espesor una vez, luego piezas).
2. `feat(ui)`: componente de medida en cm con steppers, slide y entrada manual.
3. `feat(ui)`: vista de retazos con miniatura a escala y mejor jerarquia.
4. `feat(orders)`: fila clicable, edicion de pedido y regla de material disponible.
5. `docs`: actualizar este documento y el backlog con el estado real.

Cada cambio se commitea de forma aislada y se hace push tras la revision del usuario.

## 8. Botones y tarjetas de material (referencia Kobaia3)

Referencias tomadas de `Kobaia3.html`: seccion **04 · Acciones y Botones**,
seccion **05 · Campos y Badges** y el **Card de Catalogo**.

### 8.1 Requisitos de los botones

- Jerarquia clara: una accion principal por contexto.
- Lenguaje humano y accion explicita (evitar "Procesar", "Ejecutar").
- Microinteraccion sutil (flecha que avanza en hover), sin exagerar.
- Objetivos tactiles de al menos 44 px de alto en movil.
- Estados consistentes: normal, hover, activo y deshabilitado.
- No usar botones punteados para acciones frecuentes (se perciben como "zona de carga").

### 8.2 Opciones consideradas

| Accion | Opcion descartada | Opcion elegida | Motivo |
|---|---|---|---|
| Agregar pieza | Boton punteado (zona de carga) | **Primario solido** con `+` y flecha | Es la accion mas frecuente del material |
| Listo con este material | Fantasma sin peso | **Secundario** con borde y check | Cierra el material sin competir con la accion principal |
| Listo (pieza) | Boton con texto solo | **Fantasma** con check | Accion terciaria y repetida |

Reglas Kobaia aplicadas: tipografia 600, radio `--r-sm`, transicion de 150 ms,
flecha que se desplaza `2 px` en hover, icono de acento cuando corresponde.

### 8.3 Tarjetas de material (como el Card de Catalogo)

- Cada material es una tarjeta con **miniatura de color** (swatch del vidrio),
  titulo con el material, subtitulo con piezas y area, y acciones a la derecha.
- La miniatura usa el color real del vidrio (Claro, Bronce, Verde, Negro, Espejo,
  Gris, Azul) con un degradado sutil para dar volumen, similar a los swatches de
  "Superficie y Paleta de Color".
- El indice del material se muestra como una insignia pequeña sobre la miniatura.
- Estado incompleto se comunica con icono de aviso (no solo color).
- Encabezado compacto para que muchos materiales colapsados no generen scroll.

### 8.4 Badges y campos

- Los estados usan badges semanticos (`success`, `warning`, `neutral`) del sistema.
- Los campos mantienen altura 44 px, borde hairline y foco con anillo de acento.
- La unidad (cm) siempre visible junto al campo.

### 8.5 Decisiones implementadas

1. `Agregar pieza en este material` → boton **primario** grande con flecha.
2. `Listo con este material` → boton **secundario** con check.
3. `Listo` de pieza → boton **fantasma** con check.
4. Tarjeta de material con **swatch de color** + insignia de indice.

## 9. Piezas no rectangulares (trapecios y formas con lados diferentes)

### 9.1 Estado actual

- El MVP solo corta **rectangulos**. El modelo ya contempla `geometry_type` y
  `geometry_json` por pieza, pero hoy solo se usa `rectangle`.
- El motor de optimizacion, la validacion geometrica y la secuencia guillotine
  actuales asumen rectangulos.

### 9.2 Que se requiere para un trapecio

**Modelo de datos (por pieza):**

```text
geometry_type = "trapezoid"
geometry_json = {
  base_major_mm,   // lado mayor paralelo
  base_minor_mm,   // lado menor paralelo (<= base_major)
  height_mm,       // distancia entre bases
  offset_mm,       // desplazamiento de la base menor respecto a la izquierda
  rotatable
}
```

**Interfaz (en la pieza):**

- Selector de **Forma**: Rectangulo | Trapecio | (futuro) Triangulo | Forma especial.
- Al elegir Trapecio: campos **base mayor**, **base menor**, **altura** y **desplazamiento**,
  todos en cm, con la misma entrada asistida de medidas.
- Vista previa a escala de la forma mientras se edita.

**Validacion:**

- `base_minor <= base_major`, `height > 0`, `offset` dentro del rango valido.
- Area = `(base_major + base_minor) / 2 * height`.

**Motor y produccion (el punto critico):**

- Opcion A (rapida y segura): cortar por **bounding box** (el rectangulo que contiene
  la forma). Geometria garantizada, aprovechamiento suboptimo, sin cortes diagonales.
- Opcion B (real): nesting de trapecios por subdivision (2 triangulos + 1 rectangulo)
  o por no-fit polygon. Requiere geometria computacional, validador propio y secuencia
  de corte con diagonales. Es la **Fase 8** del plan.
- La secuencia guillotine actual no aplica directo a diagonales; se necesita un
  generador de operaciones especifico.

### 9.3 Enfoque recomendado por etapas

1. **Etapa 1 - Captura**: agregar forma y parametros del trapecio al pedido y a la pieza
   (se guarda en `geometry_json`). Sin cambios en el motor.
2. **Etapa 2 - Corte por bounding box**: el motor trata la pieza por su rectangulo
   contenedor. Permite producir ya, con desperdicio mayor.
3. **Etapa 3 - Nesting real**: subdivision/no-fit polygon, validador y secuencia con
   diagonales, mas dataset de pruebas (Fase 8).

### 9.4 Pregunta abierta

Para avanzar hace falta confirmar con MacroVidrios:

- que formas se usan de verdad (trapecio, triangulo, otras);
- si el corte es recto (guillotine) o se permiten cortes diagonales;
- tolerancia y orientacion permitida;
- si el trapecio se puede rotar.

Sin esa confirmacion, la Etapa 1 (captura) es segura; las etapas 2 y 3 deben validarse
con el negocio antes de produccion.

## 10. Datos del pedido, medidas y edicion (ronda de mejoras)

Referencias: capturas del formulario actual y patrones tipo iOS (picker de rueda,
lista de ajustes por filas, tarjetas con accion de edicion).

### 10.1 Datos del pedido

- **Agregar cliente desde el pedido**: junto al selector de cliente debe existir la accion
  "Nuevo cliente" que permita capturar nombre y telefono sin salir del flujo y dejarlo
  seleccionado. Evita ir a Clientes y volver.
- **Fecha de compromiso**: sustituir el calendario por un **selector de rueda** de
  **dia** y **mes**. El **año se calcula automaticamente**: si el dia/mes elegido ya paso,
  se usa el año siguiente; si no, el año actual. Se guarda como fecha ISO.
- **Descuento**: no se captura al crear. El descuento se aplica despues, al cotizar o
  modificar el pedido. Se retira del formulario de alta.
- **Editar pedido**: debe existir la opcion de modificar un pedido ya creado (cliente,
  referencia, fecha, notas y piezas) mientras no tenga un trabajo de corte activo
  (`draft`, `pending`, `queued`). Con trabajo activo se bloquea y se explica.

### 10.2 Medidas (ancho / alto)

- **Sin slider**: se retira la barra deslizante; no aporta y ensucia la vista de PC.
- **Steppers + entrada manual** como unica interaccion, con la unidad (cm) visible.
- **Bloquear valores negativos** y cualquier medida invalida: el campo no acepta `-`,
  y al salir se normaliza el rango y se avisa si esta fuera.
- **PC**: el valor centrado, sin flechas nativas del input numerico, con los botones
  `−`/`+` a los lados y una altura consistente con los demas campos.

### 10.3 Patrones de referencia (iOS)

- Picker de rueda para seleccionar valores de una lista larga (dias, meses, medidas).
- Filas de ajuste con etiqueta a la izquierda y valor/accion a la derecha.
- Tarjetas con accion de edicion (lapiz) y un boton `+` flotante para agregar; se aplica
  a la edicion de pedidos y a la gestion de materiales.

### 10.4 Numeros negativos (regla global)

- Ninguna cantidad, medida, precio o descuento acepta valores negativos.
- Los campos se marcan con `min` y se sanean en el cliente y en el servidor (Zod).



