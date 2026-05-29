#!/usr/bin/env python3
"""
FoodData Central CSV importer for Supabase.
Usage: python scripts/import_fooddata.py
Set SUPABASE_DB_URL environment variable or edit DB_URL below.
"""

import csv
import os
import sys
import psycopg2
from pathlib import Path

# Edit this or set SUPABASE_DB_URL env var
# Format: postgresql://postgres:[password]@db.jrkhnieyramucpegntln.supabase.co:5432/postgres
DB_URL = os.environ.get("SUPABASE_DB_URL", "")

CSV_DIR = Path("/Users/mark/Downloads/FoodData_Central_foundation_food_csv_2026-04-30")

TABLES = [
    # (csv_filename, table_name, [col_renames])
    ("food.csv", "food", {}),
    ("food_attribute.csv", "food_attribute", {}),
    ("food_component.csv", "food_component", {}),
    ("food_nutrient.csv", "food_nutrient", {}),
    ("food_nutrient_conversion_factor.csv", "food_nutrient_conversion_factor", {}),
    ("food_portion.csv", "food_portion", {}),
    ("food_update_log_entry.csv", "food_update_log_entry", {}),
    ("acquisition_samples.csv", "acquisition_samples", {}),
    ("input_food.csv", "input_food", {}),
    ("market_acquisition.csv", "market_acquisition", {}),
    ("sample_food.csv", "sample_food", {}),
    ("sub_sample_food.csv", "sub_sample_food", {}),
    ("sub_sample_result.csv", "sub_sample_result", {}),
]

def import_table(conn, csv_path, table_name, col_renames, batch_size=5000):
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        orig_cols = reader.fieldnames
        cols = [col_renames.get(c, c).lower() for c in orig_cols]
        col_list = ', '.join(f'"{c}"' for c in cols)
        placeholders = ', '.join(['%s'] * len(cols))
        sql = f"INSERT INTO {table_name} ({col_list}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"

        cur = conn.cursor()
        batch = []
        total = 0
        for row in reader:
            vals = tuple(None if row[c] == '' else row[c] for c in orig_cols)
            batch.append(vals)
            if len(batch) >= batch_size:
                cur.executemany(sql, batch)
                conn.commit()
                total += len(batch)
                print(f"  {table_name}: {total} rows inserted", end='\r')
                batch = []
        if batch:
            cur.executemany(sql, batch)
            conn.commit()
            total += len(batch)
        cur.close()
        print(f"  {table_name}: {total} rows inserted          ")
    return total

def main():
    db_url = DB_URL
    if not db_url:
        print("Error: Set SUPABASE_DB_URL environment variable")
        print("Example: postgresql://postgres:YOUR_PASSWORD@db.jrkhnieyramucpegntln.supabase.co:5432/postgres")
        sys.exit(1)

    print(f"Connecting to database...")
    try:
        conn = psycopg2.connect(db_url)
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)

    print("Connected. Starting import...\n")

    for csv_filename, table_name, col_renames in TABLES:
        csv_path = CSV_DIR / csv_filename
        if not csv_path.exists():
            print(f"  SKIP {csv_filename} (not found)")
            continue
        print(f"Importing {csv_filename} -> {table_name}")
        try:
            import_table(conn, csv_path, table_name, col_renames)
        except Exception as e:
            print(f"  ERROR: {e}")
            conn.rollback()

    conn.close()
    print("\nImport complete!")

if __name__ == "__main__":
    main()
