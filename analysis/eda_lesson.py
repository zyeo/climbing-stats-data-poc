"""A gradual pandas walkthrough of the 2025 Men Boulder World Cup tables."""

from pathlib import Path

import pandas as pd


DATA_DIR = Path(__file__).parent / "data" / "generated" / "2025-men-boulder-world-cup"
TABLE_NAMES = (
    "competitions",
    "events",
    "athletes",
    "rounds",
    "event_results",
    "round_results",
    "boulder_problems",
    "boulder_problem_results",
)


def heading(number: int, title: str, pandas_tools: str) -> None:
    print(f"\n{number}. {title}")
    print(f"   pandas tools: {pandas_tools}")
    print("-" * 78)


def load_tables() -> dict[str, pd.DataFrame]:
    if not DATA_DIR.exists():
        raise SystemExit(
            "Generated analysis data is missing. Run `pnpm export:2025-men-boulder` "
            "from the repository root first."
        )

    return {name: pd.read_csv(DATA_DIR / f"{name}.csv") for name in TABLE_NAMES}


def inspect_shapes(tables: dict[str, pd.DataFrame]) -> None:
    heading(1, "Meet the tables", "read_csv, shape, dtypes")
    summary = pd.DataFrame(
        {
            "rows": {name: len(frame) for name, frame in tables.items()},
            "columns": {name: len(frame.columns) for name, frame in tables.items()},
        }
    )
    print(summary.to_string())
    print("\nNotice: event_results.score and round_results.score load as text.")
    print("Keep them as labels for now; top/zone booleans are clearer analysis inputs.")


def inspect_missing_values(tables: dict[str, pd.DataFrame]) -> None:
    heading(2, "Inspect missing values", "isna, sum, mean, concat")
    summaries = []
    for table_name, frame in tables.items():
        missing_count = frame.isna().sum()
        present = missing_count[missing_count.gt(0)]
        if not present.empty:
            summaries.append(
                pd.DataFrame(
                    {
                        "table": table_name,
                        "column": present.index,
                        "missing": present.values,
                        "missing_pct": frame.isna().mean()[present.index].values * 100,
                    }
                )
            )

    missing = pd.concat(summaries, ignore_index=True)
    print(missing.to_string(index=False, float_format=lambda value: f"{value:.1f}"))
    print("\nInterpretation:")
    print("- low_zone fields are unavailable in every row, so do not analyze them.")
    print("- start_order is unavailable in these full-event exports.")
    print("- starting_group is expected only for grouped qualification rounds.")
    print("- missing top_tries/zone_tries occur only on failed outcomes; many other failures use zero.")
    print("- two missing ranks are source DNS/unranked records, not a pandas error.")


def inspect_relationships(tables: dict[str, pd.DataFrame]) -> None:
    heading(3, "Check table relationships", "set difference, merge(validate=...)")
    relationships = (
        ("events -> competitions", "events", "competition_id", "competitions", "competition_id"),
        ("event_results -> events", "event_results", "event_id", "events", "event_id"),
        ("event_results -> athletes", "event_results", "athlete_id", "athletes", "athlete_id"),
        ("round_results -> event_results", "round_results", "result_id", "event_results", "result_id"),
        (
            "boulder_problem_results -> boulder_problems",
            "boulder_problem_results",
            "boulder_problem_id",
            "boulder_problems",
            "boulder_problem_id",
        ),
    )
    rows = []
    for label, child_table, child_key, parent_table, parent_key in relationships:
        orphan_keys = set(tables[child_table][child_key]) - set(tables[parent_table][parent_key])
        rows.append({"relationship": label, "orphan_keys": len(orphan_keys)})
    print(pd.DataFrame(rows).to_string(index=False))

    # validate raises if a supposed many-to-one join is not actually many-to-one.
    tables["round_results"].merge(
        tables["rounds"][["round_id", "name"]],
        on="round_id",
        validate="many_to_one",
    )
    print("\nAll checked foreign keys resolve, and the round join validates as many-to-one.")


def build_attempt_view(tables: dict[str, pd.DataFrame]) -> pd.DataFrame:
    event_labels = (
        tables["events"][["event_id", "competition_id"]]
        .merge(
            tables["competitions"][["competition_id", "location"]],
            on="competition_id",
            validate="many_to_one",
        )
        [["event_id", "location"]]
    )
    return (
        tables["boulder_problem_results"]
        .merge(
            tables["rounds"][["round_id", "name"]].rename(columns={"name": "round_name"}),
            on="round_id",
            validate="many_to_one",
        )
        .merge(event_labels, on="event_id", validate="many_to_one")
    )


def inspect_rates(attempts: pd.DataFrame) -> None:
    heading(4, "Calculate top and zone rates", "boolean mean, groupby, agg")
    print(
        attempts[["top", "zone"]]
        .mean()
        .rename({"top": "top_rate", "zone": "zone_rate"})
        .to_frame("overall_rate")
        .to_string(float_format=lambda value: f"{value:.3f}")
    )

    by_round = (
        attempts.groupby("round_name")
        .agg(attempts=("top", "size"), top_rate=("top", "mean"), zone_rate=("zone", "mean"))
        .sort_index()
    )
    print("\nBy round:")
    print(by_round.to_string(float_format=lambda value: f"{value:.3f}"))

    by_event = (
        attempts.groupby("location")
        .agg(attempts=("top", "size"), top_rate=("top", "mean"), zone_rate=("zone", "mean"))
        .sort_values("top_rate")
    )
    print("\nBy event, hardest to easiest by observed top rate:")
    print(by_event.to_string(float_format=lambda value: f"{value:.3f}"))
    print("\nA boolean mean is a rate: True=1 and False=0.")
    print("These are attempt-weighted rates, so larger qualification fields contribute more rows.")


def inspect_qualification_groups(
    tables: dict[str, pd.DataFrame], attempts: pd.DataFrame
) -> None:
    heading(5, "Respect qualification groups", "filter, merge, groupby(dropna=False)")
    qualification = attempts.loc[attempts["round_name"].eq("Qualification")].merge(
        tables["round_results"][["athlete_id", "round_id", "starting_group"]],
        on=["athlete_id", "round_id"],
        validate="many_to_one",
    )
    group_rates = qualification.groupby(
        ["location", "starting_group"], dropna=False
    ).agg(
        athletes=("athlete_id", "nunique"),
        attempts=("top", "size"),
        top_rate=("top", "mean"),
        zone_rate=("zone", "mean"),
    )
    print(group_rates.to_string(float_format=lambda value: f"{value:.3f}"))

    attempts_per_athlete = qualification.groupby(["event_id", "athlete_id"]).size()
    print("\nQualification attempts per athlete:")
    print(attempts_per_athlete.value_counts().sort_index().to_string())
    print("\nEvery athlete has five qualification attempts.")
    print("Curitiba's missing group label means one unlabelled group, not missing athlete attempts.")


def inspect_athlete_consistency(tables: dict[str, pd.DataFrame]) -> None:
    heading(6, "Describe athlete consistency", "merge, dropna, groupby, query, std")
    ranked_results = (
        tables["event_results"]
        .merge(
            tables["athletes"][["athlete_id", "name", "country"]],
            on="athlete_id",
            validate="many_to_one",
        )
        .dropna(subset=["rank"])
    )
    consistency = (
        ranked_results.groupby(["athlete_id", "name", "country"])
        .agg(
            events=("event_id", "nunique"),
            mean_rank=("rank", "mean"),
            rank_std=("rank", "std"),
            best_rank=("rank", "min"),
            worst_rank=("rank", "max"),
        )
        .query("events >= 3")
        .sort_values(["rank_std", "mean_rank"])
        .head(12)
        .reset_index()
    )
    print(consistency.to_string(index=False, float_format=lambda value: f"{value:.2f}"))
    print("\nLower rank_std means more stable event ranks among athletes with at least three events.")
    print("It does not prove repeatable skill: field strength and event difficulty also vary.")


def suggest_next_questions() -> None:
    heading(7, "Pause before modeling", "write questions before features")
    print("Good next descriptive questions:")
    print("- Compare Group A and Group B only within the same event.")
    print("- Compare per-boulder rates to see whether round averages hide outliers.")
    print("- Compare qualification performance with later-round advancement descriptively.")
    print("- Measure athlete top-rate consistency separately from event-rank consistency.")
    print("\nDo not start ML yet: first explain the missingness and grouping choices above.")


def main() -> None:
    pd.set_option("display.width", 120)
    tables = load_tables()
    inspect_shapes(tables)
    inspect_missing_values(tables)
    inspect_relationships(tables)
    attempts = build_attempt_view(tables)
    inspect_rates(attempts)
    inspect_qualification_groups(tables, attempts)
    inspect_athlete_consistency(tables)
    suggest_next_questions()


if __name__ == "__main__":
    main()
