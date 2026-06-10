"""Prioritize rare-top semifinal and final boulders for manual media review."""

from pathlib import Path

import pandas as pd

from advancement_profiles import build_round_result_view, heading
from difficulty_relative import (
    add_difficulty_relative_values,
    build_boulder_difficulty,
    build_boulder_result_view,
)
from eda_lesson import load_tables


CURATED_PATH = Path(__file__).parent / "data" / "curated" / "boulder_media_reviews.csv"
CURATED_COLUMNS = (
    "boulder_problem_id",
    "replay_url",
    "timestamp_seconds",
    "style_labels",
    "movement_notes",
    "review_status",
)


def load_curated_reviews() -> pd.DataFrame:
    """Load manually entered replay links, timestamps, and style notes."""
    curated = pd.read_csv(CURATED_PATH)
    missing_columns = set(CURATED_COLUMNS) - set(curated.columns)
    if missing_columns:
        raise ValueError(f"Curated media review CSV is missing columns: {sorted(missing_columns)}")
    if curated["boulder_problem_id"].dropna().duplicated().any():
        raise ValueError("Curated media review CSV contains duplicate boulder_problem_id values.")
    return curated


def build_review_candidates(valued_results: pd.DataFrame) -> pd.DataFrame:
    """Build one prioritized row per topped semifinal or final boulder."""
    eligible = valued_results.loc[
        valued_results["top"] & valued_results["round_name"].isin(["Semi-final", "Final"])
    ]
    candidates = (
        eligible.groupby(
            [
                "boulder_problem_id",
                "location",
                "round_name",
                "boulder_label",
                "review_label",
                "source_route_id",
                "athletes",
                "field_tops",
                "top_rate",
                "zone_rate",
            ],
            as_index=False,
        )
        .agg(
            topper_names=("name", lambda names: ", ".join(sorted(names))),
            best_top_tries=("top_tries", "min"),
        )
        .sort_values(["top_rate", "best_top_tries", "review_label"])
    )
    candidates["priority"] = range(1, len(candidates) + 1)
    return candidates


def add_curated_reviews(
    candidates: pd.DataFrame, curated: pd.DataFrame
) -> pd.DataFrame:
    """Attach optional human-entered media metadata to generated candidates."""
    queue = candidates.merge(curated, on="boulder_problem_id", how="left", validate="one_to_one")
    queue["review_status"] = queue["review_status"].fillna("needs-review")
    queue["timestamped_url"] = queue["replay_url"]
    has_timestamp = queue["replay_url"].notna() & queue["timestamp_seconds"].notna()
    queue.loc[has_timestamp, "timestamped_url"] = queue.loc[has_timestamp].apply(
        lambda row: (
            f"{row['replay_url']}{'&' if '?' in row['replay_url'] else '?'}"
            f"t={int(row['timestamp_seconds'])}s"
        ),
        axis=1,
    )
    return queue


def inspect_review_queue(queue: pd.DataFrame) -> None:
    heading(1, "Prioritized semifinal and final media-review queue")
    columns = [
        "priority",
        "review_label",
        "source_route_id",
        "field_tops",
        "athletes",
        "top_rate",
        "zone_rate",
        "best_top_tries",
        "topper_names",
        "review_status",
        "timestamped_url",
        "style_labels",
    ]
    print(queue.head(25)[columns].to_string(index=False, float_format=lambda value: f"{value:.3f}"))
    print(f"\nCurated review file: {CURATED_PATH}")
    print("Add one row keyed by boulder_problem_id after locating footage or reviewing style.")
    print("Qualification boulders are excluded because full official replay coverage is inconsistent.")


def main() -> None:
    pd.set_option("display.width", 220)
    tables = load_tables()
    round_results = build_round_result_view(tables)
    results = build_boulder_result_view(tables, round_results)
    difficulty = build_boulder_difficulty(results)
    valued_results = add_difficulty_relative_values(results, difficulty)
    candidates = build_review_candidates(valued_results)
    queue = add_curated_reviews(candidates, load_curated_reviews())

    assert queue["boulder_problem_id"].is_unique
    assert queue["round_name"].isin(["Semi-final", "Final"]).all()
    inspect_review_queue(queue)


if __name__ == "__main__":
    main()
