"""
Esquemas Pydantic para salida estructurada con Gemini
"""
from typing import Union, List
from pydantic import BaseModel, Field, field_validator


class ProductoUnificado(BaseModel):
    categoria: str = Field(
        description="Categoría del producto: Shampoo, Máscara, Acondicionador, Sérum, Aceite, Spray, Crema, etc."
    )
    linea_comercial: str = Field(
        description="Línea comercial exacta: ej. Serie Expert, Metal Detox, Absolut Repair, Vitamino Color, Liss Unlimited, Pro Fiber, Mythic Oil, etc."
    )
    variante_detalle: str = Field(
        description="Detalle o ingrediente clave: ej. Gold Quinoa, Resveratrol, Citramine, Inforcer, Lipidium, etc."
    )
    volumen_peso: str = Field(
        description="Contenido en formato estándar: ej. 200ml, 250ml, 300ml, 500ml, 750ml, 1500ml, 90ml, 125ml"
    )
    slug_archivo: str = Field(
        description="Slug limpio en kebab-case sin tildes ni caracteres especiales: ej. 'shampoo-absolut-repair-gold-quinoa-300ml'"
    )
    requiere_recorte: bool = Field(
        description="True si la foto tiene fondo real casero/estante. False si ya viene con fondo blanco de estudio o transparente."
    )
    resena_comercial: str = Field(
        description="Ficha oficial L'Oreal: descripción, para qué sirve, tipo de cabello y beneficios clave (máx 100 palabras)"
    )
    precio_actual_clp: int = Field(
        default=0,
        description="Precio promedio actual en Chile en CLP (entero sin puntos)"
    )
    precio_historico_clp: int = Field(
        default=0,
        description="Precio referencial estimado 2022-2023 en CLP (entero sin puntos)"
    )
    rango_actual_texto: str = Field(
        default="Consultar en tienda",
        description="Rango actual en formato texto, ej. '$17.990 - $21.990 CLP'"
    )
    fuentes_referencia: Union[str, List[str]] = Field(
        default="Retail / Salones Chile",
        description="Tiendas de referencia en Chile (Falabella, Paris, Pichara, etc.)"
    )

    @field_validator("fuentes_referencia", mode="after")
    def normalizar_fuentes(cls, v):
        if isinstance(v, list):
            return ", ".join(v)
        return str(v)
