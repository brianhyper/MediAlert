import React from 'react';

export function Footer() {
  return (
    <footer className="bg-background border-t mt-auto">
      <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 text-center text-muted-foreground">
        <p className="text-sm">
          This application helps monitor and track medication dispensation from a smart pill dispenser.
        </p>
        <p className="text-xs mt-2">
          &copy; {new Date().getFullYear()} Njabini Boys High. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
