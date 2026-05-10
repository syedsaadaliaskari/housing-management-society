import { ResidentVehiclesClient } from "./ResidentVehiclesClient";

export default function ResidentVehiclesPage() {
  return (
    <div className="py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">My Vehicles</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Register and manage your vehicles in the society.
        </p>
      </div>
      <ResidentVehiclesClient />
    </div>
  );
}
