#!/usr/bin/env python3
"""
Selezione famiglie tramite 0/1 knapsack.

Con il budget totale (default 6000$) come vincolo, massimizza la somma dei
v_index pesati in modo ESPONENZIALE:
        valore = exp(alpha * v_index / 100)
        più alpha è alto, più si privilegiano le famiglie con v_index alto

Input  : CSV con colonne  case_id, v_index, cost
         (family_size è opzionale: se presente viene solo riportata nell'output)
Output : knapsack_output.json (creato se non esiste, sovrascritto se esiste)
         con famiglie incluse e respinte, ordinate per v_index decrescente.

Uso:
    python knapsack_solver.py famiglie_demo.csv
    python knapsack_solver.py famiglie_demo.csv --alpha 8
    python knapsack_solver.py famiglie_demo.csv --budget 6000
"""

import argparse
import csv
import json
import math
import sys
from decimal import Decimal, InvalidOperation

import numpy as np

REQUIRED_COLUMNS = {"case_id", "v_index", "cost"}
SIZE_COLUMN = "family_size"
DEFAULT_OUTPUT = "knapsack_output.json"
DEFAULT_ALPHA = 12.0  # forte priorità ai casi gravi: v_index 100 vale ~400x un v_index 50, ~20x un v_index 75


def load_families(path):
    """Legge il CSV e restituisce una lista di dict validati."""
    families = []
    seen = set()
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            sys.exit("Errore: il CSV è vuoto.")
        # normalizza i nomi colonna (spazi / maiuscole)
        reader.fieldnames = [c.strip().lower() for c in reader.fieldnames]
        columns = set(reader.fieldnames)

        missing = REQUIRED_COLUMNS - columns
        if missing:
            sys.exit(f"Errore: colonne mancanti nel CSV: {', '.join(sorted(missing))}")
        has_size = SIZE_COLUMN in columns

        for line_no, row in enumerate(reader, start=2):
            case_id = (row["case_id"] or "").strip()
            if not case_id:
                sys.exit(f"Errore riga {line_no}: case_id vuoto.")
            if case_id in seen:
                sys.exit(f"Errore riga {line_no}: case_id duplicato '{case_id}'.")
            seen.add(case_id)

            try:
                v_index = float(row["v_index"])
                cost = Decimal(row["cost"].strip().replace("$", "").replace(",", "."))
            except (ValueError, InvalidOperation):
                sys.exit(f"Errore riga {line_no}: v_index o cost non numerici ({case_id}).")

            if not 0 <= v_index <= 100:
                sys.exit(f"Errore riga {line_no}: v_index fuori range 0-100 ({case_id}).")
            if cost < 0:
                sys.exit(f"Errore riga {line_no}: costo negativo ({case_id}).")

            family = {"case_id": case_id, "v_index": v_index, "cost": cost}

            if has_size:
                try:
                    size = Decimal(row[SIZE_COLUMN].strip())
                except (InvalidOperation, AttributeError):
                    sys.exit(f"Errore riga {line_no}: {SIZE_COLUMN} non numerico ({case_id}).")
                if size < 0 or size != size.to_integral_value():
                    sys.exit(f"Errore riga {line_no}: {SIZE_COLUMN} deve essere un intero >= 0 ({case_id}).")
                family["family_size"] = int(size)

            families.append(family)
    return families


def knapsack(families, budget):
    """
    0/1 knapsack con DP. I costi vengono convertiti in interi:
    dollari interi se possibile, altrimenti centesimi.
    Il valore di ogni famiglia è il suo "exp_value".
    Restituisce l'insieme degli indici selezionati.
    """
    use_cents = any(f["cost"] != f["cost"].to_integral_value() for f in families)
    scale = 100 if use_cents else 1
    W = int(Decimal(str(budget)) * scale)
    weights = [int(f["cost"] * scale) for f in families]
    values = [float(f["exp_value"]) for f in families]
    n = len(families)

    if n * (W + 1) > 400_000_000:
        sys.exit("Errore: problema troppo grande per la memoria disponibile.")

    dp = np.zeros(W + 1, dtype=np.float64)       # dp[c] = valore max con budget <= c
    keep = np.zeros((n, W + 1), dtype=bool)      # keep[i, c] = item i preso in dp_i[c]

    for i, (w, v) in enumerate(zip(weights, values)):
        if w > W:
            continue
        cand = np.full(W + 1, -np.inf)
        cand[w:] = dp[: W + 1 - w] + v
        take = cand > dp
        keep[i] = take
        dp = np.where(take, cand, dp)

    # ricostruzione della soluzione
    selected = set()
    c = W
    for i in range(n - 1, -1, -1):
        if keep[i, c]:
            selected.add(i)
            c -= weights[i]
    return selected


def to_output(f):
    cost = float(f["cost"])
    out = {
        "case_id": f["case_id"],
        "v_index": f["v_index"],
        "cost": int(cost) if cost.is_integer() else cost,
    }
    if "family_size" in f:
        out["family_size"] = f["family_size"]
    if "exp_value" in f:
        out["exp_value"] = round(f["exp_value"], 4)
    return out


def main():
    parser = argparse.ArgumentParser(description="Selezione famiglie via knapsack.")
    parser.add_argument("input_csv", help="CSV con colonne case_id, v_index, cost")
    parser.add_argument("-o", "--output", default=DEFAULT_OUTPUT,
                        help=f"JSON di output (default: {DEFAULT_OUTPUT}; sovrascritto se esiste)")
    parser.add_argument("-b", "--budget", type=float, default=6000, help="Budget totale ($)")
    parser.add_argument("-a", "--alpha", type=float, default=DEFAULT_ALPHA,
                        help="Ripidità dell'esponenziale exp(alpha * v_index/100); "
                             f"(default: {DEFAULT_ALPHA})")
    args = parser.parse_args()

    if args.alpha < 0:
        sys.exit("Errore: --alpha deve essere >= 0.")

    families = load_families(args.input_csv)
    for f in families:
        f["exp_value"] = math.exp(args.alpha * f["v_index"] / 100)
    selected_idx = knapsack(families, args.budget)

    # ordinamento: v_index decrescente (a parità, costo crescente)
    sort_key = lambda f: (-f["v_index"], f["cost"])
    included = sorted((f for i, f in enumerate(families) if i in selected_idx), key=sort_key)
    rejected = sorted((f for i, f in enumerate(families) if i not in selected_idx), key=sort_key)

    total_cost = sum(f["cost"] for f in included)
    summary = {
        "alpha": args.alpha,
        "budget": args.budget,
        "total_cost": float(total_cost),
        "budget_remaining": float(Decimal(str(args.budget)) - total_cost),
        "total_v_index": round(sum(f["v_index"] for f in included), 6),
    }
    summary["total_exp_value"] = round(sum(f["exp_value"] for f in included), 4)
    if families and "family_size" in families[0]:
        summary["total_people"] = sum(f["family_size"] for f in included)
    summary.update({
        "families_total": len(families),
        "families_included": len(included),
        "families_rejected": len(rejected),
    })

    result = {
        "summary": summary,
        "included": [to_output(f) for f in included],
        "rejected": [to_output(f) for f in rejected],
    }

    # modalità "w": crea il file se non esiste, lo sovrascrive se esiste
    with open(args.output, "w", encoding="utf-8") as out:
        json.dump(result, out, indent=2, ensure_ascii=False)

    people = f" | Persone: {summary['total_people']}" if "total_people" in summary else ""
    print(f"alpha: {args.alpha} | Incluse: {summary['families_included']} | "
          f"Respinte: {summary['families_rejected']} | "
          f"Costo: {summary['total_cost']:.2f}$ / {args.budget:.2f}$ | "
          f"V totale: {summary['total_v_index']} | "
          f"V medio: {summary['total_v_index'] / max(1, summary['families_included']):.1f}{people}")
    print(f"Output scritto in {args.output}")


if __name__ == "__main__":
    main()