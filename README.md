# Catálogo, Diagnóstico Capilar y Control de Inventario L'Oréal Professionnel 💄📦

Sistema integral que combina:
1. **Pipeline de IA & Visión Computacional:** Procesamiento de fotos de inventario con rembg y enriquecimiento multimodal con Google Gemini.
2. **Web App E-commerce & Diagnóstico Capilar:** Aplicación web moderna con diagnóstico personalizado, catálogo de 62 productos en stock, buscador en tiempo real, carrito sincronizado y checkout directo por WhatsApp.
3. **Control de Inventario y Tasación:** Planilla Excel interactiva con KPIs dinámicos, miniaturas y valorización comercial en CLP.

🌐 **Sitio Web en Vivo:** [https://liquidacion-productos-loreal.netlify.app/](https://liquidacion-productos-loreal.netlify.app/)

---

## 📌 Descripción del Proyecto

El proyecto resuelve el ciclo completo de liquidación y venta de productos profesionales: desde la captura de fotos físicas en bodega hasta la venta consultiva digital por WhatsApp.

### Capacidades Principales:

#### 1. 🌐 Web App de Venta & Diagnóstico Capilar (`/web`):
* **Diagnóstico Capilar Guiado (4 pasos):** Asesora a la clienta según textura, estado de la raíz, procesos químicos (decoloración, tintura, alisado) y objetivo deseado para recomendar una rutina completa personalizada.
* **Catálogo Completo & Buscador en Tiempo Real:** 62 productos catalogados con búsqueda instantánea por palabras clave (ej: *Inforcer, Absolut Repair, Blondifier*) y filtros rápidos por categoría (*Shampoo, Mascarilla, Acondicionador, Tratamientos, Peinado*).
* **Carrito y Checkout WhatsApp:** Reserva de productos sincronizada entre el test de diagnóstico y el catálogo general, generando un mensaje ordenado y valorizado para coordinar entrega por WhatsApp.
* **Seguridad y Rendimiento Grado "A":** Desplegado en Netlify con cabeceras de seguridad estrictas (`CSP`, `HSTS`, `X-Frame-Options`, `Permissions-Policy`), Open Graph optimizado para WhatsApp y Core Web Vitals accesibles.

#### 2. 🤖 Automatización Visual con IA (Pipeline Python):
* **Estandarización de Fotos:** Remoción de fondos reales mediante `rembg` (red neuronal U2Net) y montaje en lienzo cuadrado de **1000 × 1000 px** sobre fondo blanco puro (`#FFFFFF`).
* **Enriquecimiento Multimodal con Google Gemini:** Detección de formato, línea, beneficios y modo de uso con lenguaje profesional de salón.
* **Sincronizador Automático Excel → Web (`src/export_web.py`):** Un solo comando actualiza el catálogo web y las fotos directamente desde la planilla de inventario.

---

## 🗂️ Estructura del Repositorio

```text
Loreal venta/
├── web/                                   # Web App estática de Diagnóstico y Venta
│   ├── index.html                         # SPA con diagnóstico, buscador y catálogo
│   ├── style.css                          # Sistema de diseño de alta gama L'Oréal (oro y negro)
│   ├── app.js                             # Lógica de diagnóstico, carrito y WhatsApp checkout
│   ├── _headers                           # Cabeceras de seguridad HTTP para Netlify (Nota A)
│   ├── og-preview.jpg                     # Vista previa optimizada para WhatsApp (60 KB)
│   ├── data/
│   │   ├── productos.json                 # Catálogo maestro consumido por la web
│   │   └── productos.js                   # Catálogo para ejecución sin servidor / offline
│   └── images/                            # Fotografías estandarizadas 1000x1000
├── src/
│   ├── config.py                          # Configuración, rutas y especificaciones visuales
│   ├── models.py                          # Esquemas estructurados con Pydantic
│   ├── gemini_service.py                  # Cliente Gemini API con reintentos y backoff
│   ├── image_service.py                   # Recorte rembg, centrado y composición PIL
│   ├── catalog_service.py                 # Cruce con catálogo base y exportación Excel
│   ├── export_web.py                      # Exportador del Excel consolidado a la Web App
│   └── inventory_sheet.py                 # Generador de KPIs, miniaturas y hoja de inventario
├── data/                                  # Datos confidenciales (ignorado en git)
├── actualizar_web.bat                     # Script de 1 clic para sincronizar Excel -> Web
├── netlify.toml                           # Configuración de despliegue continuo en Netlify
├── .env.example                           # Plantilla de variables de entorno
├── main.py                                # Orquestador del pipeline de imágenes e IA
├── requirements.txt                       # Dependencias de Python
└── README.md                              # Documentación del proyecto
```

---

## 📊 Estructura del Archivo Excel Final (`catalogo_final_consolidado.xlsx`)

El archivo de salida contiene tres hojas especializadas:

### 1. 📋 Hoja `Control de Inventario` (Hoja Principal de Conteo)
Diseñada para realizar el inventario físico en bodega o salón con actualización en tiempo real:
* **Tarjetas KPI Superiores:**
  * `Total Ítems con Foto`: Muestra el total de productos catalogados.
  * `Total Unidades Contadas`: Suma dinámica de todo el stock ingresado.
  * `Valor Total Inventario ($ CLP)`: Total valorizado en pesos chilenos según precios de venta.
  * `Precio Promedio / Unidad`: Ticket promedio del inventario.
* **Columnas de Trabajo:**
  * `ID Producto` correlativo (`LOR-0001` en adelante).
  * **`Miniatura`**: Fotografía frontal del producto a 50×50 px en la celda.
  * `Línea Comercial` y `Nombre Comercial Completo` (ordenados por familia para contar estante por estante).
  * `Formato` (200ml, 300ml, 500ml, etc.).
  * **`Conteo Físico (Unidades)`**: Celda editable resaltada en tono marfil suave.
  * `Estado del Envase`: Menú desplegable (*Nuevo / Sellado*, *Sin caja / Con detalle*, *Abierto / Tester*, *Próximo a vencer*).
  * `Precio Mercado Ref.` y `Mi Precio Venta (CLP)`.
  * `Subtotal Valorizado (CLP)`: Fórmula automática `=Unidades * Precio Venta`.
  * `Ubicación / Estante`: Para registrar la posición física del producto.

### 2. 📖 Hoja `Catálogo Consolidado`
Ficha técnica completa de todos los productos fotografiados:
* Miniatura frontal, nombre de archivo PNG, descripción de beneficios, modo de uso, precios actuales e históricos, rangos de mercado y fuentes de referencia.

### 3. 🔍 Hoja `Pendientes Sin Foto`
Listado filtrado de los productos existentes en el catálogo base que no tuvieron fotografía en el lote actual, útil para identificar faltantes.

---

## 🚀 Instalación y Configuración

### 1. Prerrequisitos
* Python 3.10 o superior instalado.
* Conexión a Internet (para la API de Gemini y la descarga inicial del modelo U2Net de `rembg`).

### 2. Instalar Dependencias
En la raíz del proyecto, ejecuta en tu terminal:
```bash
pip install -r requirements.txt
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz (puedes duplicar `.env.example`) y agrega tu API Key de Google Gemini:
```env
GEMINI_API_KEY=tu_clave_de_gemini_aqui
GEMINI_MODEL=gemini-3.5-flash-lite
```

---

## 💻 Uso del Sistema

### Ejecución Completa del Pipeline
Para procesar las imágenes de `input_images/`, estandarizarlas, consultar la IA y generar el Excel:
```bash
python main.py
```

### Solo Actualizar / Regenerar la Hoja de Inventario y Miniaturas
Si ya tienes las imágenes procesadas y solo deseas regenerar el diseño del Excel o actualizar las fórmulas y miniaturas:
```bash
python -m src.inventory_sheet
```

---

## ⚡ Manejo de Caché y Tolerancia a Fallos

* El archivo `data/cache_progreso.json` guarda de manera incremental cada producto analizado por la IA.
* Si el proceso se interrumpe (por cuota de API, conexión o cierre inesperado), al volver a ejecutar `python main.py` **el sistema reanuda automáticamente desde el punto exacto donde quedó**, sin gastar llamadas duplicadas ni reprocesar imágenes ya completadas.
