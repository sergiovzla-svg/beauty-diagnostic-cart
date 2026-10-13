"""
Servicio de Catálogo y Conciliación
- Carga y analiza el catálogo base (Descripción y Beneficios.xlsx).
- Concilia productos detectados en fotos con los registros existentes.
- Identifica productos del Excel base que NO están presentes en las fotos.
- Exporta el catálogo final enriquecido y estilizado profesionalmente en Excel.
"""
import logging
from pathlib import Path
import pandas as pd
from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

logger = logging.getLogger(__name__)


class CatalogService:
    def __init__(self, base_excel_path: Path):
        self.base_excel_path = base_excel_path
        self.df_base = self._cargar_catalogo_base()
        self.indices_coincidentes = set()

    def _cargar_catalogo_base(self) -> pd.DataFrame:
        if not self.base_excel_path.exists():
            logger.warning(
                f"No se encontró el archivo base en {self.base_excel_path}. Se iniciará con catálogo nuevo."
            )
            return pd.DataFrame()

        try:
            df = pd.read_excel(self.base_excel_path)
            df.columns = [str(c).replace("\n", " ").strip().upper() for c in df.columns]
            logger.info(f"Catálogo base cargado correctamente ({len(df)} registros).")
            return df
        except Exception as e:
            logger.error(f"Error al leer el archivo Excel base: {e}")
            return pd.DataFrame()

    def buscar_en_base(
        self, linea: str, categoria: str, variante: str, formato: str
    ) -> tuple[bool, str]:
        """
        Busca si el producto ya existe en el Excel base por coincidencias de palabras clave.
        Retorna: (encontrado: bool, resena_o_beneficios: str)
        """
        if self.df_base.empty:
            return False, ""

        linea_tokens = set(linea.lower().replace("serie expert", "").split())
        cat_token = categoria.lower().strip()

        for idx, row in self.df_base.iterrows():
            titulo = str(row.get("TITULO", "")).lower()
            nombre_sap = str(row.get("NOMBRE SAP", "")).lower()
            contenido = str(row.get("CONTENIDO", "")).lower()
            texto_busqueda = f"{titulo} {nombre_sap} {contenido}"

            coincide_cat = cat_token in texto_busqueda
            coincide_linea = any(token in texto_busqueda for token in linea_tokens if len(token) > 3)

            if coincide_cat and coincide_linea:
                self.indices_coincidentes.add(idx)

                beneficios = str(row.get("BENEFICIOS", "")).strip()
                descripcion = str(row.get("DESCRIPCIÓN", "")).strip()
                modo_uso = str(row.get("MODO DE  USO", "")).strip()

                partes = []
                if descripcion and descripcion != "nan":
                    partes.append(f"DESCRIPCIÓN:\n{descripcion}")
                if beneficios and beneficios != "nan":
                    partes.append(f"BENEFICIOS:\n{beneficios}")
                if modo_uso and modo_uso != "nan":
                    partes.append(f"MODO DE USO:\n{modo_uso}")

                resena_completa = "\n\n".join(partes)
                return True, resena_completa

        return False, ""

    def obtener_pendientes_sin_foto(self) -> pd.DataFrame:
        """
        Retorna un DataFrame con los productos del catálogo base que no tuvieron
        ninguna coincidencia con las fotos del lote actual.
        """
        if self.df_base.empty:
            return pd.DataFrame()

        indices_pendientes = [i for i in range(len(self.df_base)) if i not in self.indices_coincidentes]
        df_pendientes = self.df_base.iloc[indices_pendientes].copy()
        df_pendientes["ESTADO_REVISION"] = "PENDIENTE: Sin foto en lote actual"
        return df_pendientes

    @staticmethod
    def exportar_excel_completo(
        df_consolidados: pd.DataFrame,
        df_pendientes: pd.DataFrame,
        output_path: Path
    ):
        """
        Guarda el Excel enriquecido con dos hojas:
        1. 'Catálogo Consolidado': Productos con fotos procesadas y fichas completas.
        2. 'Base Sin Fotos': Productos del catálogo base pendientes de foto para revisión del usuario.
        """
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
            df_consolidados.to_excel(writer, index=False, sheet_name="Catálogo Consolidado")
            if not df_pendientes.empty:
                df_pendientes.to_excel(writer, index=False, sheet_name="Pendientes Sin Foto")

        wb = load_workbook(output_path)

        header_fill = PatternFill(start_color="1A1A1A", end_color="1A1A1A", fill_type="solid")
        header_font = Font(name="Calibri", size=11, bold=True, color="E5C158")
        align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
        align_left = Alignment(horizontal="left", vertical="center", wrap_text=True)

        border_thin = Side(style="thin", color="E0E0E0")
        cell_border = Border(top=border_thin, bottom=border_thin, left=border_thin, right=border_thin)

        for sheet_name in wb.sheetnames:
            ws = wb[sheet_name]

            # 1. Cabecera
            for col in ws.iter_cols(min_row=1, max_row=1):
                cell = col[0]
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = align_center

            # 2. Datos
            for row in ws.iter_rows(min_row=2, max_row=ws.max_row):
                for cell in row:
                    cell.border = cell_border
                    col_name = str(ws.cell(row=1, column=cell.column).value or "").upper()

                    if "PRECIO" in col_name and isinstance(cell.value, (int, float)):
                        cell.number_format = "$#,##0"
                        cell.alignment = Alignment(horizontal="right", vertical="center")
                    elif col_name in ["ID_PRODUCTO", "FORMATO_ML", "ESTADO_FICHA", "ESTADO_FOTO", "ESTADO_REVISION"]:
                        cell.alignment = align_center
                    else:
                        cell.alignment = align_left

            # 3. Anchos de Columna
            for col in ws.columns:
                col_letter = get_column_letter(col[0].column)
                col_header = str(col[0].value or "").upper()

                if any(k in col_header for k in ["RESENA", "DESCRIP", "BENEFICIO"]):
                    ws.column_dimensions[col_letter].width = 65
                elif any(k in col_header for k in ["NOMBRE", "TITULO", "FUENTES"]):
                    ws.column_dimensions[col_letter].width = 35
                else:
                    max_len = max(len(str(cell.value or "")) for cell in col)
                    ws.column_dimensions[col_letter].width = min(max(max_len + 4, 15), 32)

            ws.freeze_panes = "A2"
            ws.auto_filter.ref = ws.dimensions

        wb.save(output_path)

        # Generar automáticamente miniaturas y la hoja 'Control de Inventario'
        try:
            from src.inventory_sheet import actualizar_excel_completo
            actualizar_excel_completo(output_path)
        except Exception as e:
            logger.error(f"Error enriqueciendo Excel con miniaturas e inventario: {e}")

        logger.info(f"Excel consolidado generado con éxito en: {output_path}")
