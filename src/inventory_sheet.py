"""
Generador de la Hoja de Control de Inventario y Catálogo con Miniaturas
Incrusta miniaturas fotográficas optimizadas tanto en 'Control de Inventario' como en 'Catálogo Consolidado'.
"""
from pathlib import Path
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.drawing.image import Image as OpenpyxlImage
from PIL import Image as PILImage


def obtener_o_crear_miniatura(img_name: str, base_dir: Path, thumbs_dir: Path) -> Path:
    """Genera una miniatura optimizada de 90x90 para inserción limpia en celdas."""
    thumb_path = thumbs_dir / f"thumb_{img_name}"
    if not thumb_path.exists():
        src_img = base_dir / "output_images" / img_name
        if src_img.exists():
            with PILImage.open(src_img) as pim:
                pim_thumb = pim.copy()
                pim_thumb.thumbnail((90, 90), PILImage.Resampling.LANCZOS)
                pim_thumb.save(thumb_path, "PNG", optimize=True)
    return thumb_path


def agregar_hoja_inventario(excel_path: Path):
    """
    Crea la hoja 'Control de Inventario' con miniaturas, KPIs, fórmulas y validaciones.
    """
    wb = openpyxl.load_workbook(excel_path)
    base_dir = excel_path.parent.parent
    thumbs_dir = excel_path.parent / "thumbnails"
    thumbs_dir.mkdir(parents=True, exist_ok=True)

    datos_previos = {}
    if "Control de Inventario" in wb.sheetnames:
        ws_prev = wb["Control de Inventario"]
        for r_idx in range(8, ws_prev.max_row + 1):
            foto_val = ws_prev.cell(row=r_idx, column=12).value
            id_val = ws_prev.cell(row=r_idx, column=1).value
            conteo = ws_prev.cell(row=r_idx, column=6).value
            estado = ws_prev.cell(row=r_idx, column=7).value
            p_venta = ws_prev.cell(row=r_idx, column=9).value
            ubic = ws_prev.cell(row=r_idx, column=11).value
            key = str(foto_val or id_val or "").strip()
            if key and (conteo is not None or ubic):
                datos_previos[key] = {
                    "conteo": conteo,
                    "estado": estado,
                    "p_venta": p_venta,
                    "ubicacion": ubic,
                }
        del wb["Control de Inventario"]

    ws_cat = wb["Catálogo Consolidado"]
    headers = [cell.value for cell in ws_cat[1]]
    rows_data = []
    for row in ws_cat.iter_rows(min_row=2, values_only=True):
        row_dict = dict(zip(headers, row))
        rows_data.append(row_dict)

    # Ordenar por Línea y luego Nombre Comercial
    rows_data.sort(
        key=lambda x: (
            str(x.get("Linea") or "").lower(),
            str(x.get("Nombre_Comercial_Completo") or "").lower(),
        )
    )

    ws = wb.create_sheet("Control de Inventario", 0)
    ws.views.sheetView[0].showGridLines = True

    # Estilos L'Oréal Luxury
    gold_accent = "D4AF37"
    charcoal_dark = "1C1C1C"
    charcoal_light = "2B2B2B"
    gray_light = "F9FAFB"
    gray_border = "D1D5DB"
    input_highlight = "FEF9C3"
    kpi_bg = "18181B"

    font_title = Font(name="Calibri", size=13, bold=True, color="FFFFFF")
    font_subtitle = Font(name="Calibri", size=9, italic=True, color="D1D5DB")
    font_kpi_label = Font(name="Calibri", size=8, bold=True, color=gold_accent)
    font_kpi_value = Font(name="Calibri", size=14, bold=True, color="FFFFFF")
    font_th = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
    font_th_input = Font(name="Calibri", size=10, bold=True, color=gold_accent)
    font_data = Font(name="Calibri", size=10)
    font_total = Font(name="Calibri", size=10, bold=True, color="FFFFFF")

    fill_title = PatternFill("solid", fgColor=charcoal_dark)
    fill_kpi = PatternFill("solid", fgColor=kpi_bg)
    fill_th = PatternFill("solid", fgColor=charcoal_dark)
    fill_th_input = PatternFill("solid", fgColor=charcoal_light)
    fill_zebra = PatternFill("solid", fgColor=gray_light)
    fill_input = PatternFill("solid", fgColor=input_highlight)
    fill_total = PatternFill("solid", fgColor=charcoal_dark)

    border_thin = Border(
        left=Side(style="thin", color=gray_border),
        right=Side(style="thin", color=gray_border),
        top=Side(style="thin", color=gray_border),
        bottom=Side(style="thin", color=gray_border),
    )

    # 1. Banner Superior (A1:L2)
    ws.merge_cells("A1:L1")
    ws["A1"] = "CONTROL DE INVENTARIO FÍSICO Y VALORIZACIÓN - L'ORÉAL PROFESSIONNEL"
    ws["A1"].font = font_title
    ws["A1"].fill = fill_title
    ws["A1"].alignment = Alignment(horizontal="center", vertical="center")

    ws.merge_cells("A2:L2")
    ws["A2"] = "Instrucciones: Ingrese la cantidad en 'Conteo Físico'. Las tarjetas KPI y el total valorizado se calculan automáticamente."
    ws["A2"].font = font_subtitle
    ws["A2"].fill = fill_title
    ws["A2"].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 24
    ws.row_dimensions[2].height = 18

    # 2. Tarjetas KPI (Filas 4 y 5)
    kpis = [
        ("B4:C4", "B5:C5", "TOTAL ÍTEMS CON FOTO", "=COUNTA(A8:A75)", "#,##0"),
        ("E4:F4", "E5:F5", "TOTAL UNIDADES CONTADAS", "=SUM(F8:F75)", "#,##0"),
        ("H4:I4", "H5:I5", "VALOR TOTAL INVENTARIO", "=SUM(J8:J75)", "$#,##0"),
        ("K4:L4", "K5:L5", "PRECIO PROMEDIO / UNIDAD", "=IF(F5>0, I5/F5, 0)", "$#,##0"),
    ]

    for label_range, val_range, label, formula, num_fmt in kpis:
        ws.merge_cells(label_range)
        ws.merge_cells(val_range)
        c_label = ws[label_range.split(":")[0]]
        c_val = ws[val_range.split(":")[0]]

        c_label.value = label
        c_label.font = font_kpi_label
        c_label.fill = fill_kpi
        c_label.alignment = Alignment(horizontal="center", vertical="center")

        c_val.value = formula
        c_val.font = font_kpi_value
        c_val.fill = fill_kpi
        c_val.alignment = Alignment(horizontal="center", vertical="center")
        c_val.number_format = num_fmt

    ws.row_dimensions[4].height = 16
    ws.row_dimensions[5].height = 24

    # 3. Encabezados de Tabla (Fila 7)
    headers_inv = [
        ("A7", "ID Producto"),
        ("B7", "Miniatura"),
        ("C7", "Línea Comercial"),
        ("D7", "Nombre Comercial Completo"),
        ("E7", "Formato"),
        ("F7", "Conteo Físico (Unidades)"),
        ("G7", "Estado del Envase"),
        ("H7", "Precio Mercado Ref."),
        ("I7", "Mi Precio Venta (CLP)"),
        ("J7", "Subtotal Valorizado (CLP)"),
        ("K7", "Ubicación / Estante"),
        ("L7", "Foto Referencia"),
    ]

    ws.row_dimensions[7].height = 28
    for cell_ref, text in headers_inv:
        cell = ws[cell_ref]
        cell.value = text
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        if "Conteo" in text:
            cell.fill = fill_th_input
            cell.font = font_th_input
        else:
            cell.fill = fill_th
            cell.font = font_th

    # Validación de datos para Estado del Envase
    dv_estado = DataValidation(
        type="list",
        formula1='"Nuevo / Sellado,Sin caja / Con detalle,Abierto / Tester,Próximo a vencer"',
        allow_blank=True,
    )
    dv_estado.error = "Seleccione un estado válido de la lista desplegable"
    dv_estado.errorTitle = "Estado inválido"
    ws.add_data_validation(dv_estado)

    # 4. Inserción de Datos (Filas 8 a 75)
    start_row = 8
    for idx, r in enumerate(rows_data):
        current_row = start_row + idx
        ws.row_dimensions[current_row].height = 48
        is_even = (idx % 2 == 0)
        row_fill = fill_zebra if is_even else PatternFill(fill_type=None)

        # Col A: ID
        ws.cell(row=current_row, column=1, value=r.get("ID_Producto")).alignment = Alignment(horizontal="center", vertical="center")

        # Col B: Miniatura
        c_thumb = ws.cell(row=current_row, column=2)
        c_thumb.alignment = Alignment(horizontal="center", vertical="center")
        img_name = r.get("Nombre_Archivo_Imagen")
        if img_name:
            t_path = obtener_o_crear_miniatura(img_name, base_dir, thumbs_dir)
            if t_path.exists():
                xl_img = OpenpyxlImage(str(t_path))
                xl_img.width = 50
                xl_img.height = 50
                ws.add_image(xl_img, f"B{current_row}")

        # Col C: Línea
        ws.cell(row=current_row, column=3, value=r.get("Linea")).alignment = Alignment(horizontal="left", vertical="center")
        # Col D: Nombre Comercial
        ws.cell(row=current_row, column=4, value=r.get("Nombre_Comercial_Completo")).alignment = Alignment(horizontal="left", vertical="center")
        # Col E: Formato
        ws.cell(row=current_row, column=5, value=r.get("Formato_ml")).alignment = Alignment(horizontal="center", vertical="center")

        prev_info = datos_previos.get(str(img_name or "").strip()) or datos_previos.get(str(r.get("ID_Producto") or "").strip(), {})

        # Col F: Conteo Físico
        c_unidades = ws.cell(row=current_row, column=6)
        c_unidades.value = prev_info.get("conteo", None)
        c_unidades.alignment = Alignment(horizontal="center", vertical="center")
        c_unidades.number_format = "#,##0"
        c_unidades.fill = fill_input

        # Col G: Estado del Envase
        estado_val = prev_info.get("estado", "Nuevo / Sellado")
        c_estado = ws.cell(row=current_row, column=7, value=estado_val)
        c_estado.alignment = Alignment(horizontal="center", vertical="center")
        dv_estado.add(c_estado)

        # Col H: Precio Mercado Ref
        c_p_mercado = ws.cell(row=current_row, column=8, value=r.get("Precio_Actual_Mercado_CLP"))
        c_p_mercado.alignment = Alignment(horizontal="right", vertical="center")
        c_p_mercado.number_format = "$#,##0"

        # Col I: Mi Precio Venta (CLP)
        p_venta_val = prev_info.get("p_venta", r.get("Precio_Actual_Mercado_CLP"))
        c_p_venta = ws.cell(row=current_row, column=9, value=p_venta_val)
        c_p_venta.alignment = Alignment(horizontal="right", vertical="center")
        c_p_venta.number_format = "$#,##0"

        # Col J: Subtotal Valorizado (Fórmula =F8*I8)
        c_subtotal = ws.cell(row=current_row, column=10)
        c_subtotal.value = f'=IF(F{current_row}<>"", F{current_row}*I{current_row}, 0)'
        c_subtotal.alignment = Alignment(horizontal="right", vertical="center")
        c_subtotal.number_format = "$#,##0"
        c_subtotal.font = Font(name="Calibri", size=10, bold=True)

        # Col K: Ubicación / Estante
        c_ubic = ws.cell(row=current_row, column=11, value=prev_info.get("ubicacion", ""))
        c_ubic.alignment = Alignment(horizontal="left", vertical="center")

        # Col L: Foto Referencia
        c_foto = ws.cell(row=current_row, column=12, value=img_name)
        c_foto.alignment = Alignment(horizontal="left", vertical="center")

        for col_idx in range(1, 13):
            c = ws.cell(row=current_row, column=col_idx)
            if col_idx == 10:
                c.font = Font(name="Calibri", size=10, bold=True)
            else:
                c.font = font_data
            c.border = border_thin
            if col_idx != 6 and is_even:
                c.fill = row_fill

    # 5. Fila de Totales Generales
    tot_row = start_row + len(rows_data)
    ws.row_dimensions[tot_row].height = 24
    ws.merge_cells(f"A{tot_row}:E{tot_row}")
    ws[f"A{tot_row}"] = "TOTALES GENERALES"
    ws[f"A{tot_row}"].font = font_total
    ws[f"A{tot_row}"].fill = fill_total
    ws[f"A{tot_row}"].alignment = Alignment(horizontal="center", vertical="center")

    # Suma unidades en Columna F
    c_tot_u = ws.cell(row=tot_row, column=6, value=f"=SUM(F{start_row}:F{tot_row-1})")
    c_tot_u.font = font_total
    c_tot_u.fill = fill_total
    c_tot_u.alignment = Alignment(horizontal="center", vertical="center")
    c_tot_u.number_format = "#,##0"

    for col_idx in [7, 8, 9, 11, 12]:
        c_bl = ws.cell(row=tot_row, column=col_idx, value="")
        c_bl.fill = fill_total

    # Suma valorizado en Columna J
    c_tot_val = ws.cell(row=tot_row, column=10, value=f"=SUM(J{start_row}:J{tot_row-1})")
    c_tot_val.font = font_total
    c_tot_val.fill = fill_total
    c_tot_val.alignment = Alignment(horizontal="right", vertical="center")
    c_tot_val.number_format = "$#,##0"

    for col_idx in range(1, 13):
        ws.cell(row=tot_row, column=col_idx).border = border_thin

    # Anchos de columna
    col_widths = {
        "A": 13,  # ID
        "B": 12,  # Miniatura
        "C": 20,  # Línea
        "D": 38,  # Nombre Comercial
        "E": 12,  # Formato
        "F": 18,  # Conteo Físico
        "G": 22,  # Estado
        "H": 18,  # Precio Mercado
        "I": 18,  # Mi Precio Venta
        "J": 20,  # Subtotal
        "K": 18,  # Ubicación
        "L": 32,  # Foto
    }
    for col_let, w in col_widths.items():
        ws.column_dimensions[col_let].width = w

    ws.freeze_panes = "A8"
    ws.auto_filter.ref = f"A7:L{tot_row-1}"

    wb.save(excel_path)
    print(f"Hoja 'Control de Inventario' con miniaturas agregada exitosamente en {excel_path}")


def agregar_miniaturas_catalogo(excel_path: Path):
    """
    Inserta una columna 'Miniatura' inmediatamente al lado de 'ID_Producto' (Columna B)
    en la hoja 'Catálogo Consolidado', embebiendo miniaturas optimizadas de 50x50 px.
    """
    base_dir = excel_path.parent.parent
    thumbs_dir = excel_path.parent / "thumbnails"
    thumbs_dir.mkdir(parents=True, exist_ok=True)

    wb = openpyxl.load_workbook(excel_path)
    if "Catálogo Consolidado" not in wb.sheetnames:
        return

    ws = wb["Catálogo Consolidado"]
    headers = [ws.cell(row=1, column=c).value for c in range(1, ws.max_column + 1)]

    if "Miniatura" not in headers:
        ws.insert_cols(2)
        cell_b1 = ws.cell(row=1, column=2, value="Miniatura")
        cell_b1.fill = PatternFill(start_color="1A1A1A", end_color="1A1A1A", fill_type="solid")
        cell_b1.font = Font(name="Calibri", size=11, bold=True, color="E5C158")
        cell_b1.alignment = Alignment(horizontal="center", vertical="center")

    headers = [ws.cell(row=1, column=c).value for c in range(1, ws.max_column + 1)]
    img_name_col = headers.index("Nombre_Archivo_Imagen") + 1

    border_thin = Side(style="thin", color="E0E0E0")
    cell_border = Border(top=border_thin, bottom=border_thin, left=border_thin, right=border_thin)

    ws.column_dimensions["B"].width = 12

    for r in range(2, ws.max_row + 1):
        ws.row_dimensions[r].height = 48
        cell_thumb = ws.cell(row=r, column=2)
        cell_thumb.border = cell_border
        cell_thumb.alignment = Alignment(horizontal="center", vertical="center")

        img_name = ws.cell(row=r, column=img_name_col).value
        if img_name:
            t_path = obtener_o_crear_miniatura(img_name, base_dir, thumbs_dir)
            if t_path.exists():
                xl_img = OpenpyxlImage(str(t_path))
                xl_img.width = 50
                xl_img.height = 50
                ws.add_image(xl_img, f"B{r}")

    ws.auto_filter.ref = ws.dimensions
    wb.save(excel_path)
    print(f"Miniaturas embebidas exitosamente en 'Catálogo Consolidado' en {excel_path}")


def actualizar_excel_completo(excel_path: Path):
    """Ejecuta ambas transformaciones sobre el archivo objetivo."""
    agregar_miniaturas_catalogo(excel_path)
    agregar_hoja_inventario(excel_path)


if __name__ == "__main__":
    from src.config import OUTPUT_EXCEL_PATH
    actualizar_excel_completo(OUTPUT_EXCEL_PATH)
