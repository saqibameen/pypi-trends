import * as React from "react";

export function Header() {
  return (
    <header className="w-full border-b py-6 px-4 flex flex-col items-center bg-white">
      <h1 className="text-4xl font-bold tracking-tight mb-2 text-black dark:text-white">PyPI Trends</h1>
      <p className="text-lg text-gray-500 dark:text-gray-300 mb-4">Compare Python package download trends</p>
    </header>
  );
} 