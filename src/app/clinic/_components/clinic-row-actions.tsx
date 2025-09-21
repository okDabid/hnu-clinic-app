// app/clinic/_components/clinic-row-actions.tsx
"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormStatus } from "react-dom";
import { updateClinicContact } from "../actions";

function SubmitBtn() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save"}
        </Button>
    );
}

export function ClinicRowActions({
    clinicId,
    currentNumber,
}: {
    clinicId: string;
    currentNumber?: string | null;
}) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(currentNumber ?? "");

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="p-2 rounded-full hover:bg-gray-100"
                    aria-label="Open menu"
                >
                    <MoreHorizontal className="h-5 w-5 text-gray-600" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
                {/* Use a Dialog to collect the new number */}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        {/* prevent menu from closing before trigger opens dialog */}
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            Update Contact Number
                        </DropdownMenuItem>
                    </DialogTrigger>

                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Update contact number</DialogTitle>
                        </DialogHeader>

                        <form
                            action={async (fd: FormData) => {
                                const res = await updateClinicContact(fd);
                                if (!("error" in res)) setOpen(false);
                            }}
                            className="space-y-4"
                        >
                            <input type="hidden" name="clinic_id" value={clinicId} />
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Contact number</label>
                                <Input
                                    name="clinic_contactno"
                                    placeholder="11-digit number"
                                    maxLength={11}
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                />
                                <p className="text-xs text-gray-500">
                                    Must be exactly 11 digits.
                                </p>
                            </div>

                            <DialogFooter className="gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <SubmitBtn />
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
