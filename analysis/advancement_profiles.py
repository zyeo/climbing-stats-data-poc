"""Descriptive EDA of advancement and athlete profiles. No prediction modeling."""

import pandas as pd

from eda_lesson import load_tables


def heading(number: int, title: str) -> None:
    print(f"\n{number}. {title}")
    print("-" * 92)


def build_round_result_view(tables: dict[str, pd.DataFrame]) -> pd.DataFrame:
    """Attach round, athlete, and event labels to each athlete-round result."""
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
        tables["round_results"]
        .merge(
            tables["rounds"][["round_id", "name"]].rename(columns={"name": "round_name"}),
            on="round_id",
            validate="many_to_one",
        )
        .merge(
            tables["athletes"][["athlete_id", "name", "country"]],
            on="athlete_id",
            validate="many_to_one",
        )
        .merge(event_labels, on="event_id", validate="many_to_one")
    )


def build_advancement_flags(round_results: pd.DataFrame) -> pd.DataFrame:
    """Define advancement from actual participation in the next round."""
    presence = (
        round_results.assign(present=True)
        .pivot_table(
            index=["event_id", "athlete_id"],
            columns="round_name",
            values="present",
            aggfunc="any",
            fill_value=False,
        )
        .reset_index()
    )
    for round_name in ("Qualification", "Semi-final", "Final"):
        if round_name not in presence:
            presence[round_name] = False

    flags = presence.rename(
        columns={
            "Semi-final": "reached_semifinal",
            "Final": "reached_final",
        }
    )
    flags["advanced_semifinal_to_final"] = flags["reached_semifinal"] & flags["reached_final"]
    return flags[
        [
            "event_id",
            "athlete_id",
            "reached_semifinal",
            "reached_final",
            "advanced_semifinal_to_final",
        ]
    ]


def build_athlete_round_performance(
    tables: dict[str, pd.DataFrame], round_results: pd.DataFrame
) -> pd.DataFrame:
    """Summarize individual boulder rows into one performance row per athlete-round."""
    performance = (
        tables["boulder_problem_results"]
        .groupby(["event_id", "athlete_id", "round_id"], as_index=False)
        .agg(
            boulders=("boulder_problem_id", "size"),
            tops=("top", "sum"),
            zones=("zone", "sum"),
            points=("points", "sum"),
        )
    )
    return performance.merge(
        round_results[
            [
                "event_id",
                "athlete_id",
                "round_id",
                "round_name",
                "rank",
                "score",
                "starting_group",
                "location",
            ]
        ],
        on=["event_id", "athlete_id", "round_id"],
        validate="one_to_one",
    )


def inspect_advancement_counts(round_results: pd.DataFrame) -> None:
    heading(1, "Define and verify advancement")
    counts = (
        round_results.groupby(["location", "round_name"])["athlete_id"]
        .nunique()
        .unstack(fill_value=0)
        [["Qualification", "Semi-final", "Final"]]
    )
    print(counts.to_string())
    print("\nDefinition: an athlete advanced when they have an actual row in the next round.")
    print("This preserves ties: Curitiba has 25 semifinalists and Prague has 27.")


def qualification_cutoffs(
    qualification: pd.DataFrame,
) -> pd.DataFrame:
    """Describe each qualification group's final advancing and first non-advancing rows."""
    rows = []
    for (location, group), frame in qualification.groupby(
        ["location", "starting_group"], dropna=False
    ):
        advanced = frame.loc[frame["reached_semifinal"]]
        did_not_advance = frame.loc[~frame["reached_semifinal"]]
        rows.append(
            {
                "location": location,
                "starting_group": group if pd.notna(group) else "Single group",
                "field": len(frame),
                "advanced": len(advanced),
                "last_advancing_rank": advanced["rank"].max(),
                "last_advancing_score": advanced.loc[advanced["rank"].idxmax(), "score"],
                "first_nonadvancing_rank": did_not_advance["rank"].min(),
                "first_nonadvancing_score": did_not_advance.loc[
                    did_not_advance["rank"].idxmin(), "score"
                ],
            }
        )
    return pd.DataFrame(rows)


def inspect_qualification_advancement(qualification: pd.DataFrame) -> None:
    heading(2, "Verify qualification cutoffs within each event and group")
    print(qualification_cutoffs(qualification).to_string(index=False))
    print("\nRanks can skip because tied athletes share a rank.")
    print("The source score is shown as a label; we do not reinterpret its scoring formula here.")

    comparison = (
        qualification.groupby("reached_semifinal")
        .agg(
            athletes=("athlete_id", "size"),
            mean_tops=("tops", "mean"),
            mean_zones=("zones", "mean"),
            mean_points=("points", "mean"),
        )
        .rename(index={False: "Did not advance", True: "Advanced"})
    )
    print("\nQualification performance, descriptive comparison:")
    print(comparison.to_string(float_format=lambda value: f"{value:.2f}"))
    print("\nThis comparison is pooled across events and groups, so it describes rather than sets a universal cutoff.")


def inspect_advancement_overlap(qualification: pd.DataFrame) -> None:
    heading(3, "Inspect overlap at the advancement boundary")
    by_tops = (
        pd.crosstab(qualification["tops"], qualification["reached_semifinal"])
        .rename(columns={False: "did_not_advance", True: "advanced"})
        .reindex(columns=["did_not_advance", "advanced"], fill_value=0)
    )
    by_tops["total"] = by_tops.sum(axis=1)
    by_tops["observed_advancement_rate"] = by_tops["advanced"] / by_tops["total"]
    print("Observed outcomes by qualification tops:")
    print(by_tops.to_string(float_format=lambda value: f"{value:.1%}"))

    same_tops = (
        qualification.loc[qualification["tops"].between(1, 3)]
        .groupby(["tops", "reached_semifinal"])
        .agg(
            athlete_events=("athlete_id", "size"),
            mean_zones=("zones", "mean"),
            mean_points=("points", "mean"),
        )
        .rename(index={False: "Did not advance", True: "Advanced"}, level="reached_semifinal")
    )
    print("\nWhen athletes had the same number of tops:")
    print(same_tops.to_string(float_format=lambda value: f"{value:.2f}"))
    print("\nPattern:")
    print("- Zero tops never advanced in these six events.")
    print("- Four or five tops always advanced.")
    print("- Two tops formed the main overlap zone: 41 advanced and 77 did not.")
    print("- Among equal-top performances, advancers generally had more zones and points.")
    print("\nThese are observed patterns, not guarantees; event and qualification-group cutoffs still differ.")


def semifinal_cutoffs(semifinal: pd.DataFrame) -> pd.DataFrame:
    """Describe each semifinal's final advancing and first non-advancing rows."""
    rows = []
    for location, frame in semifinal.groupby("location"):
        advanced = frame.loc[frame["reached_final"]]
        did_not_advance = frame.loc[~frame["reached_final"]]
        rows.append(
            {
                "location": location,
                "semifinalists": len(frame),
                "finalists": len(advanced),
                "last_finalist_rank": advanced["rank"].max(),
                "last_finalist_score": advanced.loc[advanced["rank"].idxmax(), "score"],
                "first_nonfinalist_rank": did_not_advance["rank"].min(),
                "first_nonfinalist_score": did_not_advance.loc[
                    did_not_advance["rank"].idxmin(), "score"
                ],
            }
        )
    return pd.DataFrame(rows)


def inspect_semifinal_to_final_advancement(semifinal: pd.DataFrame) -> None:
    heading(4, "Inspect semifinal-to-final advancement")
    print(semifinal_cutoffs(semifinal).to_string(index=False))

    comparison = (
        semifinal.groupby("reached_final")
        .agg(
            athlete_events=("athlete_id", "size"),
            mean_tops=("tops", "mean"),
            mean_zones=("zones", "mean"),
            mean_points=("points", "mean"),
        )
        .rename(index={False: "Did not reach final", True: "Reached final"})
    )
    print("\nSemifinal performance comparison:")
    print(comparison.to_string(float_format=lambda value: f"{value:.2f}"))

    by_tops = (
        pd.crosstab(semifinal["tops"], semifinal["reached_final"])
        .rename(columns={False: "did_not_reach_final", True: "reached_final"})
        .reindex(columns=["did_not_reach_final", "reached_final"], fill_value=0)
    )
    by_tops["total"] = by_tops.sum(axis=1)
    by_tops["observed_final_rate"] = by_tops["reached_final"] / by_tops["total"]
    print("\nObserved final outcomes by semifinal tops:")
    print(by_tops.to_string(float_format=lambda value: f"{value:.1%}"))

    same_tops = (
        semifinal.loc[semifinal["tops"].between(0, 2)]
        .groupby(["tops", "reached_final"])
        .agg(
            athlete_events=("athlete_id", "size"),
            mean_zones=("zones", "mean"),
            mean_points=("points", "mean"),
        )
        .rename(index={False: "Did not reach final", True: "Reached final"}, level="reached_final")
    )
    print("\nWhen semifinalists had the same number of tops:")
    print(same_tops.to_string(float_format=lambda value: f"{value:.2f}"))
    print("\nPattern:")
    print("- Semifinal outcomes overlap more at low top counts because the rounds were often very hard.")
    print("- Two athletes reached finals with zero tops by collecting four zones.")
    print("- Two semifinal tops usually reached finals; three or four tops always did.")
    print("- Zones and points again separate many athletes with equal top counts.")


def build_athlete_profiles(
    tables: dict[str, pd.DataFrame],
    flags: pd.DataFrame,
    athlete_round_performance: pd.DataFrame,
) -> pd.DataFrame:
    """Build one descriptive profile row per athlete."""
    event_results = (
        tables["event_results"]
        .merge(
            tables["athletes"][["athlete_id", "name", "country"]],
            on="athlete_id",
            validate="many_to_one",
        )
        .merge(flags, on=["event_id", "athlete_id"], validate="one_to_one")
    )
    outcomes = (
        event_results.groupby(["athlete_id", "name", "country"], as_index=False)
        .agg(
            events=("event_id", "nunique"),
            semifinals=("reached_semifinal", "sum"),
            finals=("reached_final", "sum"),
            wins=("rank", lambda ranks: ranks.eq(1).sum()),
            mean_event_rank=("rank", "mean"),
            rank_std=("rank", "std"),
        )
    )

    qualification = athlete_round_performance.loc[
        athlete_round_performance["round_name"].eq("Qualification")
    ]
    qualification_profile = (
        qualification.groupby("athlete_id", as_index=False)
        .agg(
            qualification_boulders=("boulders", "sum"),
            qualification_tops=("tops", "sum"),
            qualification_zones=("zones", "sum"),
        )
    )
    qualification_profile["qualification_top_rate"] = (
        qualification_profile["qualification_tops"]
        / qualification_profile["qualification_boulders"]
    )
    qualification_profile["qualification_zone_rate"] = (
        qualification_profile["qualification_zones"]
        / qualification_profile["qualification_boulders"]
    )
    qualification_profile["qualification_zone_to_top"] = (
        qualification_profile["qualification_tops"]
        / qualification_profile["qualification_zones"]
    )

    profiles = outcomes.merge(qualification_profile, on="athlete_id", validate="one_to_one")
    profiles["semifinal_rate"] = profiles["semifinals"] / profiles["events"]
    profiles["final_rate"] = profiles["finals"] / profiles["events"]
    profiles["semifinal_to_final_rate"] = profiles["finals"] / profiles["semifinals"]
    return profiles


def inspect_athlete_profiles(profiles: pd.DataFrame) -> None:
    heading(5, "Build athlete performance profiles")
    columns = [
        "name",
        "country",
        "events",
        "semifinals",
        "finals",
        "wins",
        "mean_event_rank",
        "qualification_top_rate",
        "qualification_zone_rate",
        "qualification_zone_to_top",
    ]
    established = (
        profiles.loc[profiles["events"].ge(3)]
        .sort_values(
            ["finals", "semifinals", "mean_event_rank"],
            ascending=[False, False, True],
        )
        .head(15)
    )
    print("Athletes with at least three events, ordered by finals and semifinals reached:")
    print(established[columns].to_string(index=False, float_format=lambda value: f"{value:.3f}"))
    print("\nQualification-only rates make athlete comparisons more like-for-like than mixing all rounds.")
    print("They still reflect different events and qualification groups, so they are context, not ratings.")
    print("Zone-to-top conversion is undefined for athletes who reached zero qualification zones.")


def inspect_questions_to_investigate(profiles: pd.DataFrame) -> None:
    heading(6, "Questions raised by these profiles")
    reliable = profiles.loc[profiles["events"].ge(3)]
    high_zone_low_conversion = reliable.sort_values(
        ["qualification_zone_rate", "qualification_zone_to_top"],
        ascending=[False, True],
    ).head(5)
    columns = [
        "name",
        "events",
        "qualification_zone_rate",
        "qualification_zone_to_top",
        "semifinal_rate",
        "final_rate",
    ]
    print("High qualification zone access, shown alongside zone-to-top conversion:")
    print(high_zone_low_conversion[columns].to_string(index=False, float_format=lambda value: f"{value:.3f}"))
    print("\nUseful follow-up questions:")
    print("- Who frequently reaches zones but converts relatively few into tops?")
    print("- Who advances reliably despite modest raw top rates?")
    print("- Which athlete profiles change most when split by event or qualification group?")
    print("- Which cutoff results deserve a closer athlete-by-athlete inspection?")


def main() -> None:
    pd.set_option("display.width", 160)
    tables = load_tables()
    round_results = build_round_result_view(tables)
    flags = build_advancement_flags(round_results)
    athlete_round_performance = build_athlete_round_performance(tables, round_results)

    assert flags.loc[flags["reached_final"], "reached_semifinal"].all()

    qualification = athlete_round_performance.loc[
        athlete_round_performance["round_name"].eq("Qualification")
    ].merge(flags, on=["event_id", "athlete_id"], validate="one_to_one")
    semifinal = athlete_round_performance.loc[
        athlete_round_performance["round_name"].eq("Semi-final")
    ].merge(flags, on=["event_id", "athlete_id"], validate="one_to_one")

    inspect_advancement_counts(round_results)
    inspect_qualification_advancement(qualification)
    inspect_advancement_overlap(qualification)
    inspect_semifinal_to_final_advancement(semifinal)
    profiles = build_athlete_profiles(tables, flags, athlete_round_performance)
    inspect_athlete_profiles(profiles)
    inspect_questions_to_investigate(profiles)


if __name__ == "__main__":
    main()
