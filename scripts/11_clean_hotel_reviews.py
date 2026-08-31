from pathlib import Path
import re
import pandas as pd


INPUT_PATH = Path(
    "data/raw/hotel_reviews/Hotel_Reviews.csv"
)

OUTPUT_PATH = Path(
    "data/processed/hotel_reviews_nlp.csv"
)


def clean_text(value):
    if pd.isna(value):
        return ""

    text = str(value).lower().strip()

    # Dataset placeholder values
    if text in {
        "no positive",
        "no negative",
        "nothing",
        "none",
        "n/a",
    }:
        return ""

    # Remove unnecessary symbols
    text = re.sub(
        r"[^a-z0-9\s]",
        " ",
        text
    )

    # Remove repeated spaces
    text = re.sub(
        r"\s+",
        " ",
        text
    ).strip()

    return text


def main():

    print("Loading dataset...")

    data = pd.read_csv(
        INPUT_PATH,
        usecols=[
            "Hotel_Name",
            "Reviewer_Nationality",
            "Negative_Review",
            "Positive_Review",
            "Reviewer_Score",
            "Tags",
        ]
    )

    print(
        f"Original reviews: {len(data):,}"
    )

    # ------------------------------------------
    # Clean text
    # ------------------------------------------

    data["Positive_Clean"] = (
        data["Positive_Review"]
        .apply(clean_text)
    )

    data["Negative_Clean"] = (
        data["Negative_Review"]
        .apply(clean_text)
    )

    # Combine positive and negative text
    data["Combined_Review"] = (
        data["Positive_Clean"]
        + " "
        + data["Negative_Clean"]
    ).str.strip()

    # ------------------------------------------
    # Clean nationality
    # ------------------------------------------

    data["Reviewer_Nationality"] = (
        data["Reviewer_Nationality"]
        .fillna("Unknown")
        .astype(str)
        .str.strip()
    )

    # ------------------------------------------
    # Clean score
    # ------------------------------------------

    data["Reviewer_Score"] = (
        pd.to_numeric(
            data["Reviewer_Score"],
            errors="coerce"
        )
    )

    # Remove rows with no usable text
    data = data[
        data["Combined_Review"].str.len() >= 10
    ].copy()

    # Remove duplicates
    data = data.drop_duplicates(
        subset=[
            "Hotel_Name",
            "Combined_Review",
        ]
    )

    data.reset_index(
        drop=True,
        inplace=True
    )

    # ------------------------------------------
    # Create sentiment label from reviewer score
    #
    # 0-4.9  = Negative
    # 5-7.9  = Neutral
    # 8-10   = Positive
    #
    # This is a derived training label.
    # ------------------------------------------

    def sentiment_label(score):

        if pd.isna(score):
            return "Unknown"

        if score >= 8:
            return "Positive"

        if score >= 5:
            return "Neutral"

        return "Negative"

    data["Sentiment"] = (
        data["Reviewer_Score"]
        .apply(sentiment_label)
    )

    # Don't use rows without a score for supervised NLP
    data = data[
        data["Sentiment"] != "Unknown"
    ].copy()

    # ------------------------------------------
    # Save
    # ------------------------------------------

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    data.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print(
        f"\nClean usable reviews: {len(data):,}"
    )

    print("\nSentiment distribution:")

    print(
        data["Sentiment"]
        .value_counts()
    )

    print("\nSample:")

    print(
        data[
            [
                "Hotel_Name",
                "Reviewer_Nationality",
                "Reviewer_Score",
                "Sentiment",
                "Combined_Review",
            ]
        ]
        .head(5)
        .to_string(index=False)
    )

    print(
        f"\nSaved to: {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()