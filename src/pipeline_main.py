"""
Pipeline Principal de Automatización y Estandarización de Catálogo L'Oréal Professionnel
Orquesta las Fases 1 a 4:
- Detección Visual y Estandarización de Imágenes (1000x1000 #FFFFFF).
- Conciliación con Catálogo Base y Redacción IA de Faltantes.
- Tasación Comercial (Valores CLP actuales e históricos en Chile).
- Exportación Consolidada en Excel y Detección de Productos Base Sin Foto.
"""
import json
import logging
import sys
import time
from pathlib import Path
import pandas as pd
from tqdm import tqdm

from src.config import (
    INPUT_DIR,
    OUTPUT_DIR,
    BASE_EXCEL_PATH,
    OUTPUT_EXCEL_PATH,
    CACHE_PATH,
    GEMINI_API_KEY,
)
from src.gemini_service import GeminiService
from src.image_service import procesar_imagen_ecommerce
from src.catalog_service import CatalogService

# Configurar logging con soporte limpio para Windows
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("LorealPipeline")


def cargar_cache() -> dict:
    if CACHE_PATH.exists():
        try:
            with open(CACHE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"No se pudo leer caché ({e}). Se creará nuevo.")
            return {}
    return {}


def guardar_cache(cache: dict):
    try:
        with open(CACHE_PATH, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Error guardando caché: {e}")


def main():
    logger.info("=== INICIANDO PIPELINE DE CATALOGO L'OREAL PROFESSIONNEL ===")

    if not GEMINI_API_KEY:
        logger.error("CRITICO: No se ha configurado 'GEMINI_API_KEY' en el archivo .env.")
        print("\n[!] Por favor, configura tu API Key en el archivo .env:")
        print("    GEMINI_API_KEY=tu_api_key_aqui\n")
        return

    # 1. Inicializar servicios
    gemini = GeminiService()
    catalogo = CatalogService(BASE_EXCEL_PATH)
    cache = cargar_cache()

    # 2. Detectar imágenes (incluye subcarpetas como 'Nuevas fotos')
    extensiones_validas = {".png", ".jpg", ".jpeg", ".webp"}
    imagenes = [
        f for f in sorted(INPUT_DIR.rglob("*"))
        if f.is_file() and f.suffix.lower() in extensiones_validas
    ]

    if not imagenes:
        logger.warning(f"No hay imágenes en '{INPUT_DIR}'. Nada que procesar.")
        return

    logger.info(f"Total imágenes detectadas: {len(imagenes)}")
    logger.info(f"Imágenes ya procesadas en caché: {len(cache)}")

    items_consolidados = []
    slugs_usados = set()

    # Pre-cargar slugs ya utilizados de la caché
    for item in cache.values():
        if "Nombre_Archivo_Imagen" in item:
            slugs_usados.add(item["Nombre_Archivo_Imagen"].replace(".png", ""))

    for idx, img_path in enumerate(tqdm(imagenes, desc="Procesando Catálogo"), start=1):
        img_name = img_path.name

        # Recuperar de caché si ya fue procesada anteriormente
        if img_name in cache:
            item_data = cache[img_name]
        else:
            logger.info(f"\n[{idx}/{len(imagenes)}] Procesando: {img_name}")

            # FASE 1, 2 y 3 (Llamada optimizada única): Detección Visual, Reseña y Tasación
            detalles = gemini.procesar_producto_completo(img_path)
            if not detalles:
                logger.warning(f"Saltando {img_name} tras reintentos agotados.")
                continue

            slug = detalles.slug_archivo
            contador_sufijo = 1
            slug_base = slug
            while slug in slugs_usados:
                slug = f"{slug_base}-{contador_sufijo}"
                contador_sufijo += 1
            slugs_usados.add(slug)

            out_img_name = f"{slug}.png"
            out_img_path = OUTPUT_DIR / out_img_name

            # FASE 1B: Procesamiento de imagen: rembg (u2net) + centrado 1000x1000 blanco #FFFFFF
            procesar_imagen_ecommerce(
                input_path=img_path,
                output_path=out_img_path,
                requiere_recorte=detalles.requiere_recorte,
            )

            # FASE 2: Conciliación con Catálogo Base
            nombre_completo = (
                f"{detalles.categoria} {detalles.linea_comercial} {detalles.variante_detalle}".strip()
            )

            existe_en_base, resena_existente = catalogo.buscar_en_base(
                linea=detalles.linea_comercial,
                categoria=detalles.categoria,
                variante=detalles.variante_detalle,
                formato=detalles.volumen_peso,
            )

            if existe_en_base and resena_existente:
                resena_final = resena_existente
                estado_ficha = "Existente en Excel original"
            else:
                resena_final = detalles.resena_comercial
                estado_ficha = "Completado por IA"

            item_data = {
                "Nombre_Archivo_Imagen": out_img_name,
                "Nombre_Comercial_Completo": nombre_completo,
                "Linea": detalles.linea_comercial,
                "Formato_ml": detalles.volumen_peso,
                "Resena_Para_Que_Sirve": resena_final,
                "Precio_Historico_Estimado_CLP": detalles.precio_historico_clp,
                "Precio_Actual_Mercado_CLP": detalles.precio_actual_clp,
                "Rango_Precios_Actual": detalles.rango_actual_texto,
                "Fuentes_Referencia": detalles.fuentes_referencia,
                "Estado_Ficha": estado_ficha,
                "Estado_Foto": "Foto Procesada en Lote",
            }

            # Guardar checkpoint incremental
            cache[img_name] = item_data
            guardar_cache(cache)

            # Pausa de cortesía para mantenerse holgadamente bajo el límite de peticiones por minuto (Free Tier)
            time.sleep(6.0)

        items_consolidados.append(item_data)

    # FASE 4: Consolidación y Exportación Final
    if not items_consolidados:
        logger.warning("No se generaron registros para consolidar.")
        return

    df_export = pd.DataFrame(items_consolidados)
    df_export.insert(0, "ID_Producto", [f"LOR-{i+1:04d}" for i in range(len(df_export))])

    # Extraer productos del catálogo base que no tuvieron foto en este lote
    df_pendientes = catalogo.obtener_pendientes_sin_foto()

    # Guardar archivo Excel enriquecido con estilos profesionales
    catalogo.exportar_excel_completo(df_export, df_pendientes, OUTPUT_EXCEL_PATH)

    logger.info(
        f"\n========================================================"
        f"\n PROCESO COMPLETADO EXITOSAMENTE"
        f"\n - Productos procesados con fotos: {len(df_export)}"
        f"\n - Productos base sin foto (para revisión): {len(df_pendientes)}"
        f"\n - Archivo Excel final: {OUTPUT_EXCEL_PATH}"
        f"\n - Imágenes optimizadas en: {OUTPUT_DIR}"
        f"\n========================================================"
    )


if __name__ == "__main__":
    main()
