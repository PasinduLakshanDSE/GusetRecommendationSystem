from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parent.parent

RAW_PATH = PROJECT_ROOT / "data/raw/travel_review/google_review_ratings.csv"

OUTPUT_PATH = PROJECT_ROOT / "data/processed/google_review_preferences.csv"

OUTPUT_PATH.parent.mkdir(
    parents=True,
    exist_ok=True
)


CATEGORY_NAMES = [
    "Churches",
    "Resorts",
    "Beaches",
    "Parks",
    "Theatres",
    "Museums",
    "Malls",
    "Zoos",
    "Restaurants",
    "Pubs_Bars",
    "Local_Services",
    "Burger_Pizza",
    "Hotels_Lodgings",
    "Juice_Bars",
    "Art_Galleries",
    "Dance_Clubs",
    "Swimming_Pools",
    "Gyms",
    "Bakeries",
    "Beauty_Spas",
    "Cafes",
    "Viewpoints",
    "Monuments",
    "Gardens",
]


def main():
    data = pd.read_csv(
        RAW_PATH
    )

    print("Original shape:")
    print(data.shape)

    print("\nOriginal columns:")
    print(data.columns.tolist())

    # CSV exports can contain trailing columns with no defined schema.
    unnamed_columns = [
        column
        for column in data.columns
        if str(column).startswith("Unnamed:")
    ]
    if unnamed_columns:
        discarded_values = int(data[unnamed_columns].notna().sum().sum())
        print(
            f"\nDropping unnamed export columns "
            f"({discarded_values} non-empty values)."
        )
        data = data.drop(columns=unnamed_columns)

    # First column should represent the user.
    original_columns = data.columns.tolist()

    new_columns = [
        "User_ID",
        *CATEGORY_NAMES,
    ]

    if len(original_columns) != len(new_columns):
        raise ValueError(
            f"Expected {len(new_columns)} columns "
            f"but dataset contains {len(original_columns)}."
        )

    data.columns = new_columns

    # Clean user ID.
    data["User_ID"] = (
        data["User_ID"]
        .astype(str)
        .str.strip()
    )

    # Convert ratings to numeric.
    rating_columns = CATEGORY_NAMES

    for column in rating_columns:
        data[column] = pd.to_numeric(
            data[column],
            errors="coerce"
        )

    # Replace missing ratings with median.
    for column in rating_columns:
        data[column] = data[column].fillna(
            data[column].median()
        )

    # Remove duplicate users.
    data = data.drop_duplicates(
        subset=["User_ID"]
    )

    # Create higher-level preference dimensions.

    data["Nature_Interest"] = data[
        [
            "Beaches",
            "Parks",
            "Viewpoints",
            "Gardens",
        ]
    ].mean(axis=1)

    data["Culture_Interest"] = data[
        [
            "Churches",
            "Museums",
            "Art_Galleries",
            "Monuments",
        ]
    ].mean(axis=1)

    data["Food_Interest"] = data[
        [
            "Restaurants",
            "Burger_Pizza",
            "Juice_Bars",
            "Bakeries",
            "Cafes",
        ]
    ].mean(axis=1)

    data["Wellness_Interest"] = data[
        [
            "Resorts",
            "Swimming_Pools",
            "Gyms",
            "Beauty_Spas",
        ]
    ].mean(axis=1)

    data["Entertainment_Interest"] = data[
        [
            "Theatres",
            "Pubs_Bars",
            "Dance_Clubs",
        ]
    ].mean(axis=1)

    data["Shopping_Interest"] = data[
        [
            "Malls",
            "Local_Services",
        ]
    ].mean(axis=1)

    data["Family_Interest"] = data[
        [
            "Zoos",
            "Parks",
            "Gardens",
        ]
    ].mean(axis=1)

    data.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print("\nCleaned shape:")
    print(data.shape)

    print(
        f"\nSaved to: {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()
