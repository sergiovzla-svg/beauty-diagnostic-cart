"""
Servicio de Procesamiento de Imágenes para E-commerce
Maneja remoción de fondo con rembg (u2net optimizado), autocrop de bordes vacíos,
redimensionado proporcional y centrado sobre lienzo cuadrado blanco puro (#FFFFFF).
"""
import io
import logging
from pathlib import Path
from PIL import Image, ImageOps

from src.config import CANVAS_SIZE, CANVAS_BG_COLOR, CANVAS_PADDING_RATIO

logger = logging.getLogger(__name__)

# Carga de sesión u2net persistente para máxima eficiencia
REMBG_SESSION = None
try:
    from rembg import remove as rembg_remove, new_session
    REMBG_SESSION = new_session("u2net")
    logger.info("Modelo de remoción de fondo rembg (u2net) inicializado correctamente.")
except Exception as e:
    logger.warning(f"rembg no disponible ({e}). Se aplicará estandarización de lienzo sin remoción por IA.")


def procesar_imagen_ecommerce(
    input_path: Path,
    output_path: Path,
    requiere_recorte: bool = True
) -> bool:
    """
    Procesa una imagen para catálogo e-commerce:
    1. Corrige orientación EXIF (fotos tomadas con smartphones).
    2. Pre-escala fotos gigantescas (ej. 12MP/iPhone) a un tamaño de trabajo seguro (1500px máx)
       para optimizar uso de memoria y multiplicar la velocidad por 10x.
    3. Remueve fondo con rembg (u2net) si requiere_recorte=True.
    4. Autocrop para eliminar bordes vacíos/transparentes.
    5. Centra sobre lienzo 1000x1000 px blanco (#FFFFFF) con margen e-commerce.
    """
    try:
        with Image.open(input_path) as raw_img:
            img = ImageOps.exif_transpose(raw_img)
            # Pre-escalado preventivo para fotos ultra-HD de celular
            if max(img.size) > 1600:
                img.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
            img = img.convert("RGBA")

        # 1. Remoción de fondo si aplica
        if requiere_recorte and REMBG_SESSION is not None:
            buffer_in = io.BytesIO()
            img.save(buffer_in, format="PNG")
            img_bytes = rembg_remove(buffer_in.getvalue(), session=REMBG_SESSION)
            img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")

        # 2. Autocrop: recortar espacios vacíos / transparentes
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)

        # 3. Escalar proporcionalmente al lienzo objetivo (1000x1000) con padding estético
        target_w, target_h = CANVAS_SIZE
        max_content_w = int(target_w * CANVAS_PADDING_RATIO)
        max_content_h = int(target_h * CANVAS_PADDING_RATIO)

        img.thumbnail((max_content_w, max_content_h), Image.Resampling.LANCZOS)

        # 4. Crear lienzo blanco puro y centrar producto
        canvas = Image.new("RGB", CANVAS_SIZE, CANVAS_BG_COLOR)
        offset_x = (target_w - img.width) // 2
        offset_y = (target_h - img.height) // 2

        # Pegar usando canal alfa como máscara si tiene transparencia
        if img.mode == "RGBA":
            canvas.paste(img, (offset_x, offset_y), mask=img.split()[3])
        else:
            canvas.paste(img, (offset_x, offset_y))

        # 5. Guardar resultado final optimizado
        output_path.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(output_path, format="PNG", optimize=True)
        return True

    except Exception as e:
        logger.error(f"Error procesando imagen {input_path.name}: {e}")
        return False
