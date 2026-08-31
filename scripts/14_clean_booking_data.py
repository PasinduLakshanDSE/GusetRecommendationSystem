from pathlib import Path
import pandas as pd


INPUT_PATH = Path(
    "data/raw/hotel_booking/hotel_booking.csv"
)

OUTPUT_PATH = Path(
    "data/processed/hotel_booking_clean.csv"
)


FEATURES = [
    "hotel",
    "lead_time",
    "arrival_date_month",
    "stays_in_weekend_nights",
    "stays_in_week_nights",
    "adults",
    "children",
    "babies",
    "meal",
    "country",
    "market_segment",
    "distribution_channel",
    "is_repeated_guest",
    "previous_cancellations",
    "previous_bookings_not_canceled",
    "reserved_room_type",
    "deposit_type",
    "customer_type",
    "adr",
    "required_car_parking_spaces",
    "total_of_special_requests",
]

TARGET = "is_canceled"


def main():

    print("Loading booking dataset...")

    data = pd.read_csv(INPUT_PATH)

    print(
        f"Original rows: {len(data):,}"
    )

    data = data[
        FEATURES + [TARGET]
    ].copy()

    # -------------------------------
    # Numerical cleaning
    # -------------------------------

    numerical_columns = [
        "lead_time",
        "stays_in_weekend_nights",
        "stays_in_week_nights",
        "adults",
        "children",
        "babies",
        "is_repeated_guest",
        "previous_cancellations",
        "previous_bookings_not_canceled",
        "adr",
        "required_car_parking_spaces",
        "total_of_special_requests",
    ]

    for column in numerical_columns:

        data[column] = pd.to_numeric(
            data[column],
            errors="coerce"
        )

        median = data[column].median()

        data[column] = (
            data[column]
            .fillna(median)
        )

    # -------------------------------
    # Categorical cleaning
    # -------------------------------

    categorical_columns = [
        "hotel",
        "arrival_date_month",
        "meal",
        "country",
        "market_segment",
        "distribution_channel",
        "reserved_room_type",
        "deposit_type",
        "customer_type",
    ]

    for column in categorical_columns:

        data[column] = (
            data[column]
            .fillna("Unknown")
            .astype(str)
            .str.strip()
        )

    # -------------------------------
    # Additional useful features
    # -------------------------------

    data["total_nights"] = (
        data["stays_in_weekend_nights"]
        + data["stays_in_week_nights"]
    )

    data["total_guests"] = (
        data["adults"]
        + data["children"]
        + data["babies"]
    )

    # Remove impossible bookings
    data = data[
        data["total_guests"] > 0
    ]

    # Remove extreme/invalid ADR
    data = data[
        data["adr"].between(
            0,
            5000
        )
    ]

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

    print(
        f"\nClean rows: {len(data):,}"
    )

    print("\nCancellation distribution:")

    print(
        data[TARGET]
        .value_counts()
    )

    print("\nCancellation percentage:")

    print(
        (
            data[TARGET]
            .value_counts(
                normalize=True
            )
            * 100
        ).round(2)
    )

    print(
        f"\nSaved to: {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()