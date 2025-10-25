"use client";

import { useCallback, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, Cog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { getPasswordStrength } from "@/lib/password-strength";

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
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

    const passwordMismatchMessage = useMemo(() => {
        if (!newPassword || !confirmPassword) return null;
        if (newPassword === confirmPassword) return null;
        return "Passwords do not match.";
    }, [confirmPassword, newPassword]);

    const canSubmit = useMemo(() => {
        if (!newPassword || !confirmPassword) {
            return false;
        }

        if (newPassword !== confirmPassword) {
            return false;
        }

        return passwordStrength.label !== "Too weak";
    }, [confirmPassword, newPassword, passwordStrength.label]);

    const resetState = useCallback(() => {
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
        setLoading(false);
        setErrors([]);
        setMessage(null);
        setNewPassword("");
        setConfirmPassword("");
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
            const newPasswordValue = String(formData.get("newPassword") ?? "");
            const confirmPasswordValue = String(formData.get("confirmPassword") ?? "");

            setNewPassword(newPasswordValue);
            setConfirmPassword(confirmPasswordValue);

            const hasMismatch = newPasswordValue !== confirmPasswordValue;
            const strength = getPasswordStrength(newPasswordValue);
            const isTooWeak = strength.label === "Too weak";

            if (hasMismatch || isTooWeak) {
                setErrors([]);
                setMessage(null);
                return;
            }

            try {
                setLoading(true);
                setErrors([]);
                setMessage(null);

                const result = await onSubmit({ oldPassword, newPassword: newPasswordValue });

                if (result && result.error) {
                    setErrors([result.error]);
                    return;
                }

                const success = result?.success ?? successMessage;
                setMessage(success);
                onSuccess?.(success);
                form.reset();
                setNewPassword("");
                setConfirmPassword("");
            } catch (error) {
                console.error("Password update failed", error);
                setErrors(["Failed to update password. Please try again."]);
            } finally {
                setLoading(false);
            }
        },
        [onSubmit, onSuccess, successMessage]
    );

    const handleNewPasswordChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            setNewPassword(value);
            setErrors([]);
            setMessage(null);
        },
        []
    );

    const handleConfirmPasswordChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            setConfirmPassword(value);
            setErrors([]);
            setMessage(null);
        },
        []
    );

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
                        <div className="space-y-2">
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
                                    {showNew ? (
                                        <EyeOff className="h-5 w-5 text-gray-500" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-500" />
                                    )}
                                </Button>
                            </div>
                            {newPassword ? (
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className={cn("font-medium", passwordStrength.textClass)}>
                                            Strength: {passwordStrength.label}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            Use 8+ chars with letters, numbers & symbols
                                        </span>
                                    </div>
                                    <Progress
                                        value={passwordStrength.value}
                                        indicatorClassName={passwordStrength.indicatorClass}
                                        aria-label={`Password strength ${passwordStrength.label || "unknown"}`}
                                    />
                                </div>
                            ) : null}
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
                                onChange={handleConfirmPasswordChange}
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
                        {passwordMismatchMessage ? (
                            <p className="mt-2 text-xs text-muted-foreground">{passwordMismatchMessage}</p>
                        ) : null}
                    </div>

                    {errors.length > 0 ? (
                        <div className="space-y-1 text-sm text-red-600">
                            {errors.map((error, index) => (
                                <p key={index}>{error}</p>
                            ))}
                        </div>
                    ) : null}

                    {message ? <p className="text-sm text-green-600">{message}</p> : null}

                    <DialogFooter>
                        <Button
                            type="submit"
                            className="w-full rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700"
                            disabled={loading || !canSubmit}
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
