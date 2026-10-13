"""
Módulo de Configuración Central
Carga variables de entorno, rutas del sistema y especificaciones de IA y e-commerce.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Rutas del Proyecto
BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_DIR = BASE_DIR / "input_images"
OUTPUT_DIR = BASE_DIR / "output_images"
DATA_DIR = BASE_DIR / "data"

# Archivos clave
BASE_EXCEL_PATH = DATA_DIR / "Descripción y Beneficios.xlsx"
OUTPUT_EXCEL_PATH = DATA_DIR / "catalogo_final_consolidado.xlsx"
CACHE_PATH = DATA_DIR / "cache_progreso.json"

# Garantizar creación de carpetas
for folder in [INPUT_DIR, OUTPUT_DIR, DATA_DIR]:
    folder.mkdir(parents=True, exist_ok=True)

# Configuración API Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip()

# Especificaciones de imagen para E-commerce
CANVAS_SIZE = (1000, 1000)
CANVAS_BG_COLOR = (255, 255, 255)  # Blanco puro #FFFFFF
CANVAS_PADDING_RATIO = 0.88        # El producto ocupa ~88% del lienzo para dejar aire estético
