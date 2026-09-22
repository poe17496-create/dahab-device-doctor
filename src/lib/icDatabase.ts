import icData from '@/data/ic_database.json';

export interface ICRecord {
  partNumber: string;
  category: string;
  deviceFamily: string;
  function: string;
  compatibles: string[];
  commonSymptoms: string;
  diodeReadings: string;
}

export function searchICDatabase(query: string): ICRecord[] {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase().trim();

  return (icData as ICRecord[]).filter((item) => {
    return (
      item.partNumber.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.deviceFamily.toLowerCase().includes(q) ||
      item.function.toLowerCase().includes(q) ||
      item.compatibles.some((c) => c.toLowerCase().includes(q))
    );
  });
}
