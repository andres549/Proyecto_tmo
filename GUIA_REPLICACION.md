# GUÍA DE REPLICACIÓN INDEPENDIENTE: SISTEMA TMO CON N8N, SUPABASE E IA

Esta guía contiene las instrucciones detalladas paso a paso para que cualquier persona técnica o no técnica pueda instalar, configurar y ejecutar la solución completa desde cero sin depender de asistencia externa.

---

## 📋 A. Requisitos Previos

### 1. Software y Herramientas Necesarias
* **Node.js:** Versión 18.x, 20.x o 24.x ([Descargar de nodejs.org](https://nodejs.org/)).
* **n8n:** Versión 1.x o 2.x instalada globalmente mediante npm (`npm install -g n8n`) o vía Docker.
* **Navegador Web:** Google Chrome, Edge o Firefox.
* **Cliente de Base de Datos (Opcional):** DBeaver o el propio editor SQL de Supabase.

### 2. Cuentas y Servicios Externos
* **Cuenta de Supabase / PostgreSQL:** Proyecto gratuito en [supabase.com](https://supabase.com).
* **Cuenta de Correo (Gmail / Outlook / SMTP):** 
  * Si es Gmail: Requiere activar la **Verificación en 2 pasos** y generar una **Contraseña de Aplicación de 16 caracteres** (en `myaccount.google.com/apppasswords`).
* **API Key de OpenAI (Opcional para el nodo IA):** Clave `sk-...` obtenida de [platform.openai.com](https://platform.openai.com).

### 3. Archivos del Paquete Incluidos en este ZIP
* `workflow_1_calculo_tmo.json`: Flujo de n8n para cálculo y consolidación.
* `workflow_2_validacion_ia.json`: Flujo de n8n para validación independiente e IA.
* `supabase_schema.sql`: Script DDL para crear las 7 tablas y vistas en PostgreSQL.
* `server.js`: Servidor API y portal web.
* `tmo_excel_generator.js`: Motor de generación de Excel de 4 hojas con gráficos.
* `generate_validation_excel.js`: Motor de generación de Excel de auditoría.
* `sample_data_generator.js`: Creador del dataset de 85 filas.
* `gestiones_call_center_50plus.xlsx`: Archivo de prueba listo para usar.
* Carpeta `web/`: Archivos del portal web interactivo.

---

## 💻 B. Instalación y Puesta en Marcha Local

### Paso 1: Descomprimir el Proyecto
Descomprime el archivo `.zip` en una carpeta local de tu preferencia, por ejemplo:
`C:\proyectos\tmo-automation`

### Paso 2: Instalar Dependencias de Node.js
Abre una terminal (PowerShell o CMD) en la carpeta descomprimida y ejecuta:
```bash
npm install
```
*(Si no tienes las dependencias preinstaladas, esto descargará `exceljs`, `nodemailer`, `chartjs-to-image`, etc.)*

### Paso 3: Configurar la Base de Datos en Supabase
1. Ingresa a tu panel de Supabase y abre el **SQL Editor**.
2. Copia todo el contenido del archivo `supabase_schema.sql`.
3. Pégalo en el editor y haz clic en **Run**.
4. Se crearán automáticamente las tablas:
   * `app_settings` (configuraciones de umbral y correos)
   * `agents` (directorio de asesores)
   * `tmo_runs` (historial de ejecuciones)
   * `tmo_records` (registros crudos)
   * `tmo_summaries` (resúmenes calculados)
   * `tmo_validations` (resultados de reglas y diagnóstico IA)
   * `email_logs` (trazabilidad de envíos)

### Paso 4: Iniciar el Servidor Web Local
En la terminal, ejecuta:
```bash
node server.js
```
El servidor quedará activo en: **`http://localhost:3333`**

---

## 🔄 C. Importación y Configuración en n8n

### Paso 1: Iniciar n8n
En otra ventana de terminal, ejecuta:
```bash
n8n
```
Abre tu navegador en: **`http://localhost:5678`**

### Paso 2: Importar los Flujos JSON
1. En n8n, haz clic en **Workflows** > botón de los tres puntos `...` (arriba a la derecha) > **Import from File**.
2. Selecciona primero `workflow_1_calculo_tmo.json` y guárdalo.
3. Repite el proceso para `workflow_2_validacion_ia.json`.

### Paso 3: Configurar Credenciales en n8n
* **Credencial SMTP (Correo Saliente):**
  * Abre el nodo **`Enviar Correo con Excel Consolidado`**.
  * En *Credential to connect with*, selecciona **Create New** > **SMTP**.
  * Host: `smtp.gmail.com` | Port: `465` (SSL activado) | User: tu correo | Pass: tu contraseña de aplicación.
* **Credencial PostgreSQL (Supabase):**
  * Abre el nodo **`Supabase - Leer app_settings`**.
  * Crea una credencial **Postgres** con los datos de conexión de tu proyecto Supabase (Host de conexión directa o pooler en puerto 5432 / 6543).
* **Credencial OpenAI (Asistente IA):**
  * En el Flujo 2, abre el nodo **`Asistente IA - Revisión y Detección de Anomalías`** y pega tu API Key.

---

## 🚀 D. Ejecución y Pruebas Paso a Paso

### Opción 1: Ejecución Directa desde el Portal Web
1. Abre tu navegador en **`http://localhost:3333`**.
2. En el panel superior derecho, verifica tu correo en el campo **Correo Destinatario**.
3. Haz clic en el botón **"Cargar Muestra (85 filas)"** o arrastra el archivo `gestiones_call_center_50plus.xlsx`.
4. El sistema calculará el TMO en vivo, mostrará las gráficas interactivas y clasificará los agentes.
5. Haz clic en **"Ejecutar Flujo n8n & Enviar por Correo"**.
6. En segundos, se generarán los libros Excel y recibirás las notificaciones en tu bandeja de entrada de Gmail.

### Opción 2: Ejecución desde el Canvas de n8n
1. En n8n, abre **Flujo 1**.
2. Haz clic en **Test workflow**.
3. El webhook procesará el archivo, validará duplicados con SHA-256, consolidará los datos y despachará el correo automáticamente.

---

## 🔍 E. Verificación y Resultados Esperados

Al finalizar una ejecución exitosa, debes comprobar:
1. **En tu Correo:**
   * Recibirás un correo con el asunto: `[REPORTE TMO CONSOLIDADO] Resultados del Equipo - TMO 19.55s`.
   * El archivo adjunto `reporte_consolidado_tmo.xlsx` debe contener 4 hojas funcionales y formateadas con gráficos de barras y donas.
2. **En la Base de Datos:**
   * La tabla `tmo_runs` debe tener un nuevo registro con estado `EXITOSO` y el hash SHA-256 del archivo.
   * La tabla `email_logs` registrará el envío con marca de tiempo.
3. **Control de Duplicados:**
   * Si intentas subir exactamente el mismo archivo por segunda vez, el sistema detectará el hash SHA-256 y evitará la duplicación de métricas.
