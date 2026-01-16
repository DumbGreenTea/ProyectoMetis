from datetime import date
from pathlib import Path
from typing import List, Optional

import pandas as pd
from fastapi import APIRouter, HTTPException
from filelock import FileLock
from pydantic import BaseModel

router = APIRouter(prefix="/analytics", tags=["analytics"])

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "Base_Egresados_Ficticia_1000.xlsx"
LOCK_PATH = DATA_PATH.with_suffix(".lock")

_cache = {"mtime": None, "rows": []}


class GraduateRow(BaseModel):
    rut: str
    career: str
    graduation_date: Optional[date]
    work_current: bool
    country: str
    company: str
    department: str
    role: str
    industry: str
    job_start_date: Optional[date]


def _normalize_text(value: object, fallback: str) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return fallback
    text = str(value).strip()
    return text if text else fallback


def _load_rows() -> List[GraduateRow]:
    if not DATA_PATH.exists():
        raise HTTPException(status_code=404, detail="Excel file not found")

    with FileLock(str(LOCK_PATH)):
        df = pd.read_excel(DATA_PATH)

    df["Académico - Fecha_Egreso"] = pd.to_datetime(
        df["Académico - Fecha_Egreso"], errors="coerce"
    )
    df["Laboral (Historial) - Fecha_Inicio_Trabajo"] = pd.to_datetime(
        df["Laboral (Historial) - Fecha_Inicio_Trabajo"], errors="coerce"
    )

    rows: List[GraduateRow] = []
    for _, row in df.iterrows():
        graduation_date = row.get("Académico - Fecha_Egreso")
        work_value = _normalize_text(row.get("Estado - Es_Trabajo_Actual"), "No")
        work_current = work_value.lower() in {"si", "sí", "true", "1"}

        rows.append(
            GraduateRow(
                rut=_normalize_text(row.get("Identificación - RUT"), "Sin dato"),
                career=_normalize_text(row.get("Académico - Carrera_Pregrado"), "Sin dato"),
                graduation_date=graduation_date.date()
                if not pd.isna(graduation_date)
                else None,
                work_current=work_current,
                country=_normalize_text(row.get("Estado - Pais_Residencia"), "Sin dato"),
                company=_normalize_text(row.get("Laboral (Historial) - Empresa"), "Sin dato"),
                department=_normalize_text(row.get("Laboral (Historial) - Departamento"), "Sin dato"),
                role=_normalize_text(row.get("Laboral (Historial) - Cargo"), "Sin dato"),
                industry=_normalize_text(row.get("Laboral (Historial) - Rubro_Empresa"), "Sin dato"),
                job_start_date=row.get("Laboral (Historial) - Fecha_Inicio_Trabajo").date()
                if not pd.isna(row.get("Laboral (Historial) - Fecha_Inicio_Trabajo"))
                else None,
            )
        )
    return rows


def _get_cached_rows() -> List[GraduateRow]:
    if not DATA_PATH.exists():
        raise HTTPException(status_code=404, detail="Excel file not found")
    mtime = DATA_PATH.stat().st_mtime
    if _cache["mtime"] != mtime:
        _cache["rows"] = _load_rows()
        _cache["mtime"] = mtime
    return _cache["rows"]


@router.get("/graduates", response_model=List[GraduateRow])
async def get_graduates():
    """Return normalized graduate rows from the Excel source."""
    return _get_cached_rows()
