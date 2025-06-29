
export interface VehicleAnalysis {
  description: string;
  damage_analysis: string;
  estimated_impact_speed: string;
}

export interface ReportData {
  summary: string;
  probable_cause: string;
  vehicles: VehicleAnalysis[];
}
