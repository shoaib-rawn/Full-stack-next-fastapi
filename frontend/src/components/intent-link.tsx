"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

// A Link that waits for the user's intent (hover, touch or keyboard focus)
// before prefetching. Prefetching every visible route on load kept a phone's
// main thread busy and slowed the first page; navigation itself is unchanged.
export function IntentLink(props: ComponentProps<typeof Link>) {
  const [active, setActive] = useState(false);
  const activate = () => setActive(true);

  return (
    <Link
      {...props}
      prefetch={active ? null : false}
      onPointerEnter={(event) => {
        activate();
        props.onPointerEnter?.(event);
      }}
      onTouchStart={(event) => {
        activate();
        props.onTouchStart?.(event);
      }}
      onFocus={(event) => {
        activate();
        props.onFocus?.(event);
      }}
    />
  );
}
