"use client";
import { Toaster as Sonner } from "sonner";
import {
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiInfo,
  FiLoader,
} from "react-icons/fi";

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      expand={true}
      richColors={false}
      closeButton={true}
      duration={4000}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-slate-800/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-white group-[.toaster]:border group-[.toaster]:border-slate-700/50 group-[.toaster]:shadow-2xl group-[.toaster]:shadow-black/20 group-[.toaster]:rounded-xl",
          title: "group-[.toast]:text-white group-[.toast]:font-semibold",
          description: "group-[.toast]:text-slate-300",
          actionButton:
            "group-[.toast]:bg-gradient-to-r group-[.toast]:from-emerald-500 group-[.toast]:to-teal-500 group-[.toast]:text-white group-[.toast]:font-medium group-[.toast]:rounded-lg group-[.toast]:shadow-lg group-[.toast]:shadow-emerald-500/20 group-[.toast]:hover:shadow-emerald-500/30 group-[.toast]:transition-all",
          cancelButton:
            "group-[.toast]:bg-slate-700 group-[.toast]:text-slate-300 group-[.toast]:hover:bg-slate-600 group-[.toast]:rounded-lg group-[.toast]:transition-all",
          closeButton:
            "group-[.toast]:bg-slate-700/50 group-[.toast]:border-slate-600 group-[.toast]:text-slate-400 group-[.toast]:hover:bg-slate-600 group-[.toast]:hover:text-white group-[.toast]:transition-all",
          success:
            "group-[.toaster]:!bg-emerald-500/10 group-[.toaster]:!border-emerald-500/30 group-[.toaster]:!text-emerald-400 [&>div>svg]:!text-emerald-400",
          error:
            "group-[.toaster]:!bg-red-500/10 group-[.toaster]:!border-red-500/30 group-[.toaster]:!text-red-400 [&>div>svg]:!text-red-400",
          warning:
            "group-[.toaster]:!bg-amber-500/10 group-[.toaster]:!border-amber-500/30 group-[.toaster]:!text-amber-400 [&>div>svg]:!text-amber-400",
          info: "group-[.toaster]:!bg-blue-500/10 group-[.toaster]:!border-blue-500/30 group-[.toaster]:!text-blue-400 [&>div>svg]:!text-blue-400",
          loading:
            "group-[.toaster]:!bg-slate-700/50 group-[.toaster]:!border-slate-600/50",
        },
      }}
      icons={{
        success: <FiCheckCircle className="w-5 h-5 text-emerald-400" />,
        error: <FiXCircle className="w-5 h-5 text-red-400" />,
        warning: <FiAlertCircle className="w-5 h-5 text-amber-400" />,
        info: <FiInfo className="w-5 h-5 text-blue-400" />,
        loading: <FiLoader className="w-5 h-5 text-slate-400 animate-spin" />,
      }}
      {...props}
    />
  );
};

export { Toaster };
