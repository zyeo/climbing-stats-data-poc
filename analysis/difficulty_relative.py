"""Transparent difficulty-relative boulder and athlete analysis. No ML."""

import pandas as pd

from advancement_profiles import build_round_result_view, heading
from eda_lesson import load_tables


def build_boulder_result_view(
    tables: dict[str, pd.DataFrame], round_results: pd.DataFrame
) -> pd.DataFrame:
    """Attach athlete, event, and round context to every athlete-boulder result."""
    return (
        tables["boulder_problem_results"]
        .merge(
            tables["boulder_problems"][
                ["boulder_problem_id", "source_route_id", "route_name"]
            ],
            on="boulder_problem_id",
            validate="many_to_one",
            suffixes=("", "_problem"),
        )
        .merge(
            round_results[
                [
                    "event_id",
                    "round_id",
                    "athlete_id",
                    "round_name",
                    "starting_group",
                    "location",
                    "name",
                    "country",
                ]
            ],
            on=["event_id", "round_id", "athlete_id"],
            validate="many_to_one",
        )
    )


def build_boulder_difficulty(results: pd.DataFrame) -> pd.DataFrame:
    """Summarize the field's observed outcomes on each exact shared boulder."""
    return (
        results.groupby(
            [
                "boulder_problem_id",
                "location",
                "round_name",
                "source_route_id",
                "route_name",
            ],
            as_index=False,
        )
        .agg(
            athletes=("athlete_id", "nunique"),
            tops=("top", "sum"),
            zones=("zone", "sum"),
            top_rate=("top", "mean"),
            zone_rate=("zone", "mean"),
        )
    )


def add_difficulty_relative_values(
    results: pd.DataFrame, difficulty: pd.DataFrame
) -> pd.DataFrame:
    """Award more descriptive value to successful outcomes achieved by fewer athletes."""
    field_rates = difficulty[
        ["boulder_problem_id", "athletes", "tops", "zones", "top_rate", "zone_rate"]
    ].rename(columns={"tops": "field_tops", "zones": "field_zones"})
    valued = results.merge(
        field_rates,
        on="boulder_problem_id",
        validate="many_to_one",
    )
    valued["standout_top_value"] = valued["top"].astype(float) * (1 - valued["top_rate"])
    valued["standout_zone_value"] = valued["zone"].astype(float) * (1 - valued["zone_rate"])
    return valued


def inspect_boulder_difficulty(difficulty: pd.DataFrame) -> None:
    heading(1, "Find difficult boulders")
    columns = [
        "location",
        "round_name",
        "route_name",
        "source_route_id",
        "athletes",
        "tops",
        "zones",
        "top_rate",
        "zone_rate",
    ]
    hardest = difficulty.sort_values(["top_rate", "zone_rate"]).head(20)
    print("Lowest observed top rates:")
    print(hardest[columns].to_string(index=False, float_format=lambda value: f"{value:.1%}"))
    print("\nA zero-top boulder can be called difficult, but it has no standout topper to identify.")
    print("Observed rates combine boulder difficulty with the strength of the athletes who faced it.")


def inspect_rare_tops(valued_results: pd.DataFrame) -> None:
    heading(2, "Identify rare tops for manual review")
    columns = [
        "name",
        "country",
        "location",
        "round_name",
        "route_name",
        "source_route_id",
        "field_tops",
        "athletes",
        "top_rate",
        "top_tries",
        "standout_top_value",
    ]
    rare_tops = (
        valued_results.loc[valued_results["top"]]
        .sort_values(["top_rate", "top_tries", "name"])
        .head(25)
    )
    print(rare_tops[columns].to_string(index=False, float_format=lambda value: f"{value:.3f}"))
    print("\n`standout_top_value = 1 - field top rate` for a successful top.")
    print("The source route ID lets us find the exact boulder for later manual style review.")


def inspect_difficulty_relative_athletes(valued_results: pd.DataFrame) -> None:
    heading(3, "Summarize qualification difficulty-relative performance")
    qualification = valued_results.loc[valued_results["round_name"].eq("Qualification")]
    profiles = (
        qualification.groupby(["athlete_id", "name", "country"], as_index=False)
        .agg(
            events=("event_id", "nunique"),
            boulders=("boulder_problem_id", "size"),
            tops=("top", "sum"),
            zones=("zone", "sum"),
            rare_top_value=("standout_top_value", "sum"),
            rare_zone_value=("standout_zone_value", "sum"),
            mean_difficulty_relative_top_value=("standout_top_value", "mean"),
        )
    )
    established = (
        profiles.loc[profiles["events"].ge(3)]
        .sort_values(
            ["mean_difficulty_relative_top_value", "rare_top_value"],
            ascending=False,
        )
        .head(20)
    )
    columns = [
        "name",
        "country",
        "events",
        "boulders",
        "tops",
        "rare_top_value",
        "mean_difficulty_relative_top_value",
        "rare_zone_value",
    ]
    print(established[columns].to_string(index=False, float_format=lambda value: f"{value:.3f}"))
    print("\nThe mean score gives zero for failures and more credit for tops achieved by fewer peers.")
    print("It is transparent descriptive math, not an athlete rating or proof of style-specific strength.")


def inspect_manual_review_candidates(valued_results: pd.DataFrame) -> None:
    heading(4, "Choose boulders for manual style review")
    topped = valued_results.loc[valued_results["top"]]
    candidates = (
        topped.groupby(
            [
                "boulder_problem_id",
                "location",
                "round_name",
                "route_name",
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
        .sort_values(["top_rate", "best_top_tries"])
        .head(15)
    )
    columns = [
        "location",
        "round_name",
        "route_name",
        "source_route_id",
        "athletes",
        "field_tops",
        "top_rate",
        "zone_rate",
        "best_top_tries",
        "topper_names",
    ]
    print(candidates[columns].to_string(index=False, float_format=lambda value: f"{value:.3f}"))
    print("\nThese are strong candidates to watch and manually label for style or movement demands.")


def main() -> None:
    pd.set_option("display.width", 200)
    tables = load_tables()
    round_results = build_round_result_view(tables)
    results = build_boulder_result_view(tables, round_results)
    difficulty = build_boulder_difficulty(results)
    valued_results = add_difficulty_relative_values(results, difficulty)

    assert not results.duplicated(["athlete_id", "boulder_problem_id"]).any()
    assert difficulty["top_rate"].between(0, 1).all()
    assert valued_results["standout_top_value"].between(0, 1).all()

    inspect_boulder_difficulty(difficulty)
    inspect_rare_tops(valued_results)
    inspect_difficulty_relative_athletes(valued_results)
    inspect_manual_review_candidates(valued_results)


if __name__ == "__main__":
    main()
