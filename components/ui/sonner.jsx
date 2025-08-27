"use client";
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

const Toaster = ({
  ...props
}) => {

  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#c4b5fd] group-[.toaster]:text-neutral-950 group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-[#c4b5fd] group-[.toast]:text-neutral-950",
          cancelButton:
            "group-[.toast]:bg-neutral-950 group-[.toast]:text-white",
        },
      }}
      {...props}
    />
  );
}

export { Toaster }
