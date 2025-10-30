# Descripción Detallada del Proyecto

La Web es una plataforma web simplificada, enfocada en dos funcionalidades principales: la **Gestión de Usuarios** y el **Control de Pallets** en el almacén. Su arquitectura full-stack está construida para ser robusta, escalable y fácil de mantener, utilizando tecnologías modernas y siguiendo las mejores prácticas de desarrollo.

### 1. Visión General del Proyecto

El objetivo principal de esta versión es proporcionar herramientas eficientes para la administración de usuarios y la trazabilidad de productos en posiciones de pallet.

### 2. Arquitectura Full-Stack

El proyecto sigue una arquitectura de aplicación web de dos capas principales: un frontend de cliente y un backend de servidor, que se comunican a través de APIs RESTful.

- **Frontend (Cliente)**: React con TypeScript, Fluent UI, React Router, TanStack Query.
- **Backend (Servidor)**: Node.js con Express.js, PostgreSQL, Drizzle ORM, Zod.

### 3. Tecnologías y Componentes Clave

- **Frontend**: React, TypeScript, Fluent UI (`@fluentui/react-components`), React Router (`react-router-dom`), TanStack Query (`@tanstack/react-query`), `date-fns`.
- **Backend**: Node.js, Express.js, PostgreSQL, Drizzle ORM (`drizzle-orm`), Zod (`zod`), JWT (`jsonwebtoken`), `bcryptjs`.

### 4. Módulos y Funcionalidades Clave

El proyecto Web incluye los siguientes módulos esenciales:

- **Autenticación y Autorización de Usuarios**:
  - Inicio de sesión y cierre de sesión de usuarios.
  - Cambio de contraseña (incluyendo un flujo forzado).
  - Roles de usuario simplificados: `developer`, `deposito`.
- **Gestión de Usuarios**:
  - Listado paginado y filtrado de usuarios.
  - Creación, edición y actualización de usuarios (nombre, email, rol, estado activo/inactivo).
  - Reseteo de contraseñas a un valor predeterminado.
  - Visualización de usuarios activos en tiempo real.
  - Historial de inicios de sesión.
- **Control de Pallets**:
  - **Gestión de Posiciones**: Creación, habilitación/deshabilitación y eliminación de posiciones de pallet (Filas y Posiciones).
  - **Gestión de Productos**: Adición, actualización (bultos) y eliminación de productos en posiciones de pallet.
  - **Visualización**: Vistas de cuadrícula (grid), tabla y resumen de inventario por producto y estado de vencimiento.
  - **Trazabilidad**: Registro detallado de todas las acciones realizadas sobre posiciones y productos (logs).
  - **Búsqueda y Filtros**: Búsqueda por texto y filtros por producto, fecha de vencimiento y estado de expiración.

### 5. Prácticas de Desarrollo y Mantenimiento

- **Monorepo**: Estructura de monorepo para cliente y servidor.
- **Tipificación Fuerte**: Uso extensivo de TypeScript.
- **Despliegue Automatizado**: Flujo de trabajo de GitHub Actions para despliegue continuo (CD) a AWS EC2.
- **Migraciones de Base de Datos**: `drizzle-kit` para la gestión de esquemas.