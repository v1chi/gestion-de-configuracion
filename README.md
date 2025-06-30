# App Móvil - Gestión de Configuración de Componentes

Aplicación móvil desarrollada en React Native con Expo que permite gestionar componentes y subcomponentes, registrar características, controlar su estado (activo o de baja), y mantener un historial completo de cambios. La app está diseñada con roles diferenciados: administrador y usuario.

---

## Tecnologías utilizadas

- React Native (Expo SDK 53)
- Firebase Authentication (inicio de sesión con Google)
- MongoDB (usada por el backend)
- Axios (consumo de API REST)
- React Navigation (navegación entre pantallas)
- AsyncStorage (almacenamiento local de sesión)
- Dotenv (manejo de variables de entorno)

---

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/usuario/proyecto.git
cd front-movil-gestion-de-configuracion
```

### 2. Instalar dependencias

```bash
npm install
```

---

## Configuración de Firebase

1. Crear un proyecto en Firebase Console
2. Habilitar la autenticación con Google
3. Registrar la app Android con el nombre del paquete:

```
com.ucn.gestioncomponentes
```

4. Descargar el archivo `google-services.json`
5. Colocar el archivo descargado en la ruta:

```
android/app/google-services.json
```

6. (Opcional) Si se requiere el `webClientId`, puedes encontrarlo en la configuración de OAuth 2.0 del proyecto Firebase

---

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```
API_URL=http://TU_BACKEND_URL
```

Reemplaza `TU_BACKEND_URL` por la URL en que esté corriendo el backend.

---

## Ejecutar la app en Android

Debido a la autenticación con Google, **no se debe usar `expo start`**.

Ejecutar con:

```bash
npx expo run:android
```

Esto construirá la app e instalará el `.apk` en un dispositivo físico o emulador.

---

## Funcionalidades por pantalla

### LoginScreen
- Iniciar sesión con correo/contraseña o Google
- Guarda token y rol del usuario en AsyncStorage
- Redirige según el rol (administrador o usuario)

### MenuAdminScreen
- Lista todos los componentes
- Permite buscar por nombre o tipo
- Acceso al historial de modificaciones y al detalle de cada componente

### AddComponentScreen
- Formulario para registrar nuevo componente
- Agregar múltiples características

### ManageComponentsScreen
- Lista componentes existentes
- Acceso a editar cada uno

### ComponentDetailScreen
- Editar nombre, tipo y estado del componente
- Agregar, editar o eliminar características
- Asociar o desasociar subcomponentes

### CreateSubcomponentScreen
- Crear subcomponentes desde un componente padre

### HistoryScreen
- Visualizar historial completo de modificaciones
- Muestra usuario, fecha, acción y detalles del cambio

### MenuUserScreen
- Vista de solo lectura para usuarios
- Visualización de componentes y subcomponentes

---

## Estructura del proyecto

```
├── src/
│   ├── assets/
│   └── screens/
├── .env
├── android/
├── App.js
├── app.json
├── babel.config.js
├── package.json
└── README.md
```

---

## Notas importantes

- Esta app está diseñada solo para dispositivos Android
- El backend debe estar ejecutándose en red local o accesible desde `API_URL`
- El backend fue desarrollado por otro integrante del equipo y no está incluido en este repositorio

---


## Autor

Este proyecto fue desarrollado como parte de una entrega académica. Para dudas o colaboración:

- Nombre: María Victoria Quiroga Martinez
- Correo: maria.quiroga@alumnos.ucn.cl
- Universidad: Universidad Católica del Norte

---

## Capturas de pantalla

