"use client"

import { useDictionary } from "@/hooks/use-dictionary";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Button } from "./ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

export default function ConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    onCancel,
    title,
    message,
    confirmText,
    cancelText
}: ConfirmationDialogProps) {
    const dict = useDictionary();
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>{title}</DrawerTitle>
                        <DrawerDescription>{message}</DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter className="pb-[calc(16px+env(safe-area-inset-bottom))]">
                        <Button
                            type="button"
                            onClick={() => void onConfirm()}
                        >
                            {confirmText || dict.button.continue}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                onCancel?.();
                                onOpenChange(false);
                            }}
                        >
                            {cancelText || dict.button.cancel}
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{message}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>{cancelText || dict.button.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>{confirmText || dict.button.continue}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
