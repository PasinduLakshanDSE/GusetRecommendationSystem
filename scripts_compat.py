import importlib.util
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent


def load_module(
    module_name,
    file_path,
):

    spec = (
        importlib.util
        .spec_from_file_location(
            module_name,
            file_path
        )
    )

    module = (
        importlib.util
        .module_from_spec(
            spec
        )
    )

    spec.loader.exec_module(
        module
    )

    return module


service_module = load_module(
    "service_recommender",
    BASE_DIR
    / "scripts"
    / "10_service_recommender.py",
)


place_module = load_module(
    "place_recommender",
    BASE_DIR
    / "scripts"
    / "09_place_recommender.py",
)


def load_service_recommendations(
    guest_preferences,
    budget,
    top_n=5,
):

    return (
        service_module
        .recommend_services(
            guest_preferences=
                guest_preferences,

            guest_budget=
                budget,

            top_n=
                top_n,
        )
    )


def load_place_recommendations(
    guest_preferences,
    top_n=5,
    district=None,
):

    return (
        place_module
        .recommend_places(
            guest_preferences,
            top_n=top_n,
            district=district,
        )
    )