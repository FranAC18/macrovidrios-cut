# MacroVidrios Cut - Arquitectura tecnica ejecutable

## 1. Stack recomendado

| Area | Decision | Motivo |
|---|---|---|
| Aplicacion | Next.js con App Router + React + TypeScript | SSR/RSC para administracion y rutas protegidas, con interaccion donde aporta valor |
| Estilos | Tailwind CSS + shadcn/ui | Velocidad, consistencia y componentes accesibles personalizables |
| Formularios | React Hook Form + Zod | Formularios eficientes y esquema compartido entre UI y servidor |
| Backend | Server Actions para mutaciones internas; Route Handlers para endpoints, webhooks y descargas | Mantiene casos de uso cerca de la aplicacion y reserva HTTP explicito para integraciones |
| Persistencia | Supabase PostgreSQL | Transacciones, RLS, vistas, funciones y respaldo gestionado |
| Auth | Supabase Auth | Sesion integrada y control de acceso por usuario |
| Archivos | Supabase Storage con buckets privados | PDFs y documentos sin exponer rutas publicas |
| Motor | Biblioteca TypeScript pura, sin dependencia de React | Determinismo, pruebas rapidas y futura ejecucion en worker/job |
| Plano | SVG para MVP; Canvas solo si el editor o volumen lo exige | SVG facilita etiquetas, accesibilidad, impresion y eventos |
| PDF | React-PDF o generacion server-side equivalente | Documento reproducible desde snapshot del trabajo |
| Testing | Vitest, Testing Library y Playwright | Unitario/dominio, componentes y flujos reales |
| Deploy | Vercel + Supabase | Encaja con la web y el stack propuesto |
| PWA | Manifest, service worker y cache selectiva | Instalacion y experiencia movil, sin prometer offline total prematuramente |

Las versiones exactas se fijaran al crear el proyecto y se actualizaran de forma controlada, no con upgrades masivos durante una fase critica.

## 2. Estructura inicial de codigo

```text
src/
  app/
    (auth)/
    (app)/
      dashboard/
      pedidos/
      cuadres/
      produccion/
      clientes/
      retazos/
      planchas/
      historial/
      configuracion/
    api/
  components/
    ui/
    forms/
    layouts/
    production/
    cutting/
  domain/
    customers/
    orders/
    inventory/
    cutting/
    pricing/
    audit/
  lib/
    optimization/
    supabase/
    auth/
    validation/
    errors/
    observability/
  actions/
  queries/
  types/
  styles/
tests/
  unit/
  integration/
  e2e/
supabase/
  migrations/
  seed.sql
docs/
```

Las reglas de dominio no deben importarse desde componentes de UI. Las acciones de servidor deben validar sesion, rol, entrada y transaccion antes de llamar al dominio.

## 3. Fronteras de arquitectura

### UI

Renderiza estado, recoge interaccion y muestra mensajes comprensibles. No decide permisos, reservas, totales definitivos ni validez geometrica.

### Aplicacion

Orquesta casos de uso: crear pedido, crear cuadre, reservar material, iniciar corte y finalizar trabajo. Aqui se controla la transaccion y se traducen errores tecnicos a errores de producto.

### Dominio

Contiene estados, transiciones, compatibilidad de materiales, reglas de costo, trazabilidad y contratos del optimizador. Debe poder probarse sin navegador ni Supabase.

### Infraestructura

Implementa repositorios, Auth, Storage, PDF, logging, reloj, identificadores y acceso a base de datos.

### Optimizador

Recibe datos serializables y devuelve una solucion serializable. No conoce usuarios, React, SQL ni sesiones.

## 4. Persistencia y modelo de datos

El modelo de la especificacion es la base, pero en implementacion debe añadir controles para auditoria y concurrencia:

- `organization_id` en entidades de negocio, aunque el primer despliegue tenga una sola empresa;
- claves y restricciones unicas para codigos, combinaciones de catalogo y relaciones;
- `created_at`, `updated_at` y usuario de modificacion en entidades mutables;
- `inventory_movements` para entradas, reservas, consumos, ajustes y descartes;
- `material_reservations` con estado, vencimiento y referencia al trabajo;
- snapshots de configuracion, inventario y costo en cada `cutting_job`;
- `geometry_json` validado por version y `geometry_type`, nunca JSON arbitrario sin contrato;
- `optimizer_version` y `configuration_version` obligatorios en layouts;
- `audit_logs` append-only para cambios criticos.

La cantidad visible de inventario puede ser una proyeccion, pero el origen debe ser un movimiento transaccional. Esto evita perder trazabilidad por ediciones directas.

### Integridad minima

- medidas enteras positivas en mm;
- cantidades enteras positivas;
- dinero en centavos enteros;
- porcentajes acotados entre 0 y 100;
- estados con transiciones validas en funcion SQL o caso de uso;
- foreign keys y restricciones de compatibilidad;
- indice por material, estado, dimensiones y organizacion para retazos;
- indice por estado y fecha para cola de produccion.

## 5. Server Actions y consultas

Cada mutacion debe seguir esta secuencia:

1. validar sesion;
2. comprobar rol y organizacion;
3. parsear input con Zod;
4. cargar el estado necesario;
5. verificar reglas de dominio;
6. ejecutar una transaccion;
7. registrar auditoria y evento tecnico;
8. invalidar/revalidar la cache apropiada;
9. devolver resultado tipado o error de producto.

Las lecturas administrativas pueden usar Server Components y consultas paginadas. Las pantallas interactivas solo deben hidratar las islas que necesitan estado local.

## 6. Concurrencia y reservas

La reserva de retazo no se implementa como `select` seguido de `update` desde el navegador. Debe ser una funcion transaccional o mutacion equivalente que:

- bloquee la fila o use una condicion atomica;
- compruebe estado y cantidad disponible;
- cree la reserva y movimiento;
- rechace el segundo intento con error tipado;
- libere reservas canceladas o vencidas;
- mantenga idempotencia ante reintentos.

El cierre del trabajo debe consumir las reservas y generar movimientos de sobrantes dentro de una transaccion coherente.

## 7. Rendimiento y eficiencia

### Aplicacion web

- usar Server Components para tablas y resumen no interactivo;
- paginar pedidos, historial y retazos;
- cargar el visor SVG y el editor de forma diferida;
- no enviar toda la geometria historica al cliente;
- cachear catalogos estables con invalidacion al editar;
- aplicar debounce a busquedas, no a acciones de produccion;
- evitar recalcular un cuadre si no cambiaron piezas, reglas o inventario;
- mostrar skeleton solo donde reduzca percepcion de espera y estados claros durante mutaciones.

### Optimizacion

- MVP sin job distribuido: ejecutar en servidor para casos acotados y dar progreso por etapas si la duracion lo requiere;
- mover calculos pesados a Web Worker o job cuando bloqueen la respuesta o superen el umbral medido;
- guardar hash de entrada/configuracion para reutilizar resultados validos;
- establecer timeout, limite de candidatos y resultado parcial controlado;
- registrar duracion, cantidad de candidatos y memoria aproximada.

### Base de datos

- seleccionar solo columnas necesarias;
- indices guiados por consultas reales;
- agregaciones del dashboard en vistas o consultas agrupadas, no fila por fila;
- paginacion por cursor en historiales extensos;
- revisar planes de consulta antes de optimizaciones especulativas.

## 8. Seguridad

- RLS activa en toda tabla expuesta;
- `service_role` solo en servidor y nunca en el navegador;
- politicas por organizacion y rol;
- validacion de servidor incluso si existe validacion visual;
- PDFs privados servidos con URL firmada o descarga autorizada;
- rate limit en login, generacion de cuadre y PDF si el despliegue lo requiere;
- sanitizacion de texto y nombres de archivos;
- no guardar secretos, tokens o datos innecesarios en logs;
- auditoria de permisos, ajustes de inventario, reservas, cambios de cuadre y finalizaciones forzadas.

## 9. Ambientes y despliegue

- local: Supabase local o proyecto de desarrollo;
- preview: proyecto/datos aislados para cada rama relevante;
- produccion: proyecto protegido con migraciones revisadas;
- migraciones SQL versionadas y aplicadas por CI o procedimiento controlado;
- seeds separados de datos reales;
- variables documentadas y validadas al arrancar;
- rollback de aplicacion y plan de restauracion de base de datos.
