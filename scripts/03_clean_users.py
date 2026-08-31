from pathlib import Path
import pandas as pd


INPUT_PATH = Path(
    "data/raw/User_Dataset/Final_Updated_Expanded_Users.csv"
)

OUTPUT_PATH = Path(
    "data/processed/users_clean.csv"
)


def main():
    data = pd.read_csv(INPUT_PATH)

    print("Original columns:")
    print(data.columns.tolist())

    # Remove fields not needed for ML
    drop_columns = [
        column
        for column in ["Name", "Email"]
        if column in data.columns
    ]

    data = data.drop(
        columns=drop_columns
    )

    # Clean preferences
    if "Preferences" in data.columns:
        data["Preferences"] = (
            data["Preferences"]
            .fillna("")
            .astype(str)
            .str.strip()
        )

    # Clean adults
    if "NumberOfAdults" in data.columns:
        data["NumberOfAdults"] = pd.to_numeric(
            data["NumberOfAdults"],
            errors="coerce"
        ).fillna(1)

    # Clean children
    if "NumberOfChildren" in data.columns:
        data["NumberOfChildren"] = pd.to_numeric(
            data["NumberOfChildren"],
            errors="coerce"
        ).fillna(0)

    # Remove duplicate users
    if "UserID" in data.columns:
        data = data.drop_duplicates(
            subset=["UserID"]
        )

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    data.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print("\nCleaned rows:")
    print(len(data))

    print(
        f"\nSaved to: {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()
