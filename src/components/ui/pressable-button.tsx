"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = ButtonProps;

const PressableButton = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, children, ...rest }, ref) => {
    return (
      <Button
        asChild
        className={cn(
          "transition-transform active:translate-y-[1px] active:scale-[0.98] focus-visible:ring-2 ring-offset-2 focus-visible:ring-neutral-400/60",
          className
        )}
        {...rest}
      >
        <motion.button
          ref={ref}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 800, damping: 30 }}
        >
          {children}
        </motion.button>
      </Button>
    );
  }
);

PressableButton.displayName = "PressableButton";
export { PressableButton };
