"use client";

import { useCallback, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, Cog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type AccountPasswordPayload = {
    oldPassword: string;
    newPassword: string;
};

export type AccountPasswordResult = {
    error?: string;
    success?: string;
};

export type AccountPasswordSubmit = (
    payload: AccountPasswordPayload
) => Promise<AccountPasswordResult | void>;

interface AccountPasswordDialogProps {
    onSubmit: AccountPasswordSubmit;
    onSuccess?: (message: string) => void;
    triggerAriaLabel?: string;
    triggerClassName?: string;
    dialogTitle?: string;
    dialogDescription?: string;
    successMessage?: string;
}

const passwordValidationRules: { test: (value: string) => boolean; message: string }[] = [
    { test: (value) => value.length >= 8, message: "Password must be at least 8 characters." },
    { test: (value) => /[A-Z]/.test(value), message: "Must contain an uppercase letter." },
    { test: (value) => /[a-z]/.test(value), message: "Must contain a lowercase letter." },
    { test: (value) => /\d/.test(value), message: "Must contain a number." },
    { test: (value) => /[^\w\s]/.test(value), message: "Must contain a symbol." },
];

function collectPasswordErrors(password: string) {
    return passwordValidationRules
        .filter((rule) => !rule.test(password))
        .map((rule) => rule.message);
}

export function AccountPasswordDialog({
    onSubmit,
    onSuccess,
    triggerAriaLabel = "Update password",
    triggerClassName,
    dialogTitle = "Update password",
    dialogDescription = "Change your account password securely. Enter your current password and set a new one.",
    successMessage = "Password updated successfully!",
}: AccountPasswordDialogProps) {
    const [open, setOpen] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [livePasswordErrors, setLivePasswordErrors] = useState<string[]>([]);

    const combinedErrors = useMemo(() => {
        if (errors.length > 0) return errors;
        return livePasswordErrors;
    }, [errors, livePasswordErrors]);

    const resetState = useCallback(() => {
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
        setLoading(false);
        setErrors([]);
        setLivePasswordErrors([]);
        setMessage(null);
    }, []);

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (!nextOpen) {
                resetState();
            }
            setOpen(nextOpen);
        },
        [resetState]
    );

    const handleSubmit = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);
            const oldPassword = String(formData.get("oldPassword") ?? "");
            const newPassword = String(formData.get("newPassword") ?? "");
            const confirmPassword = String(formData.get("confirmPassword") ?? "");

            const validationErrors = collectPasswordErrors(newPassword);
            if (newPassword !== confirmPassword) {
                validationErrors.push("Passwords do not match.");
            }

            if (validationErrors.length > 0) {
                setErrors(validationErrors);
                setMessage(null);
                return;
            }

            try {
                setLoading(true);
                setErrors([]);
                setMessage(null);

                const result = await onSubmit({ oldPassword, newPassword });

                if (result && result.error) {
                    setErrors([result.error]);
                    return;
                }

                const success = result?.success ?? successMessage;
                setMessage(success);
                onSuccess?.(success);
                form.reset();
            } catch (error) {
                console.error("Password update failed", error);
                setErrors(["Failed to update password. Please try again."]);
            } finally {
                setLoading(false);
            }
        },
        [onSubmit, onSuccess, successMessage]
    );

    const handleNewPasswordChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (value.length === 0) {
            setLivePasswordErrors([]);
            setMessage(null);
            return;
        }
        setLivePasswordErrors(collectPasswordErrors(value));
        setMessage(null);
    }, []);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    aria-label={triggerAriaLabel}
                    className={cn(
                        "rounded-xl border-green-200 text-green-700 hover:bg-green-100/60",
                        triggerClassName
                    )}
                >
                    <Cog className="h-5 w-5 text-green-600" />
                </Button>
            </DialogTrigger>

            <DialogContent className="w-[95%] max-w-md rounded-3xl border border-green-100/80 bg-white/95">
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                    <DialogDescription>{dialogDescription}</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label className="mb-1 block font-medium">Current password</Label>
                        <div className="relative">
                            <Input type={showCurrent ? "text" : "password"} name="oldPassword" required className="pr-10" />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowCurrent((prev) => !prev)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-transparent"
                            >
                                {showCurrent ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                            </Button>
                        </div>
                    </div>

                    <div>
                        <Label className="mb-1 block font-medium">New password</Label>
                        <div className="relative">
                            <Input
                                type={showNew ? "text" : "password"}
                                name="newPassword"
                                required
                                className="pr-10"
                                onChange={handleNewPasswordChange}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowNew((prev) => !prev)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-transparent"
                            >
                                {showNew ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                            </Button>
                        </div>
                    </div>

                    <div>
                        <Label className="mb-1 block font-medium">Confirm password</Label>
                        <div className="relative">
                            <Input
                                type={showConfirm ? "text" : "password"}
                                name="confirmPassword"
                                required
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowConfirm((prev) => !prev)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-transparent"
                            >
                                {showConfirm ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                            </Button>
                        </div>
                    </div>

                    {combinedErrors.length > 0 && (
                        <ul className="space-y-1 text-sm text-red-600">
                            {combinedErrors.map((error, index) => (
                                <li key={index}>• {error}</li>
                            ))}
                        </ul>
                    )}

                    {message ? <p className="text-sm text-green-600">{message}</p> : null}

                    <DialogFooter>
                        <Button
                            type="submit"
                            className="w-full rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                                </>
                            ) : (
                                "Update password"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
