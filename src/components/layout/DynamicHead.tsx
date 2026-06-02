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

    // Default Fallback Logo to the locally uploaded favicon.png
    const fallbackLogo = "/favicon.png";
    const logo = storeSettings?.logo || fallbackLogo;

    // Update Browser Favicon and Touch Icons
    const updateIcon = (rel: string) => {
      // Find all elements with this rel (some browsers use multiple)
      const existingIcons = document.querySelectorAll(`link[rel*="${rel}"]`);
      
      if (existingIcons.length > 0) {
        existingIcons.forEach(icon => {
          (icon as HTMLLinkElement).href = logo;
        });
      } else {
        // If not found, create a new one to ensure the default is overridden
        const icon = document.createElement('link');
        icon.rel = rel;
        icon.href = logo;
        document.head.appendChild(icon);
      }
    };

    // Standard Favicons
    updateIcon('icon');
    updateIcon('shortcut icon');
    
    // Apple Touch Icon for iOS
    updateIcon('apple-touch-icon');
    
    // Attempt to update standard manifest link hint (browser support varies)
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      manifestLink.setAttribute('data-logo', logo);
    }

  }, [storeSettings?.logo, theme]);

  return null;
}
