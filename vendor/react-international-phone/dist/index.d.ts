import * as React from "react";

export interface PhoneInputData {
    countryCode?: string;
    dialCode?: string;
    country?: string;
}

export interface PhoneInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
    value?: string;
    onChange?: (value: string, data: PhoneInputData) => void;
    defaultCountry?: string;
    countries?: string[];
    inputClassName?: string;
    forceDialCode?: boolean;
}

export const PhoneInput: React.ForwardRefExoticComponent<
    PhoneInputProps & React.RefAttributes<HTMLInputElement>
>;
