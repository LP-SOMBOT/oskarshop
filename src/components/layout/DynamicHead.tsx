"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/context";

/**
 * DynamicHead Component
 * Updates the browser favicon, apple-touch-icon, and theme 
 * based on the admin settings stored in the database.
 */
export default function DynamicHead() {
  const { storeSettings, theme } = useApp();

  useEffect(() => {
    // Update Theme Color based on Light/Dark mode
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0F172A' : '#0EA5E9');
    }

    // Default Fallback Logo to the custom logo.png
    const fallbackLogo = "/logo.png";
    const logo = storeSettings?.logo || fallbackLogo;

    // Update Browser Favicon and Touch Icons
    const updateIcon = (rel: string) => {
      const existingIcons = document.querySelectorAll(`link[rel*="${rel}"]`);
      
      if (existingIcons.length > 0) {
        existingIcons.forEach(icon => {
          (icon as HTMLLinkElement).href = logo;
        });
      } else {
        const icon = document.createElement('link');
        icon.rel = rel;
        icon.href = logo;
        document.head.appendChild(icon);
      }
    };

    updateIcon('icon');
    updateIcon('shortcut icon');
    updateIcon('apple-touch-icon');
    
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      manifestLink.setAttribute('data-logo', logo);
    }

  }, [storeSettings?.logo, theme]);

  return null;
}
