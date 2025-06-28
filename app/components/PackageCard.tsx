import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

interface PackageCardProps {
  name: string;
  downloads: number;
  error?: string;
}

export function PackageCard({ name, downloads, error }: PackageCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-sm text-red-500 dark:text-red-400">{error}</div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-300">
            Total downloads: <span className="font-mono font-bold dark:text-white">{downloads.toLocaleString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 