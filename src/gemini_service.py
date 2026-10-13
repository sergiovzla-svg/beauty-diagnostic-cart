"""
Integración con Google GenAI SDK (gemini-3.5-flash)
Procesamiento integral por imagen en 1 sola llamada multimodal:
- Detección técnica del producto y formato.
- Slug kebab-case limpio para e-commerce.
- Determinación de necesidad de recorte de fondo.
- Redacción de reseña y beneficios en tono oficial L'Oréal.
- Tasación de mercado chileno (CLP actual e histórico 2022-2023).
- Sistema de reintento automático con backoff inteligente en caso de cuota por minuto.
"""
import json
import logging
import re
import time
from pathlib import Path
from typing import Optional
from PIL import Image

from google import genai
from google.genai import types

from src.config import GEMINI_API_KEY, GEMINI_MODEL
from src.models import ProductoUnificado

logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self):
        if not GEMINI_API_KEY:
            raise ValueError(
                "No se encontró GEMINI_API_KEY. Por favor configúrala en el archivo .env"
            )
        self.client = genai.Client(api_key=GEMINI_API_KEY)

    def procesar_producto_completo(self, image_path: Path) -> Optional[ProductoUnificado]:
        """
        Ejecuta el análisis visual, redacción comercial y tasación en 1 sola llamada optimizada.
        Incluye reintento automático si se alcanza un límite temporal de tasa por minuto.
        """
        prompt = (
            f"Actúa como un especialista senior en el catálogo oficial de L'Oréal Professionnel "
            f"y experto en fijación de precios de belleza profesional en Chile.\n\n"
            f"Analiza la siguiente imagen de producto.\n"
            f"Nombre de archivo original como contexto: '{image_path.name}'.\n\n"
            f"Completa con máxima fidelidad:\n"
            f"1. categoria: ej. Shampoo, Máscara, Acondicionador, Sérum, Aceite, Spray, Crema, etc.\n"
            f"2. linea_comercial: ej. Serie Expert, Metal Detox, Absolut Repair, Vitamino Color, Liss Unlimited, Pro Fiber, Mythic Oil, Inforcer, etc.\n"
            f"3. variante_detalle: ej. Gold Quinoa + Protein, Resveratrol, Citramine, Inforcer, Lipidium, etc.\n"
            f"4. volumen_peso: formato normalizado, ej. 300ml, 500ml, 1500ml, 200ml, 250ml, 90ml, 125ml.\n"
            f"5. slug_archivo: kebab-case estricto sin tildes ni caracteres especiales, ej. 'shampoo-absolut-repair-gold-quinoa-300ml'.\n"
            f"6. requiere_recorte: True si la foto tiene fondo real casero, mesa o estante; False si ya viene con fondo blanco de estudio o es transparente.\n"
            f"7. resena_comercial: descripción profesional, para qué sirve, tipo de cabello y beneficios clave (máximo 100 palabras en tono L'Oréal).\n"
            f"8. precio_actual_clp: número entero en pesos chilenos (CLP) representativo de venta a público en Chile (Falabella, Paris, Pichara, etc.).\n"
            f"9. precio_historico_clp: número entero en CLP del valor referencial en Chile hace 3-4 años (período 2022-2023).\n"
            f"10. rango_actual_texto: texto ej. '$17.990 - $21.990 CLP'.\n"
            f"11. fuentes_referencia: tiendas o salones en Chile (ej. 'Falabella, Paris, Pichara, Salcobrand')."
        )

        modelos = [GEMINI_MODEL, "gemini-3.5-flash-lite", "gemini-3.6-flash"]
        # Eliminar duplicados manteniendo orden
        modelos_disponibles = []
        for m in modelos:
            if m not in modelos_disponibles:
                modelos_disponibles.append(m)

        for modelo_actual in modelos_disponibles:
            max_intentos = 3
            for intento in range(1, max_intentos + 1):
                try:
                    with Image.open(image_path) as pil_img:
                        rgb_img = pil_img.convert("RGB")
                        if max(rgb_img.size) > 1600:
                            rgb_img.thumbnail((1600, 1600), Image.Resampling.LANCZOS)

                        response = self.client.models.generate_content(
                            model=modelo_actual,
                            contents=[rgb_img, prompt],
                            config=types.GenerateContentConfig(
                                response_mime_type="application/json",
                                response_schema=ProductoUnificado,
                                temperature=0.1,
                            ),
                        )

                    data = json.loads(response.text)
                    return ProductoUnificado(**data)

                except Exception as e:
                    err_str = str(e)
                    es_cuota_diaria = "GenerateRequestsPerDay" in err_str or "limit: 20" in err_str
                    es_cuota_rpm = "429" in err_str or "RESOURCE_EXHAUSTED" in err_str
                    es_saturacion = "503" in err_str or "UNAVAILABLE" in err_str

                    if es_cuota_diaria:
                        logger.warning(f"Límite diario alcanzado en {modelo_actual}. Cambiando a modelo alternativo...")
                        break  # Pasa al siguiente modelo disponible

                    if es_cuota_rpm or es_saturacion:
                        match = re.search(r"retry in (\d+(?:\.\d+)?)", err_str, re.IGNORECASE)
                        if match:
                            wait_sec = int(float(match.group(1))) + 2
                        else:
                            wait_sec = min(15 + (intento * 10), 30)

                        tipo_error = "Rate Limit (429)" if es_cuota_rpm else "Servidores saturados (503)"
                        logger.warning(
                            f"[{tipo_error}] en {modelo_actual} para {image_path.name}."
                        )
                        # Cuenta regresiva visible para no dar impresión de congelamiento
                        for sec_left in range(wait_sec, 0, -1):
                            sys.stdout.write(f"\r  [Pausa activa] Reintentando en {sec_left}s... ")
                            sys.stdout.flush()
                            time.sleep(1)
                        sys.stdout.write("\r                                                 \r")
                        sys.stdout.flush()
                    else:
                        logger.error(f"Error procesando {image_path.name} con {modelo_actual}: {e}")
                        if intento == max_intentos:
                            break
                        time.sleep(3)

        return None
