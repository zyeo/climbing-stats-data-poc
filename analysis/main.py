from pathlib import Path

import pandas as pd


DATA_DIR = Path(__file__).parent / "data" / "generated" / "2025-men-boulder-world-cup"


def main():
    if not DATA_DIR.exists():
        raise SystemExit(
            "Generated analysis data is missing. Run `pnpm export:2025-men-boulder` "
            "from the repository root first."
        )

    for csv_path in sorted(DATA_DIR.glob("*.csv")):
        frame = pd.read_csv(csv_path)
        print(f"{csv_path.name}: {len(frame)} rows")


if __name__ == "__main__":
    main()
