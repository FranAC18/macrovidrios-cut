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
