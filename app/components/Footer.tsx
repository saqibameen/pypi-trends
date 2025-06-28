import * as React from "react";

export function Footer() {
  return (
    <footer className="w-full border-t py-6 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-950 mt-12">
      &copy; {new Date().getFullYear()} PyPI Trends. Not affiliated with PyPI or npmtrends.com.
    </footer>
  );
} 