from pathlib import Path
import pandas as pd


INPUT_PATH = Path(
    "data/raw/sri_lanka_places/Destination Reviews_(raw).csv"
)

OUTPUT_PATH = Path(
    "data/processed/destination_reviews_clean.csv"
)


def main():
    if not INPUT_PATH.exists():
        raise FileNotFoundError(
            f"File not found: {INPUT_PATH}"
        )

    data = pd.read_csv(
        INPUT_PATH,
        encoding="latin-1"
    )

    # Clean column names
    data.columns = (
        data.columns
        .str.strip()
    )

    print("Original rows:", len(data))
    print("\nColumns:")
    print(data.columns.tolist())

    required = [
        "Destination",
        "District",
        "Review",
    ]

    missing = [
        column
        for column in required
        if column not in data.columns
    ]

    if missing:
        raise ValueError(
            f"Missing columns: {missing}"
        )

    # Keep useful fields
    keep_columns = [
        column
        for column in [
            "Destination",
            "District",
            "Timespan",
            "Review",
        ]
        if column in data.columns
    ]

    data = data[keep_columns].copy()

    # Clean text
    for column in [
        "Destination",
        "District",
        "Review",
    ]:
        data[column] = (
            data[column]
            .astype("string")
            .str.strip()
        )

    # Remove missing records
    data = data.dropna(
        subset=[
            "Destination",
            "Review",
        ]
    )

    data = data[
        data["Review"].str.len() > 2
    ]

    # Remove duplicate reviews
    data = data.drop_duplicates(
        subset=[
            "Destination",
            "Review",
        ]
    )

    data.reset_index(
        drop=True,
        inplace=True
    )

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    data.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print("\nClean rows:", len(data))

    print(
        "\nUnique destinations:",
        data["Destination"].nunique()
    )

    print(
        "\nUnique districts:",
        data["District"].nunique()
    )

    print("\nTop destinations:")
    print(
        data["Destination"]
        .value_counts()
        .head(15)
    )

    print(
        f"\nSaved to: {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()
