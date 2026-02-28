#!/usr/bin/env python3
"""
Converte Conversion Time de Brasília (GMT-3) para Chicago (GMT-6)
para upload de conversões offline no Google Ads.

Uso:
    python scripts/convert-conversion-time-brasilia-to-chicago.py arquivo.csv
    python scripts/convert-conversion-time-brasilia-to-chicago.py arquivo.csv -o saida.csv

Colunas esperadas: GCLID, Conversion Name, Conversion Time
Saída: yyyy-MM-dd HH:mm:ss (compatível com Google Sheets/CSV)
"""

import csv
import re
import sys
from datetime import datetime

# Python 3.9+ tem zoneinfo. Para 3.8: pip install backports.zoneinfo
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo

BRASILIA = ZoneInfo("America/Sao_Paulo")
CHICAGO = ZoneInfo("America/Chicago")


def parse_brasilia_time(value: str) -> datetime | None:
    """Interpreta a string como horário de Brasília."""
    if not value or not value.strip():
        return None
    value = value.strip()

    # Remove timezone suffix se existir (-03:00, -0300, Z, etc)
    value_clean = re.sub(r"[-+]\d{2}:?\d{2}$", "", value, flags=re.I)
    value_clean = re.sub(r"Z$", "", value_clean, flags=re.I)
    value_clean = value_clean.replace("T", " ").strip()

    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y %H:%M",
        "%d/%m/%Y",
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(value_clean, fmt)
            return dt.replace(tzinfo=BRASILIA)
        except ValueError:
            continue

    # Fallback: dateutil ou datetime.fromisoformat
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=BRASILIA)
        return dt
    except ValueError:
        pass

    return None


def convert_to_chicago(dt: datetime) -> str:
    """Converte para Chicago e formata como yyyy-MM-dd HH:mm:ss"""
    chicago_dt = dt.astimezone(CHICAGO)
    return chicago_dt.strftime("%Y-%m-%d %H:%M:%S")


def convert_brasilia_to_chicago(value: str) -> str:
    """Converte string em Brasília para string em Chicago."""
    dt = parse_brasilia_time(value)
    if dt is None:
        return ""
    return convert_to_chicago(dt)


def find_column_index(headers: list[str], names: list[str]) -> int:
    """Encontra índice da coluna por nome (case-insensitive)."""
    lower_headers = [h.lower() for h in headers]
    for name in names:
        for i, h in enumerate(lower_headers):
            if name.lower() in h:
                return i
    return -1


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    opts = sys.argv[1:]
    input_path = args[0] if args else None
    output_path = None
    if "-o" in opts:
        idx = opts.index("-o")
        if idx + 1 < len(opts):
            output_path = opts[idx + 1]

    if not input_path:
        print("Uso: python convert-conversion-time-brasilia-to-chicago.py <arquivo.csv> [-o saida.csv]")
        sys.exit(1)

    try:
        with open(input_path, "r", encoding="utf-8-sig") as f:
            sample = f.read(4096)
            f.seek(0)
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
            reader = csv.reader(f, dialect)
            rows = list(reader)
    except FileNotFoundError:
        print(f"Arquivo não encontrado: {input_path}")
        sys.exit(1)

    if not rows:
        print("Arquivo vazio.")
        sys.exit(0)

    headers = rows[0]
    conv_time_idx = find_column_index(headers, ["conversion time", "conversion_time"])
    if conv_time_idx < 0:
        print(f'Coluna "Conversion Time" não encontrada. Colunas: {", ".join(headers)}')
        sys.exit(1)

    out_rows = [headers]
    converted = 0
    for row in rows[1:]:
        if len(row) <= conv_time_idx:
            row.extend([""] * (conv_time_idx - len(row) + 1))
        raw = row[conv_time_idx] if conv_time_idx < len(row) else ""
        new_time = convert_brasilia_to_chicago(raw)
        if new_time:
            row[conv_time_idx] = new_time
            converted += 1
        out_rows.append(row)

    if output_path:
        with open(output_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f, dialect=dialect)
            writer.writerows(out_rows)
        print(f"✅ {converted} conversões processadas. Salvo em: {output_path}")
    else:
        writer = csv.writer(sys.stdout, dialect=dialect)
        writer.writerows(out_rows)


if __name__ == "__main__":
    main()
