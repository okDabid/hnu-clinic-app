"use client";

import React, { forwardRef } from "react";
import "./style.css";

const SPACING_REGEX = /\D/g;

function buildDialData(countryCode) {
    if (countryCode === "ph") {
        return { countryCode, dialCode: "+63", country: "Philippines" };
    }
    return { countryCode, dialCode: "", country: "" };
}

function deriveSubscriberDigits(raw = "") {
    let digits = raw.replace(/\D/g, "");

    if (!digits) return "";

    if (digits.startsWith("63")) {
        digits = digits.slice(2);
    }

    if (!digits.startsWith("0")) {
        digits = `0${digits}`;
    }

    return digits.slice(0, 11);
}

function formatSubscriberForDisplay(subscriber) {
    if (!subscriber) return "";

    if (subscriber.length <= 4) return subscriber;
    if (subscriber.length <= 7) return `${subscriber.slice(0, 4)} ${subscriber.slice(4)}`;

    return `${subscriber.slice(0, 4)} ${subscriber.slice(4, 7)} ${subscriber.slice(7)}`;
}

export const PhoneInput = forwardRef(function PhoneInput(
    {
        value = "",
        onChange,
        defaultCountry = "ph",
        countries = ["ph"],
        className = "",
        inputClassName = "",
        placeholder = "Enter phone number",
        disabled = false,
        forceDialCode = true,
        ...rest
    },
    ref
) {
    const dialData = buildDialData(defaultCountry || countries?.[0] || "");

    const handleChange = (event) => {
        const rawDigits = event.target.value.replace(SPACING_REGEX, "");
        const subscriberDigits = deriveSubscriberDigits(rawDigits);
        const subscriberIntl = subscriberDigits.startsWith("0") ? subscriberDigits.slice(1) : subscriberDigits;
        const emitted = forceDialCode && dialData.dialCode ? `${dialData.dialCode}${subscriberIntl}` : subscriberDigits;

        onChange?.(emitted, dialData);
    };

    const resolvedValue = (() => {
        const subscriber = deriveSubscriberDigits(String(value ?? ""));
        const formatted = formatSubscriberForDisplay(subscriber);

        if (forceDialCode && dialData.dialCode) {
            return `${dialData.dialCode} ${formatted}`.trim();
        }

        return formatted;
    })();

    return (
        React.createElement(
            "div",
            { className: `rip-root ${className}` },
            React.createElement(
                "div",
                { className: "rip-flag" },
                React.createElement("span", { className: "rip-flag-emoji" }, "🇵🇭"),
                React.createElement("span", { className: "rip-dial-code" }, dialData.dialCode),
                React.createElement("span", { className: "rip-caret" }, "▾")
            ),
            React.createElement("input", {
                ref,
                className: `rip-input ${inputClassName}`,
                value: resolvedValue,
                onChange: handleChange,
                placeholder,
                disabled,
                type: "tel",
                ...rest,
            })
        )
    );
});
