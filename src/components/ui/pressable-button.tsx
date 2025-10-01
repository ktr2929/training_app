"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof Button>;

export const PressableButton = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.div
        whileTap={{ scale: 0.97, y: 1 }}
        whileHover={{ y: -1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <Button ref={ref} className={cn(className)} {...props}>
          {children}
        </Button>
      </motion.div>
    );
  }
);

PressableButton.displayName = "PressableButton";
