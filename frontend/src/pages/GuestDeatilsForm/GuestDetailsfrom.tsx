import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Moon,
  Users,
  Baby,
  Compass,
  Wallet,
  BedDouble,
  Utensils,
  Activity,
  MessageSquareText,
  Accessibility,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import "./guestDeatilsFrom.css";
import "./districtPicker.css";

type GuestFormData = {
  // Step 1
  fullName: string;
  email: string;
  phone: string;
  country: string;

  // Step 2
  arrivalDate: string;
  stayDuration: number;
  adults: number;
  children: number;
  purposeOfVisit: string;
  district: string;

  // Step 3
  budget: string;
  activityLevel: string;
  roomPreference: string;
  foodPreference: string;
  interests: string[];
  specialRequests: string;
  accessibilityNeeds: string;
  consent: boolean;
};

const initialFormData: GuestFormData = {
  fullName: "",
  email: "",
  phone: "",
  country: "",

  arrivalDate: "",
  stayDuration: 2,
  adults: 2,
  children: 0,
  purposeOfVisit: "Leisure",
  district: "",

  budget: "Medium",
  activityLevel: "Moderate",
  roomPreference: "",
  foodPreference: "",
  interests: [],
  specialRequests: "",
  accessibilityNeeds: "",
  consent: false,
};

const interestOptions = [
  "Nature",
  "Culture",
  "Adventure",
  "Food",
  "Wellness",
  "Entertainment",
  "Shopping",
  "Family",
];

const districtOptions = [
  { value: "Ella", note: "Hill-country escape" },
  { value: "Kandy", note: "Nearby Matale & Hatton" },
  { value: "Badulla", note: "Waterfalls & nature" },
  { value: "Colombo", note: "City experiences" },
  { value: "Galle", note: "Coastal heritage" },
  { value: "Hatton", note: "Tea country" },
  { value: "Matale", note: "Lakes & mountains" },
  { value: "Matara", note: "Southern coast" },
  { value: "Hambantota", note: "Wildlife & beaches" },
  { value: "Kurunegala", note: "Cultural sites" },
  { value: "Kalutara", note: "Coastal relaxation" },
  { value: "Ratnapura", note: "Nature & gems" },
];

export default function GuestDetailsfrom() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] =
    useState<GuestFormData>(initialFormData);

  const updateField = (
    field: keyof GuestFormData,
    value: string | number | boolean | string[]
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const toggleInterest = (interest: string) => {
    const exists = formData.interests.includes(interest);

    const updated = exists
      ? formData.interests.filter((item) => item !== interest)
      : [...formData.interests, interest];

    updateField("interests", updated);
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) {
      alert("Please enter your full name.");
      return false;
    }

    if (!formData.email.trim()) {
      alert("Please enter your email address.");
      return false;
    }

    if (!formData.phone.trim()) {
      alert("Please enter your phone number.");
      return false;
    }

    if (!formData.country) {
      alert("Please select your country.");
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!formData.arrivalDate) {
      alert("Please select your arrival date.");
      return false;
    }

    if (formData.adults < 1) {
      alert("At least one adult is required.");
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) {
      return;
    }

    if (step === 2 && !validateStep2()) {
      return;
    }

    setStep((current) => Math.min(current + 1, 3));
  };

  const previousStep = () => {
    setStep((current) => Math.max(current - 1, 1));
  };

  const submitForm = async () => {
    if (!formData.consent) {
      alert(
        "Please provide consent before submitting your preferences."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:8000/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const guest = await response.json();
      if (!response.ok) throw new Error(guest.error || "Unable to submit preferences.");
      sessionStorage.setItem("latestGuestAnalysis", JSON.stringify({
        name: guest.fullName,
        country: guest.country,
        adults: guest.adults,
        budget: guest.budget,
        district: guest.district,
        status: guest.status,
        analysis: guest.aiAnalysis,
      }));
      navigate("/Hotelstaffdashboard");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to contact the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="guest-page">
      <div className="guest-card">

        {/* ==============================
            STEP HEADER
        ============================== */}

        <div className="guest-top-row">
          <span className="step-badge">
            STEP {step} ·{" "}
            {step === 1
              ? "GUEST INFORMATION"
              : step === 2
              ? "STAY INFORMATION"
              : "YOUR PREFERENCES"}
          </span>

          <span className="step-count">
            Step {step} of 3
          </span>
        </div>

        {/* ==============================
            STEP 1
        ============================== */}

        {step === 1 && (
          <>
            <h1>Guest details</h1>

            <p className="guest-subtitle">
              Let&apos;s begin with your contact details so the
              hotel can identify your booking.
            </p>

            <StepIndicator step={step} />

            <div className="form-section">

              <FormField
                label="Full name"
                icon={<User size={20} />}
              >
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(event) =>
                    updateField(
                      "fullName",
                      event.target.value
                    )
                  }
                />
              </FormField>

              <div className="two-column">

                <FormField
                  label="Email address"
                  icon={<Mail size={20} />}
                >
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(event) =>
                      updateField(
                        "email",
                        event.target.value
                      )
                    }
                  />
                </FormField>

                <FormField
                  label="Phone number"
                  icon={<Phone size={20} />}
                >
                  <input
                    type="tel"
                    placeholder="+94 77 123 4567"
                    value={formData.phone}
                    onChange={(event) =>
                      updateField(
                        "phone",
                        event.target.value
                      )
                    }
                  />
                </FormField>

              </div>

              <FormField
                label="Country of residence"
                icon={<MapPin size={20} />}
              >
                <select
                  value={formData.country}
                  onChange={(event) =>
                    updateField(
                      "country",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select your country
                  </option>

                  <option value="Sri Lanka">
                    Sri Lanka
                  </option>

                  <option value="United Kingdom">
                    United Kingdom
                  </option>

                  <option value="Germany">
                    Germany
                  </option>

                  <option value="France">
                    France
                  </option>

                  <option value="India">
                    India
                  </option>

                  <option value="Australia">
                    Australia
                  </option>

                  <option value="United States">
                    United States
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </FormField>
            </div>
          </>
        )}

        {/* ==============================
            STEP 2
        ============================== */}

        {step === 2 && (
          <>
            <h1>Plan your stay</h1>

            <p className="guest-subtitle">
              Tell us when you are visiting and who will
              be joining you.
            </p>

            <StepIndicator step={step} />

            <div className="form-section">

              <div className="two-column">

                <FormField
                  label="Arrival date"
                  icon={<CalendarDays size={20} />}
                >
                  <input
                    type="date"
                    value={formData.arrivalDate}
                    onChange={(event) =>
                      updateField(
                        "arrivalDate",
                        event.target.value
                      )
                    }
                  />
                </FormField>

                <FormField
                  label="Length of stay"
                  icon={<Moon size={20} />}
                >
                  <select
                    value={formData.stayDuration}
                    onChange={(event) =>
                      updateField(
                        "stayDuration",
                        Number(event.target.value)
                      )
                    }
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 10, 14].map(
                      (night) => (
                        <option
                          value={night}
                          key={night}
                        >
                          {night}{" "}
                          {night === 1
                            ? "night"
                            : "nights"}
                        </option>
                      )
                    )}
                  </select>
                </FormField>

              </div>

              <div className="three-column">

                <FormField
                  label="Adults"
                  icon={<Users size={20} />}
                >
                  <select
                    value={formData.adults}
                    onChange={(event) =>
                      updateField(
                        "adults",
                        Number(event.target.value)
                      )
                    }
                  >
                    {[1, 2, 3, 4, 5, 6].map(
                      (value) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {value}
                        </option>
                      )
                    )}
                  </select>
                </FormField>

                <FormField
                  label="Children"
                  icon={<Baby size={20} />}
                >
                  <select
                    value={formData.children}
                    onChange={(event) =>
                      updateField(
                        "children",
                        Number(event.target.value)
                      )
                    }
                  >
                    {[0, 1, 2, 3, 4, 5].map(
                      (value) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {value}
                        </option>
                      )
                    )}
                  </select>
                </FormField>

                <FormField
                  label="Purpose of visit"
                  icon={<Compass size={20} />}
                >
                  <select
                    value={
                      formData.purposeOfVisit
                    }
                    onChange={(event) =>
                      updateField(
                        "purposeOfVisit",
                        event.target.value
                      )
                    }
                  >
                    <option value="Leisure">
                      Leisure
                    </option>
                    <option value="Business">
                      Business
                    </option>
                    <option value="Family Holiday">
                      Family Holiday
                    </option>
                    <option value="Honeymoon">
                      Honeymoon
                    </option>
                    <option value="Wellness">
                      Wellness
                    </option>
                    <option value="Adventure">
                      Adventure
                    </option>
                  </select>
                </FormField>

              </div>

              <section className="district-picker">
                <div className="district-picker-heading">
                  <div>
                    <span className="district-picker-label"><MapPin size={17} /> Preferred area or district</span>
                    <p>Choose an area to prioritise local recommendations.</p>
                  </div>
                  <span className="district-optional">Optional</span>
                </div>
                <div className="district-option-grid">
                  {districtOptions.map((district) => (
                    <button
                      type="button"
                      key={district.value}
                      className={formData.district === district.value ? "district-option selected" : "district-option"}
                      onClick={() => updateField("district", district.value)}
                    >
                      <MapPin size={17} />
                      <span><b>{district.value}</b><small>{district.note}</small></span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className={!formData.district ? "district-option no-preference selected" : "district-option no-preference"}
                    onClick={() => updateField("district", "")}
                  >
                    <span><b>No preference</b><small>Show the best matches across Sri Lanka</small></span>
                  </button>
                </div>
                
              </section>

            </div>
          </>
        )}

        {/* ==============================
            STEP 3
        ============================== */}

        {step === 3 && (
          <>
            <h1>Your preferences</h1>

            <p className="guest-subtitle">
              Tell us what matters most so we can
              personalise your stay.
            </p>

            <StepIndicator step={step} />

            <div className="form-section">

              <div className="two-column">

                <FormField
                  label="Budget level"
                  icon={<Wallet size={20} />}
                >
                  <select
                    value={formData.budget}
                    onChange={(event) =>
                      updateField(
                        "budget",
                        event.target.value
                      )
                    }
                  >
                    <option value="Low">
                      Low
                    </option>
                    <option value="Medium">
                      Medium
                    </option>
                    <option value="High">
                      High
                    </option>
                    <option value="Luxury">
                      Luxury
                    </option>
                  </select>
                </FormField>

                <FormField
                  label="Activity level"
                  icon={<Activity size={20} />}
                >
                  <select
                    value={formData.activityLevel}
                    onChange={(event) =>
                      updateField(
                        "activityLevel",
                        event.target.value
                      )
                    }
                  >
                    <option value="Low">
                      Relaxed
                    </option>

                    <option value="Moderate">
                      Moderate
                    </option>

                    <option value="High">
                      Active
                    </option>
                  </select>
                </FormField>

              </div>

              <div className="two-column">

                <FormField
                  label="Room preference"
                  icon={<BedDouble size={20} />}
                >
                  <select
                    value={
                      formData.roomPreference
                    }
                    onChange={(event) =>
                      updateField(
                        "roomPreference",
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select room preference
                    </option>

                    <option value="Quiet Room">
                      Quiet Room
                    </option>

                    <option value="High Floor">
                      High Floor
                    </option>

                    <option value="Pool View">
                      Pool View
                    </option>

                    <option value="Nature View">
                      Nature View
                    </option>

                    <option value="Near Facilities">
                      Near Facilities
                    </option>

                    <option value="No Preference">
                      No Preference
                    </option>
                  </select>
                </FormField>

                <FormField
                  label="Food preference"
                  icon={<Utensils size={20} />}
                >
                  <select
                    value={
                      formData.foodPreference
                    }
                    onChange={(event) =>
                      updateField(
                        "foodPreference",
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select food preference
                    </option>

                    <option value="Sri Lankan">
                      Sri Lankan
                    </option>

                    <option value="Western">
                      Western
                    </option>

                    <option value="Vegetarian">
                      Vegetarian
                    </option>

                    <option value="Vegan">
                      Vegan
                    </option>

                    <option value="Seafood">
                      Seafood
                    </option>

                    <option value="Halal">
                      Halal
                    </option>

                    <option value="No Preference">
                      No Preference
                    </option>
                  </select>
                </FormField>

              </div>

              <div className="interest-section">
                <label>
                  What are you interested in?
                </label>

                <div className="interest-grid">
                  {interestOptions.map(
                    (interest) => (
                      <button
                        type="button"
                        key={interest}
                        className={
                          formData.interests.includes(
                            interest
                          )
                            ? "interest-option selected"
                            : "interest-option"
                        }
                        onClick={() =>
                          toggleInterest(interest)
                        }
                      >
                        {interest}
                      </button>
                    )
                  )}
                </div>
              </div>

              <FormField
                label="Special requests"
                icon={
                  <MessageSquareText size={20} />
                }
              >
                <textarea
                  rows={3}
                  placeholder="Airport pickup, early check-in, romantic setup, baby cot, etc."
                  value={
                    formData.specialRequests
                  }
                  onChange={(event) =>
                    updateField(
                      "specialRequests",
                      event.target.value
                    )
                  }
                />
              </FormField>

              <FormField
                label="Accessibility requirements"
                icon={<Accessibility size={20} />}
              >
                <textarea
                  rows={2}
                  placeholder="Please tell us about any accessibility requirements."
                  value={
                    formData.accessibilityNeeds
                  }
                  onChange={(event) =>
                    updateField(
                      "accessibilityNeeds",
                      event.target.value
                    )
                  }
                />
              </FormField>

              <label className="consent-row">
                <input
                  type="checkbox"
                  checked={formData.consent}
                  onChange={(event) =>
                    updateField(
                      "consent",
                      event.target.checked
                    )
                  }
                />

                <span>
                  I agree that my submitted
                  preferences may be used to
                  personalise my stay and generate
                  recommendations.
                </span>
              </label>

            </div>
          </>
        )}

        {/* ==============================
            FOOTER
        ============================== */}

        <div className="form-footer">

          <div className="privacy-message">
            <ShieldCheck size={17} />

            <span>
              Your details are secure and used only
              to personalise your stay.
            </span>
          </div>

          <div className="navigation-buttons">

            {step > 1 && (
              <button
                type="button"
                className="back-button"
                onClick={previousStep}
              >
                <ChevronLeft size={18} />
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                className="continue-button"
                onClick={nextStep}
              >
                Continue
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                className="continue-button"
                onClick={submitForm}
              >
                {isSubmitting ? "Generating AI analysis..." : "Submit preferences"}
                <ChevronRight size={18} />
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   REUSABLE COMPONENTS
========================================= */

function StepIndicator({
  step,
}: {
  step: number;
}) {
  return (
    <div className="step-indicator">
      {[1, 2, 3].map((number) => (
        <div
          key={number}
          className={
            number <= step
              ? "step-circle active"
              : "step-circle"
          }
        >
          {number}
        </div>
      ))}
    </div>
  );
}

type FormFieldProps = {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
};

function FormField({
  label,
  icon,
  children,
}: FormFieldProps) {
  return (
    <div className="form-group">
      <label>{label}</label>

      <div className="input-wrapper">
        <span className="field-icon">
          {icon}
        </span>

        {children}
      </div>
    </div>
  );
}
