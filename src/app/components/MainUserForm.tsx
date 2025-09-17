"use client";

import React, { useState, useRef } from "react";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import StudentForm from "./StudentForm";
import EmployeeForm from "./EmployeeForm";
import NurseForm from "./NurseForm";
import DoctorForm from "./DoctorForm";
import WorkingScholarForm from "./WorkingScholarForm";

const roles = [
    { label: "Student", value: "STUDENT" },
    { label: "Employee", value: "EMPLOYEE" },
    { label: "Nurse", value: "NURSE" },
    { label: "Doctor", value: "DOCTOR" },
    { label: "Working Scholar", value: "WORKING_SCHOLAR" },
];

export default function MainUserForm() {
    
}