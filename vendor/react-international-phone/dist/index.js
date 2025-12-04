"use client";

import React, { forwardRef } from "react";
import "./style.css";

function buildDialData(countryCode) {
    if (countryCode === "ph") {
        return { countryCode, dialCode: "+63", country: "Philippines" };
    }
    return { countryCode, dialCode: "", country: "" };
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
        const raw = event.target.value;
        const withDial = forceDialCode && dialData.dialCode
            ? `${dialData.dialCode} ${raw.replace(/^[+]?63\s?/, "").replace(/^0/, "")}`.trim()
            : raw;
        onChange?.(withDial, dialData);
    };

    const resolvedValue = (() => {
        if (!value && forceDialCode && dialData.dialCode) return `${dialData.dialCode} `;
        if (forceDialCode && dialData.dialCode && !String(value).startsWith(dialData.dialCode)) {
            const raw = String(value).replace(/^[+]?63\s?/, "").replace(/^0/, "");
            return `${dialData.dialCode} ${raw}`.trim();
        }
        return value;
    })();

    return (
        React.createElement(
            "div",
            { className: `rip-root ${className}` },
            countries?.length > 1 ? (
                React.createElement(
                    "div",
                    { className: "rip-flag" },
                    dialData.country ? `🇵🇭 ${dialData.dialCode}` : dialData.dialCode
                )
            ) : (
                React.createElement(
                    "div",
                    { className: "rip-flag" },
                    `🇵🇭 ${dialData.dialCode}`
                )
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
